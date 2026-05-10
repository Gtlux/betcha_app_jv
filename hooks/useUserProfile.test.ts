import { renderHook, act } from '@testing-library/react-native';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/lib/supabase';

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
  },
}));

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('turėtų užkrauti vartotojo profilį sėkmingai', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockData = {
      id: 'user-123',
      username: 'testuser',
      balance: 100,
      total_points_collected: 500,
      created_at: '2023-01-01',
    };

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const { result } = renderHook(() => useUserProfile());

    // Palaukti kol užsikraus
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toEqual({
      ...mockData,
      email: mockUser.email,
    });
    expect(result.current.error).toBeNull();
  });

  it('turėtų grąžinti klaidą, jei vartotojas neprisijungęs', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useUserProfile());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Vartotojas neprisijungęs');
  });
});
