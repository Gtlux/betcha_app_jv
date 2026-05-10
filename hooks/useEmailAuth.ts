import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthResult {
  success: boolean;
  error: string | null;
}

export function useEmailAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch {
      return { success: false, error: 'Nežinoma klaida' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch {
      return { success: false, error: 'Nežinoma klaida' };
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, signUp, isLoading };
}
