import { FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { useGroup } from '@/providers/GroupProvider';
import { Group } from '@/lib/api';

export default function GroupsScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const { groups, activeGroup, isLoading, setActiveGroup } = useGroup();

  const handleSelectGroup = (group: Group) => {
    setActiveGroup(group);
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const isActive = activeGroup?.id === item.id;

    return (
      <Pressable onPress={() => handleSelectGroup(item)}>
        <Box
          backgroundColor={isActive ? 'surfaceContainerHigh' : 'mainBackground'}
          padding="m"
          marginBottom="s"
          borderRadius={12}
          borderWidth={isActive ? 2 : 1}
          borderColor={isActive ? 'buttonPrimaryBackground' : 'outline'}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box flex={1}>
            <Box flexDirection="row" alignItems="center" gap="s">
              <Text variant="subheader" color="mainForeground">
                {item.name}
              </Text>
              {isActive && (
                <Box
                  backgroundColor="buttonPrimaryBackground"
                  paddingHorizontal="s"
                  paddingVertical="s"
                  borderRadius={4}
                >
                  <Text variant="body" color="buttonPrimaryForeground" fontSize={10}>
                    Aktyvi
                  </Text>
                </Box>
              )}
            </Box>
            <Box flexDirection="row" alignItems="center" gap="m" marginTop="s">
              <Text variant="body" color="textSecondary" fontSize={12}>
                {item.role === 'admin' ? 'Administratorius' : 'Narys'}
              </Text>
              <Text variant="body" color="textSecondary" fontSize={12}>
                {item.memberCount} {item.memberCount === 1 ? 'narys' : 'nariai'}
              </Text>
            </Box>
          </Box>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/group-members', params: { groupId: item.id } })
            }
          >
            <Text variant="body" color="buttonPrimaryBackground" fontSize={22}>
              &gt;
            </Text>
          </Pressable>
        </Box>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="mainBackground">
        <ActivityIndicator size="large" color={theme.colors.buttonPrimaryBackground} />
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" padding="m">
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
        <Text variant="header" color="textPrimary">
          Grupės
        </Text>
        <Box flexDirection="row" gap="s">
          <Pressable onPress={() => router.push('/join-group')}>
            <Box
              backgroundColor="surfaceContainerHigh"
              paddingHorizontal="m"
              paddingVertical="s"
              borderRadius={8}
            >
              <Text variant="body" color="mainForeground">
                Prisijungti
              </Text>
            </Box>
          </Pressable>
          <Pressable onPress={() => router.push('/create-group')}>
            <Box
              backgroundColor="buttonPrimaryBackground"
              paddingHorizontal="m"
              paddingVertical="s"
              borderRadius={8}
            >
              <Text variant="body" color="buttonPrimaryForeground">
                + Nauja
              </Text>
            </Box>
          </Pressable>
        </Box>
      </Box>

      {groups.length === 0 ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <Text variant="body" color="textSecondary" textAlign="center">
            Neturite grupių. Sukurkite naują arba prisijunkite per kvietimo kodą.
          </Text>
        </Box>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Box>
  );
}
