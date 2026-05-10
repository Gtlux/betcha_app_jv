import { useState } from 'react';
import { Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import * as Clipboard from 'expo-clipboard';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { createGroup } from '@/lib/api';
import { useGroup } from '@/providers/GroupProvider';

export default function CreateGroupScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const { refreshGroups, setActiveGroup } = useGroup();

  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Grupės pavadinimas negali būti tuščias');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const group = await createGroup(trimmed);
      setInviteCode(group.invite_code);
      await refreshGroups();
      await setActiveGroup({
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        createdById: '',
        role: 'admin',
        memberCount: 1,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepavyko sukurti grupės';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (inviteCode) {
    return (
      <Box flex={1} backgroundColor="mainBackground" padding="l" justifyContent="center">
        <Text variant="header" color="mainForeground" textAlign="center" marginBottom="l">
          Grupė sukurta!
        </Text>
        <Text variant="body" color="textSecondary" textAlign="center" marginBottom="m">
          Pasidalinkite kvietimo kodu su draugais:
        </Text>
        <Box
          backgroundColor="surfaceContainerHigh"
          padding="l"
          borderRadius={12}
          alignItems="center"
          marginBottom="l"
        >
          <Text variant="header" color="mainForeground" fontSize={32}>
            {inviteCode}
          </Text>
        </Box>
        <Pressable onPress={handleCopy}>
          <Box
            backgroundColor="buttonPrimaryBackground"
            padding="m"
            borderRadius={8}
            alignItems="center"
          >
            <Text variant="body" color="buttonPrimaryForeground">
              {copied ? 'Nukopijuota!' : 'Kopijuoti kodą'}
            </Text>
          </Box>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Box marginTop="m" padding="m">
            <Text variant="body" color="textSecondary" textAlign="center">
              Grįžti
            </Text>
          </Box>
        </Pressable>
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box flex={1} backgroundColor="mainBackground" padding="l">
        <Text variant="subheader" color="mainForeground" marginBottom="l">
          Nauja grupė
        </Text>

        <Text variant="body" color="textSecondary" marginBottom="s">
          Pavadinimas
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderRadius: 8,
            padding: theme.spacing.m,
            fontSize: theme.textVariants.body.fontSize,
            color: theme.colors.mainForeground,
            borderColor: theme.colors.outline,
          }}
          value={name}
          onChangeText={setName}
          placeholder="Įveskite grupės pavadinimą"
          placeholderTextColor={theme.colors.textSecondary}
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
          onPress={handleCreate}
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
              {isSubmitting ? 'Kuriama...' : 'Sukurti grupę'}
            </Text>
          </Box>
        </Pressable>
      </Box>
    </KeyboardAvoidingView>
  );
}
