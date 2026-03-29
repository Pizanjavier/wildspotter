import { Platform } from 'react-native';

type StorageEngine = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  clear: () => Promise<void>;
};

const createWebStorage = (): StorageEngine => ({
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
  removeItem: async (key) => localStorage.removeItem(key),
  getAllKeys: async () => Object.keys(localStorage),
  clear: async () => localStorage.clear(),
});

let nativeStorageModule: StorageEngine | null = null;

const getNativeStorage = async (): Promise<StorageEngine> => {
  if (nativeStorageModule) return nativeStorageModule;

  const mod = await import(
    '@react-native-async-storage/async-storage'
  );
  const AsyncStorage = mod.default;

  nativeStorageModule = {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
    getAllKeys: async () => {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    },
    clear: () => AsyncStorage.clear(),
  };

  return nativeStorageModule;
};

export const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') return createWebStorage().getItem(key);
  const engine = await getNativeStorage();
  return engine.getItem(key);
};

export const setItem = async (
  key: string,
  value: string,
): Promise<void> => {
  if (Platform.OS === 'web') return createWebStorage().setItem(key, value);
  const engine = await getNativeStorage();
  return engine.setItem(key, value);
};

export const removeItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') return createWebStorage().removeItem(key);
  const engine = await getNativeStorage();
  return engine.removeItem(key);
};

export const getAllKeys = async (): Promise<string[]> => {
  if (Platform.OS === 'web') return createWebStorage().getAllKeys();
  const engine = await getNativeStorage();
  return engine.getAllKeys();
};

export const clear = async (): Promise<void> => {
  if (Platform.OS === 'web') return createWebStorage().clear();
  const engine = await getNativeStorage();
  return engine.clear();
};
