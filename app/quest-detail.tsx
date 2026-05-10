import { useCallback, useEffect } from 'react';
import { ScrollView, ActivityIndicator, Image, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import BettorsList from '@/components/betting/BettorsList';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { useQuestBets } from '@/hooks/useQuestBets';
import { useAuth } from '@/providers/AuthProvider';
import type { TaskDetail, TaskDetailProfile } from '@/lib/api';

const STATUS_LABELS: Record<TaskDetail['status'], string> = {
  open: 'Atvira',
  completed: 'Užbaigta',
  rejected: 'Atmesta',
};

export default function QuestDetailScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const currentUserId = session?.user.id ?? null;

  const { data, isLoading, error, refresh } = useTaskDetail(id ?? null);
  const { data: bettorsData, isLoading: isBettorsLoading, fetchBets } = useQuestBets();

  useEffect(() => {
    if (id) {
      fetchBets(id);
    }
  }, [id, fetchBets]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      if (id) fetchBets(id);
    }, [refresh, fetchBets, id]),
  );

  const canSubmitEvidence =
    !!currentUserId && data?.assignedTo?.id === currentUserId && data?.status === 'open';

  if (isLoading) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="mainBackground">
        <ActivityIndicator size="large" color={theme.colors.buttonPrimaryBackground} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        flex={1}
        alignItems="center"
        justifyContent="center"
        backgroundColor="mainBackground"
        padding="l"
      >
        <Text variant="body" color="error" textAlign="center">
          {error ?? 'Užduoties duomenys nerasti'}
        </Text>
      </Box>
    );
  }

  const statusColor =
    data.status === 'completed' ? 'linkPrimary' : data.status === 'rejected' ? 'error' : 'outline';

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Box padding="m">
          {/* Antraštė ir statusas */}
          <Box marginBottom="m">
            <Text color="textSecondary" style={styles.label}>
              UŽDUOTIS
            </Text>
            <Text color="textPrimary" style={styles.title}>
              {data.title}
            </Text>
            <Box flexDirection="row" alignItems="center" marginTop="s">
              <Box
                paddingHorizontal="s"
                paddingVertical="s"
                backgroundColor={statusColor}
                borderRadius={4}
              >
                <Text color="buttonPrimaryForeground" fontSize={11} fontWeight="bold">
                  {STATUS_LABELS[data.status].toUpperCase()}
                </Text>
              </Box>
              {data.difficultyScore !== null && (
                <Text color="textSecondary" fontSize={12} marginLeft="m">
                  Sunkumas: {data.difficultyScore.toFixed(1)} / 10
                </Text>
              )}
            </Box>
          </Box>

          {/* Pradinė nuotrauka */}
          {data.initialImageUrl && (
            <Box marginBottom="m">
              <Text color="textSecondary" style={styles.label} marginBottom="s">
                PRADINĖ NUOTRAUKA
              </Text>
              <Image source={{ uri: data.initialImageUrl }} style={styles.image} />
            </Box>
          )}

          {/* Įrodymo nuotrauka (tik užbaigus) */}
          {data.evidenceImageUrl && (
            <Box marginBottom="m">
              <Text color="textSecondary" style={styles.label} marginBottom="s">
                ĮRODYMO NUOTRAUKA
              </Text>
              <Image source={{ uri: data.evidenceImageUrl }} style={styles.image} />
            </Box>
          )}

          {/* Aprašymas */}
          {data.description && (
            <Box
              marginBottom="m"
              padding="m"
              backgroundColor="surfaceContainer"
              borderRadius={12}
              borderWidth={1}
              borderColor="outline"
            >
              <Text color="textSecondary" style={styles.label} marginBottom="s">
                APRAŠYMAS
              </Text>
              <Text color="textPrimary" variant="body">
                {data.description}
              </Text>
            </Box>
          )}

          {/* AI verdikto priežastis */}
          {data.aiVerdictReason && (
            <Box
              marginBottom="m"
              padding="m"
              backgroundColor="surfaceContainerHigh"
              borderRadius={12}
            >
              <Text color="textSecondary" style={styles.label} marginBottom="s">
                AI VERDIKTAS
              </Text>
              <Text color="textPrimary" variant="body">
                {data.aiVerdictReason}
              </Text>
            </Box>
          )}

          {/* Dalyviai */}
          <Box
            marginBottom="m"
            padding="m"
            backgroundColor="surfaceContainer"
            borderRadius={12}
            borderWidth={1}
            borderColor="outline"
          >
            <Text color="textSecondary" style={styles.label} marginBottom="s">
              DALYVIAI
            </Text>
            <ParticipantRow label="Kūrėjas" profile={data.creator} />
            <ParticipantRow
              label="Vykdytojas"
              profile={data.assignedTo}
              fallback="Nepriskirta"
              isMe={!!currentUserId && data.assignedTo?.id === currentUserId}
            />
          </Box>

          {/* Lažybų sąrašas */}
          <Box
            padding="m"
            backgroundColor="surfaceContainer"
            borderRadius={12}
            borderWidth={1}
            borderColor="outline"
          >
            <BettorsList data={bettorsData} isLoading={isBettorsLoading} />
          </Box>

          {canSubmitEvidence && id && (
            <Box marginTop="m">
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/quest-evidence' as never, params: { id } })
                }
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.buttonPrimaryBackground },
                ]}
              >
                <Text variant="body" color="buttonPrimaryForeground" fontWeight="bold">
                  Atlikau
                </Text>
              </Pressable>
            </Box>
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}

function ParticipantRow({
  label,
  profile,
  fallback,
  isMe,
}: {
  label: string;
  profile: TaskDetailProfile | null;
  fallback?: string;
  isMe?: boolean;
}) {
  return (
    <Box flexDirection="row" justifyContent="space-between" alignItems="center" paddingVertical="s">
      <Text color="textSecondary" fontSize={14}>
        {label}
      </Text>
      <Box flexDirection="row" alignItems="center">
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : profile ? (
          <Box
            width={24}
            height={24}
            borderRadius={12}
            backgroundColor="surfaceContainerHigh"
            alignItems="center"
            justifyContent="center"
            marginRight="s"
          >
            <Text color="textSecondary" fontSize={11}>
              {profile.username?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </Box>
        ) : null}
        <Text color="textPrimary" fontSize={14} fontWeight="bold">
          {profile?.username ?? fallback ?? '—'}
        </Text>
        {isMe && (
          <Box
            marginLeft="s"
            paddingHorizontal="s"
            paddingVertical="s"
            backgroundColor="linkPrimary"
            borderRadius={4}
          >
            <Text color="buttonPrimaryForeground" fontSize={10} fontWeight="bold">
              TAU PRISKIRTA
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
