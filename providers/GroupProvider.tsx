import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthProvider';
import { getMyGroups, Group } from '@/lib/api';

const ACTIVE_GROUP_KEY = '@betcha/activeGroupId';

interface GroupContextType {
  groups: Group[];
  activeGroup: Group | null;
  isLoading: boolean;
  setActiveGroup: (group: Group) => Promise<void>;
  refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType>({
  groups: [],
  activeGroup: null,
  isLoading: true,
  setActiveGroup: async () => {},
  refreshGroups: async () => {},
});

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroupState] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshGroups = useCallback(async () => {
    try {
      const fetched = await getMyGroups();
      setGroups(fetched);

      const savedId = await AsyncStorage.getItem(ACTIVE_GROUP_KEY);
      const match = fetched.find((g) => g.id === savedId);

      if (match) {
        setActiveGroupState(match);
      } else if (fetched.length > 0) {
        setActiveGroupState(fetched[0]);
        await AsyncStorage.setItem(ACTIVE_GROUP_KEY, fetched[0].id);
      } else {
        setActiveGroupState(null);
        await AsyncStorage.removeItem(ACTIVE_GROUP_KEY);
      }
    } catch {
      setGroups([]);
      setActiveGroupState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      refreshGroups();
    } else {
      setGroups([]);
      setActiveGroupState(null);
      setIsLoading(false);
    }
  }, [session, refreshGroups]);

  const setActiveGroup = useCallback(async (group: Group) => {
    setActiveGroupState(group);
    await AsyncStorage.setItem(ACTIVE_GROUP_KEY, group.id);
  }, []);

  return (
    <GroupContext.Provider
      value={{ groups, activeGroup, isLoading, setActiveGroup, refreshGroups }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export const useGroup = () => useContext(GroupContext);
