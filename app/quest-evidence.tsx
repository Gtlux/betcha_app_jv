import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { useCameraPermission } from '@/hooks/useCameraPermission';
import { useSubmitEvidence } from '@/hooks/useSubmitEvidence';

export default function QuestEvidenceScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cameraRef = useRef<CameraView>(null);
  const { hasPermission, ensurePermission } = useCameraPermission();
  const { submit, reset, isLoading, result, error } = useSubmitEvidence();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isTaking, setIsTaking] = useState(false);

  useEffect(() => {
    if (result?.verdict === 'approved') {
      const timer = setTimeout(() => {
        router.replace({ pathname: '/quest-detail' as never, params: { id } });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [result, router, id]);

  if (!id) {
    return (
      <Box flex={1} backgroundColor="mainBackground" padding="l" justifyContent="center">
        <Text variant="body" color="error" textAlign="center">
          Trūksta užduoties ID
        </Text>
      </Box>
    );
  }

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const r = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (r?.uri) setPhoto(r.uri);
    } finally {
      setIsTaking(false);
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    reset();
  };

  const handleSubmit = async () => {
    if (!photo) return;
    await submit(id, photo);
  };

  if (!hasPermission) {
    return (
      <Box
        flex={1}
        backgroundColor="mainBackground"
        justifyContent="center"
        alignItems="center"
        padding="l"
      >
        <Text variant="body" textAlign="center" marginBottom="m">
          Norint įkelti įrodymą, reikia suteikti kameros leidimą.
        </Text>
        <Pressable
          onPress={ensurePermission}
          style={[styles.button, { backgroundColor: theme.colors.buttonPrimaryBackground }]}
        >
          <Text variant="body" color="buttonPrimaryForeground">
            Suteikti leidimą
          </Text>
        </Pressable>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={theme.colors.buttonPrimaryBackground} />
        <Text variant="body" color="textSecondary" marginTop="m">
          AI vertina įrodymą...
        </Text>
      </Box>
    );
  }

  if (result?.verdict === 'approved') {
    return (
      <Box
        flex={1}
        backgroundColor="mainBackground"
        justifyContent="center"
        alignItems="center"
        padding="l"
      >
        <Box
          backgroundColor="linkPrimary"
          padding="m"
          borderRadius={12}
          marginBottom="m"
          width="100%"
        >
          <Text color="buttonPrimaryForeground" fontWeight="bold" textAlign="center">
            Patvirtinta
          </Text>
        </Box>
        <Text variant="body" color="textPrimary" textAlign="center">
          {result.reason}
        </Text>
      </Box>
    );
  }

  if (result?.verdict === 'rejected' || result?.verdict === 'unclear' || error) {
    const reason = result?.reason ?? error ?? 'Įvyko klaida';
    return (
      <Box flex={1} backgroundColor="mainBackground" padding="l" justifyContent="center">
        <Box backgroundColor="errorContainer" padding="m" borderRadius={12} marginBottom="m">
          <Text color="error" variant="body" fontWeight="bold" marginBottom="s">
            {result?.verdict === 'rejected' ? 'AI atmetė įrodymą' : 'Nepavyko patvirtinti'}
          </Text>
          <Text color="error" variant="body">
            {reason}
          </Text>
        </Box>
        <Pressable
          onPress={handleRetake}
          style={[styles.button, { backgroundColor: theme.colors.buttonPrimaryBackground }]}
        >
          <Text variant="body" color="buttonPrimaryForeground" textAlign="center">
            Bandyti dar kartą
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.button,
            { backgroundColor: theme.colors.surfaceContainerHigh, marginTop: 12 },
          ]}
        >
          <Text variant="body" color="mainForeground" textAlign="center">
            Atgal
          </Text>
        </Pressable>
      </Box>
    );
  }

  if (photo) {
    return (
      <Box flex={1} backgroundColor="mainBackground">
        <Image source={{ uri: photo }} style={styles.preview} />
        <Box flexDirection="row" justifyContent="space-around" alignItems="center" padding="l">
          <Pressable
            onPress={handleRetake}
            style={[styles.button, { backgroundColor: theme.colors.surfaceContainerHigh }]}
          >
            <Text variant="body" color="mainForeground">
              Perfotografuoti
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            style={[styles.button, { backgroundColor: theme.colors.buttonPrimaryBackground }]}
          >
            <Text variant="body" color="buttonPrimaryForeground">
              Įkelti
            </Text>
          </Pressable>
        </Box>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      {isFocused && <CameraView ref={cameraRef} style={styles.camera} facing="back" />}
      <Box position="absolute" bottom={0} left={0} right={0} alignItems="center" paddingBottom="xl">
        <Pressable
          onPress={handleTakePhoto}
          disabled={isTaking}
          style={[
            styles.captureButton,
            { borderColor: theme.colors.mainForeground },
            isTaking && styles.captureButtonDisabled,
          ]}
        >
          <Box
            width={56}
            height={56}
            borderRadius={28}
            backgroundColor="mainForeground"
            opacity={isTaking ? 0.5 : 1}
          />
        </Pressable>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: 'contain' },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: { opacity: 0.5 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
