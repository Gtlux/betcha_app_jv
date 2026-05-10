import { renderHook, act } from '@testing-library/react-native';
import { useFacebookAuth } from './useFacebookAuth';

const mockSignInWithOAuth = jest.fn();
const mockSetSession = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      setSession: (...args: unknown[]) => mockSetSession(...args),
    },
  },
}));

const mockMakeRedirectUri = jest.fn().mockReturnValue('exp://redirect');
const mockOpenAuthSessionAsync = jest.fn();

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: () => mockMakeRedirectUri(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSessionAsync(...args),
}));

describe('useFacebookAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success after full OAuth flow', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://www.facebook.com/dialog/oauth' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'exp://redirect#access_token=fb_token&refresh_token=fb_refresh',
    });
    mockSetSession.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useFacebookAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(true);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'facebook',
      options: { redirectTo: 'exp://redirect', skipBrowserRedirect: true },
    });
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'fb_token',
      refresh_token: 'fb_refresh',
    });
  });

  it('returns error when signInWithOAuth fails', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: 'Provider not enabled' },
    });

    const { result } = renderHook(() => useFacebookAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(false);
    expect(authResult!.error).toBe('Provider not enabled');
  });

  it('returns null error when user cancels browser', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://www.facebook.com/dialog/oauth' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({ type: 'cancel' });

    const { result } = renderHook(() => useFacebookAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(false);
    expect(authResult!.error).toBeNull();
  });

  it('returns error when tokens are missing from redirect', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://www.facebook.com/dialog/oauth' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'exp://redirect#something=else',
    });

    const { result } = renderHook(() => useFacebookAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(false);
    expect(authResult!.error).toBe('Nepavyko gauti sesijos tokenų');
  });

  it('handles unexpected errors', async () => {
    mockSignInWithOAuth.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFacebookAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(false);
    expect(authResult!.error).toBe('Nežinoma klaida');
  });
});
