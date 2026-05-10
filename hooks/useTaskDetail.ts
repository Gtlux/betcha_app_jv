import { useCallback, useEffect, useState } from 'react';
import { getTaskById, TaskDetail } from '@/lib/api';

export function useTaskDetail(taskId: string | null) {
  const [data, setData] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTaskById(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepavyko gauti užduoties');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!taskId) {
      setData(null);
      return;
    }
    fetchTask(taskId);
  }, [taskId, fetchTask]);

  const refresh = useCallback(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId, fetchTask]);

  return { data, isLoading, error, refresh };
}
