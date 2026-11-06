// Key-value storage. Uses MMKV in dev/production builds; falls back to memory
// (or localStorage on web) where the native module is absent, e.g. Expo Go.
import type { StateStorage } from 'zustand/middleware';

interface KV {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): boolean | void;
}

function makeStore(id: string): KV {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    return createMMKV({ id });
  } catch {
    const mem = new Map<string, string>();
    const ls = typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
    return {
      getString: (k) => ls?.getItem(`${id}:${k}`) ?? mem.get(k),
      set: (k, v) => {
        mem.set(k, v);
        ls?.setItem(`${id}:${k}`, v);
      },
      remove: (k) => {
        mem.delete(k);
        ls?.removeItem(`${id}:${k}`);
      },
    };
  }
}

export function zustandStorage(id: string): StateStorage {
  const kv = makeStore(id);
  return {
    getItem: (name) => kv.getString(name) ?? null,
    setItem: (name, value) => kv.set(name, value),
    removeItem: (name) => {
      kv.remove(name);
    },
  };
}
