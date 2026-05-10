import { Link, Stack } from 'expo-router';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Box
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="m"
        backgroundColor="mainBackground"
      >
        <Text variant="header" color="textPrimary">
          This screen doesn't exist.
        </Text>

        <Link href="/">
          <Text variant="body" color="linkPrimary" marginTop="m">
            Go to home screen!
          </Text>
        </Link>
      </Box>
    </>
  );
}
