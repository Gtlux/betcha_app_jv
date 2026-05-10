import { useCallback, useState } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { Alert, Linking } from 'react-native';

export function useCameraPermission() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const showBlockedAlert = useCallback(() => {
    Alert.alert(
      'Kameros prieiga užblokuota',
      'Norint fiksuoti netvarką, reikia suteikti kameros leidimą. Eikite į nustatymus ir įjunkite kameros prieigą.',
      [
        { text: 'Atšaukti', style: 'cancel' },
        { text: 'Atidaryti nustatymus', onPress: openSettings },
      ],
    );
  }, [openSettings]);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (permission?.granted) {
      return true;
    }

    setIsRequesting(true);
    try {
      const result = await requestPermission();

      if (result.granted) {
        return true;
      }

      if (!result.canAskAgain) {
        showBlockedAlert();
      }

      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [permission, requestPermission, showBlockedAlert]);

  return {
    hasPermission: permission?.granted ?? false,
    isRequesting,
    ensurePermission,
  };
}
