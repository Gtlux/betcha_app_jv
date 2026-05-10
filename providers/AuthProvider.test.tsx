import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useAuth, AuthProvider } from './AuthProvider';

const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
let authChangeCallback: (event: string, session: unknown) => void;

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('pradžioje isLoading yra true, po getSession tampa false', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.session).toBeTruthy();
  });

  it('signOut iškviečia supabase.auth.signOut ir ištrina sesiją', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('sessionExpired tampa true kai TOKEN_REFRESHED be sesijos', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.sessionExpired).toBe(false);

    act(() => {
      authChangeCallback('TOKEN_REFRESHED', null);
    });

    expect(result.current.sessionExpired).toBe(true);
  });

  it('sessionExpired resetinamas po SIGNED_IN', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    act(() => {
      authChangeCallback('TOKEN_REFRESHED', null);
    });
    expect(result.current.sessionExpired).toBe(true);

    act(() => {
      authChangeCallback('SIGNED_IN', { user: { id: '1' } });
    });
    expect(result.current.sessionExpired).toBe(false);
  });

  it('signOut resetina sessionExpired', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    act(() => {
      authChangeCallback('TOKEN_REFRESHED', null);
    });
    expect(result.current.sessionExpired).toBe(true);

    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.sessionExpired).toBe(false);
  });
});
