import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useCameraPermission } from './useCameraPermission';

jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: {} },
}));

const mockRequestPermission = jest.fn();
let mockPermission: { granted: boolean; canAskAgain: boolean } | null = null;

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [mockPermission, mockRequestPermission],
}));

jest.spyOn(Alert, 'alert');

describe('useCameraPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermission = null;
  });

  it('turėtų grąžinti hasPermission: false kai leidimas nesuteiktas', () => {
    mockPermission = { granted: false, canAskAgain: true };
    const { result } = renderHook(() => useCameraPermission());
    expect(result.current.hasPermission).toBe(false);
  });

  it('turėtų grąžinti hasPermission: true kai leidimas suteiktas', () => {
    mockPermission = { granted: true, canAskAgain: true };
    const { result } = renderHook(() => useCameraPermission());
    expect(result.current.hasPermission).toBe(true);
  });

  it('turėtų grąžinti true be užklausos kai leidimas jau suteiktas', async () => {
    mockPermission = { granted: true, canAskAgain: true };
    const { result } = renderHook(() => useCameraPermission());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.ensurePermission();
    });

    expect(granted!).toBe(true);
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('turėtų prašyti leidimo ir grąžinti true kai suteikiamas', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    mockRequestPermission.mockResolvedValue({ granted: true, canAskAgain: true });

    const { result } = renderHook(() => useCameraPermission());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.ensurePermission();
    });

    expect(granted!).toBe(true);
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('turėtų grąžinti false kai leidimas atmetamas', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    mockRequestPermission.mockResolvedValue({ granted: false, canAskAgain: true });

    const { result } = renderHook(() => useCameraPermission());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.ensurePermission();
    });

    expect(granted!).toBe(false);
  });

  it('turėtų rodyti Alert kai leidimas užblokuotas visam laikui', async () => {
    mockPermission = { granted: false, canAskAgain: false };
    mockRequestPermission.mockResolvedValue({ granted: false, canAskAgain: false });

    const { result } = renderHook(() => useCameraPermission());

    await act(async () => {
      await result.current.ensurePermission();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Kameros prieiga užblokuota',
      expect.stringContaining('nustatymus'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Atšaukti' }),
        expect.objectContaining({ text: 'Atidaryti nustatymus' }),
      ]),
    );
  });
});
