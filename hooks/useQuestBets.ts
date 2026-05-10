import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface BettorInfo {
  id: string;
  amount: number;
  createdAt: string;
  profile: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface QuestBetsData {
  totalPool: number;
  forBets: BettorInfo[];
  againstBets: BettorInfo[];
}

export function useQuestBets() {
  const [data, setData] = useState<QuestBetsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBets = useCallback(async (questId: string): Promise<QuestBetsData | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Vartotojas neprisijungęs');
        return null;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/bets/quest/${questId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error ?? 'Nepavyko pakrauti lažybų duomenų');
        return null;
      }

      setData(json);
      return json as QuestBetsData;
    } catch {
      setError('Tinklo klaida kraunant lažybų duomenis');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchBets };
}
