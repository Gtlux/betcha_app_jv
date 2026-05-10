import React from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { QuestBetsData, BettorInfo } from '@/hooks/useQuestBets';

interface BettorsListProps {
  data: QuestBetsData | null;
  isLoading: boolean;
}

export default function BettorsList({ data, isLoading }: BettorsListProps) {
  if (isLoading && !data) {
    return (
      <Box pt="m" mt="m" borderTopWidth={1} borderTopColor="outline" alignItems="center">
        <ActivityIndicator size="small" color="#FFFFFF" />
      </Box>
    );
  }

  if (!data) return null;

  const renderBettor = (b: BettorInfo) => (
    <Box
      key={b.id}
      flexDirection="row"
      justifyContent="space-between"
      py="s"
      borderBottomWidth={1}
      borderBottomColor="outline"
    >
      <Text fontSize={14} color="textSecondary">
        {b.profile?.username || 'Anonimas'}
      </Text>
      <Text fontSize={14} fontWeight="bold">
        {b.amount}
      </Text>
    </Box>
  );

  return (
    <Box mt="m" pt="m" borderTopWidth={1} borderTopColor="outline">
      <Text variant="body" fontWeight="bold" textAlign="center" mb="m">
        Visas prizinis fondas: {data.totalPool} taškų
      </Text>
      <Box flexDirection="row" justifyContent="space-between">
        {/* UŽ Column */}
        <Box flex={1} mr="s">
          <Text variant="body" color="linkPrimary" fontWeight="bold" textAlign="center" mb="s">
            UŽ ({data.forBets.length})
          </Text>
          {data.forBets.length === 0 ? (
            <Text fontSize={12} textAlign="center" color="textSecondary">
              Nėra statymų
            </Text>
          ) : (
            data.forBets.map(renderBettor)
          )}
        </Box>
        {/* PRIEŠ Column */}
        <Box flex={1} ml="s">
          <Text variant="body" color="error" fontWeight="bold" textAlign="center" mb="s">
            PRIEŠ ({data.againstBets.length})
          </Text>
          {data.againstBets.length === 0 ? (
            <Text fontSize={12} textAlign="center" color="textSecondary">
              Nėra statymų
            </Text>
          ) : (
            data.againstBets.map(renderBettor)
          )}
        </Box>
      </Box>
    </Box>
  );
}
