import React from 'react';
import { TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { useBetInput } from '@/hooks/useBetInput';

interface BetPanelProps {
  /** Vartotojo laisvas balansas taškais */
  userBalance: number;
  /** Lažybų indeksas "UŽ" */
  forOdds: number;
  /** Lažybų indeksas "PRIEŠ" */
  againstOdds: number;
  /** Iškviečiama patvirtinus statymą "UŽ" */
  onBetFor: (amount: number) => void;
  /** Iškviečiama patvirtinus statymą "PRIEŠ" */
  onBetAgainst: (amount: number) => void;
  /** Rodyti užkrovimo būseną */
  isLoading?: boolean;
}

export default function BetPanel({
  userBalance,
  forOdds,
  againstOdds,
  onBetFor,
  onBetAgainst,
  isLoading = false,
}: BetPanelProps) {
  const { selectedSide, inputAmount, error, selectSide, handleAmountChange, confirm } = useBetInput(
    { userBalance, onBetFor, onBetAgainst },
  );

  return (
    <Box>
      {/* Lažybų indeksų atvaizdavimas */}
      <Box
        flexDirection="row"
        justifyContent="space-around"
        backgroundColor="surfaceContainerLowest"
        borderRadius={10}
        paddingVertical="m"
        marginBottom="m"
        borderWidth={1}
        borderColor="outline"
      >
        <Box alignItems="center" flex={1}>
          <Text color="textSecondary" style={styles.oddsLabel}>
            Indeksas UŽ
          </Text>
          <Text color="linkPrimary" style={styles.oddsValue}>
            {forOdds.toFixed(2)}×
          </Text>
        </Box>

        <Box width={1} backgroundColor="outline" />

        <Box alignItems="center" flex={1}>
          <Text color="textSecondary" style={styles.oddsLabel}>
            Indeksas PRIEŠ
          </Text>
          <Text color="buttonPrimaryBackground" style={styles.oddsValue}>
            {againstOdds.toFixed(2)}×
          </Text>
        </Box>
      </Box>

      {/* Statymo mygtukai */}
      <Box flexDirection="row">
        <Box flex={1} marginRight="s">
          <TouchableOpacity
            onPress={() => selectSide('for')}
            activeOpacity={0.8}
            testID="bet-for-button"
          >
            <Box
              paddingVertical="m"
              borderRadius={8}
              backgroundColor={selectedSide === 'for' ? 'linkPrimary' : 'surfaceContainerHigh'}
              alignItems="center"
              borderWidth={1}
              borderColor={selectedSide === 'for' ? 'linkPrimary' : 'outline'}
            >
              <Text
                color={selectedSide === 'for' ? 'buttonPrimaryForeground' : 'textSecondary'}
                style={styles.buttonLabel}
              >
                Statyti UŽ
              </Text>
            </Box>
          </TouchableOpacity>
        </Box>

        <Box flex={1} marginLeft="s">
          <TouchableOpacity
            onPress={() => selectSide('against')}
            activeOpacity={0.8}
            testID="bet-against-button"
          >
            <Box
              paddingVertical="m"
              borderRadius={8}
              backgroundColor={
                selectedSide === 'against' ? 'buttonPrimaryBackground' : 'surfaceContainerHigh'
              }
              alignItems="center"
              borderWidth={1}
              borderColor={selectedSide === 'against' ? 'buttonPrimaryBackground' : 'outline'}
            >
              <Text
                color={selectedSide === 'against' ? 'buttonPrimaryForeground' : 'textSecondary'}
                style={styles.buttonLabel}
              >
                Statyti PRIEŠ
              </Text>
            </Box>
          </TouchableOpacity>
        </Box>
      </Box>

      {/* Taškų įvestis — rodoma tik pasirinkus pusę */}
      {selectedSide !== null && (
        <Box marginTop="m">
          <Box flexDirection="row" alignItems="center">
            <Box
              flex={1}
              marginRight="s"
              backgroundColor="surfaceContainerHigh"
              borderRadius={8}
              borderWidth={1}
              borderColor={error ? 'error' : 'outline'}
              paddingHorizontal="m"
            >
              <TextInput
                value={inputAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="Taškų suma..."
                placeholderTextColor="rgba(255,255,240,0.3)"
                style={styles.input}
                maxLength={10}
                testID="bet-amount-input"
              />
            </Box>

            <TouchableOpacity
              onPress={confirm}
              disabled={isLoading}
              activeOpacity={0.8}
              testID="bet-confirm-button"
            >
              <Box
                paddingVertical="m"
                paddingHorizontal="l"
                borderRadius={8}
                backgroundColor={selectedSide === 'for' ? 'linkPrimary' : 'buttonPrimaryBackground'}
                style={isLoading ? styles.disabled : undefined}
              >
                <Text color="buttonPrimaryForeground" style={styles.buttonLabel}>
                  Patvirtinti
                </Text>
              </Box>
            </TouchableOpacity>
          </Box>

          {/* Klaidos pranešimas */}
          {error && (
            <Box
              marginTop="s"
              paddingHorizontal="m"
              paddingVertical="s"
              backgroundColor="errorContainer"
              borderRadius={6}
              testID="bet-error-message"
            >
              <Text color="error" style={styles.errorText}>
                {error}
              </Text>
            </Box>
          )}

          {/* Likutis */}
          <Box marginTop="s">
            <Text color="textSecondary" style={styles.balanceText}>
              Jūsų likutis: {userBalance} taškų
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// StyleSheet — tik ne-teminiams savybėms (fontSize, fontWeight, textAlign),
// kurių Restyle tiesiogiai nepalaiko
const styles = StyleSheet.create({
  oddsLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  oddsValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    color: '#FFFFF0',
    fontSize: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
  },
  balanceText: {
    fontSize: 13,
    textAlign: 'right',
  },
  disabled: {
    opacity: 0.5,
  },
});
