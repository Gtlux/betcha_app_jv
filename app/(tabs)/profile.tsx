import React from 'react';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import ProfilePanel from '@/components/profile/ProfilePanel';
import ActivityLog from '@/components/profile/ActivityLog';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useInventory } from '@/hooks/useInventory';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';

export default function ProfileScreen() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useUserProfile();
  const { inventory, useItem: handleUseItem, refresh: refreshInventory } = useInventory();

  const [refreshing, setRefreshing] = React.useState(false);
  const [itemToUse, setItemToUse] = React.useState<{ id: string; name: string } | null>(null);

  const handleConfirmUseItem = React.useCallback((inventoryId: string, itemName: string) => {
    setItemToUse({ id: inventoryId, name: itemName });
  }, []);

  const handleUseConfirmed = React.useCallback(async () => {
    if (!itemToUse) return;
    await handleUseItem(itemToUse.id);
    setItemToUse(null);
  }, [handleUseItem, itemToUse]);

  useFocusEffect(
    React.useCallback(() => {
      refreshInventory();
      refreshProfile();
    }, [refreshInventory, refreshProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), refreshInventory()]);
    setRefreshing(false);
  };

  if (profileLoading && !refreshing && !profile) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="mainBackground">
        <ActivityIndicator size="large" />
      </Box>
    );
  }

  if (profileError || !profile) {
    return (
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="mainBackground"
        padding="m"
      >
        <Text variant="body" color="error">
          Klaida kraunant profilį:{' '}
          {typeof profileError === 'string'
            ? profileError
            : (profileError as any)?.message || 'Profilis nerastas'}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Modal
        visible={!!itemToUse}
        transparent
        animationType="fade"
        onRequestClose={() => setItemToUse(null)}
      >
        <Box
          flex={1}
          backgroundColor="black"
          opacity={0.5}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Box flex={1} justifyContent="center" alignItems="center" padding="l">
          <Box
            backgroundColor="surfaceContainer"
            width="100%"
            padding="l"
            borderRadius={24}
            shadowColor="black"
            shadowOpacity={0.5}
            elevation={10}
          >
            <Text variant="subheader" textAlign="center" marginBottom="s">
              Naudoti itemą?
            </Text>
            <Text variant="body" color="textSecondary" textAlign="center" marginBottom="l">
              Ar tikrai nori panaudoti „{itemToUse?.name}“?
            </Text>

            <Box gap="m">
              <TouchableOpacity onPress={handleUseConfirmed}>
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

              <TouchableOpacity onPress={() => setItemToUse(null)}>
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

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        <ProfilePanel
          username={profile.username}
          avatarUrl={profile.avatar_url}
          balance={profile.balance}
          totalPoints={profile.total_points_collected || 0}
        />

        <ActivityLog />

        <Box paddingHorizontal="m" marginTop="m">
          <Text variant="header" color="textPrimary" marginBottom="m">
            Mano Inventorius
          </Text>

          {inventory.length === 0 ? (
            <Box
              backgroundColor="surfaceContainer"
              padding="l"
              borderRadius={24}
              alignItems="center"
            >
              <Text variant="body" color="textSecondary">
                Inventorius tuščias
              </Text>
            </Box>
          ) : (
            <Box gap="m">
              {inventory.map((inv) => (
                <Box
                  key={inv.id}
                  backgroundColor="surfaceContainer"
                  padding="m"
                  borderRadius={16}
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box flex={1}>
                    <Text variant="body" fontWeight="bold">
                      {inv.item.name}
                    </Text>
                    <Text variant="body" color="textSecondary" fontSize={14}>
                      {inv.item.description || 'Nėra aprašymo'}
                    </Text>
                  </Box>
                  <TouchableOpacity onPress={() => handleConfirmUseItem(inv.id, inv.item.name)}>
                    <Box
                      backgroundColor="linkPrimary"
                      paddingVertical="s"
                      paddingHorizontal="m"
                      borderRadius={8}
                    >
                      <Text color="white" fontWeight="bold" fontSize={14}>
                        Naudoti
                      </Text>
                    </Box>
                  </TouchableOpacity>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}
