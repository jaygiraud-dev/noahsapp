import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Homework, CalEvent, Class, School, Friend, ParentConnection, Timetable } from '../types';
import { Vibe } from '../theme';
import {
  Profile, upsertHomework, upsertEvent, fetchHomework, fetchEvents, getProfile, updateProfile,
  deleteHomeworkRow, deleteEventRow, logActivity, getParentPushTokens, sendExpoPush,
  addFriendByCode as rpcAddFriend, AddFriendResult, removeFriendRow, getFriends,
  getMyParents, uploadHomeworkPhoto, signPhotoPaths, deletePhotoPaths,
  fetchUnseenNudges, markNudgeSeen,
  Message, fetchInbox, fetchConversation, sendMessage, markMessagesRead, deleteMessage,
  uploadChatPhoto, signChatPhotos, deleteChatPhoto,
} from '../lib/db';
import { dateKey } from '../lib/time';
import { reminderTime, scheduleReminder, scheduleWeeklyReminder, cancelReminder } from '../lib/classNotifications';
import { nextOccurrence, repeatLabel } from '../lib/events';
import { defaultPeriods } from '../lib/timetable';

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export type AppPhase = 'auth' | 'onboarding' | 'main' | 'parent';

export interface Nudge { id: string; message: string; sentAt: string }

interface AppState {
  phase: AppPhase;
  school: School;
  grade: number;
  classes: Class[];
  timetable: Timetable | null;
  pairingCode: string;
  points: number;
  streak: number;
  lastActivityDate: string; // YYYY-MM-DD
  homework: Homework[];
  events: CalEvent[];
  friends: Friend[];
  parents: ParentConnection[];
  vibe: Vibe;
  darkMode: boolean;
  bgImageUri: string;
  avatar: string;
  reward: { points: number; streak: number } | null;
  userId: string;
  email: string;
  displayName: string;
  userRole: 'student' | 'parent';
  onboarded: boolean;
  /** Set while the user is on a password-reset link (not persisted) */
  passwordRecovery: boolean;
  /** Unseen nudges from a parent (not persisted) */
  nudges: Nudge[];
  /** Which setup screen to open first when editing from Me (not persisted) */
  onboardingStart: 'SchoolPicker' | 'Classes';
  editSetup: (start: 'SchoolPicker' | 'Classes') => void;
  /** Homework/event ids saved on this device but not yet on the server */
  unsynced: string[];
  /** Why the last save to the server failed ('' when everything is saved) */
  syncError: string;
  /** Short confirmation shown after adding something (not persisted) */
  toast: string;
  retrySync: () => Promise<void>;
  clearToast: () => void;
  _hasHydrated: boolean;
  /** Has this device been through the intro slides? */
  seenIntro: boolean;
  setSeenIntro: (v: boolean) => void;
  /** Messages with friends, oldest first (not persisted). Local ones still sending carry `pending`. */
  messages: ChatMessage[];
  /** Whether the database has messaging switched on yet */
  messagingStatus: 'unknown' | 'ready' | 'needs_update';
  /** Friend whose chat is open ('' when none) */
  openChatWith: string;
  /** Newest message that arrived while its chat wasn't open (for the little alert) */
  incoming: ChatMessage | null;
  setOpenChat: (friendId: string) => void;
  clearIncoming: () => void;
  loadInbox: () => Promise<void>;
  loadConversation: (friendId: string) => Promise<void>;
  /** Temporary viewing links for chat photos (path → URL, not persisted) */
  chatPhotoUrls: Record<string, string>;
  sendChat: (friendId: string, body: string, photoUri?: string) => Promise<void>;
  retryChat: (localId: string) => Promise<void>;
  receiveMessage: (m: Message) => void;
  unsendMessage: (id: string) => Promise<void>;

  setPhase: (phase: AppPhase) => void;
  setHasHydrated: (v: boolean) => void;
  setPasswordRecovery: (v: boolean) => void;
  resetForUser: (uid: string, role: 'student' | 'parent', name: string, email: string) => void;
  applyProfile: (p: Profile) => void;
  setSchool: (school: School) => void;
  setGrade: (grade: number) => void;
  setClasses: (classes: Class[]) => void;
  setSchedule: (classes: Class[], timetable: Timetable) => void;
  setDisplayName: (name: string) => void;
  setAvatar: (uri: string) => void;
  completeOnboarding: () => void;
  toggleHomework: (id: string) => void;
  addHomework: (hw: Omit<Homework, 'id' | 'done'>) => void;
  editHomework: (id: string, changes: Partial<Homework>) => void;
  deleteHomework: (id: string) => void;
  addEvent: (ev: Omit<CalEvent, 'id' | 'done'>) => void;
  editEvent: (id: string, changes: Partial<CalEvent>) => void;
  deleteEvent: (id: string) => void;
  /** Remove one day from a weekly repeat */
  skipEventOn: (id: string, day: string) => void;
  /** Stop a weekly repeat before this day (keeps earlier ones) */
  endEventBefore: (id: string, day: string) => void;
  setVibe: (vibe: Vibe) => void;
  setDarkMode: (v: boolean) => void;
  setBgImageUri: (uri: string) => void;
  clearReward: () => void;
  loadFriends: () => Promise<void>;
  addFriendByCode: (code: string) => Promise<AddFriendResult>;
  removeFriend: (id: string) => Promise<void>;
  loadParents: () => Promise<void>;
  checkNudges: () => Promise<void>;
  pushNudge: (n: Nudge) => void;
  dismissNudge: (id: string) => void;
  loadDataFromSupabase: () => Promise<void>;
  syncProfileState: () => void;
}

export type ChatMessage = Message & { pending?: 'sending' | 'failed'; /** On-device copy of a photo still being sent */ localPhotoUri?: string };

/** Get viewing links for any chat photos we don't have one for yet. */
async function signMissingPhotos(messages: ChatMessage[]) {
  const have = useStore.getState().chatPhotoUrls;
  const need = [...new Set(messages.map((m) => m.photo).filter((p): p is string => !!p && !have[p]))];
  if (!need.length) return;
  const urls = await signChatPhotos(need);
  if (Object.keys(urls).length) useStore.setState((s) => ({ chatPhotoUrls: { ...s.chatPhotoUrls, ...urls } }));
}

/** Merge server messages into what we have, keeping local ones still sending, oldest first. */
function mergeMessages(have: ChatMessage[], incoming: Message[], replaceFor?: (m: ChatMessage) => boolean): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of have) if (!replaceFor || m.pending || !replaceFor(m)) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function unreadFrom(messages: ChatMessage[], me: string, friendId?: string): number {
  return messages.filter((m) => m.recipientId === me && !m.readAt && (!friendId || m.senderId === friendId)).length;
}

export const GRADES = [8, 9, 10, 11, 12];

const CLASS_COLORS = ['#ec4899', '#a78bfa', '#06d6e0', '#fbbf24', '#34d399', '#f472b6', '#06b6d4', '#d97706'];

const DEMO_SCHOOL: School = { name: 'Sutherland Secondary', city: 'North Vancouver', district: 'SD44 North Vancouver' };

// Demo uses Noah's real rotation: blocks 1–3 rotate through Science, Math and
// Metalwork by weekday; ICT is always block 4.
const SAMPLE_CLASSES: Class[] = [
  { id: 'c1', name: 'Science 9', teacher: 'Ms. Tran',   color: CLASS_COLORS[2], emoji: '🧪' },
  { id: 'c2', name: 'Math 9',    teacher: 'Mr. Chen',   color: CLASS_COLORS[1], emoji: '🧭' },
  { id: 'c3', name: 'Metalwork', teacher: 'Mr. Singh',  color: CLASS_COLORS[3], emoji: '🔧' },
  { id: 'c4', name: 'ICT',       teacher: 'Ms. Patel',  color: CLASS_COLORS[0], emoji: '💻' },
];

const SAMPLE_TIMETABLE: Timetable = {
  periods: defaultPeriods(4, DEMO_SCHOOL.name),
  sameEveryDay: false,
  days: {
    '1': ['c1', 'c2', 'c3', 'c4'],
    '2': ['c3', 'c1', 'c2', 'c4'],
    '3': ['c2', 'c3', 'c1', 'c4'],
    '4': ['c1', 'c2', 'c3', 'c4'],
    '5': ['c3', 'c1', 'c2', 'c4'],
  },
};

function todayStr() { return dateKey(new Date()); }

function calcStreak(lastActivityDate: string, currentStreak: number): { streak: number; lastActivityDate: string } {
  const today = todayStr();
  if (lastActivityDate === today) return { streak: currentStreak, lastActivityDate };
  const y = new Date(); y.setDate(y.getDate() - 1);
  const newStreak = lastActivityDate === dateKey(y) ? currentStreak + 1 : 1;
  return { streak: newStreak, lastActivityDate: today };
}

const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30, 50, 75, 100];

function daysFromNow(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString();
}

function demoHomework(): Homework[] {
  const cls = (i: number) => SAMPLE_CLASSES[i] ?? SAMPLE_CLASSES[0];
  return [
    { id: 'h1', classId: cls(0).id, subject: cls(0).name, classColor: cls(0).color, title: 'Cells quiz — chapter 5', tag: 'Quiz', due: 'Today', dueDate: daysFromNow(0), points: 15, done: false },
    { id: 'h2', classId: cls(1).id, subject: cls(1).name, classColor: cls(1).color, title: 'Worksheet 3.2 — linear equations', tag: 'Worksheet', due: 'Today', dueDate: daysFromNow(0), points: 10, done: false },
    { id: 'h3', classId: cls(2).id, subject: cls(2).name, classColor: cls(2).color, title: 'Dustpan project sketch', tag: 'Project', due: 'Tomorrow', dueDate: daysFromNow(1), points: 15, done: false },
    { id: 'h4', classId: cls(3).id, subject: cls(3).name, classColor: cls(3).color, title: 'Finish website wireframe', tag: 'Homework', due: 'Tomorrow', dueDate: daysFromNow(1), points: 10, done: false },
    { id: 'h5', classId: cls(1).id, subject: cls(1).name, classColor: cls(1).color, title: 'Unit test — linear relations', tag: 'Test', due: 'Next week', dueDate: daysFromNow(6), points: 10, done: false },
  ];
}

const DEMO_EVENTS: CalEvent[] = [
  { id: 'e1', title: 'Volleyball practice', icon: '🏐', type: 'Practice', time: '3:30 PM', endTime: '5:00 PM', date: daysFromNow(0), done: false },
  { id: 'e2', title: 'Work shift', icon: '💵', type: 'Work', time: '6:00 PM', endTime: '8:00 PM', date: daysFromNow(1), done: false },
];

function isLocalUri(uri: string) {
  return uri.startsWith('data:') || uri.startsWith('file:') || uri.startsWith('blob:') || uri.startsWith('content:') || uri.startsWith('ph:');
}

/** Uploads any new local photos, deletes removed ones, returns the new path + URI lists. */
async function syncPhotos(userId: string, hw: Homework, uris: string[]): Promise<{ photos: string[]; attachedImages: string[] }> {
  const oldUris = hw.attachedImages ?? [];
  const oldPaths = hw.photos ?? [];
  const pathByUri = new Map<string, string>();
  oldUris.forEach((u, i) => { if (oldPaths[i]) pathByUri.set(u, oldPaths[i]); });

  const photos: string[] = [];
  const shown: string[] = [];
  for (const uri of uris) {
    const known = pathByUri.get(uri);
    if (known) { photos.push(known); shown.push(uri); continue; }
    if (isLocalUri(uri)) {
      const path = await uploadHomeworkPhoto(userId, hw.id, uri);
      if (path) { photos.push(path); shown.push(uri); }
    }
  }
  const removed = oldPaths.filter((p) => !photos.includes(p));
  if (removed.length) deletePhotoPaths(removed).catch(() => {});
  return { photos, attachedImages: shown };
}

function scheduleHwReminder(hw: Homework) {
  if (hw.done) { cancelReminder(hw.id).catch(() => {}); return; }
  const when = reminderTime(hw.reminder, { dueDate: hw.dueDate });
  scheduleReminder(hw.id, `📚 ${hw.title}`, hw.subject ? `${hw.subject} · due ${hw.due ?? 'soon'}` : `Due ${hw.due ?? 'soon'}`, when).catch(() => {});
}

function scheduleEventReminder(ev: CalEvent) {
  if (ev.repeat === 'weekly') {
    const next = nextOccurrence(ev);
    const when = next ? reminderTime(ev.reminder, { eventDate: next.toISOString(), eventTime: ev.time }) : null;
    scheduleWeeklyReminder(ev.id, `📅 ${ev.title}`, [ev.time, ev.location].filter(Boolean).join(' · ') || 'Coming up', when).catch(() => {});
    return;
  }
  const when = reminderTime(ev.reminder, { eventDate: ev.date, eventTime: ev.time });
  scheduleReminder(ev.id, `📅 ${ev.title}`, [ev.time, ev.location].filter(Boolean).join(' · ') || 'Coming up', when).catch(() => {});
}

function notifyParents(title: string, body: string) {
  getParentPushTokens().then((tokens) => tokens.forEach((t) => sendExpoPush(t, title, body))).catch(() => {});
}

/** Turns a database error into something a student or parent can act on. */
function friendlySyncError(msg: string): string {
  const m = msg.toLowerCase();
  if (/column|schema cache|does not exist|relation/.test(m)) return 'The database needs its one-time update before homework can be saved. Run supabase_schema.sql in Supabase (README, setup step 1).';
  if (/jwt|not authenticated|401|row-level security/.test(m)) return 'You’re signed out of your account. Sign out and back in to save.';
  if (/fetch|network|timeout|offline/.test(m)) return 'No connection right now. It’s kept on this phone and will save when you’re back online.';
  return msg;
}

function markUnsynced(id: string) {
  useStore.setState((s) => (s.unsynced.includes(id) ? s : { unsynced: [...s.unsynced, id] }));
}

function markSynced(id: string) {
  useStore.setState((s) => {
    const unsynced = s.unsynced.filter((x) => x !== id);
    return { unsynced, syncError: unsynced.length === 0 ? '' : s.syncError };
  });
}

/** Saves homework to the account; on failure keeps it locally and records why. */
async function pushHw(hw: Homework): Promise<boolean> {
  const { userId } = useStore.getState();
  if (!userId) return true;
  markUnsynced(hw.id);
  const { attachedImages, ...row } = hw;
  const err = await upsertHomework(userId, row as Homework);
  if (err) { useStore.setState({ syncError: friendlySyncError(err) }); return false; }
  markSynced(hw.id);
  return true;
}

async function pushEv(ev: CalEvent): Promise<boolean> {
  const { userId } = useStore.getState();
  if (!userId) return true;
  markUnsynced(ev.id);
  const err = await upsertEvent(userId, ev);
  if (err) { useStore.setState({ syncError: friendlySyncError(err) }); return false; }
  markSynced(ev.id);
  return true;
}

function dueText(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const t = new Date(); const tm = new Date(); tm.setDate(t.getDate() + 1);
  if (d.toDateString() === t.toDateString()) return 'today';
  if (d.toDateString() === tm.toDateString()) return 'tomorrow';
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  phase: 'auth',
  school: DEMO_SCHOOL,
  grade: 9,
  classes: SAMPLE_CLASSES,
  timetable: SAMPLE_TIMETABLE,
  pairingCode: '',
  points: 120,
  streak: 4,
  lastActivityDate: dateKey(new Date()),
  homework: demoHomework(),
  events: DEMO_EVENTS,
  friends: [],
  parents: [],
  vibe: 'twilight',
  darkMode: true,
  bgImageUri: '',
  avatar: '',
  reward: null,
  userId: '',
  email: '',
  displayName: 'Student',
  userRole: 'student',
  onboarded: false,
  passwordRecovery: false,
  nudges: [],
  onboardingStart: 'SchoolPicker',
  unsynced: [],
  syncError: '',
  toast: '',
  _hasHydrated: false,
  seenIntro: false,
  messages: [],
  messagingStatus: 'unknown',
  openChatWith: '',
  incoming: null,
  chatPhotoUrls: {},

  setPhase: (phase) => set({ phase }),
  setSeenIntro: (seenIntro) => set({ seenIntro }),
  setHasHydrated: (v) => set({ _hasHydrated: v }),
  setPasswordRecovery: (v) => set({ passwordRecovery: v }),
  editSetup: (start) => set({ onboardingStart: start, phase: 'onboarding' }),

  resetForUser: (uid, role, name, email) => set({
    userId: uid,
    userRole: role,
    email,
    displayName: name,
    pairingCode: '',
    school: { name: '', city: '' },
    grade: 9,
    classes: [],
    timetable: null,
    homework: [],
    events: [],
    points: 0,
    streak: 0,
    lastActivityDate: '',
    friends: [],
    parents: [],
    avatar: '',
    bgImageUri: '',
    onboarded: false,
    nudges: [],
    unsynced: [],
    syncError: '',
    reward: null,
    messages: [],
    messagingStatus: 'unknown',
    openChatWith: '',
    incoming: null,
    chatPhotoUrls: {},
    phase: role === 'parent' ? 'parent' : 'onboarding',
  }),

  // Copy what the server knows about this account into local state.
  applyProfile: (p) => set((s) => ({
    userRole: p.role,
    displayName: p.display_name || s.displayName,
    pairingCode: p.pairing_code ?? s.pairingCode,
    school: p.school_name ? { name: p.school_name, city: p.school_city ?? '', district: s.school.district } : s.school,
    grade: p.grade ?? s.grade,
    classes: p.classes && p.classes.length > 0 ? p.classes : s.classes,
    timetable: p.timetable ?? s.timetable,
    points: p.points ?? s.points,
    streak: p.streak ?? s.streak,
    lastActivityDate: p.last_activity_date ?? s.lastActivityDate,
    avatar: p.avatar ?? s.avatar,
    // Accounts made before the onboarded flag existed count as set up once they have classes
    onboarded: !!p.onboarded || s.onboarded || (p.classes?.length ?? 0) > 0,
  })),

  setSchool: (school) => { set({ school }); get().syncProfileState(); },
  setGrade: (grade) => { set({ grade }); get().syncProfileState(); },
  setClasses: (classes) => { set({ classes }); get().syncProfileState(); },
  setSchedule: (classes, timetable) => { set({ classes, timetable }); get().syncProfileState(); },
  setDisplayName: (displayName) => {
    set({ displayName });
    const { userId } = get();
    if (userId) updateProfile(userId, { displayName }).catch(() => {});
  },
  setAvatar: (avatar) => {
    set({ avatar });
    const { userId } = get();
    if (userId) updateProfile(userId, { avatar: avatar || null }).catch(() => {});
  },
  completeOnboarding: () => {
    set({ onboarded: true, phase: 'main', onboardingStart: 'SchoolPicker' });
    const { userId } = get();
    if (userId) updateProfile(userId, { onboarded: true }).catch(() => {});
    get().syncProfileState();
  },

  toggleHomework: (id) => {
    const { homework, userId, streak: oldStreak } = get();
    const hw = homework.find((h) => h.id === id);
    if (!hw) return;
    const newDone = !hw.done;
    const updated: Homework = { ...hw, done: newDone, doneAt: newDone ? new Date().toISOString() : undefined };
    set((s) => {
      const { streak, lastActivityDate } = newDone
        ? calcStreak(s.lastActivityDate, s.streak)
        : { streak: s.streak, lastActivityDate: s.lastActivityDate };
      return {
        homework: s.homework.map((h) => (h.id === id ? updated : h)),
        points: Math.max(0, newDone ? s.points + (hw.points || 10) : s.points - (hw.points || 10)),
        streak,
        lastActivityDate,
        reward: newDone ? { points: hw.points || 10, streak } : null,
      };
    });
    scheduleHwReminder(updated);
    if (!userId) return;
    pushHw(updated);
    get().syncProfileState();
    if (newDone) {
      logActivity(userId, 'hw_done', `Finished ${hw.title}`, hw.subject, hw.classColor).catch(() => {});
      notifyParents('✓ Homework done', `${get().displayName}: ${hw.subject ? hw.subject + ' — ' : ''}${hw.title}`);
      const s = get().streak;
      if (s > oldStreak && STREAK_MILESTONES.includes(s)) {
        logActivity(userId, 'streak', `Hit a ${s}-day streak 🔥`).catch(() => {});
      }
    }
  },

  addHomework: (data) => {
    const { userId, streak: oldStreak } = get();
    const id = 'h' + Date.now();
    const newHw: Homework = { ...data, id, done: false, photos: [] };
    set((s) => {
      const { streak, lastActivityDate } = calcStreak(s.lastActivityDate, s.streak);
      return {
        homework: [...s.homework, newHw],
        points: s.points + 5,
        streak,
        lastActivityDate,
        reward: { points: 5, streak },
      };
    });
    scheduleHwReminder(newHw);
    if (!userId) { set({ toast: `Added · due ${dueText(newHw.dueDate)}` }); return; }
    markUnsynced(id);
    get().syncProfileState();
    const dueLabel = newHw.dueDate
      ? new Date(newHw.dueDate).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
      : newHw.due;
    logActivity(userId, 'hw_added', `Added ${newHw.title} · due ${dueLabel}`, newHw.subject, newHw.classColor).catch(() => {});
    const s = get().streak;
    if (s > oldStreak && STREAK_MILESTONES.includes(s)) logActivity(userId, 'streak', `Hit a ${s}-day streak 🔥`).catch(() => {});
    (async () => {
      let saved = newHw;
      if ((data.attachedImages ?? []).length > 0) {
        const res = await syncPhotos(userId, { ...newHw, attachedImages: [], photos: [] }, data.attachedImages ?? []);
        saved = { ...newHw, ...res };
        set((st) => ({ homework: st.homework.map((h) => (h.id === id ? { ...h, photos: res.photos } : h)) }));
      }
      const ok = await pushHw(saved);
      if (ok) set({ toast: `Saved · due ${dueText(saved.dueDate)}` });
    })().catch(() => {});
  },

  editHomework: (id, changes) => {
    const { userId, homework } = get();
    const before = homework.find((h) => h.id === id);
    if (!before) return;
    set((s) => ({ homework: s.homework.map((h) => (h.id === id ? { ...h, ...changes } : h)) }));
    const after = get().homework.find((h) => h.id === id)!;
    scheduleHwReminder(after);
    if (!userId) return;
    (async () => {
      let saved = after;
      if (changes.attachedImages !== undefined) {
        const res = await syncPhotos(userId, before, changes.attachedImages ?? []);
        saved = { ...after, ...res };
        set((st) => ({ homework: st.homework.map((h) => (h.id === id ? { ...h, photos: res.photos } : h)) }));
      }
      const ok = await pushHw(saved);
      if (ok) set({ toast: 'Changes saved' });
    })().catch(() => {});
  },

  deleteHomework: (id) => {
    const { userId, homework } = get();
    const hw = homework.find((h) => h.id === id);
    if (!hw) return;
    set((s) => ({ homework: s.homework.filter((h) => h.id !== id) }));
    cancelReminder(id).catch(() => {});
    if (!userId) return;
    markSynced(id);
    deleteHomeworkRow(id).catch(() => {});
    if (hw.photos?.length) deletePhotoPaths(hw.photos).catch(() => {});
  },

  addEvent: (data) => {
    const { userId } = get();
    const id = 'e' + Date.now();
    const newEv: CalEvent = { ...data, id, done: false };
    set((s) => {
      const { streak, lastActivityDate } = calcStreak(s.lastActivityDate, s.streak);
      return { events: [...s.events, newEv], streak, lastActivityDate };
    });
    scheduleEventReminder(newEv);
    if (!userId) { set({ toast: 'Event added' }); return; }
    pushEv(newEv).then((ok) => { if (ok) set({ toast: 'Event saved' }); });
    get().syncProfileState();
    const day = newEv.date ? new Date(newEv.date).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
    const when = newEv.repeat === 'weekly' ? repeatLabel(newEv).toLowerCase() : day;
    logActivity(userId, 'event_added', `Added ${newEv.title}${when ? ` · ${when}` : ''}${newEv.time ? ` ${newEv.time}` : ''}`).catch(() => {});
  },

  editEvent: (id, changes) => {
    const { userId } = get();
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...changes } : e)) }));
    const updated = get().events.find((e) => e.id === id);
    if (updated) scheduleEventReminder(updated);
    if (userId && updated) pushEv(updated);
  },

  deleteEvent: (id) => {
    const { userId } = get();
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    cancelReminder(id).catch(() => {});
    markSynced(id);
    if (userId) deleteEventRow(id).catch(() => {});
  },

  skipEventOn: (id, day) => {
    const ev = get().events.find((e) => e.id === id);
    if (!ev) return;
    get().editEvent(id, { skipDates: Array.from(new Set([...(ev.skipDates ?? []), day])) });
  },

  endEventBefore: (id, day) => {
    const ev = get().events.find((e) => e.id === id);
    if (!ev?.date) return;
    const cut = new Date(day + 'T12:00:00'); cut.setDate(cut.getDate() - 1);
    // Ending before the very first one means removing the whole series
    if (cut < new Date(new Date(ev.date).toDateString())) { get().deleteEvent(id); return; }
    get().editEvent(id, { repeatUntil: cut.toISOString() });
  },

  setVibe: (vibe) => set({
    vibe,
    ...(vibe === 'clay' ? { darkMode: false } : {}),
    ...(vibe === 'paper' || vibe === 'twilight' || vibe === 'mono' ? { darkMode: true } : {}),
  }),
  setDarkMode: (darkMode) => set({ darkMode }),
  setBgImageUri: (bgImageUri) => set({ bgImageUri }),
  clearReward: () => set({ reward: null }),

  loadFriends: async () => {
    if (!get().userId) return;
    try {
      const rows = await getFriends();
      set({
        friends: rows.map((r, i) => ({
          id: r.id,
          name: r.display_name ?? 'Friend',
          school: r.school_name ?? '',
          grade: r.grade,
          pts: r.points ?? 0,
          // Friends see the same "alive" streak the owner sees
          streak: (() => {
            const t = todayStr(); const y = new Date(); y.setDate(y.getDate() - 1);
            return r.last_activity_date === t || r.last_activity_date === dateKey(y) ? r.streak : 0;
          })(),
          avatar: r.avatar,
          color: CLASS_COLORS[i % CLASS_COLORS.length],
        })),
      });
    } catch {
      // keep the last list we had
    }
  },

  addFriendByCode: async (code) => {
    if (!get().userId) return 'not_signed_in';
    const result = await rpcAddFriend(code);
    if (result === 'added') await get().loadFriends();
    return result;
  },

  removeFriend: async (id) => {
    set((s) => ({ friends: s.friends.filter((f) => f.id !== id) }));
    if (get().userId) await removeFriendRow(id);
  },

  loadParents: async () => {
    if (!get().userId || get().userRole !== 'student') return;
    set({ parents: await getMyParents() });
  },

  checkNudges: async () => {
    const { userId, userRole } = get();
    if (!userId || userRole !== 'student') return;
    const unseen = await fetchUnseenNudges(userId);
    if (unseen.length) set((s) => ({ nudges: [...s.nudges, ...unseen.filter((n) => !s.nudges.some((x) => x.id === n.id))] }));
  },

  pushNudge: (n) => set((s) => (s.nudges.some((x) => x.id === n.id) ? s : { nudges: [...s.nudges, n] })),

  dismissNudge: (id) => {
    set((s) => ({ nudges: s.nudges.filter((n) => n.id !== id) }));
    if (get().userId) markNudgeSeen(id).catch(() => {});
  },

  loadDataFromSupabase: async () => {
    const { userId, homework: localHw, events: localEv } = get();
    if (!userId) return;
    let sbHw: Homework[]; let sbEv: CalEvent[]; let profile: Profile | null;
    try {
      [sbHw, sbEv, profile] = await Promise.all([fetchHomework(userId), fetchEvents(userId), getProfile(userId)]);
    } catch {
      return; // offline — keep what's on the device
    }
    if (profile) get().applyProfile(profile);
    const pending = new Set(get().unsynced);
    const sbHwIds = new Set(sbHw.map((h) => h.id));
    const sbEvIds = new Set(sbEv.map((e) => e.id));
    if (sbHw.length > 0 || sbEv.length > 0) {
      const paths = sbHw.flatMap((h) => h.photos ?? []);
      const urls = await signPhotoPaths(paths);
      const fromServer = sbHw.map((h) => {
        // A local edit that hasn't reached the server yet wins over the server copy
        const local = pending.has(h.id) ? localHw.find((l) => l.id === h.id) : undefined;
        const base = local ? { ...local, photos: local.photos ?? h.photos } : h;
        return { ...base, attachedImages: (base.photos ?? []).map((p) => urls[p]).filter(Boolean) };
      });
      const onlyLocal = localHw.filter((h) => pending.has(h.id) && !sbHwIds.has(h.id));
      const evFromServer = sbEv.map((e) => (pending.has(e.id) ? localEv.find((l) => l.id === e.id) ?? e : e));
      const evOnlyLocal = localEv.filter((e) => pending.has(e.id) && !sbEvIds.has(e.id));
      set({ homework: [...fromServer, ...onlyLocal], events: [...evFromServer, ...evOnlyLocal] });
    } else if (localHw.length > 0 || localEv.length > 0) {
      // Server is empty but this device has data for this same account — push it up
      localHw.forEach((h) => markUnsynced(h.id));
      localEv.forEach((e) => markUnsynced(e.id));
    }
    await get().retrySync();
    get().loadFriends();
    get().loadParents();
    get().checkNudges();
    get().loadInbox();
  },

  retrySync: async () => {
    const { unsynced, homework, events } = get();
    for (const id of unsynced) {
      const h = homework.find((x) => x.id === id);
      if (h) { await pushHw(h); continue; }
      const e = events.find((x) => x.id === id);
      if (e) { await pushEv(e); continue; }
      markSynced(id); // deleted locally meanwhile
    }
  },

  clearToast: () => set({ toast: '' }),

  // ─── Messages ───
  setOpenChat: (friendId) => {
    set((s) => ({ openChatWith: friendId, incoming: s.incoming?.senderId === friendId ? null : s.incoming }));
    if (friendId) get().loadConversation(friendId);
  },
  clearIncoming: () => set({ incoming: null }),

  loadInbox: async () => {
    const { userId, userRole } = get();
    if (!userId || userRole !== 'student') return;
    const res = await fetchInbox();
    if (!res.ok) { if (res.reason === 'needs_update') set({ messagingStatus: 'needs_update' }); return; }
    const loadedBefore = get().messagingStatus === 'ready';
    const before = new Set(get().messages.map((m) => m.id));
    // The inbox is the full recent picture: drop anything the server no longer has (unsent)
    set((s) => ({ messagingStatus: 'ready', messages: mergeMessages(s.messages, res.messages, () => true) }));
    signMissingPhotos(res.messages);
    const fresh = res.messages.filter((m) => !before.has(m.id) && m.recipientId === userId && !m.readAt);
    // Alert only for messages that arrived since the last check, not old unread ones on first load
    if (loadedBefore && fresh.length) [...fresh].reverse().forEach((m) => get().receiveMessage(m)); // oldest first, so the alert shows the newest
    const open = get().openChatWith;
    if (open && get().messages.some((m) => m.senderId === open && m.recipientId === userId && !m.readAt)) {
      get().loadConversation(open);
    }
  },

  loadConversation: async (friendId) => {
    const { userId } = get();
    if (!userId) return;
    const res = await fetchConversation(friendId);
    if (!res.ok) { if (res.reason === 'needs_update') set({ messagingStatus: 'needs_update' }); return; }
    const inChat = (m: ChatMessage) => m.senderId === friendId || m.recipientId === friendId;
    set((s) => ({ messagingStatus: 'ready', messages: mergeMessages(s.messages, res.messages, inChat) }));
    signMissingPhotos(res.messages);
    if (get().openChatWith === friendId && res.messages.some((m) => m.senderId === friendId && !m.readAt)) {
      const now = new Date().toISOString();
      set((s) => ({ messages: s.messages.map((m) => (m.senderId === friendId && m.recipientId === userId && !m.readAt ? { ...m, readAt: now } : m)) }));
      markMessagesRead(friendId);
    }
  },

  sendChat: async (friendId, body, photoUri) => {
    const { userId } = get();
    const text = body.trim();
    if (!userId || (!text && !photoUri)) return;
    const localId = `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const draft: ChatMessage = {
      id: localId, senderId: userId, recipientId: friendId, body: text, photo: null, localPhotoUri: photoUri,
      createdAt: new Date().toISOString(), readAt: null, pending: 'sending',
    };
    set((s) => ({ messages: [...s.messages, draft] }));
    await get().retryChat(localId);
  },

  retryChat: async (localId) => {
    const m = get().messages.find((x) => x.id === localId);
    if (!m) return;
    set((s) => ({ messages: s.messages.map((x) => (x.id === localId ? { ...x, pending: 'sending' } : x)) }));
    const fail = (needsUpdate: boolean) => set((s) => ({
      messagingStatus: needsUpdate ? 'needs_update' : s.messagingStatus,
      messages: s.messages.map((x) => (x.id === localId ? { ...x, pending: 'failed' } : x)),
    }));
    // Upload the photo first (once — a retry reuses the uploaded file)
    let photo = m.photo ?? null;
    if (m.localPhotoUri && !photo) {
      const up = await uploadChatPhoto(m.senderId, m.recipientId, m.localPhotoUri);
      if ('error' in up) { fail(up.error === 'needs_update'); return; }
      photo = up.path;
      set((s) => ({ messages: s.messages.map((x) => (x.id === localId ? { ...x, photo } : x)) }));
    }
    const res = await sendMessage(m.senderId, m.recipientId, m.body, photo);
    if (res.ok) {
      // Show the on-device copy right away instead of waiting for a download link
      if (photo && m.localPhotoUri) set((s) => ({ chatPhotoUrls: { ...s.chatPhotoUrls, [photo!]: m.localPhotoUri! } }));
      set((s) => ({ messagingStatus: 'ready', messages: mergeMessages(s.messages.filter((x) => x.id !== localId), [res.message]) }));
    } else {
      fail(res.reason === 'needs_update');
    }
  },

  receiveMessage: (m) => {
    const { userId, openChatWith } = get();
    if (m.recipientId !== userId) return;
    set((s) => ({ messages: mergeMessages(s.messages, [m]) }));
    signMissingPhotos([m]);
    // Someone who just added us: fetch them so their name shows
    if (!get().friends.some((f) => f.id === m.senderId)) get().loadFriends();
    if (openChatWith === m.senderId) get().loadConversation(m.senderId);
    else set({ incoming: m });
  },

  unsendMessage: async (id) => {
    const m = get().messages.find((x) => x.id === id);
    set((s) => ({ messages: s.messages.filter((x) => x.id !== id) }));
    if (m && !m.pending) {
      const ok = await deleteMessage(id);
      if (!ok) { set((s) => ({ messages: mergeMessages(s.messages, [m]) })); return; }
    }
    if (m?.photo) deleteChatPhoto(m.photo);
  },

  // Debounced push of profile fields that change often.
  syncProfileState: () => {
    const { userId, userRole } = get();
    if (!userId || userRole !== 'student') return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const { classes, timetable, points, streak, lastActivityDate, school, grade } = get();
      updateProfile(userId, {
        classes, timetable, points, streak, lastActivityDate, grade,
        schoolName: school.name, schoolCity: school.city,
      }).catch(() => {});
    }, 800);
  },
    }),
    {
      name: 'my-agenda-store',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Older saved state had fake friends/requests/notifications — drop them.
      migrate: (persisted: any) => {
        const s = { ...(persisted ?? {}) };
        delete s.friendRequests; delete s.notifications; delete s.useClassTimes; delete s.parentPaired;
        s.friends = [];
        if (s.school && !('district' in s.school)) s.school = { ...s.school };
        if (s.userId && s.onboarded === undefined) s.onboarded = (s.classes ?? []).length > 0;
        return s;
      },
      partialize: (state) => ({
        phase: state.phase,
        seenIntro: state.seenIntro,
        school: state.school,
        grade: state.grade,
        classes: state.classes,
        timetable: state.timetable,
        pairingCode: state.pairingCode,
        points: state.points,
        streak: state.streak,
        lastActivityDate: state.lastActivityDate,
        displayName: state.displayName,
        email: state.email,
        // Signed-in photos live in storage; only demo keeps image data locally
        homework: state.userId
          ? state.homework.map(({ attachedImages, ...h }) => h)
          : state.homework,
        events: state.events,
        friends: state.friends,
        parents: state.parents,
        vibe: state.vibe,
        darkMode: state.darkMode,
        bgImageUri: state.bgImageUri,
        avatar: state.avatar,
        userId: state.userId,
        userRole: state.userRole,
        onboarded: state.onboarded,
        unsynced: state.unsynced,
      }),
    }
  )
);
