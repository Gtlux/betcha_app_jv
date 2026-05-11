import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  ActivityIndicator,
  Animated,
  Pressable,
  Image,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/constants/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import BetPanel from '@/components/betting/BetPanel';
import BettorsList from '@/components/betting/BettorsList';
import { usePlaceBet } from '@/hooks/usePlaceBet';
import { useQuestBets } from '@/hooks/useQuestBets';
import { useToast } from '@/providers/ToastProvider';

import { useActiveQuest, QuestStatus } from '@/hooks/useActiveQuest';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGroup } from '@/providers/GroupProvider';
import { useAuth } from '@/providers/AuthProvider';
import { calculateOdds } from '@/utils/calculateOdds';
import type { Quest, QuestAssignee } from '@/hooks/useActiveQuest';

type BetNotification = {
  type: 'success' | 'error';
  message: string;
  questId: string;
} | null;

export default function BetScreen() {
  const theme = useTheme<Theme>();
  const { placeBet, isLoading } = usePlaceBet();
  const { data: bettorsData, isLoading: isBettorsLoading, fetchBets } = useQuestBets();

  const { quests, isLoading: isQuestLoading, fetchActiveQuest } = useActiveQuest();
  const { profile, refresh: refreshProfile } = useUserProfile();
  const { activeGroup } = useGroup();
  const { session } = useAuth();
  const currentUserId = session?.user.id ?? null;
  const router = useRouter();
  const { showToast } = useToast();

  const [notification, setNotification] = useState<BetNotification>(null);
  const [rateLimitedIds, setRateLimitedIds] = useState<Set<string>>(new Set());
  const [betsDataMap, setBetsDataMap] = useState<Record<string, typeof bettorsData>>({});
  const [statusFilter, setStatusFilter] = useState<QuestStatus>('open');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refreshProfile(), fetchActiveQuest(activeGroup?.id ?? null, statusFilter)]);
    setIsRefreshing(false);
  }, [refreshProfile, fetchActiveQuest, activeGroup?.id, statusFilter]);

  // Atnaujina balansą kiekvieną kartą grįžus į ekraną
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  // Pakrauname quest'us kai pasikeičia aktyvi grupė ar filtras
  useEffect(() => {
    fetchActiveQuest(activeGroup?.id ?? null, statusFilter);
  }, [fetchActiveQuest, activeGroup?.id, statusFilter]);

  // Kai atsinaujina quest'ų sąrašas — pakrauname kiekvieno lažybų statistiką
  useEffect(() => {
    quests.forEach((q) => {
      fetchBets(q.id).then((data) => {
        setBetsDataMap((prev) => ({ ...prev, [q.id]: data }));
      });
    });
  }, [quests, fetchBets]);

  const handleBet = async (quest: Quest, direction: 'for' | 'against', amount: number) => {
    setNotification(null);
    const { forOdds, againstOdds } = calculateOdds(quest.difficulty_score);
    const coefficient = direction === 'for' ? forOdds : againstOdds;

    const result = await placeBet({
      questId: quest.id,
      direction,
      amount,
      coefficient,
    });

    if (result.success) {
      refreshProfile();
      showToast(`Statymas priimtas! Rezervuota ${amount} taškų.`, 'success');
      fetchBets(quest.id).then((data) => {
        setBetsDataMap((prev) => ({ ...prev, [quest.id]: data }));
      });
    } else {
      showToast(result.error ?? 'Nepavyko atlikti statymo.', 'error');
      if (result.error?.includes('Pristabdykite')) {
        setRateLimitedIds((prev) => new Set(prev).add(quest.id));
        setTimeout(() => {
          setRateLimitedIds((prev) => {
            const next = new Set(prev);
            next.delete(quest.id);
            return next;
          });
        }, 3000);
      }
    }
  };

  if (isQuestLoading && quests.length === 0) {
    return (
      <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.buttonPrimaryBackground}
          />
        }
      >
        <Box padding="m">
          {/* Balanso juosta */}
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            backgroundColor="surfaceContainer"
            borderRadius={10}
            padding="m"
            marginBottom="l"
            borderWidth={1}
            borderColor="outline"
          >
            <Text color="textSecondary">Jūsų balansas</Text>
            <Text color="textPrimary" style={{ fontSize: 20, fontWeight: '700' }}>
              {profile ? `${profile.balance} taškų` : '...'}
            </Text>
          </Box>

          {/* Statuso filtras */}
          <StatusFilterTabs current={statusFilter} onChange={setStatusFilter} />

          {quests.length === 0 ? (
            statusFilter === 'open' ? (
              <NoQuestPlaceholder />
            ) : (
              <NoQuestForFilterPlaceholder status={statusFilter} />
            )
          ) : (
            quests.map((quest) => (
              <Box key={quest.id} marginBottom="l">
                {notification?.questId === quest.id && (
                  <Box
                    marginBottom="m"
                    padding="m"
                    borderRadius={8}
                    backgroundColor={
                      notification.type === 'success' ? 'linkPrimary' : 'errorContainer'
                    }
                    borderWidth={1}
                    borderColor={notification.type === 'success' ? 'linkPrimary' : 'error'}
                  >
                    <Text
                      color={notification.type === 'success' ? 'buttonPrimaryForeground' : 'error'}
                      style={{ fontSize: 14 }}
                    >
                      {notification.message}
                    </Text>
                  </Box>
                )}

                <Box
                  backgroundColor="surfaceContainer"
                  borderRadius={12}
                  padding="m"
                  borderWidth={1}
                  borderColor="outline"
                >
                  <Box
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    marginBottom="s"
                  >
                    <Text color="textSecondary" style={{ fontSize: 11 }}>
                      UŽDUOTIS
                    </Text>
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: '/quest-detail', params: { id: quest.id } })
                      }
                      hitSlop={8}
                    >
                      <Text color="linkPrimary" style={{ fontSize: 12, fontWeight: '600' }}>
                        Detalės →
                      </Text>
                    </Pressable>
                  </Box>
                  <Text
                    color="textPrimary"
                    style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}
                  >
                    {quest.title}
                  </Text>

                  <AssigneeRow
                    assignee={quest.assigned_to}
                    isMe={!!currentUserId && quest.assigned_to?.id === currentUserId}
                  />

                  {quest.status === 'open' ? (
                    <BetPanel
                      userBalance={profile?.balance || 0}
                      forOdds={calculateOdds(quest.difficulty_score).forOdds}
                      againstOdds={calculateOdds(quest.difficulty_score).againstOdds}
                      onBetFor={(amount) => handleBet(quest, 'for', amount)}
                      onBetAgainst={(amount) => handleBet(quest, 'against', amount)}
                      isLoading={isLoading || rateLimitedIds.has(quest.id)}
                    />
                  ) : (
                    <Box
                      p="m"
                      alignItems="center"
                      backgroundColor={quest.status === 'completed' ? 'linkPrimary' : 'error'}
                      borderRadius={8}
                    >
                      <Text color="buttonPrimaryForeground" fontWeight="bold">
                        LAŽYBOS BAIGTOS ({quest.status.toUpperCase()})
                      </Text>
                    </Box>
                  )}

                  <BettorsList data={betsDataMap[quest.id] ?? null} isLoading={isBettorsLoading} />
                </Box>
              </Box>
            ))
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}

function AssigneeRow({ assignee, isMe }: { assignee: QuestAssignee | null; isMe: boolean }) {
  return (
    <Box flexDirection="row" alignItems="center" marginBottom="m">
      {assignee?.avatar_url ? (
        <Image source={{ uri: assignee.avatar_url }} style={assigneeStyles.avatar} />
      ) : (
        <Box
          width={28}
          height={28}
          borderRadius={14}
          backgroundColor="surfaceContainerHigh"
          alignItems="center"
          justifyContent="center"
          marginRight="s"
        >
          <Text color="textSecondary" style={{ fontSize: 12 }}>
            {assignee?.username?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </Box>
      )}
      <Text color="textSecondary" style={{ fontSize: 13 }}>
        Vykdytojas:{' '}
        <Text color="textPrimary" style={{ fontWeight: '600' }}>
          {assignee?.username ?? 'Nepriskirta'}
        </Text>
      </Text>
      {isMe && (
        <Box
          marginLeft="s"
          paddingHorizontal="s"
          paddingVertical="s"
          backgroundColor="linkPrimary"
          borderRadius={4}
        >
          <Text color="buttonPrimaryForeground" style={{ fontSize: 10, fontWeight: '700' }}>
            TAU PRISKIRTA
          </Text>
        </Box>
      )}
    </Box>
  );
}

const assigneeStyles = {
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
};

const FILTER_OPTIONS: { value: QuestStatus; label: string }[] = [
  { value: 'open', label: 'Atviri' },
  { value: 'completed', label: 'Užbaigti' },
  { value: 'rejected', label: 'Atmesti' },
];

function StatusFilterTabs({
  current,
  onChange,
}: {
  current: QuestStatus;
  onChange: (status: QuestStatus) => void;
}) {
  return (
    <Box flexDirection="row" marginBottom="m">
      {FILTER_OPTIONS.map((option) => {
        const isActive = current === option.value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={{ flex: 1 }}>
            <Box
              paddingVertical="s"
              alignItems="center"
              backgroundColor={isActive ? 'buttonPrimaryBackground' : 'surfaceContainer'}
              borderWidth={1}
              borderColor={isActive ? 'buttonPrimaryBackground' : 'outline'}
              borderRadius={8}
              marginHorizontal="s"
            >
              <Text
                color={isActive ? 'buttonPrimaryForeground' : 'textSecondary'}
                style={{ fontSize: 13, fontWeight: '600' }}
              >
                {option.label}
              </Text>
            </Box>
          </Pressable>
        );
      })}
    </Box>
  );
}

function NoQuestForFilterPlaceholder({ status }: { status: QuestStatus }) {
  const message =
    status === 'completed'
      ? 'Šioje grupėje dar nėra užbaigtų užduočių.'
      : 'Šioje grupėje dar nėra atmestų užduočių.';
  return (
    <Box
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="l"
      style={{ paddingVertical: 60 }}
    >
      <Text style={{ fontSize: 38, marginBottom: 16 }}>📭</Text>
      <Text color="textSecondary" textAlign="center" style={{ fontSize: 14, lineHeight: 20 }}>
        {message}
      </Text>
    </Box>
  );
}

function NoQuestPlaceholder() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <Box
      flex={1}
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="l"
      style={{ paddingVertical: 60 }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 2,
          borderColor: 'rgba(224, 8, 11, 0.25)',
          top: 52,
          transform: [{ scale: pulse }],
        }}
      />

      <Box
        width={88}
        height={88}
        borderRadius={44}
        backgroundColor="surfaceContainer"
        borderWidth={2}
        borderColor="buttonPrimaryBackground"
        alignItems="center"
        justifyContent="center"
        style={{
          shadowColor: '#E0080B',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
        }}
      >
        <Text style={{ fontSize: 38 }}>🎯</Text>
      </Box>

      <Text
        color="textPrimary"
        style={{ fontSize: 20, fontWeight: '700', marginTop: 24, textAlign: 'center' }}
      >
        Laukiama DI verdikto
      </Text>

      <Text
        color="textSecondary"
        style={{ fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22 }}
      >
        Šiuo metu nėra aktyvios lažybų užduoties.{'\n'}
        Sukurkite užduotį pagrindiniame lange ir čia atsiras galimybė statyti.
      </Text>

      <Box
        height={1}
        borderRadius={1}
        style={{
          width: 60,
          marginTop: 28,
          marginBottom: 16,
          backgroundColor: 'rgba(255,255,255,0.1)',
        }}
      />

      <Text color="textSecondary" style={{ fontSize: 12, textAlign: 'center', opacity: 0.55 }}>
        💡 Užduotis sukuriama „Namai" skiltoje
      </Text>
    </Box>
  );
}
