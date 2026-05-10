import { useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

interface AuthResult {
  success: boolean;
  error: string | null;
}

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { success: false, error: error.message };

      if (!data.url) return { success: false, error: 'Nepavyko gauti autorizacijos nuorodos' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type !== 'success') {
        return { success: false, error: null };
      }

      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        return { success: false, error: 'Nepavyko gauti sesijos tokenų' };
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) return { success: false, error: sessionError.message };

      return { success: true, error: null };
    } catch {
      return { success: false, error: 'Nežinoma klaida' };
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, isLoading };
}
