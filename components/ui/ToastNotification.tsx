// Autorius: JV (Jarek)
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

// Tipų sąjunga (union type) — nurodo, kokio tipo pranešimas gali būti.
// 'success' = sėkmės pranešimas (žalias), 'error' = klaidos (raudonas), 'warning' = įspėjimo (oranžinis)
export type ToastType = 'success' | 'error' | 'warning';

/**
 * ToastNotificationProps — TypeScript sąsaja (interface), apibrėžianti kokius
 * parametrus šis komponentas priima iš tėvinio komponento (ToastProvider).
 * Tai užtikrina, kad komponentas visada gaus teisingus duomenų tipus (type safety).
 */
interface ToastNotificationProps {
  message: string;      // Tekstas, kuris bus rodomas pranešime (pvz. "Statymas priimtas!")
  type: ToastType;      // Pranešimo tipas, nuo kurio priklauso spalva ir ikonėlė
  visible: boolean;     // Ar pranešimas šiuo metu turi būti rodomas ekrane
  onHide: () => void;   // Callback funkcija, kuri bus iškviesta kai pranešimas turi pasislėpti
  duration?: number;    // Neprivalomas: kiek milisekundžių pranešimas bus matomas (numatyta: 3000ms = 3s)
}

// Konfigūracija pranešimų tipams: spalvos ir ikonėlės (FR-1)
const COLORS: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: '#2E7D32', icon: '✅' },
  error: { bg: '#C62828', icon: '❌' },
  warning: { bg: '#EF6C00', icon: '⚠️' },
};

/**
 * ToastNotification - vizualinis pranešimų (toast) komponentas.
 * Palaiko 3 tipus: success, error, warning (FR-1).
 * Naudojamos animacijos sklandžiam atsiradimui ir išnykimui.
 */
export default function ToastNotification({
  message,
  type,
  visible,
  onHide,
  duration = 3000,
}: ToastNotificationProps) {
  const translateY = useRef(new Animated.Value(-100)).current; // Animacijos reikšmė: pradedama nuo -100px (už ekrano ribų viršuje)
  const opacity = useRef(new Animated.Value(0)).current; // Pradinis permatomumas yra 0 (nematomas)

  useEffect(() => {
    if (visible) {
      // Jei `visible` yra true, pradedame rodymo animaciją (slide-in)
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0, // Nusileidžia į pradinę poziciją (Y=0)
          duration: 300, // Animacija trunka 300ms
          useNativeDriver: true, // Naudojame native driver dėl našumo
        }),
        Animated.timing(opacity, {
          toValue: 1, // Pasidaro pilnai matomas
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Nustatome laikmatį, po kurio pranešimas pasislėps
      const timer = setTimeout(() => {
        // Pradedame slėpimo animaciją (slide-out)
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100, // Pakyla atgal už ekrano ribų
            duration: 250, // Paslėpimas trunka 250ms
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0, // Pasidaro vėl nematomas
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => onHide()); // Kai animacija baigiasi, iškviečiama onHide funkcija
      }, duration);

      // Išvalome laikmatį, jei komponentas atsijungia prieš jam suveikiant
      return () => clearTimeout(timer);
    }
  }, [visible, duration]); // Efektas perskaičiuojamas pasikeitus `visible` arba `duration`

  if (!visible) return null; // Jei pranešimas neturi būti rodomas, komponentas negrąžina jokio UI

  const { bg, icon } = COLORS[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bg, transform: [{ translateY }], opacity },
      ]}
      testID="toast-notification"
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

// StyleSheet.create — React Native būdas apibrėžti stilius (panašu į CSS, bet naudoja JavaScript objektus)
const styles = StyleSheet.create({
  container: {
    position: 'absolute', // Komponentas „plaukia" virš kitų elementų, nepaveikdamas jų pozicijos
    top: 50,              // 50px nuo ekrano viršaus (po status bar'u)
    left: 16,             // 16px paraštė iš kairės
    right: 16,            // 16px paraštė iš dešinės (konteineris užima beveik visą plotį)
    paddingHorizontal: 16, // Vidinis horizontalus tarpas
    paddingVertical: 14,   // Vidinis vertikalus tarpas
    borderRadius: 12,      // Suapvalinti kampai (12px spindulys)
    flexDirection: 'row',  // Vaikai išdėstomi horizontaliai (ikonėlė → tekstas)
    alignItems: 'center',  // Vaikai centruojami vertikaliai
    zIndex: 9999,          // Labai aukštas sluoksnis — pranešimas visada rodomas virš visko
    elevation: 10,         // Android šešėlių gylis
    shadowColor: '#000',   // iOS šešėlio spalva (juoda)
    shadowOffset: { width: 0, height: 4 }, // Šešėlis po apačia
    shadowOpacity: 0.3,    // Šešėlio intensyvumas (30%)
    shadowRadius: 8,       // Šešėlio išsklaidymas (minkštumas)
  },
  icon: {
    fontSize: 18,       // Ikonėlės (emoji) dydis
    marginRight: 10,    // Tarpas tarp ikonėlės ir teksto
  },
  message: {
    color: '#FFFFFF',   // Baltas teksto spalva (kontrastas su spalvotu fonu)
    fontSize: 14,       // Teksto dydis
    fontWeight: '600',  // Pusiau paryškintas šriftas
    flex: 1,            // Tekstas užima visą likusią erdvę (ikonėlė fiksuota, tekstas plečiasi)
  },
});
