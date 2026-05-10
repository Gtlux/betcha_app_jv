import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useSubmitEvidence } from './useSubmitEvidence';
import { submitEvidence } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  submitEvidence: jest.fn(),
}));

const mockSubmit = submitEvidence as jest.MockedFunction<typeof submitEvidence>;

describe('useSubmitEvidence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('approved → result užpildytas, error null', async () => {
    mockSubmit.mockResolvedValue({
      verdict: 'approved',
      reason: 'Indai išplauti',
      status: 'completed',
    });

    const { result } = renderHook(() => useSubmitEvidence());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.submit('task-1', 'file://photo.jpg');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.result?.verdict).toBe('approved');
    expect(result.current.error).toBeNull();
    expect(returned).toEqual({
      verdict: 'approved',
      reason: 'Indai išplauti',
      status: 'completed',
    });
    expect(mockSubmit).toHaveBeenCalledWith('task-1', 'file://photo.jpg');
  });

  it('rejected → result užpildytas su rejected', async () => {
    mockSubmit.mockResolvedValue({
      verdict: 'rejected',
      reason: 'Indai vis dar nešvarūs',
      status: 'open',
    });

    const { result } = renderHook(() => useSubmitEvidence());

    await act(async () => {
      await result.current.submit('task-1', 'file://photo.jpg');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.result?.verdict).toBe('rejected');
    expect(result.current.error).toBeNull();
  });

  it('klaida → error užpildytas, result null', async () => {
    mockSubmit.mockRejectedValue(new Error('Tinklo klaida'));

    const { result } = renderHook(() => useSubmitEvidence());

    let returned: unknown = 'not-set';
    await act(async () => {
      returned = await result.current.submit('task-1', 'file://photo.jpg');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe('Tinklo klaida');
    expect(returned).toBeNull();
  });

  it('reset → išvalo state', async () => {
    mockSubmit.mockResolvedValue({
      verdict: 'rejected',
      reason: 'Ne',
      status: 'open',
    });

    const { result } = renderHook(() => useSubmitEvidence());

    await act(async () => {
      await result.current.submit('task-1', 'file://photo.jpg');
    });

    expect(result.current.result?.verdict).toBe('rejected');

    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
