// Autorius: JV (Jarek)
import React from 'react';
import { FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { useActivity, ActivityItem } from '@/hooks/useActivity';

/**
 * ActivityLog - UI komponentas, skirtas atvaizduoti vartotojo veiklos istoriją (UR-1).
 * Naudoja `useActivity` hook'ą duomenims gauti ir rodo juos kaip FlatList.
 */
export default function ActivityLog() {
  const { activities, isLoading, error } = useActivity();

  if (isLoading) {
    return (
      <Box padding="l" alignItems="center">
        <ActivityIndicator size="small" color="#FFFFFF" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="m">
        <Text color="error" style={{ fontSize: 13 }}>
          {error}
        </Text>
      </Box>
    );
  }

  if (activities.length === 0) {
    return (
      <Box padding="l" alignItems="center">
        <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
        <Text color="textSecondary" textAlign="center" style={{ fontSize: 13 }}>
          Dar nėra veiklos. Pradėkite nuo quest'o!
        </Text>
      </Box>
    );
  }

  // Pagalbinė funkcija konvertuoti ISO datą į formatą "MM-DD HH:mm"
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0'); // Mėnuo prasideda nuo 0
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${min}`;
  };

  // renderItem funkcija iškviečiama kiekvienam masyvo elementui FlatList komponente
  const renderItem = ({ item }: { item: ActivityItem }) => (
    <Box
      flexDirection="row" // Išdėstymas eilute (horizontaliai)
      alignItems="center" // Centruojame vertikaliai
      paddingVertical="s"
      paddingHorizontal="m"
      style={styles.row}
    >
      {/* 1. Kairėje pusėje: Ikona (emoji), nurodanti veiksmo tipą */}
      <Text style={styles.emoji}>{item.emoji}</Text>

      {/* 2. Viduryje: Aprašymas ir data, naudojant flex: 1, kad užimtų likusią erdvę */}
      <Box flex={1} marginHorizontal="s">
        {/* Veiksmo etiketė (pvz. "Pirkimas") su numberOfLines=1, kad nukirptų ilgą tekstą */}
        <Text color="textPrimary" style={{ fontSize: 13 }} numberOfLines={1}>
          {item.label}
        </Text>
        {/* Suformatuotas laikas (pilkšvos spalvos) */}
        <Text color="textSecondary" style={{ fontSize: 11 }}>
          {formatDate(item.createdAt)}
        </Text>
      </Box>

      {/* 3. Dešinėje: Suma. Jei suma teigiama, spalva žalia (#4CAF50), jei neigiama - raudona (#F44336) */}
      <Text
        style={[
          styles.amount,
          { color: item.amount >= 0 ? '#4CAF50' : '#F44336' },
        ]}
      >
        {item.amountFormatted}
      </Text>
    </Box>
  );

  return (
    <Box backgroundColor="surfaceContainer" borderRadius={16} padding="m" margin="m">
      <Text variant="subheader" marginBottom="m">
        Mano veikla
      </Text>
      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <Box height={1} backgroundColor="outline" marginVertical="s" />
        )}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
  },
  emoji: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
