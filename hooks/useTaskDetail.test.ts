import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useTaskDetail } from './useTaskDetail';
import { getTaskById, TaskDetail } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  getTaskById: jest.fn(),
}));

const mockGetTaskById = getTaskById as jest.MockedFunction<typeof getTaskById>;

const taskFixture: TaskDetail = {
  id: 'task-123',
  groupId: 'group-abc',
  title: 'Netvarkinga virtuvė',
  description: 'Indai',
  status: 'open',
  difficultyScore: 6,
  aiVerdictReason: null,
  initialImageUrl: 'https://example.com/img.jpg',
  evidenceImageUrl: null,
  createdAt: '2026-04-26T10:00:00Z',
  completedAt: null,
  creator: { id: 'c1', username: 'Tomas', avatar_url: null },
  assignedTo: null,
  bets: { totalPool: 0, forCount: 0, againstCount: 0 },
};

describe('useTaskDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('turėtų užkrauti užduoties detales kai pateiktas taskId', async () => {
    mockGetTaskById.mockResolvedValue(taskFixture);

    const { result } = renderHook(() => useTaskDetail('task-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(taskFixture);
    expect(result.current.error).toBeNull();
    expect(mockGetTaskById).toHaveBeenCalledWith('task-123');
  });

  it('turėtų grąžinti null kai taskId yra null', () => {
    const { result } = renderHook(() => useTaskDetail(null));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockGetTaskById).not.toHaveBeenCalled();
  });

  it('turėtų grąžinti error kai API meta klaidą', async () => {
    mockGetTaskById.mockRejectedValue(new Error('Užduotis nerasta'));

    const { result } = renderHook(() => useTaskDetail('missing-id'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Užduotis nerasta');
  });

  it('refresh turėtų iš naujo užkrauti duomenis', async () => {
    mockGetTaskById.mockResolvedValue(taskFixture);

    const { result } = renderHook(() => useTaskDetail('task-123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetTaskById).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refresh();
    });

    expect(mockGetTaskById).toHaveBeenCalledTimes(2);
  });
});
