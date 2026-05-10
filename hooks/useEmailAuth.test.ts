import { renderHook, act } from '@testing-library/react-native';
import { useEmailAuth } from './useEmailAuth';

jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  },
}));

describe('useEmailAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('returns success when credentials are valid', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });

      const { result } = renderHook(() => useEmailAuth());

      let authResult: { success: boolean; error: string | null };
      await act(async () => {
        authResult = await result.current.signIn('test@test.com', 'password123');
      });

      expect(authResult!.success).toBe(true);
      expect(authResult!.error).toBeNull();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });

    it('returns error when credentials are invalid', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      const { result } = renderHook(() => useEmailAuth());

      let authResult: { success: boolean; error: string | null };
      await act(async () => {
        authResult = await result.current.signIn('test@test.com', 'wrong');
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe('Invalid login credentials');
    });

    it('handles unexpected errors', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useEmailAuth());

      let authResult: { success: boolean; error: string | null };
      await act(async () => {
        authResult = await result.current.signIn('test@test.com', 'password123');
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe('Nežinoma klaida');
    });

    it('sets isLoading during sign in', async () => {
      let resolvePromise: (value: unknown) => void;
      mockSignInWithPassword.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const { result } = renderHook(() => useEmailAuth());
      expect(result.current.isLoading).toBe(false);

      let promise: Promise<unknown>;
      act(() => {
        promise = result.current.signIn('test@test.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ data: { session: {} }, error: null });
        await promise!;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('returns success when registration succeeds', async () => {
      mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });

      const { result } = renderHook(() => useEmailAuth());

      let authResult: { success: boolean; error: string | null };
      await act(async () => {
        authResult = await result.current.signUp('new@test.com', 'password123');
      });

      expect(authResult!.success).toBe(true);
      expect(authResult!.error).toBeNull();
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'password123',
      });
    });

    it('returns error when email already exists', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const { result } = renderHook(() => useEmailAuth());

      let authResult: { success: boolean; error: string | null };
      await act(async () => {
        authResult = await result.current.signUp('existing@test.com', 'password123');
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe('User already registered');
    });

    it('handles unexpected errors', async () => {
      mockSignUp.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useEmailAuth());

      let authResult: { success: boolean; error: string | null };
      await act(async () => {
        authResult = await result.current.signUp('test@test.com', 'password123');
      });

      expect(authResult!.success).toBe(false);
      expect(authResult!.error).toBe('Nežinoma klaida');
    });
  });
});
