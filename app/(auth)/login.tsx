import {
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { useTheme } from '@shopify/restyle';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { Theme } from '@/constants/theme';
import { useEmailAuth } from '@/hooks/useEmailAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { useAuth } from '@/providers/AuthProvider';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const theme = useTheme<Theme>();
  const { sessionExpired } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const emailAuth = useEmailAuth();
  const googleAuth = useGoogleAuth();
  const facebookAuth = useFacebookAuth();

  const isLoading = emailAuth.isLoading || googleAuth.isLoading || facebookAuth.isLoading;

  const handleEmailAuth = async () => {
    setError(null);

    if (!email || !password) {
      setError('Užpildykite visus laukus');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Slaptažodžiai nesutampa');
      return;
    }

    const result =
      mode === 'login'
        ? await emailAuth.signIn(email, password)
        : await emailAuth.signUp(email, password);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    const result = await googleAuth.signIn();
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const handleFacebookAuth = async () => {
    setError(null);
    const result = await facebookAuth.signIn();
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.mainBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Box flex={1} justifyContent="center" padding="l">
          {/* Header */}
          <Text variant="header" color="textPrimary" marginBottom="s" style={styles.title}>
            BETCHA
          </Text>
          <Text color="textSecondary" marginBottom="xl" style={styles.subtitle}>
            Lažinkis su draugais
          </Text>

          {/* Tab Toggle */}
          <Box
            flexDirection="row"
            backgroundColor="surfaceContainer"
            borderRadius={12}
            padding="s"
            marginBottom="l"
            style={{ padding: 4 }}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                mode === 'login' && { backgroundColor: theme.colors.surfaceContainerHigh },
              ]}
              onPress={() => {
                setMode('login');
                setError(null);
              }}
            >
              <Text
                style={[styles.tabText, mode === 'login' && { color: theme.colors.textPrimary }]}
              >
                Prisijungti
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                mode === 'register' && { backgroundColor: theme.colors.surfaceContainerHigh },
              ]}
              onPress={() => {
                setMode('register');
                setError(null);
              }}
            >
              <Text
                style={[styles.tabText, mode === 'register' && { color: theme.colors.textPrimary }]}
              >
                Registruotis
              </Text>
            </TouchableOpacity>
          </Box>

          {/* Expired Session */}
          {sessionExpired && (
            <Box backgroundColor="surfaceContainer" padding="m" marginBottom="m" borderRadius={8}>
              <Text color="textSecondary" style={styles.errorText}>
                Sesija pasibaigė. Prašome prisijungti iš naujo.
              </Text>
            </Box>
          )}

          {/* Error */}
          {error && (
            <Box backgroundColor="errorContainer" padding="m" marginBottom="m" borderRadius={8}>
              <Text color="error" style={styles.errorText}>
                {error}
              </Text>
            </Box>
          )}

          {/* Form */}
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            placeholder="El. paštas"
            placeholderTextColor={theme.colors.outline}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            placeholder="Slaptažodis"
            placeholderTextColor={theme.colors.outline}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          {mode === 'register' && (
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Pakartokite slaptažodį"
              placeholderTextColor={theme.colors.outline}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleEmailAuth}
            disabled={isLoading}
            activeOpacity={0.8}
            style={[styles.submitButton, { backgroundColor: theme.colors.buttonPrimaryBackground }]}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.buttonPrimaryForeground} />
            ) : (
              <Text color="buttonPrimaryForeground" style={styles.submitText}>
                {mode === 'login' ? 'PRISIJUNGTI' : 'REGISTRUOTIS'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Separator */}
          <Box flexDirection="row" alignItems="center" marginVertical="l">
            <Box flex={1} height={1} backgroundColor="surfaceContainer" />
            <Text color="textSecondary" style={styles.separatorText}>
              arba
            </Text>
            <Box flex={1} height={1} backgroundColor="surfaceContainer" />
          </Box>

          {/* Social Login */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.white }]}
            onPress={handleGoogleAuth}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.googleText}>Prisijungti su Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.facebook }]}
            onPress={handleFacebookAuth}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.facebookText}>Prisijungti su Facebook</Text>
          </TouchableOpacity>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  title: {
    textAlign: 'center',
    letterSpacing: 6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    color: '#767575',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
  },
  input: {
    backgroundColor: '#0E0E0E',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(94, 63, 58, 0.15)',
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 2,
  },
  separatorText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  facebookText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
