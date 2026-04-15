/**
 * Tauri Store Adapter for Zustand Persist
 * 
 * This adapter allows Zustand's persist middleware to use
 * Tauri's native storage instead of localStorage,
 * ensuring data persists correctly across app restarts.
 */

import { load } from '@tauri-apps/plugin-store';
import type { StateStorage, PersistStorage } from 'zustand/middleware';

const STORE_NAME = 'supactl-store.bin';

// Create a lazy-loaded store instance
let storePromise: ReturnType<typeof load> | null = null;

function getStore() {
  if (!storePromise) {
    storePromise = load(STORE_NAME);
  }
  return storePromise;
}

/**
 * Zustand StateStorage implementation using Tauri Store
 */
export const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const store = await getStore();
      const value = await store.get<string>(name);
      return value ?? null;
    } catch (err) {
      console.error('Failed to get item from Tauri store:', err);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const store = await getStore();
      await store.set(name, value);
      await store.save();
    } catch (err) {
      console.error('Failed to set item in Tauri store:', err);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      const store = await getStore();
      await store.delete(name);
      await store.save();
    } catch (err) {
      console.error('Failed to remove item from Tauri store:', err);
    }
  },
};

/**
 * Create a custom persist storage for Zustand
 * This wraps the Tauri storage with proper serialization
 */
export function createTauriPersistStorage(): PersistStorage<unknown> {
  return {
    getItem: async (name) => {
      const value = await tauriStorage.getItem(name);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    },
    setItem: async (name, value) => {
      await tauriStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: async (name) => {
      await tauriStorage.removeItem(name);
    },
  };
}
