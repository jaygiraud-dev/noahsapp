import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LinkedKid {
  id: string;
  studentUserId: string;   // Supabase auth UUID — empty string for demo/sample kid
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

  pairKid: (code: string) => boolean;
  addLinkedKid: (kid: LinkedKid) => void;
  removeLinkedKid: (id: string) => void;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  clearAllNotifications: () => void;
}

const SAMPLE_KID: LinkedKid = {
  id: 'kid-demo',
  studentUserId: '',
  name: 'Noah (demo)',
  pairingCode: '7K4M2D',
  school: 'Kitsilano Secondary',
  grade: 'Grade 10',
  points: 1840,
  streak: 12,
  homeworkDue: 3,
  homeworkDone: 2,
  eventsToday: 1,
  lastActive: '10 min ago',
};

const SAMPLE_NOTIFS: ParentNotif[] = [
  { id: 'n1', kidId: 'kid-demo', type: 'hw_done',  text: 'Noah finished Math homework — Textbook p.45', time: '2h ago',  read: false },
  { id: 'n2', kidId: 'kid-demo', type: 'streak',   text: 'Noah hit a 12-day streak! 🔥',                time: '1d ago',  read: false },
  { id: 'n3', kidId: 'kid-demo', type: 'hw_due',   text: 'Science project due tomorrow',                time: '1d ago',  read: true  },
  { id: 'n4', kidId: 'kid-demo', type: 'points',   text: 'Noah earned 50 points today',                 time: '2d ago',  read: true  },
];

export const useParentStore = create<ParentState>()(
  persist(
    (set, get) => ({
      linkedKids: [],
      notifications: [],

      // Legacy fallback — handles demo sample kid for users not signed in
      pairKid: (code) => {
        if (code.toUpperCase() === SAMPLE_KID.pairingCode) {
          const alreadyLinked = get().linkedKids.some((k) => k.id === SAMPLE_KID.id);
          if (!alreadyLinked) {
            set((s) => ({
              linkedKids: [...s.linkedKids, SAMPLE_KID],
              notifications: [...s.notifications, ...SAMPLE_NOTIFS],
            }));
          }
          return true;
        }
        return false;
      },

      removeLinkedKid: (id) =>
        set((s) => ({ linkedKids: s.linkedKids.filter((k) => k.id !== id) })),

      // Used by ParentDashboardScreen after a successful Supabase lookup
      addLinkedKid: (kid) => {
        const alreadyLinked = get().linkedKids.some(
          (k) => kid.studentUserId !== '' && k.studentUserId === kid.studentUserId
        );
        if (!alreadyLinked) {
          set((s) => ({ linkedKids: [...s.linkedKids, kid] }));
        }
      },

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
    }
  )
);
