import { useCallback, useEffect, useState } from 'react';
import { getGroupStats, GroupStats } from '@/lib/api';

export function useGroupStats(groupId: string | null) {
  const [data, setData] = useState<GroupStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getGroupStats(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepavyko gauti grupės statistikos');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!groupId) {
      setData(null);
      return;
    }
    fetchStats(groupId);
  }, [groupId, fetchStats]);

  const refresh = useCallback(() => {
    if (groupId) {
      fetchStats(groupId);
    }
  }, [groupId, fetchStats]);

  return { data, isLoading, error, refresh };
}
