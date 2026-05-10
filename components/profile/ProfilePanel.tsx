import React from 'react';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { getCurrentLevel, getProgressPercentage } from '@/utils/levelCalculator';
import { Image } from 'react-native';

interface ProfilePanelProps {
  username: string;
  avatarUrl?: string;
  balance: number;
  totalPoints: number;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({
  username,
  avatarUrl,
  balance,
  totalPoints,
}) => {
  const currentLevel = getCurrentLevel(totalPoints);
  const progress = getProgressPercentage(totalPoints);

  return (
    <Box
      backgroundColor="surfaceContainer"
      padding="m"
      borderRadius={16}
      margin="m"
      shadowColor="black"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.25}
      shadowRadius={3.84}
      elevation={5}
    >
      <Box flexDirection="row" alignItems="center" marginBottom="m">
        <Box
          width={60}
          height={60}
          borderRadius={30}
          backgroundColor="surfaceContainerHigh"
          overflow="hidden"
          marginRight="m"
          borderWidth={2}
          borderColor={currentLevel.color}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Text variant="header" fontSize={24}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </Box>
          )}
        </Box>
        <Box flex={1}>
          <Text variant="subheader" numberOfLines={1}>
            {username}
          </Text>
          <Box flexDirection="row" alignItems="center">
            <Box
              width={12}
              height={12}
              borderRadius={6}
              backgroundColor={currentLevel.color}
              marginRight="s"
            />
            <Text variant="body" color="textSecondary">
              {currentLevel.name} lygis
            </Text>
          </Box>
        </Box>
      </Box>

      <Box marginBottom="s">
        <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
          <Text variant="body" color="textSecondary">
            Progresas iki kito slenksčio
          </Text>
          <Text variant="body" fontWeight="bold">
            {Math.round(progress * 100)}%
          </Text>
        </Box>
        <Box height={8} backgroundColor="surfaceContainerHigh" borderRadius={4} overflow="hidden">
          <Box height="100%" width={`${progress * 100}%`} backgroundColor={currentLevel.color} />
        </Box>
      </Box>

      <Box
        flexDirection="row"
        justifyContent="space-between"
        marginTop="m"
        borderTopWidth={1}
        borderTopColor="outline"
        paddingTop="m"
      >
        <Box alignItems="center">
          <Text variant="body" color="textSecondary">
            Balansas
          </Text>
          <Text variant="subheader" color="linkPrimary">
            {balance} 🪙
          </Text>
        </Box>
        <Box alignItems="center">
          <Text variant="body" color="textSecondary">
            Visi taškai
          </Text>
          <Text variant="subheader" color="tabBarActive">
            {totalPoints} XP
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePanel;
