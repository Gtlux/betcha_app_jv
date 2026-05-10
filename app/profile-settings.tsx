import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const toLithuanianError = (err: unknown, fallback: string) => {
  const message = err instanceof Error ? err.message : '';

  if (!message) return fallback;

  if (
    message.startsWith('Užpildykite') ||
    message.startsWith('Nauji') ||
    message.startsWith('Naujas') ||
    message.startsWith('Neteisingas') ||
    message.startsWith('Vartotojas') ||
    message.startsWith('Nėra')
  ) {
    return message;
  }

  if (message.includes('Email address')) {
    return 'Neteisingas el. pašto formatas';
  }
  if (message.includes('is invalid')) {
    return 'Neteisingas el. pašto formatas';
  }
  if (message.includes('duplicate key value') || message.includes('already registered')) {
    return 'Toks el. paštas jau naudojamas';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Neteisingi prisijungimo duomenys';
  }
  if (message.includes('Password should be at least')) {
    return 'Slaptažodis per trumpas';
  }

  return fallback;
};

export default function ProfileSettingsScreen() {
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setGeneralError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error('Vartotojas neprisijungęs');
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!active) return;
        setAvatarUrl(profileData?.avatar_url ?? '');
        setInitialAvatarUrl(profileData?.avatar_url ?? '');
      } catch (err) {
        setGeneralError(err instanceof Error ? err.message : 'Nepavyko užkrauti nustatymų');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setProfileError(null);
      setMessage(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Vartotojas neprisijungęs');
      }

      const nextAvatar = avatarUrl.trim();
      const avatarChanged = nextAvatar !== initialAvatarUrl;

      if (!avatarChanged) {
        setMessage('Nėra pakeitimų išsaugojimui');
        return;
      }

      if (avatarChanged) {
        const { error: avatarError } = await supabase
          .from('profiles')
          .update({ avatar_url: nextAvatar || null })
          .eq('id', user.id);

        if (avatarError) throw avatarError;
        setInitialAvatarUrl(nextAvatar);
      }

      setMessage('Profilio nustatymai sėkmingai atnaujinti');
    } catch (err) {
      setProfileError(toLithuanianError(err, 'Nepavyko išsaugoti profilio nustatymų'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSavingPassword(true);
      setPasswordError(null);
      setMessage(null);

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        throw new Error('Užpildykite visus slaptažodžio laukus');
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        throw new Error('Vartotojas neprisijungęs');
      }

      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (reAuthError) {
        throw new Error('Neteisingas senas slaptažodis');
      }

      if (currentPassword === newPassword) {
        throw new Error('Naujas slaptažodis negali sutapti su senu');
      }

      if (newPassword.length < 6) {
        throw new Error('Naujas slaptažodis turi būti bent 6 simbolių');
      }

      if (newPassword !== confirmNewPassword) {
        throw new Error('Nauji slaptažodžiai nesutampa');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordForm(false);
      setMessage('Slaptažodis sėkmingai atnaujintas');
    } catch (err) {
      setPasswordError(toLithuanianError(err, 'Nepavyko pakeisti slaptažodžio'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
  };

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="mainBackground">
        <ActivityIndicator size="large" />
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <Box
          flex={1}
          backgroundColor="black"
          opacity={0.5}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Box flex={1} justifyContent="center" alignItems="center" padding="l">
          <Box backgroundColor="surfaceContainer" width="100%" padding="l" borderRadius={24}>
            <Text variant="subheader" textAlign="center" marginBottom="s">
              Atsijungti?
            </Text>
            <Text variant="body" color="textSecondary" textAlign="center" marginBottom="l">
              Ar tikrai norite atsijungti?
            </Text>

            <Box gap="m">
              <TouchableOpacity onPress={handleConfirmLogout}>
                <Box
                  backgroundColor="linkPrimary"
                  padding="m"
                  borderRadius={12}
                  alignItems="center"
                >
                  <Text color="white" fontWeight="bold">
                    Taip
                  </Text>
                </Box>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowLogoutConfirm(false)}>
                <Box
                  backgroundColor="buttonPrimaryBackground"
                  padding="m"
                  borderRadius={12}
                  alignItems="center"
                >
                  <Text color="white" fontWeight="bold">
                    Ne
                  </Text>
                </Box>
              </TouchableOpacity>
            </Box>
          </Box>
        </Box>
      </Modal>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text variant="header" marginBottom="l">
          Profilio nustatymai
        </Text>

        {message ? (
          <Box
            backgroundColor="surfaceContainerHigh"
            borderRadius={12}
            padding="m"
            marginBottom="m"
          >
            <Text color="textPrimary">{message}</Text>
          </Box>
        ) : null}

        {generalError ? (
          <Box
            backgroundColor="surfaceContainerHigh"
            borderRadius={12}
            padding="m"
            marginBottom="m"
          >
            <Text color="error">{generalError}</Text>
          </Box>
        ) : null}

        <Box backgroundColor="surfaceContainer" borderRadius={16} padding="m" marginBottom="m">
          <Text variant="subheader" marginBottom="m">
            Paskyra
          </Text>

          {profileError ? (
            <Box
              backgroundColor="surfaceContainerHigh"
              borderRadius={12}
              padding="m"
              marginBottom="m"
            >
              <Text color="error">{profileError}</Text>
            </Box>
          ) : null}

          <Text color="textSecondary" marginBottom="s">
            Profilio nuotraukos URL
          </Text>
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            autoCapitalize="none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#fff',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 14,
            }}
          />

          <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile}>
            <Box backgroundColor="linkPrimary" padding="m" borderRadius={12} alignItems="center">
              {savingProfile ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text color="white" fontWeight="bold">
                  Išsaugoti pakeitimus
                </Text>
              )}
            </Box>
          </TouchableOpacity>
        </Box>

        <Box backgroundColor="surfaceContainer" borderRadius={16} padding="m" marginBottom="m">
          <Text variant="subheader" marginBottom="m">
            Slaptažodis
          </Text>

          {!showPasswordForm ? (
            <TouchableOpacity onPress={() => setShowPasswordForm(true)}>
              <Box
                backgroundColor="surfaceContainerHigh"
                padding="m"
                borderRadius={12}
                alignItems="center"
              >
                <Text color="textPrimary" fontWeight="bold">
                  Keisti slaptažodį
                </Text>
              </Box>
            </TouchableOpacity>
          ) : (
            <Box>
              {passwordError ? (
                <Box
                  backgroundColor="surfaceContainerHigh"
                  borderRadius={12}
                  padding="m"
                  marginBottom="m"
                >
                  <Text color="error">{passwordError}</Text>
                </Box>
              ) : null}

              <Text color="textSecondary" marginBottom="s">
                Senas slaptažodis
              </Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 12,
                }}
              />

              <Text color="textSecondary" marginBottom="s">
                Naujas slaptažodis
              </Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 12,
                }}
              />

              <Text color="textSecondary" marginBottom="s">
                Patvirtinkite naują slaptažodį
              </Text>
              <TextInput
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 14,
                }}
              />

              <Box gap="m">
                <TouchableOpacity onPress={handleChangePassword} disabled={savingPassword}>
                  <Box
                    backgroundColor="linkPrimary"
                    padding="m"
                    borderRadius={12}
                    alignItems="center"
                  >
                    {savingPassword ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text color="white" fontWeight="bold">
                        Atnaujinti slaptažodį
                      </Text>
                    )}
                  </Box>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                >
                  <Box
                    backgroundColor="buttonPrimaryBackground"
                    padding="m"
                    borderRadius={12}
                    alignItems="center"
                  >
                    <Text color="white" fontWeight="bold">
                      Atšaukti
                    </Text>
                  </Box>
                </TouchableOpacity>
              </Box>
            </Box>
          )}
        </Box>

        <TouchableOpacity onPress={() => setShowLogoutConfirm(true)}>
          <Box
            backgroundColor="buttonPrimaryBackground"
            padding="m"
            borderRadius={12}
            alignItems="center"
          >
            <Text color="white" fontWeight="bold">
              Atsijungti
            </Text>
          </Box>
        </TouchableOpacity>
      </ScrollView>
    </Box>
  );
}
