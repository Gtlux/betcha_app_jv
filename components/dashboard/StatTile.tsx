import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';

interface StatTileProps {
  label: string;
  value: string | number;
}

export default function StatTile({ label, value }: StatTileProps) {
  return (
    <Box
      flex={1}
      padding="m"
      backgroundColor="surfaceContainer"
      borderRadius={12}
      borderWidth={1}
      borderColor="outline"
    >
      <Text color="textSecondary" fontSize={11} marginBottom="s">
        {label.toUpperCase()}
      </Text>
      <Text color="textPrimary" fontSize={24} fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}
