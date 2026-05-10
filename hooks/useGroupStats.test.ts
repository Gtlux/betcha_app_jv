import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useGroupStats } from './useGroupStats';
import { getGroupStats, GroupStats } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  getGroupStats: jest.fn(),
}));

const mockGetGroupStats = getGroupStats as jest.MockedFunction<typeof getGroupStats>;

const fixture: GroupStats = {
  openQuests: [
    {
      id: 'q1',
      title: 'Išplauti indus',
      status: 'open',
      difficultyScore: 5,
      assignedTo: { id: 'u2', username: 'Tomas' },
      createdAt: '2026-04-20T12:00:00Z',
    },
  ],
  openCount: 1,
  recentResolved: [],
  totalPrizePool: 50,
};

describe('useGroupStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('užkrauna grupės statistiką kai paduotas groupId', async () => {
    mockGetGroupStats.mockResolvedValue(fixture);

    const { result } = renderHook(() => useGroupStats('group-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(fixture);
    expect(result.current.error).toBeNull();
    expect(mockGetGroupStats).toHaveBeenCalledWith('group-1');
  });

  it('nekvieta API kai groupId yra null', () => {
    const { result } = renderHook(() => useGroupStats(null));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockGetGroupStats).not.toHaveBeenCalled();
  });

  it('grąžina error kai API meta klaidą', async () => {
    mockGetGroupStats.mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useGroupStats('group-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Forbidden');
  });

  it("refresh re-fetch'ina duomenis", async () => {
    mockGetGroupStats.mockResolvedValue(fixture);

    const { result } = renderHook(() => useGroupStats('group-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetGroupStats).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refresh();
    });

    expect(mockGetGroupStats).toHaveBeenCalledTimes(2);
  });
});
