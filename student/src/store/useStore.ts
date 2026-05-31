import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Homework, CalEvent, Class, School, Friend, FriendRequest, ActivityNotif } from '../types';
import { Vibe } from '../theme';
import { upsertHomework, upsertEvent, fetchHomework, fetchEvents, getParentPushToken, sendExpoPush } from '../lib/db';

function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export type AppPhase = 'auth' | 'onboarding' | 'main' | 'parent';

interface AppState {
  phase: AppPhase;
  school: School;
  classes: Class[];
  useClassTimes: boolean;
  pairingCode: string;
  parentPaired: boolean;
  points: number;
  streak: number;
  lastActivityDate: string; // YYYY-MM-DD
  homework: Homework[];
  events: CalEvent[];
  friends: Friend[];
  friendRequests: FriendRequest[];
  notifications: ActivityNotif[];
  vibe: Vibe;
  darkMode: boolean;
  bgImageUri: string;
  reward: { points: number; streak: number } | null;
  userId: string;
  displayName: string;
  userRole: 'student' | 'parent';
  _hasHydrated: boolean;

  setPhase: (phase: AppPhase) => void;
  setHasHydrated: (v: boolean) => void;
  setUserRole: (role: 'student' | 'parent') => void;
  resetForUser: (uid: string, role: 'student' | 'parent', name?: string) => void;
  setSchool: (school: School) => void;
  setClasses: (classes: Class[]) => void;
  setUseClassTimes: (v: boolean) => void;
  setParentPaired: (v: boolean) => void;
  toggleHomework: (id: string) => void;
  addHomework: (hw: Omit<Homework, 'id' | 'done'>) => void;
  editHomework: (id: string, changes: Partial<Homework>) => void;
  toggleEvent: (id: string) => void;
  addEvent: (ev: Omit<CalEvent, 'id' | 'done'>) => void;
  setVibe: (vibe: Vibe) => void;
  setDarkMode: (v: boolean) => void;
  setBgImageUri: (uri: string) => void;
  clearReward: () => void;
  acceptFriendRequest: (id: string) => void;
  declineFriendRequest: (id: string) => void;
  pushNotification: (n: ActivityNotif) => void;
  loadDataFromSupabase: () => Promise<void>;
}

const SAMPLE_CLASSES: Class[] = [
  { id: 'c1', name: 'English 11',   teacher: 'Ms. Tran',   start: '08:45', end: '09:55', color: '#ec4899', emoji: '📖' },
  { id: 'c2', name: 'Pre-Calc 11',  teacher: 'Mr. Chen',   start: '10:00', end: '11:10', color: '#a78bfa', emoji: '🧭' },
  { id: 'c3', name: 'Chemistry 11', teacher: 'Mr. Singh',  start: '11:15', end: '12:25', color: '#06d6e0', emoji: '🧪' },
  { id: 'c4', name: 'Socials 11',   teacher: 'Mme. Côté', start: '13:10', end: '14:20', color: '#fbbf24', emoji: '🌎' },
  { id: 'c5', name: 'PE / Athletics', teacher: 'Coach Patel', start: '14:25', end: '15:25', color: '#34d399', emoji: '🏐' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcStreak(lastActivityDate: string, currentStreak: number): { streak: number; lastActivityDate: string } {
  const today = todayStr();
  if (lastActivityDate === today) return { streak: currentStreak, lastActivityDate };
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  const newStreak = lastActivityDate === yStr ? currentStreak + 1 : 1;
  return { streak: newStreak, lastActivityDate: today };
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

const STARTING_HW: Homework[] = [
  { id: 'h1', classId: 'c1', subject: 'English 11',    classColor: '#ec4899', title: 'Vocab quiz — chapter 5',        tag: 'Quiz',      due: 'Today',     dueDate: daysFromNow(0),  dueUrgent: true, points: 15, done: false },
  { id: 'h2', classId: 'c2', subject: 'Pre-Calc 11',   classColor: '#a78bfa', title: 'Worksheet 3.2 — derivatives',   tag: 'Worksheet', due: 'Today',     dueDate: daysFromNow(0),  points: 10, done: false },
  { id: 'h3', classId: 'c3', subject: 'Chemistry 11',  classColor: '#06d6e0', title: 'Lab writeup — page 124',        tag: 'Lab',       due: 'Tomorrow',  dueDate: daysFromNow(1),  points: 15, done: false },
  { id: 'h4', classId: 'c1', subject: 'English 11',    classColor: '#ec4899', title: 'Read Romeo & Juliet Act 2',     tag: 'Reading',   due: 'Tomorrow',  dueDate: daysFromNow(1),  points: 10, done: false },
  { id: 'h5', classId: 'c4', subject: 'Socials 11',    classColor: '#fbbf24', title: 'Read pages 88–102',             tag: 'Reading',   due: 'Next week', dueDate: daysFromNow(7),  points: 10, done: true  },
];

const STARTING_EVENTS: CalEvent[] = [
  { id: 'e1', title: 'Volleyball practice', icon: '▲', kind: 'Practice', time: '3:30 pm', date: daysFromNow(0), done: false },
  { id: 'e2', title: 'Work shift at Earnest', icon: '$', kind: 'Work',   time: '5:00 – 8:00 pm', date: daysFromNow(0), done: false },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  phase: 'auth',
  school: { city: 'Vancouver', name: 'Eric Hamber Secondary' },
  classes: SAMPLE_CLASSES,
  useClassTimes: true,
  pairingCode: '7K4M2D',
  parentPaired: false,
  points: 1840,
  streak: 12,
  lastActivityDate: '',
  homework: STARTING_HW,
  events: STARTING_EVENTS,
  friends: [],
  friendRequests: [],
  notifications: [
    { type: 'streak', who: 'Alex', what: 'Hit a 12-day streak 🔥', when: 'Yesterday 7:30 pm' },
    { type: 'done',   who: 'Alex', what: 'Read pages 88–102', cls: 'Socials 11', when: 'Yesterday 8:14 pm', clr: '#fbbf24' },
    { type: 'add',    who: 'Alex', what: 'Essay outline due Friday', cls: 'English 11', when: 'Yesterday 4:02 pm', clr: '#ec4899' },
    { type: 'done',   who: 'Alex', what: 'Worksheet 3.2', cls: 'Pre-Calc 11', when: 'Mon 9:10 pm', clr: '#a78bfa' },
  ],
  vibe: 'twilight',
  darkMode: true,
  bgImageUri: '',
  reward: null,
  userId: '',
  displayName: 'Student',
  userRole: 'student',
  _hasHydrated: false,

  setPhase: (phase) => set({ phase }),
  setHasHydrated: (v) => set({ _hasHydrated: v }),
  setUserRole: (role) => set({ userRole: role }),

  resetForUser: (uid, role, name) => set({
    userId: uid,
    userRole: role,
    displayName: name ?? 'Student',
    pairingCode: generatePairingCode(),
    classes: [],
    homework: [],
    events: [],
    points: 0,
    streak: 0,
    lastActivityDate: '',
    friends: [],
    friendRequests: [],
    notifications: [],
    parentPaired: false,
    reward: null,
    phase: role === 'parent' ? 'parent' : 'onboarding',
  }),
  setSchool: (school) => set({ school }),
  setClasses: (classes) => set({ classes }),
  setUseClassTimes: (v) => set({ useClassTimes: v }),
  setParentPaired: (v) => set({ parentPaired: v }),

  toggleHomework: (id) => {
    const { homework, streak, classes, userId } = get();
    const hw = homework.find(h => h.id === id);
    if (!hw) return;
    const newDone = !hw.done;
    const updated = { ...hw, done: newDone };
    set({
      homework: homework.map(h => h.id === id ? updated : h),
      points: newDone ? get().points + (hw.points || 10) : get().points - (hw.points || 10),
      reward: newDone ? { points: hw.points || 10, streak } : null,
    });
    if (newDone) {
      const cls = classes.find(c => c.id === hw.classId);
      get().pushNotification({ type: 'done', who: get().displayName, what: hw.title, cls: cls?.name, when: 'just now', clr: cls?.color });
    }
    if (userId) upsertHomework(userId, updated).catch(() => {});
    // Fire-and-forget parent push notification when homework is marked done
    if (newDone && userId) {
      getParentPushToken(userId).then((token) => {
        if (token) {
          const notifBody = `${hw.subject ? hw.subject + ': ' : ''}${hw.title}`;
          sendExpoPush(token, '✓ Homework done', notifBody).catch(() => {});
        }
      }).catch(() => {});
    }
  },

  editHomework: (id, changes) => {
    const { userId } = get();
    set(s => ({ homework: s.homework.map(h => h.id === id ? { ...h, ...changes } : h) }));
    const updated = get().homework.find(h => h.id === id);
    if (userId && updated) upsertHomework(userId, updated).catch(() => {});
  },

  addHomework: (data) => {
    const { classes, userId } = get();
    const id = 'h' + Date.now();
    const newHw: Homework = { ...data, id, done: false };
    set(s => {
      const { streak, lastActivityDate } = calcStreak(s.lastActivityDate, s.streak);
      return {
        homework: [...s.homework, newHw],
        points: s.points + 5,
        streak,
        lastActivityDate,
        reward: { points: 5, streak },
      };
    });
    const cls = classes.find(c => c.id === data.classId);
    get().pushNotification({ type: 'add', who: get().displayName, what: data.title, cls: cls?.name, when: 'just now', clr: cls?.color });
    if (userId) upsertHomework(userId, newHw).catch(() => {});
  },

  toggleEvent: (id) => {
    const { userId } = get();
    set(s => ({ events: s.events.map(e => e.id === id ? { ...e, done: !e.done } : e) }));
    const updated = get().events.find(e => e.id === id);
    if (userId && updated) upsertEvent(userId, updated).catch(() => {});
  },

  addEvent: (data) => {
    const { userId } = get();
    const id = 'e' + Date.now();
    const newEv: CalEvent = { ...data, id, done: false };
    set(s => {
      const { streak, lastActivityDate } = calcStreak(s.lastActivityDate, s.streak);
      return { events: [...s.events, newEv], streak, lastActivityDate };
    });
    get().pushNotification({ type: 'event', who: 'Alex', what: `${data.title} · ${data.time}`, when: 'just now' });
    if (userId) upsertEvent(userId, newEv).catch(() => {});
  },

  setVibe: (vibe) => set({ vibe, ...(vibe === 'clay' ? { darkMode: false } : {}) }),
  setDarkMode: (darkMode) => set({ darkMode }),
  setBgImageUri: (bgImageUri) => set({ bgImageUri }),
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

  loadDataFromSupabase: async () => {
    const { userId, homework: localHw, events: localEv } = get();
    if (!userId) return;
    const [sbHw, sbEv] = await Promise.all([fetchHomework(userId), fetchEvents(userId)]);
    if (sbHw.length > 0 || sbEv.length > 0) {
      // Supabase is source of truth — merge with local (keep local images)
      const merged = sbHw.map(sh => {
        const local = localHw.find(lh => lh.id === sh.id);
        return local ? { ...sh, attachedImages: local.attachedImages } : sh;
      });
      set({ homework: merged, events: sbEv });
    } else {
      // No Supabase data yet — push local data up
      await Promise.all([
        ...localHw.map(hw => upsertHomework(userId, hw)),
        ...localEv.map(ev => upsertEvent(userId, ev)),
      ]);
    }
  },
    }),
    {
      name: 'my-agenda-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        phase: state.phase,
        school: state.school,
        classes: state.classes,
        useClassTimes: state.useClassTimes,
        pairingCode: state.pairingCode,
        parentPaired: state.parentPaired,
        points: state.points,
        streak: state.streak,
        homework: state.homework,
        events: state.events,
        friends: state.friends,
        friendRequests: state.friendRequests,
        notifications: state.notifications,
        vibe: state.vibe,
        darkMode: state.darkMode,
        bgImageUri: state.bgImageUri,
        userId: state.userId,
        userRole: state.userRole,
      }),
    }
  )
);
