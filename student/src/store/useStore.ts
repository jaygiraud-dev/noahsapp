import { create } from 'zustand';
import { Homework, CalEvent, Class, School, Friend, FriendRequest, ActivityNotif } from '../types';
import { Vibe } from '../theme';

export type AppPhase = 'auth' | 'onboarding' | 'main';

interface AppState {
  phase: AppPhase;
  school: School;
  classes: Class[];
  useClassTimes: boolean;
  pairingCode: string;
  parentPaired: boolean;
  points: number;
  streak: number;
  homework: Homework[];
  events: CalEvent[];
  friends: Friend[];
  friendRequests: FriendRequest[];
  notifications: ActivityNotif[];
  vibe: Vibe;
  darkMode: boolean;
  reward: { points: number; streak: number } | null;

  setPhase: (phase: AppPhase) => void;
  setSchool: (school: School) => void;
  setClasses: (classes: Class[]) => void;
  setUseClassTimes: (v: boolean) => void;
  setParentPaired: (v: boolean) => void;
  toggleHomework: (id: string) => void;
  addHomework: (hw: Omit<Homework, 'id' | 'done'>) => void;
  toggleEvent: (id: string) => void;
  addEvent: (ev: Omit<CalEvent, 'id' | 'done'>) => void;
  setVibe: (vibe: Vibe) => void;
  setDarkMode: (v: boolean) => void;
  clearReward: () => void;
  acceptFriendRequest: (id: string) => void;
  declineFriendRequest: (id: string) => void;
  pushNotification: (n: ActivityNotif) => void;
}

const SAMPLE_CLASSES: Class[] = [
  { id: 'c1', name: 'English 11',   teacher: 'Ms. Tran',   start: '08:45', end: '09:55', color: '#ec4899', emoji: '📖' },
  { id: 'c2', name: 'Pre-Calc 11',  teacher: 'Mr. Chen',   start: '10:00', end: '11:10', color: '#a78bfa', emoji: '🧭' },
  { id: 'c3', name: 'Chemistry 11', teacher: 'Mr. Singh',  start: '11:15', end: '12:25', color: '#06d6e0', emoji: '🧪' },
  { id: 'c4', name: 'Socials 11',   teacher: 'Mme. Côté', start: '13:10', end: '14:20', color: '#fbbf24', emoji: '🌎' },
  { id: 'c5', name: 'PE / Athletics', teacher: 'Coach Patel', start: '14:25', end: '15:25', color: '#34d399', emoji: '🏐' },
];

const STARTING_HW: Homework[] = [
  { id: 'h1', classId: 'c1', title: 'Read Romeo & Juliet Act 2', tag: 'Reading', due: 'Tomorrow', points: 10, done: false },
  { id: 'h2', classId: 'c1', title: 'Vocab quiz — chapter 5', tag: 'Quiz', due: 'Today', dueUrgent: true, points: 15, done: false },
  { id: 'h3', classId: 'c2', title: 'Worksheet 3.2 — derivatives', tag: 'Worksheet', due: 'Tomorrow', points: 10, done: false },
  { id: 'h4', classId: 'c3', title: 'Lab writeup — page 124', tag: 'Lab', due: 'Fri', points: 15, done: false },
  { id: 'h5', classId: 'c4', title: 'Read pages 88–102', tag: 'Reading', due: 'Mon', points: 10, done: true },
];

const STARTING_EVENTS: CalEvent[] = [
  { id: 'e1', title: 'Volleyball practice', icon: '▲', kind: 'Practice', time: '3:30 pm', done: false },
  { id: 'e2', title: 'Work shift at Earnest', icon: '$', kind: 'Work', time: '5:00 – 8:00 pm', done: false },
];

export const useStore = create<AppState>((set, get) => ({
  phase: 'auth',
  school: { city: 'Vancouver', name: 'Eric Hamber Secondary' },
  classes: SAMPLE_CLASSES,
  useClassTimes: true,
  pairingCode: '7K4M2D',
  parentPaired: false,
  points: 1840,
  streak: 12,
  homework: STARTING_HW,
  events: STARTING_EVENTS,
  friends: [
    { id: 'u1', name: 'You',      school: 'Eric Hamber', pts: 1840, streak: 12, avatar: 'Y', color: '#ec4899' },
    { id: 'u2', name: 'Maya R.',  school: 'Eric Hamber', pts: 2210, streak: 18, avatar: 'M', color: '#a78bfa' },
    { id: 'u3', name: 'Jordan K.',school: 'Eric Hamber', pts: 1995, streak: 7,  avatar: 'J', color: '#06d6e0' },
    { id: 'u4', name: 'Priya S.', school: 'Eric Hamber', pts: 1610, streak: 4,  avatar: 'P', color: '#34d399' },
    { id: 'u5', name: 'Alex T.',  school: 'Eric Hamber', pts: 1420, streak: 9,  avatar: 'A', color: '#fbbf24' },
    { id: 'u6', name: 'Sam W.',   school: 'Eric Hamber', pts: 1180, streak: 2,  avatar: 'S', color: '#f472b6' },
  ],
  friendRequests: [
    { id: 'fr1', name: 'Ben K.',   school: 'Eric Hamber', mutual: 4, color: '#06d6e0', avatar: 'B', when: '2h' },
    { id: 'fr2', name: 'Ines M.',  school: 'Lord Byng',   mutual: 1, color: '#a78bfa', avatar: 'I', when: 'Yesterday' },
    { id: 'fr3', name: 'Tariq S.', school: 'Eric Hamber', mutual: 7, color: '#fbbf24', avatar: 'T', when: 'Mon' },
  ],
  notifications: [
    { type: 'streak', who: 'Alex', what: 'Hit a 12-day streak 🔥', when: 'Yesterday 7:30 pm' },
    { type: 'done',   who: 'Alex', what: 'Read pages 88–102', cls: 'Socials 11', when: 'Yesterday 8:14 pm', clr: '#fbbf24' },
    { type: 'add',    who: 'Alex', what: 'Essay outline due Friday', cls: 'English 11', when: 'Yesterday 4:02 pm', clr: '#ec4899' },
    { type: 'done',   who: 'Alex', what: 'Worksheet 3.2', cls: 'Pre-Calc 11', when: 'Mon 9:10 pm', clr: '#a78bfa' },
  ],
  vibe: 'twilight',
  darkMode: true,
  reward: null,

  setPhase: (phase) => set({ phase }),
  setSchool: (school) => set({ school }),
  setClasses: (classes) => set({ classes }),
  setUseClassTimes: (v) => set({ useClassTimes: v }),
  setParentPaired: (v) => set({ parentPaired: v }),

  toggleHomework: (id) => {
    const { homework, streak, classes } = get();
    const hw = homework.find(h => h.id === id);
    if (!hw) return;
    const newDone = !hw.done;
    set({
      homework: homework.map(h => h.id === id ? { ...h, done: newDone } : h),
      points: newDone ? get().points + (hw.points || 10) : get().points - (hw.points || 10),
      reward: newDone ? { points: hw.points || 10, streak } : null,
    });
    if (newDone) {
      const cls = classes.find(c => c.id === hw.classId);
      get().pushNotification({ type: 'done', who: 'Alex', what: hw.title, cls: cls?.name, when: 'just now', clr: cls?.color });
    }
  },

  addHomework: (data) => {
    const { streak, classes } = get();
    const id = 'h' + Date.now();
    set(s => ({
      homework: [...s.homework, { ...data, id, done: false }],
      points: s.points + 5,
      reward: { points: 5, streak: s.streak },
    }));
    const cls = classes.find(c => c.id === data.classId);
    get().pushNotification({ type: 'add', who: 'Alex', what: data.title, cls: cls?.name, when: 'just now', clr: cls?.color });
  },

  toggleEvent: (id) => set(s => ({ events: s.events.map(e => e.id === id ? { ...e, done: !e.done } : e) })),

  addEvent: (data) => {
    const id = 'e' + Date.now();
    set(s => ({ events: [...s.events, { ...data, id, done: false }] }));
    get().pushNotification({ type: 'event', who: 'Alex', what: `${data.title} · ${data.time}`, when: 'just now' });
  },

  setVibe: (vibe) => set({ vibe }),
  setDarkMode: (darkMode) => set({ darkMode }),
  clearReward: () => set({ reward: null }),

  acceptFriendRequest: (id) => {
    const { friendRequests, friends } = get();
    const req = friendRequests.find(r => r.id === id);
    if (!req) return;
    set({
      friendRequests: friendRequests.filter(r => r.id !== id),
      friends: [...friends, { id: req.id, name: req.name, school: req.school, pts: 1000 + Math.floor(Math.random() * 1000), streak: Math.floor(Math.random() * 14), avatar: req.avatar, color: req.color }],
    });
  },

  declineFriendRequest: (id) => set(s => ({ friendRequests: s.friendRequests.filter(r => r.id !== id) })),

  pushNotification: (n) => set(s => ({ notifications: [n, ...s.notifications] })),
}));
