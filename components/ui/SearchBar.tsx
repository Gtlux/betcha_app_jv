// Autorius: JV (Jarek)
import React, { useState, useRef, useCallback } from 'react';
import { TextInput, StyleSheet, Pressable } from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';

/**
 * SearchBarProps apibrėžia parametrus.
 */
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

/**
 * SearchBar - paieškos laukelis su 300ms debounce (FR-2).
 * Neleidžia bereikalingų API kvietimų arba filtrų atnaujinimų kiekvieno klavišo paspaudimo metu.
 */
export default function SearchBar({
  onSearch,
  placeholder = 'Ieškoti quest\'ų...',
}: SearchBarProps) {
  const [value, setValue] = useState(''); // Lokali būsena teksto įvesčiai
  // timerRef saugo setTimeout nuorodą, kad galėtume ją išvalyti (clearTimeout) jei vartotojas vėl įveda tekstą
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Funkcija iškviečiama kiekvieną kartą pasikeitus tekstui laukelyje
  const handleChange = useCallback(
    (text: string) => {
      setValue(text); // Iš karto atnaujiname UI (laukelyje rodomą tekstą)

      // Jei jau buvo paleistas timeris (vartotojas dar neseniai kažką rašė), mes jį išvalome
      // Taip išvengiame onSearch kvietimo kiekvienam įvestam simboliui
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Sukuriame naują timerį. Jis iškvies onSearch po 300ms, JEI nebus vėl išvalytas (jei vartotojas nenustos rašyti)
      timerRef.current = setTimeout(() => {
        onSearch(text.trim()); // Perduodame tekstą į tėvinį komponentą apkirptą (be tarpų pradžioje/pabaigoje)
      }, 300);
    },
    [onSearch], // useCallback priklausomybė - funkcija persikurs tik jei pasikeis onSearch referencija
  );

  // Funkcija išvalyti paieškos laukelį (paspaudus X mygtuką)
  const handleClear = useCallback(() => {
    setValue(''); // Išvalome UI tekstą
    if (timerRef.current) {
      clearTimeout(timerRef.current); // Atšaukiame bet kokį laukiantį debounce timerį
    }
    onSearch(''); // Iš karto siunčiame tuščią string'ą (atstatome filtrą)
  }, [onSearch]);

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      backgroundColor="surfaceContainerHigh"
      borderRadius={12}
      paddingHorizontal="m"
      marginBottom="m"
    >
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        autoCapitalize="none"
        autoCorrect={false}
        testID="search-bar-input"
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8} testID="search-bar-clear">
          <Text style={styles.clearIcon}>✕</Text>
        </Pressable>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  clearIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    padding: 4,
  },
});
