import { create } from 'zustand';

export interface LinkedKid {
  id: string;
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
  markNotifRead: (id: string) => void;
}

const SAMPLE_KID: LinkedKid = {
  id: 'kid-1',
  name: 'Noah',
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

export const useParentStore = create<ParentState>((set, get) => ({
  linkedKids: [],
  notifications: [],

  pairKid: (code) => {
    if (code.toUpperCase() === SAMPLE_KID.pairingCode) {
      const alreadyLinked = get().linkedKids.some((k) => k.id === SAMPLE_KID.id);
      if (!alreadyLinked) {
        const notifs: ParentNotif[] = [
          { id: 'n1', kidId: 'kid-1', type: 'hw_done', text: 'Noah finished Math homework — Textbook p.45', time: '2h ago', read: false },
          { id: 'n2', kidId: 'kid-1', type: 'streak', text: 'Noah hit a 12-day streak! 🔥', time: '1d ago', read: false },
          { id: 'n3', kidId: 'kid-1', type: 'hw_due', text: 'Science project due tomorrow', time: '1d ago', read: true },
          { id: 'n4', kidId: 'kid-1', type: 'points', text: 'Noah earned 50 points today', time: '2d ago', read: true },
        ];
        set((s) => ({ linkedKids: [...s.linkedKids, SAMPLE_KID], notifications: [...s.notifications, ...notifs] }));
      }
      return true;
    }
    return false;
  },

  markNotifRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
}));
