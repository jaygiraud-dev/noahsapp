import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Pillar } from './theme';
import { PILLAR_KEYS } from './theme';
import { QUESTS, getQuest, sparksForDifficulty } from './data/quests';
import { multiplierFor, todayKey, dayDiff, cooldownRemainingMs } from './economy';

export interface StatState {
  value: number; // 0..100
  recent: number; // last gain, shown as (+N)
}

export interface UserQuest {
  uid: string; // instance id
  questId: string;
  status: 'active' | 'done';
  addedDay: string;
  doneDay?: string;
}

export interface DayRecord {
  key: string; // YYYY-MM-DD
  dayNumber: number;
  mood?: 'rough' | 'ok' | 'great';
  multiplier: number;
  points: number; // Sparks earned that day
  questUids: string[]; // completed quest instance uids
  journalId?: string;
}

export interface JournalEntry {
  id: string;
  day: string;
  text: string;
  photo?: string; // emoji motif stand-in for a photo in this offline build
  questId?: string;
  createdAt: number;
}

export interface AuraPoint {
  day: string;
  value: number;
}

interface RewardPayload {
  sparks: number;
  multiplier: number;
  pillars: { pillar: Pillar; amount: number }[];
}

type Phase = 'onboarding' | 'main';

interface State {
  _hydrated: boolean;
  phase: Phase;
  // identity / personalization
  name: string;
  focus: Pillar[];

  // economy
  stats: Record<Pillar, StatState>;
  aura: number;
  sparksWallet: number; // lifetime sparks (spendable currency in Phase 2)
  streak: number;
  lastActiveDay: string | null;
  dayCounter: number; // "Day N" of the journey

  // data
  userQuests: UserQuest[];
  days: DayRecord[];
  journal: JournalEntry[];
  auraHistory: AuraPoint[];
  startDate: string;
  lastCompleted: Record<string, number>; // questId -> ms timestamp of last completion (cooldowns)

  // transient
  reward: RewardPayload | null;

  // actions
  setHydrated: (v: boolean) => void;
  finishOnboarding: (name: string, focus: Pillar[]) => void;
  addQuest: (questId: string) => void;
  completeQuest: (uid: string) => void;
  quickComplete: (questId: string) => void;
  removeQuest: (uid: string) => void;
  setMood: (mood: 'rough' | 'ok' | 'great') => void;
  addJournal: (text: string, photo?: string, questId?: string) => void;
  clearReward: () => void;
  reset: () => void;
}

function freshStats(focus: Pillar[]): Record<Pillar, StatState> {
  const base: Record<Pillar, StatState> = {
    personality: { value: 38, recent: 0 },
    body: { value: 41, recent: 0 },
    mind: { value: 44, recent: 0 },
    soul: { value: 40, recent: 0 },
  };
  // Personalization: chosen focus pillars start a little higher.
  focus.forEach((p) => {
    base[p] = { value: Math.min(100, base[p].value + 9), recent: 0 };
  });
  return base;
}

function auraFromStats(stats: Record<Pillar, StatState>): number {
  // Seed Aura from the starting stat sheet so the hero number feels earned.
  const sum = PILLAR_KEYS.reduce((s, p) => s + stats[p].value, 0);
  return Math.round(sum * 90); // ~15k starting Aura
}

// Build a gentle historical Aura curve so the Profile graph renders alive on day one.
function seedHistory(start: number): AuraPoint[] {
  const pts: AuraPoint[] = [];
  const today = new Date();
  let v = start * 0.72;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // smooth upward drift with light noise
    v += (start - v) * 0.045 + (Math.sin(i * 0.7) + 1) * (start * 0.0009);
    pts.push({ day: todayKey(d), value: Math.round(v) });
  }
  pts[pts.length - 1].value = start;
  return pts;
}

const DEFAULTS = () => {
  const stats = freshStats([]);
  const aura = auraFromStats(stats);
  return {
    phase: 'onboarding' as Phase,
    name: '',
    focus: [] as Pillar[],
    stats,
    aura,
    sparksWallet: 0,
    streak: 0,
    lastActiveDay: null,
    dayCounter: 1,
    userQuests: [] as UserQuest[],
    days: [] as DayRecord[],
    journal: [] as JournalEntry[],
    auraHistory: seedHistory(aura),
    startDate: todayKey(),
    lastCompleted: {} as Record<string, number>,
    reward: null as RewardPayload | null,
  };
};

let uidSeq = 0;
const mkUid = () => `${Date.now().toString(36)}-${uidSeq++}`;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      _hydrated: false,
      ...DEFAULTS(),

      setHydrated: (v) => set({ _hydrated: v }),

      finishOnboarding: (name, focus) => {
        const stats = freshStats(focus);
        const aura = auraFromStats(stats);
        // Suggest 3 starter quests weighted to the chosen focus pillars.
        const pick = QUESTS.filter(
          (q) => q.difficulty === 'easy' && Object.keys(q.stats).some((p) => focus.includes(p as Pillar))
        ).slice(0, 3);
        const fallback = QUESTS.filter((q) => q.difficulty === 'easy').slice(0, 3);
        const starters = (pick.length >= 3 ? pick : [...pick, ...fallback].slice(0, 3)).map((q) => ({
          uid: mkUid(),
          questId: q.id,
          status: 'active' as const,
          addedDay: todayKey(),
        }));
        set({
          phase: 'main',
          name,
          focus,
          stats,
          aura,
          auraHistory: seedHistory(aura),
          userQuests: starters,
        });
      },

      addQuest: (questId) => {
        const exists = get().userQuests.some((u) => u.questId === questId && u.status === 'active');
        if (exists) return;
        // Honor the cooldown — a quest on cooldown can't be re-added to farm Aura.
        const q = getQuest(questId);
        if (q && cooldownRemainingMs(get().lastCompleted[questId], q.difficulty) > 0) return;
        set((s) => ({
          userQuests: [
            { uid: mkUid(), questId, status: 'active', addedDay: todayKey() },
            ...s.userQuests,
          ],
        }));
      },

      removeQuest: (uid) =>
        set((s) => ({ userQuests: s.userQuests.filter((u) => u.uid !== uid) })),

      // Quick-log: instantly add and complete a quest in one tap.
      quickComplete: (questId) => {
        const q = getQuest(questId);
        if (q && cooldownRemainingMs(get().lastCompleted[questId], q.difficulty) > 0) return;
        const uid = mkUid();
        set((s) => ({
          userQuests: [{ uid, questId, status: 'active', addedDay: todayKey() }, ...s.userQuests],
        }));
        get().completeQuest(uid);
      },

      completeQuest: (uid) => {
        const s = get();
        const uq = s.userQuests.find((u) => u.uid === uid);
        if (!uq || uq.status === 'done') return;
        const quest = getQuest(uq.questId);
        if (!quest) return;

        // Anti-farm: if this quest was completed within its cooldown, clear the
        // card without re-awarding any Sparks/Aura.
        if (cooldownRemainingMs(s.lastCompleted[uq.questId], quest.difficulty) > 0) {
          set({
            userQuests: s.userQuests.map((u) =>
              u.uid === uid ? { ...u, status: 'done', doneDay: todayKey() } : u
            ),
          });
          return;
        }

        const today = todayKey();

        // --- streak / multiplier ---
        let streak = s.streak;
        let dayCounter = s.dayCounter;
        if (s.lastActiveDay !== today) {
          const gap = s.lastActiveDay ? dayDiff(today, s.lastActiveDay) : null;
          if (gap === 1) streak = s.streak + 1;
          else streak = 1; // first ever, or a missed day resets the streak (not Aura)
          dayCounter = s.dayCounter + (s.lastActiveDay ? Math.max(1, gap ?? 1) : 0);
        }
        const multiplier = multiplierFor(streak);

        // --- sparks & aura ---
        const baseSparks = sparksForDifficulty(quest.difficulty);
        const sparks = Math.round(baseSparks * multiplier);
        const aura = s.aura + sparks;

        // --- stat gains (independent, capped 0..100) ---
        const stats = { ...s.stats };
        const pillarsHit: { pillar: Pillar; amount: number }[] = [];
        // reset everyone's "recent" so only this completion shows a (+N)
        PILLAR_KEYS.forEach((p) => {
          stats[p] = { ...stats[p], recent: 0 };
        });
        (Object.entries(quest.stats) as [Pillar, number][]).forEach(([p, amt]) => {
          stats[p] = { value: Math.min(100, stats[p].value + amt), recent: amt };
          pillarsHit.push({ pillar: p, amount: amt });
        });

        // --- day record ---
        const days = [...s.days];
        let di = days.findIndex((d) => d.key === today);
        if (di === -1) {
          days.unshift({
            key: today,
            dayNumber: dayCounter,
            multiplier,
            points: sparks,
            questUids: [uid],
          });
        } else {
          days[di] = {
            ...days[di],
            multiplier,
            points: days[di].points + sparks,
            questUids: [...days[di].questUids, uid],
          };
        }

        // --- aura history ---
        const auraHistory = [...s.auraHistory];
        const hi = auraHistory.findIndex((a) => a.day === today);
        if (hi === -1) auraHistory.push({ day: today, value: aura });
        else auraHistory[hi] = { day: today, value: aura };

        set({
          userQuests: s.userQuests.map((u) =>
            u.uid === uid ? { ...u, status: 'done', doneDay: today } : u
          ),
          stats,
          aura,
          sparksWallet: s.sparksWallet + sparks,
          streak,
          lastActiveDay: today,
          dayCounter,
          days,
          auraHistory,
          lastCompleted: { ...s.lastCompleted, [quest.id]: Date.now() },
          reward: { sparks, multiplier, pillars: pillarsHit },
        });
      },

      setMood: (mood) => {
        const today = todayKey();
        set((s) => {
          const days = [...s.days];
          const i = days.findIndex((d) => d.key === today);
          if (i === -1) {
            days.unshift({
              key: today,
              dayNumber: s.dayCounter,
              mood,
              multiplier: multiplierFor(s.streak),
              points: 0,
              questUids: [],
            });
          } else {
            days[i] = { ...days[i], mood };
          }
          return { days };
        });
      },

      addJournal: (text, photo, questId) => {
        const today = todayKey();
        const id = mkUid();
        set((s) => {
          const days = [...s.days];
          const i = days.findIndex((d) => d.key === today);
          if (i === -1) {
            days.unshift({
              key: today,
              dayNumber: s.dayCounter,
              multiplier: multiplierFor(s.streak),
              points: 0,
              questUids: [],
              journalId: id,
            });
          } else if (!days[i].journalId) {
            days[i] = { ...days[i], journalId: id };
          }
          return {
            days,
            journal: [
              { id, day: today, text, photo, questId, createdAt: Date.now() },
              ...s.journal,
            ],
          };
        });
      },

      clearReward: () => set({ reward: null }),

      reset: () => set({ ...DEFAULTS(), _hydrated: true }),
    }),
    {
      name: 'questline-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ _hydrated, reward, ...rest }) => rest,
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);
