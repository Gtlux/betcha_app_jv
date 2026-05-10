import { Pressable, StyleSheet } from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';

const STATUS_LABELS: Record<'open' | 'completed' | 'rejected', string> = {
  open: 'Atvira',
  completed: 'Užbaigta',
  rejected: 'Atmesta',
};

const STATUS_COLORS: Record<
  'open' | 'completed' | 'rejected',
  'outline' | 'linkPrimary' | 'error'
> = {
  open: 'outline',
  completed: 'linkPrimary',
  rejected: 'error',
};

interface QuestCardProps {
  id: string;
  title: string;
  status: 'open' | 'completed' | 'rejected';
  difficultyScore?: number | null;
  assignedToMe?: boolean;
  compact?: boolean;
  onPress: (id: string) => void;
}

export default function QuestCard({
  id,
  title,
  status,
  difficultyScore,
  assignedToMe,
  compact,
  onPress,
}: QuestCardProps) {
  return (
    <Pressable onPress={() => onPress(id)} style={styles.pressable} testID={`quest-card-${id}`}>
      <Box
        padding={compact ? 's' : 'm'}
        backgroundColor="surfaceContainer"
        borderRadius={12}
        borderWidth={1}
        borderColor="outline"
        marginBottom="s"
      >
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flex={1} marginRight="s">
            <Text
              color="textPrimary"
              fontWeight="bold"
              fontSize={compact ? 14 : 16}
              numberOfLines={2}
            >
              {title}
            </Text>
            {!compact && difficultyScore !== null && difficultyScore !== undefined && (
              <Text color="textSecondary" fontSize={12} marginTop="s">
                Sunkumas: {difficultyScore.toFixed(1)} / 10
              </Text>
            )}
          </Box>
          <Box
            paddingHorizontal="s"
            paddingVertical="s"
            backgroundColor={STATUS_COLORS[status]}
            borderRadius={4}
          >
            <Text color="buttonPrimaryForeground" fontSize={10} fontWeight="bold">
              {STATUS_LABELS[status].toUpperCase()}
            </Text>
          </Box>
        </Box>
        {assignedToMe && (
          <Box
            marginTop="s"
            alignSelf="flex-start"
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
});
