import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PlaceBetParams {
  questId: string;
  direction: 'for' | 'against';
  amount: number;
  coefficient: number;
}

interface PlaceBetResult {
  success: boolean;
  error: string | null;
}

export function usePlaceBet() {
  const [isLoading, setIsLoading] = useState(false);

  const placeBet = async (params: PlaceBetParams): Promise<PlaceBetResult> => {
    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return { success: false, error: 'Vartotojas neprisijungęs' };
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/bets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          questId: params.questId,
          direction: params.direction,
          amount: params.amount,
          coefficient: params.coefficient,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          return {
            success: false,
            error: 'Pristabdykite statymus. Bandykite dar kartą po kelių sekundžių.',
          };
        }
        // 400 — validacijos klaida arba nepakanka taškų
        return { success: false, error: json.error ?? 'Klaida kuriant statymą' };
      }

      // 200 — statymas sėkmingas
      return { success: true, error: null };
    } catch {
      return { success: false, error: 'Tinklo klaida. Patikrinkite interneto ryšį.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { placeBet, isLoading };
}
