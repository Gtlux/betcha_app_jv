import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ActivityItem {
  id: string;
  type: string;
  label: string;
  emoji: string;
  amount: number;
  amountFormatted: string;
  referenceId: string | null;
  createdAt: string;
}

export function useActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Vartotojas neprisijungęs');
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/users/activity`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error ?? 'Nepavyko gauti veiklos duomenų');
        return;
      }

      setActivities(json.activities ?? []);
    } catch {
      setError('Tinklo klaida kraunant veiklos duomenis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { activities, isLoading, error, refresh: fetchActivity };
}
