// Autorius: JV (Jarek)
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Vartotojo veiklos elemento (transakcijos) struktūra iš API (UR-1).
 */
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

/**
 * useActivity - React hook'as skirtas gauti vartotojo veiklos žurnalą (UR-1).
 * Naudoja Supabase sesiją autentifikacijai su backend API.
 */
export function useActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]); // Saugomi API grąžinti veiklos duomenys
  const [isLoading, setIsLoading] = useState(false); // Krovimo būsena, skirta UI atvaizdavimui (ActivityIndicator)
  const [error, setError] = useState<string | null>(null); // Klaidų būsena (pvz. nepavyko prisijungti)

  // useCallback padaro fetchActivity funkciją pernaudojamą be beprasmio perkūrimo tarp renderinimų
  const fetchActivity = useCallback(async () => {
    setIsLoading(true); // Pradedame krauti, parodome suktuką
    setError(null); // Išvalome senas klaidas
    try {
      // 1. Gauname aktyvią Supabase sesiją (autentifikacijos token'ą)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Jei vartotojas neprisijungęs - metame klaidą
      if (!session) {
        setError('Vartotojas neprisijungęs');
        return;
      }

      // 2. Paruošiame API kvietimą. Imame backend URL iš aplinkos kintamųjų
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/users/activity`, {
        method: 'GET',
        headers: {
          // Pridedame autorizacijos headerį su gautu tokenu.
          // Tai būtina, nes backend /api/users/activity maršrutas apsaugotas su requireAuth middleware
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // 3. Išpakuojame atsakymą į JSON formatą
      const json = await response.json();

      // 4. Jei HTTP statusas nėra 2xx (pvz. 401 ar 500), fiksuojame klaidą
      if (!response.ok) {
        setError(json.error ?? 'Nepavyko gauti veiklos duomenų');
        return;
      }

      // 5. Jei viskas gerai, išsaugome `activities` (ActivityItem masyvą) į state
      setActivities(json.activities ?? []);
    } catch {
      // Jei įvyksta tinklo klaida (nepasiekiamas serveris)
      setError('Tinklo klaida kraunant veiklos duomenis');
    } finally {
      // Visada pabaigoje nuimame krovimo būseną
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { activities, isLoading, error, refresh: fetchActivity };
}
