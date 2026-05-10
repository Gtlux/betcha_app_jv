import { useState } from 'react';
import { StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { createTask } from '@/lib/api';
import { useGroup } from '@/providers/GroupProvider';

export default function ConfirmScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const { activeGroup } = useGroup();
  const params = useLocalSearchParams<{
    title: string;
    description: string;
    bettingIndex: string;
    photoUrl?: string;
  }>();

  const [title, setTitle] = useState(params.title ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const bettingIndex = Number(params.bettingIndex) || 1;
  const photoUrl = params.photoUrl;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError('Pavadinimas negali būti tuščias');
      return;
    }

    if (!trimmedDescription) {
      setError('Aprašymas negali būti tuščias');
      return;
    }

    if (!activeGroup) {
      setError('Pasirinkite aktyvią grupę prieš skelbiant užduotį');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createTask({
        title: trimmedTitle,
        description: trimmedDescription,
        bettingIndex,
        groupId: activeGroup.id,
        photoUrl,
      });
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepavyko paskelbti užduoties';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box flex={1} backgroundColor="mainBackground" padding="l">
        <Text variant="subheader" color="mainForeground" marginBottom="l">
          Patvirtinti užduotį
        </Text>

        <Text variant="body" color="textSecondary" marginBottom="s">
          Pavadinimas
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: theme.colors.mainForeground, borderColor: theme.colors.outline },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder="Įveskite pavadinimą"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text variant="body" color="textSecondary" marginBottom="s" marginTop="m">
          Aprašymas
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            { color: theme.colors.mainForeground, borderColor: theme.colors.outline },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Įveskite aprašymą"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={4}
        />

        <Text variant="body" color="textSecondary" marginBottom="s" marginTop="m">
          Lazybų indeksas
        </Text>
        <Box backgroundColor="surfaceContainerHigh" padding="m" borderRadius={8} marginBottom="l">
          <Text variant="body" color="mainForeground">
            {bettingIndex}/10
          </Text>
        </Box>

        {error && (
          <Box backgroundColor="errorContainer" padding="m" borderRadius={8} marginBottom="m">
            <Text variant="body" color="error" textAlign="center">
              {error}
            </Text>
          </Box>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[
            styles.button,
            { backgroundColor: theme.colors.buttonPrimaryBackground },
            isSubmitting && styles.disabled,
          ]}
        >
          <Text variant="body" color="buttonPrimaryForeground" textAlign="center">
            {isSubmitting ? 'Skelbiama...' : 'Paskelbti'}
          </Text>
        </Pressable>
      </Box>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
