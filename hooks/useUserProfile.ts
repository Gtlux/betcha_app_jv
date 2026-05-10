import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  balance: number;
  total_points_collected?: number;
  email?: string;
  created_at: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Vartotojas neprisijungęs');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, balance, created_at, total_points_collected')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        throw new Error('Profilio duomenų nėra');
      }

      setProfile({
        ...data,
        email: user.email,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepavyko gauti profilio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await fetchProfile();
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId || !active) return;

      // Naudojame unikalų kanalo pavadinimą, kad išvengti konflikto su jau SUBSCRIBED kanalu
      const channelName = `profile_changes_${userId}_${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const next = payload.new as Partial<UserProfile> & { id?: string };
            if (next && next.id === userId) {
              setProfile((prev) => ({ ...(prev as UserProfile), ...(next as UserProfile) }));
            }
          },
        )
        .subscribe();

      // Cleanup
      return () => {
        supabase.removeChannel(channel);
      };
    })();

    return () => {
      active = false;
    };
  }, [fetchProfile]);

  return { profile, loading, error, refresh: fetchProfile };
};
