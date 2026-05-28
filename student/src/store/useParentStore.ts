import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LinkedKid {
  id: string;
  studentUserId: string;   // Supabase auth UUID — always a real UUID, never empty
  name: string;
  pairingCode: string;
  school: string;
  grade: string;
  points: number;
  streak: number;
  homeworkDue: number;
  homeworkDone: number;
  eventsToday: number;
  lastActive: string;
}

export interface ParentNotif {
  id: string;
  kidId: string;
  type: 'hw_done' | 'hw_due' | 'event' | 'streak' | 'points';
  text: string;
  time: string;
  read: boolean;
}

interface ParentState {
  linkedKids: LinkedKid[];
  notifications: ParentNotif[];

  setLinkedKids: (kids: LinkedKid[]) => void;
  addLinkedKid: (kid: LinkedKid) => void;
  removeLinkedKid: (id: string) => void;
  addNotifications: (notifs: ParentNotif[]) => void;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  clearAllNotifications: () => void;
}

export const useParentStore = create<ParentState>()(
  persist(
    (set, get) => ({
      linkedKids: [],
      notifications: [],

      // Replace the entire linked-kids list with authoritative Supabase data
      setLinkedKids: (kids) => {
        // Strip any demo/sample notifications that don't belong to a real kid
        const realIds = new Set(kids.map((k) => k.studentUserId));
        set((s) => ({
          linkedKids: kids,
          notifications: s.notifications.filter(
            (n) => realIds.has(n.kidId) && !n.id.startsWith('n1') && !n.id.startsWith('n2') && !n.id.startsWith('n3') && !n.id.startsWith('n4')
          ),
        }));
      },

      // Used after a successful single Supabase lookup (linking a new kid)
      addLinkedKid: (kid) => {
        if (!kid.studentUserId) return;
        const alreadyLinked = get().linkedKids.some((k) => k.studentUserId === kid.studentUserId);
        if (!alreadyLinked) {
          set((s) => ({ linkedKids: [...s.linkedKids, kid] }));
        }
      },

      removeLinkedKid: (id) =>
        set((s) => ({ linkedKids: s.linkedKids.filter((k) => k.id !== id) })),

      // Only adds notifs whose IDs don't already exist — safe to call on every refresh
      addNotifications: (notifs) =>
        set((s) => {
          const existingIds = new Set(s.notifications.map((n) => n.id));
          const fresh = notifs.filter((n) => !existingIds.has(n.id));
          if (fresh.length === 0) return s;
          return { notifications: [...fresh, ...s.notifications] };
        }),

      markNotifRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotifsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearAllNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'my-agenda-parent-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Migration: strip any demo kids and fake notifications from persisted state
      migrate: (persisted: any) => {
        const state = persisted as ParentState;
        return {
          ...state,
          linkedKids: (state.linkedKids ?? []).filter(
            (k) => k.studentUserId && k.studentUserId !== '' && k.id !== 'kid-demo'
          ),
          notifications: (state.notifications ?? []).filter(
            (n) => n.kidId !== 'kid-demo' && !['n1', 'n2', 'n3', 'n4'].includes(n.id)
          ),
        };
      },
      version: 2,
    }
  )
);
