import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ResolveQuestParams {
  taskId: string;
  resolutionIsPositive: boolean;
}

interface ResolveQuestResult {
  success: boolean;
  error: string | null;
}

export function useResolveQuest() {
  const [isLoading, setIsLoading] = useState(false);

  const resolveQuest = useCallback(
    async (params: ResolveQuestParams): Promise<ResolveQuestResult> => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          return { success: false, error: 'Vartotojas neprisijungęs' };
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/tasks/${params.taskId}/resolve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            resolution_is_positive: params.resolutionIsPositive,
          }),
        });

        const json = await response.json();

        if (!response.ok) {
          return { success: false, error: json.error ?? 'Nepavyko išspręsti užduoties' };
        }

        return { success: true, error: null };
      } catch {
        return { success: false, error: 'Tinklo klaida bandant išspręsti užduotį.' };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { resolveQuest, isLoading };
}
