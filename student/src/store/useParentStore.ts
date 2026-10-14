import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Parent-side preferences kept on the device. Kids, homework and activity are
// always loaded fresh from the server, so nothing here can go stale.
interface ParentState {
  ownerId: string;
  /** Activity newer than this shows as unread on the bell */
  lastSeenActivityAt: string;
  /** "Clear all" hides activity older than this */
  clearedBefore: string;
  ensureOwner: (parentId: string) => void;
  markActivitySeen: () => void;
  clearActivity: () => void;
}

export const useParentStore = create<ParentState>()(
  persist(
    (set, get) => ({
      ownerId: '',
      lastSeenActivityAt: '',
      clearedBefore: '',
      ensureOwner: (parentId) => {
        if (get().ownerId !== parentId) set({ ownerId: parentId, lastSeenActivityAt: '', clearedBefore: '' });
      },
      markActivitySeen: () => set({ lastSeenActivityAt: new Date().toISOString() }),
      clearActivity: () => {
        const now = new Date().toISOString();
        set({ clearedBefore: now, lastSeenActivityAt: now });
      },
    }),
    {
      name: 'my-agenda-parent-store',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: () => ({ ownerId: '', lastSeenActivityAt: '', clearedBefore: '' }) as any,
    }
  )
);
