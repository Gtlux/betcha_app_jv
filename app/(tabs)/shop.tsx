import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { useShop, StoreItem } from '@/hooks/useShop';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SymbolView } from 'expo-symbols';
import { useFocusEffect } from '@react-navigation/native';

export default function ShopScreen() {
  const { items, loading, error, refresh, purchaseItem } = useShop();
  const { profile, refresh: refreshProfile } = useUserProfile();
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Mock režimas pašalintas – naudojame tik serverio API

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 2200);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshProfile()]);
    setRefreshing(false);
  };

  // Saugumo priemonė: jei išeiname iš ekrano su atidarytu modalu,
  // išvalome pasirinktą prekę, kad išvengtume UI/glitch/crash.
  useFocusEffect(
    useCallback(() => {
      // Kai ekranas patenka į fokusą – automatiškai atsinaujiname parduotuvės sąrašą
      // ir (pasirinktinai) profilį, kad balansas būtų sinchronizuotas.
      refresh();
      // Jei norime visada sinchronizuoti ir balansą:
      // refreshProfile();
      return () => {
        // Išeinant iš ekrano – išvalome modalą/būsenas, kad išvengti glitch/crash
        setSelectedItem(null);
        setPurchasing(false);
      };
    }, [refresh /*, refreshProfile*/]),
  );

  const handlePurchase = async () => {
    if (!selectedItem || !profile) return;

    if (profile.balance < selectedItem.price) {
      Alert.alert('Klaida', 'Nepakanka taškų pirkimui.');
      return;
    }

    setPurchasing(true);
    const result = await purchaseItem(selectedItem.id, selectedItem.price);
    setPurchasing(false);

    if (result.success) {
      await Promise.all([refreshProfile(), refresh()]);
      setSelectedItem(null);
      setSuccessMessage(`Nusipirkai: ${selectedItem.name}`);
    } else {
      Alert.alert('Klaida', result.error || 'Nepavyko atlikti pirkimo');
    }
  };

  const renderItem = ({ item }: { item: StoreItem }) => (
    <TouchableOpacity onPress={() => setSelectedItem(item)} style={{ flex: 1, margin: 8 }}>
      <Box
        backgroundColor="surfaceContainer"
        padding="m"
        borderRadius={16}
        alignItems="center"
        borderWidth={1}
        borderColor="outline"
        opacity={profile && profile.balance < item.price ? 0.6 : 1}
      >
        <SymbolView
          name={{ ios: 'gift.fill', android: 'card_giftcard', web: 'card_giftcard' }}
          size={32}
          tintColor="#E0080B"
        />
        <Text variant="body" fontWeight="bold" marginTop="s" textAlign="center">
          {item.name}
        </Text>
        <Text variant="body" color="linkPrimary" fontWeight="bold">
          {item.price} 🪙
        </Text>
      </Box>
    </TouchableOpacity>
  );

  return (
    <Box flex={1} backgroundColor="mainBackground" padding="s">
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" padding="m">
        <Text variant="header">Parduotuvė</Text>
        <Box
          backgroundColor="surfaceContainerHigh"
          paddingHorizontal="m"
          paddingVertical="s"
          borderRadius={20}
        >
          <Text variant="body" fontWeight="bold">
            {profile?.balance || 0} 🪙
          </Text>
        </Box>
      </Box>

      {successMessage ? (
        <Box
          marginHorizontal="m"
          marginBottom="s"
          backgroundColor="surfaceContainerHigh"
          borderRadius={12}
          padding="m"
          borderWidth={1}
          borderColor="linkPrimary"
        >
          <Text color="textPrimary" fontWeight="bold">
            {successMessage}
          </Text>
        </Box>
      ) : null}

      {loading && !refreshing && items.length === 0 ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#E0080B" />
        </Box>
      ) : error ? (
        <Box flex={1} justifyContent="center" alignItems="center" padding="l">
          <Text variant="body" color="error" textAlign="center">
            {error === 'AbortError' ? 'Nepavyko pasiekti serverio (pasibaigė laikas).' : error}
          </Text>
        </Box>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
          ListEmptyComponent={
            <Box padding="xl" alignItems="center">
              <Text variant="body" color="textSecondary">
                Prekių šiuo metu nėra
              </Text>
            </Box>
          }
        />
      )}

      {/* Pirkimo Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
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
              {selectedItem?.name}
            </Text>
            <Text variant="body" color="textSecondary" textAlign="center" marginBottom="l">
              {selectedItem?.description || 'Ši prekė neturi aprašymo.'}
            </Text>

            <Box flexDirection="row" justifyContent="space-between" marginBottom="xl">
              <Text variant="body">Kaina:</Text>
              <Text variant="body" fontWeight="bold" color="linkPrimary">
                {selectedItem?.price} 🪙
              </Text>
            </Box>

            <Box gap="m">
              <TouchableOpacity
                onPress={handlePurchase}
                disabled={Boolean(
                  purchasing || (profile && selectedItem && profile.balance < selectedItem.price),
                )}
              >
                <Box
                  backgroundColor={
                    profile && selectedItem && profile.balance < selectedItem.price
                      ? 'outline'
                      : 'linkPrimary'
                  }
                  padding="m"
                  borderRadius={12}
                  alignItems="center"
                >
                  {purchasing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text color="white" fontWeight="bold">
                      Pirkti
                    </Text>
                  )}
                </Box>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSelectedItem(null)} disabled={purchasing}>
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
        </Box>
      </Modal>
    </Box>
  );
}
