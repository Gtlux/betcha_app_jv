import { useState } from 'react';
import { Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { joinGroup } from '@/lib/api';
import { useGroup } from '@/providers/GroupProvider';

export default function JoinGroupScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const { refreshGroups } = useGroup();

  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    const trimmed = inviteCode.trim().toUpperCase();
    if (!trimmed) {
      setError('Kvietimo kodas negali būti tuščias');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await joinGroup(trimmed);
      await refreshGroups();
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepavyko prisijungti';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box flex={1} backgroundColor="mainBackground" padding="l">
        <Text variant="subheader" color="mainForeground" marginBottom="l">
          Prisijungti prie grupės
        </Text>

        <Text variant="body" color="textSecondary" marginBottom="s">
          Kvietimo kodas
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderRadius: 8,
            padding: theme.spacing.m,
            fontSize: theme.textVariants.body.fontSize,
            color: theme.colors.mainForeground,
            borderColor: theme.colors.outline,
            textAlign: 'center',
            letterSpacing: 4,
          }}
          value={inviteCode}
          onChangeText={(text) => setInviteCode(text.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="characters"
          maxLength={6}
          autoFocus
        />

        {error && (
          <Box backgroundColor="errorContainer" padding="m" borderRadius={8} marginTop="m">
            <Text variant="body" color="error" textAlign="center">
              {error}
            </Text>
          </Box>
        )}

        <Pressable
          onPress={handleJoin}
          disabled={isSubmitting}
          style={isSubmitting ? { opacity: 0.5 } : undefined}
        >
          <Box
            backgroundColor="buttonPrimaryBackground"
            paddingVertical="m"
            borderRadius={8}
            marginTop="l"
          >
            <Text variant="body" color="buttonPrimaryForeground" textAlign="center">
              {isSubmitting ? 'Jungiamasi...' : 'Prisijungti'}
            </Text>
          </Box>
        </Pressable>
      </Box>
    </KeyboardAvoidingView>
  );
}
