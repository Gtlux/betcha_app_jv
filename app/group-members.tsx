import { useEffect, useState } from 'react';
import { FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import * as Clipboard from 'expo-clipboard';
import { Theme } from '@/constants/theme';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { getGroupMembers, GroupDetails, GroupMember } from '@/lib/api';

export default function GroupMembersScreen() {
  const theme = useTheme<Theme>();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const fetchMembers = async () => {
      try {
        const data = await getGroupMembers(groupId);
        setGroup(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nepavyko gauti narių';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const handleCopyCode = async () => {
    if (group?.inviteCode) {
      await Clipboard.setStringAsync(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderMember = ({ item }: { item: GroupMember }) => (
    <Box
      flexDirection="row"
      alignItems="center"
      padding="m"
      marginBottom="s"
      backgroundColor="surfaceContainerHigh"
      borderRadius={12}
    >
      <Box
        width={40}
        height={40}
        borderRadius={20}
        backgroundColor="surfaceContainer"
        alignItems="center"
        justifyContent="center"
        marginRight="m"
      >
        <Text variant="body" color="mainForeground" fontSize={18}>
          {(item.username ?? '?')[0].toUpperCase()}
        </Text>
      </Box>
      <Box flex={1}>
        <Text variant="body" color="mainForeground">
          {item.username ?? 'Nežinomas'}
        </Text>
      </Box>
      <Box
        backgroundColor={item.role === 'admin' ? 'buttonPrimaryBackground' : 'surfaceContainer'}
        paddingHorizontal="s"
        paddingVertical="s"
        borderRadius={4}
      >
        <Text
          variant="body"
          color={item.role === 'admin' ? 'buttonPrimaryForeground' : 'textSecondary'}
          fontSize={11}
        >
          {item.role === 'admin' ? 'Admin' : 'Narys'}
        </Text>
      </Box>
    </Box>
  );

  if (isLoading) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="mainBackground">
        <ActivityIndicator size="large" color={theme.colors.buttonPrimaryBackground} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        flex={1}
        alignItems="center"
        justifyContent="center"
        backgroundColor="mainBackground"
        padding="l"
      >
        <Text variant="body" color="error" textAlign="center">
          {error}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" padding="m">
      <Text variant="header" color="textPrimary" marginBottom="s">
        {group?.name}
      </Text>

      <Pressable onPress={handleCopyCode}>
        <Box
          flexDirection="row"
          alignItems="center"
          backgroundColor="surfaceContainerHigh"
          padding="m"
          borderRadius={8}
          marginBottom="l"
          justifyContent="space-between"
        >
          <Box>
            <Text variant="body" color="textSecondary" fontSize={12}>
              Kvietimo kodas
            </Text>
            <Text variant="body" color="mainForeground" fontSize={20}>
              {group?.inviteCode}
            </Text>
          </Box>
          <Text variant="body" color="buttonPrimaryBackground">
            {copied ? 'Nukopijuota!' : 'Kopijuoti'}
          </Text>
        </Box>
      </Pressable>

      <Text variant="body" color="textSecondary" marginBottom="m">
        Nariai ({group?.members.length ?? 0})
      </Text>

      <FlatList
        data={group?.members ?? []}
        keyExtractor={(item) => item.profileId}
        renderItem={renderMember}
        showsVerticalScrollIndicator={false}
      />
    </Box>
  );
}
