import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import QuestCard from '@/components/dashboard/QuestCard';
import StatTile from '@/components/dashboard/StatTile';
import EmptyGroupCTA from '@/components/dashboard/EmptyGroupCTA';
import { useGroup } from '@/providers/GroupProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGroupStats } from '@/hooks/useGroupStats';
import { useAuth } from '@/providers/AuthProvider';
import { getCurrentLevel, getProgressPercentage } from '@/utils/levelCalculator';

export default function DashboardScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const { session } = useAuth();
  const currentUserId = session?.user.id ?? null;

  const { activeGroup, isLoading: groupsLoading } = useGroup();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useUserProfile();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useGroupStats(activeGroup?.id ?? null);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      refreshStats();
    }, [refreshProfile, refreshStats]),
  );

  const handleQuestPress = (id: string) => {
    router.push({ pathname: '/quest-detail' as never, params: { id } });
  };

  if (groupsLoading || (profileLoading && !profile)) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="mainBackground">
        <ActivityIndicator size="large" color={theme.colors.buttonPrimaryBackground} />
      </Box>
    );
  }

  const totalPoints = profile?.total_points_collected ?? 0;
  const currentLevel = getCurrentLevel(totalPoints);
  const progress = getProgressPercentage(totalPoints);

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={statsLoading}
            onRefresh={() => {
              refreshProfile();
              refreshStats();
            }}
            tintColor={theme.colors.buttonPrimaryBackground}
          />
        }
      >
        <Box padding="m">
          {/* Sveikinimas + balansas */}
          <Box marginBottom="m">
            <Text color="textSecondary" fontSize={12}>
              SVEIKAS,
            </Text>
            <Text color="textPrimary" fontSize={24} fontWeight="bold">
              {profile?.username ?? '—'}
            </Text>
          </Box>

          {/* Balansas — didelis skaičius */}
          <Box
            marginBottom="m"
            padding="l"
            backgroundColor="cardPrimaryBackground"
            borderRadius={16}
          >
            <Text color="buttonPrimaryForeground" fontSize={11} marginBottom="s">
              BALANSAS
            </Text>
            <Text color="buttonPrimaryForeground" fontSize={40} fontWeight="bold">
              {profile?.balance ?? 0}
            </Text>
          </Box>

          {/* Lygio progresas */}
          <Box
            marginBottom="m"
            padding="m"
            backgroundColor="surfaceContainer"
            borderRadius={12}
            borderWidth={1}
            borderColor="outline"
          >
            <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
              <Text color="textSecondary" fontSize={11}>
                LYGIS
              </Text>
              <Text color="textPrimary" fontWeight="bold">
                {currentLevel.name}
              </Text>
            </Box>
            <Box
              height={8}
              backgroundColor="surfaceContainerHigh"
              borderRadius={4}
              overflow="hidden"
            >
              <Box
                height={8}
                width={`${Math.round(progress * 100)}%`}
                backgroundColor="linkPrimary"
              />
            </Box>
            <Text color="textSecondary" fontSize={12} marginTop="s">
              {totalPoints} taškų
            </Text>
          </Box>

          {/* Jei nėra aktyvios grupės — CTA */}
          {!activeGroup && <EmptyGroupCTA />}

          {/* Aktyvi grupė + statistika */}
          {activeGroup && (
            <>
              <Box marginBottom="m">
                <Text color="textSecondary" fontSize={11} marginBottom="s">
                  AKTYVI GRUPĖ
                </Text>
                <Text color="textPrimary" fontSize={18} fontWeight="bold">
                  {activeGroup.name}
                </Text>
              </Box>

              {statsError ? (
                <Box
                  padding="m"
                  backgroundColor="errorContainer"
                  borderRadius={12}
                  marginBottom="m"
                >
                  <Text color="error" marginBottom="s">
                    {statsError}
                  </Text>
                  <Pressable
                    onPress={refreshStats}
                    style={[
                      styles.retryButton,
                      { backgroundColor: theme.colors.buttonPrimaryBackground },
                    ]}
                  >
                    <Text color="buttonPrimaryForeground" textAlign="center">
                      Bandyti dar kartą
                    </Text>
                  </Pressable>
                </Box>
              ) : stats ? (
                <>
                  {/* Stats plytelės */}
                  <Box flexDirection="row" gap="s" marginBottom="m">
                    <StatTile label="Atviri" value={stats.openCount} />
                    <StatTile label="Prize pool" value={stats.totalPrizePool} />
                  </Box>

                  {/* Atvirų quest'ų sąrašas */}
                  <Box marginBottom="m">
                    <Text color="textSecondary" fontSize={11} marginBottom="s">
                      AKTYVŪS QUEST&apos;AI
                    </Text>
                    {stats.openQuests.length === 0 ? (
                      <Box
                        padding="m"
                        backgroundColor="surfaceContainer"
                        borderRadius={12}
                        borderWidth={1}
                        borderColor="outline"
                      >
                        <Text color="textSecondary" textAlign="center">
                          Šiuo metu nėra atvirų quest&apos;ų — sukurkite naują!
                        </Text>
                      </Box>
                    ) : (
                      stats.openQuests.map((q) => (
                        <QuestCard
                          key={q.id}
                          id={q.id}
                          title={q.title}
                          status={q.status}
                          difficultyScore={q.difficultyScore}
                          assignedToMe={!!currentUserId && q.assignedTo?.id === currentUserId}
                          onPress={handleQuestPress}
                        />
                      ))
                    )}
                  </Box>

                  {/* Paskutiniai užbaigti */}
                  {stats.recentResolved.length > 0 && (
                    <Box marginBottom="m">
                      <Text color="textSecondary" fontSize={11} marginBottom="s">
                        PASKUTINIAI UŽBAIGTI
                      </Text>
                      {stats.recentResolved.map((q) => (
                        <QuestCard
                          key={q.id}
                          id={q.id}
                          title={q.title}
                          status={q.status}
                          compact
                          onPress={handleQuestPress}
                        />
                      ))}
                    </Box>
                  )}
                </>
              ) : (
                <Box alignItems="center" padding="m">
                  <ActivityIndicator color={theme.colors.buttonPrimaryBackground} />
                </Box>
              )}
            </>
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  retryButton: {
    paddingVertical: 10,
    borderRadius: 8,
  },
});
