import { useRef, useState } from 'react';
import { StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { useTheme } from '@shopify/restyle';
import { useIsFocused } from '@react-navigation/native';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { useCameraPermission } from '@/hooks/useCameraPermission';
import { useRouter } from 'expo-router';
import { analyzePhoto } from '@/lib/api';

export default function CameraScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const { hasPermission, ensurePermission } = useCameraPermission();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isTaking) return;

    setIsTaking(true);
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (result?.uri) {
        setPhoto(result.uri);
      }
    } finally {
      setIsTaking(false);
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    setAnalysisError(null);
  };

  const handleConfirm = async () => {
    if (!photo || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzePhoto(photo);
      setPhoto(null);
      router.push({
        pathname: '/confirm',
        params: {
          title: result.title,
          description: result.description,
          bettingIndex: String(result.bettingIndex),
          photoUrl: result.photoUrl,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nežinoma klaida';
      if (message === 'AI_TIMEOUT') {
        setPhoto(null);
        router.push({
          pathname: '/confirm',
          params: { title: '', description: '', bettingIndex: '5' },
        });
        return;
      }
      if (message === 'AI_UNRECOGNIZED') {
        setAnalysisError('Nepavyko atpažinti nuotraukos turinio. Bandykite perfotografuoti.');
      } else {
        setAnalysisError(message);
      }
    } finally {
      setIsAnalyzing(false);
    }
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
          Norint fiksuoti netvarką, reikia suteikti kameros leidimą.
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

  if (isAnalyzing) {
    return (
      <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={theme.colors.buttonPrimaryBackground} />
        <Text variant="body" color="textSecondary" marginTop="m">
          Analizuojama nuotrauka...
        </Text>
      </Box>
    );
  }

  if (photo) {
    return (
      <Box flex={1} backgroundColor="mainBackground">
        <Image source={{ uri: photo }} style={styles.preview} />
        {analysisError && (
          <Box backgroundColor="errorContainer" padding="m" marginHorizontal="m" borderRadius={8}>
            <Text variant="body" color="error" textAlign="center">
              {analysisError}
            </Text>
          </Box>
        )}
        <Box
          flexDirection="row"
          justifyContent="space-around"
          alignItems="center"
          padding="l"
          backgroundColor="mainBackground"
        >
          <Pressable
            onPress={handleRetake}
            style={[styles.button, { backgroundColor: theme.colors.surfaceContainerHigh }]}
          >
            <Text variant="body" color="mainForeground">
              Perfotografuoti
            </Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            style={[styles.button, { backgroundColor: theme.colors.buttonPrimaryBackground }]}
          >
            <Text variant="body" color="buttonPrimaryForeground">
              Patvirtinti
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
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
