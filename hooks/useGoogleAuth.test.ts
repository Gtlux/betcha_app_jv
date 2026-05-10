import { renderHook, act } from '@testing-library/react-native';
import { useGoogleAuth } from './useGoogleAuth';

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

describe('useGoogleAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success after full OAuth flow', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/auth' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'exp://redirect#access_token=abc123&refresh_token=def456',
    });
    mockSetSession.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useGoogleAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(true);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'exp://redirect', skipBrowserRedirect: true },
    });
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'abc123',
      refresh_token: 'def456',
    });
  });

  it('returns error when signInWithOAuth fails', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: 'Provider not enabled' },
    });

    const { result } = renderHook(() => useGoogleAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(false);
    expect(authResult!.error).toBe('Provider not enabled');
  });

  it('returns null error when user cancels browser', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/auth' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({ type: 'cancel' });

    const { result } = renderHook(() => useGoogleAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(false);
    expect(authResult!.error).toBeNull();
  });

  it('returns error when tokens are missing from redirect', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/auth' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'exp://redirect#something=else',
    });

    const { result } = renderHook(() => useGoogleAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(false);
    expect(authResult!.error).toBe('Nepavyko gauti sesijos tokenų');
  });

  it('returns error when setSession fails', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/auth' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'exp://redirect#access_token=abc&refresh_token=def',
    });
    mockSetSession.mockResolvedValue({ error: { message: 'Invalid token' } });

    const { result } = renderHook(() => useGoogleAuth());

    let authResult: { success: boolean; error: string | null };
    await act(async () => {
      authResult = await result.current.signIn();
    });

    expect(authResult!.success).toBe(false);
    expect(authResult!.error).toBe('Invalid token');
  });

  it('sets isLoading during sign in', async () => {
    let resolveOAuth: (value: unknown) => void;
    mockSignInWithOAuth.mockReturnValue(
      new Promise((resolve) => {
        resolveOAuth = resolve;
      }),
    );

    const { result } = renderHook(() => useGoogleAuth());
    expect(result.current.isLoading).toBe(false);

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.signIn();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveOAuth!({ data: { url: null }, error: { message: 'fail' } });
      await promise!;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
