import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useActiveQuest } from './useActiveQuest';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useActiveQuest', () => {
  let eqMock: jest.Mock;
  let orderMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    orderMock = jest.fn().mockResolvedValue({ data: [], error: null });
    eqMock = jest.fn();
    eqMock.mockReturnValue({ eq: eqMock, order: orderMock });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: eqMock }),
    });
  });

  it('be groupId nedaro užklausos ir grąžina tuščią sąrašą', async () => {
    const { result } = renderHook(() => useActiveQuest());

    await act(async () => {
      await result.current.fetchActiveQuest(null);
    });

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.quests).toEqual([]);
  });

  it('default atveju užklausia status=open ir mapina assigned profilį', async () => {
    const mockRows = [
      {
        id: 'q1',
        title: 'Test',
        description: 'Desc',
        difficulty_score: 5,
        status: 'open',
        assigned: { id: 'user-1', username: 'Petras', avatar_url: null },
      },
    ];
    orderMock.mockResolvedValue({ data: mockRows, error: null });

    const { result } = renderHook(() => useActiveQuest());

    await act(async () => {
      await result.current.fetchActiveQuest('group-1');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(eqMock).toHaveBeenCalledWith('status', 'open');
    expect(eqMock).toHaveBeenCalledWith('group_id', 'group-1');
    expect(result.current.quests).toEqual([
      {
        id: 'q1',
        title: 'Test',
        description: 'Desc',
        difficulty_score: 5,
        status: 'open',
        assigned_to: { id: 'user-1', username: 'Petras', avatar_url: null },
      },
    ]);
  });

  it('grąžina assigned_to: null kai assigned yra null', async () => {
    orderMock.mockResolvedValue({
      data: [
        {
          id: 'q2',
          title: 'No assignee',
          description: '',
          difficulty_score: 3,
          status: 'open',
          assigned: null,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useActiveQuest());

    await act(async () => {
      await result.current.fetchActiveQuest('group-1');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.quests[0].assigned_to).toBeNull();
  });

  it('užklausia su nurodytu status filtru (completed)', async () => {
    const { result } = renderHook(() => useActiveQuest());

    await act(async () => {
      await result.current.fetchActiveQuest('group-1', 'completed');
    });

    expect(eqMock).toHaveBeenCalledWith('status', 'completed');
  });

  it('užklausia su rejected statusu', async () => {
    const { result } = renderHook(() => useActiveQuest());

    await act(async () => {
      await result.current.fetchActiveQuest('group-1', 'rejected');
    });

    expect(eqMock).toHaveBeenCalledWith('status', 'rejected');
  });

  it('nustato error kai Supabase grąžina klaidą', async () => {
    orderMock.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { result } = renderHook(() => useActiveQuest());

    await act(async () => {
      await result.current.fetchActiveQuest('group-1');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Nepavyko gauti užduočių');
  });
});
