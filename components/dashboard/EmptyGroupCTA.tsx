import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';

export default function EmptyGroupCTA() {
  const theme = useTheme<Theme>();
  const router = useRouter();

  return (
    <Box
      padding="l"
      backgroundColor="surfaceContainer"
      borderRadius={12}
      borderWidth={1}
      borderColor="outline"
      alignItems="center"
    >
      <Text color="textPrimary" fontSize={18} fontWeight="bold" marginBottom="s">
        Dar nesi grupėje
      </Text>
      <Text color="textSecondary" textAlign="center" marginBottom="m">
        Sukurk savo grupę arba prisijunk prie esamos, kad galėtum kurti quest&apos;us ir statyti.
      </Text>
      <Pressable
        onPress={() => router.push('/create-group')}
        style={[styles.button, { backgroundColor: theme.colors.buttonPrimaryBackground }]}
      >
        <Text variant="body" color="buttonPrimaryForeground" fontWeight="bold">
          Sukurti grupę
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/join-group')}
        style={[
          styles.button,
          { backgroundColor: theme.colors.surfaceContainerHigh, marginTop: 12 },
        ]}
      >
        <Text variant="body" color="mainForeground">
          Prisijungti prie grupės
        </Text>
      </Pressable>
    </Box>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
});
