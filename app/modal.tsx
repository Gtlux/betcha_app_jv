import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';

export default function ModalScreen() {
  return (
    <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="mainBackground">
      <Text variant="header" color="textPrimary">
        Modal
      </Text>
      <Box height={1} width="80%" backgroundColor="mainForeground" marginVertical="l" />
      <Text variant="body" color="textSecondary">
        Turinys ruošiamas
      </Text>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </Box>
  );
}
