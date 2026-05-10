import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

let capturedOptions: {
  auth: {
    storage: StorageAdapter;
    autoRefreshToken: boolean;
    persistSession: boolean;
    detectSessionInUrl: boolean;
  };
};

interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((_url: string, _key: string, options: typeof capturedOptions) => {
    capturedOptions = options;
    return { auth: { storage: options.auth.storage } };
  }),
}));

// Force module to load with mocks
require('./supabase');

describe('ExpoSecureStoreAdapter', () => {
  const storage = capturedOptions!.auth.storage;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('naudoja SecureStore.getItemAsync tokenui nuskaityti', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

    const result = await storage.getItem('supabase-auth-token');

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('supabase-auth-token');
    expect(result).toBe('test-token');
  });

  it('naudoja SecureStore.setItemAsync tokenui išsaugoti', async () => {
    await storage.setItem('supabase-auth-token', 'new-token');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('supabase-auth-token', 'new-token');
  });

  it('naudoja SecureStore.deleteItemAsync tokenui ištrinti', async () => {
    await storage.removeItem('supabase-auth-token');

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('supabase-auth-token');
  });

  it('grąžina null kai tokenas nerastas', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const result = await storage.getItem('nonexistent-key');

    expect(result).toBeNull();
  });

  it('Supabase klientas sukonfigūruotas su persistSession ir autoRefreshToken', () => {
    expect(capturedOptions.auth.autoRefreshToken).toBe(true);
    expect(capturedOptions.auth.persistSession).toBe(true);
    expect(capturedOptions.auth.detectSessionInUrl).toBe(false);
  });
});
