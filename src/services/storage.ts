// src/services/storage.ts
// Storage abstraction that will use MMKV in production builds.
// In Expo Go, MMKV is unavailable, so we use an in-memory fallback.

type StorageBackend = {
  set: (key: string, value: string | boolean | number) => void;
  getString: (key: string) => string | undefined;
  getBoolean: (key: string) => boolean | undefined;
  getNumber: (key: string) => number | undefined;
  delete: (key: string) => void;
};

// In a real EAS build, this would be initialized with MMKV.
// For now, we use a simple in-memory store.
const memoryStore = new Map<string, string>();

const backend: StorageBackend = {
  set: (key, value) => memoryStore.set(key, String(value)),
  getString: (key) => memoryStore.get(key) ?? undefined,
  getBoolean: (key) => {
    const value = memoryStore.get(key);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  },
  getNumber: (key) => {
    const value = memoryStore.get(key);
    if (value === undefined) return undefined;
    const number = Number(value);
    return isNaN(number) ? undefined : number;
  },
  delete: (key) => memoryStore.delete(key),
};

export const storage = backend;