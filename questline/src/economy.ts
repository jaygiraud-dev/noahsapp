import type { Difficulty } from './theme';

// Base Sparks (✦) per difficulty.
export const SPARKS: Record<Difficulty, number> = {
  easy: 50,
  medium: 250,
  hard: 600,
  epic: 1000,
};

// Day-streak driven multiplier on Sparks earned that day.
// 1–2 day = x1, 3–6 = x1.5, 7–13 = x2, 14+ = x3
export function multiplierFor(streak: number): number {
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export function multiplierLabel(m: number): string {
  return 'x' + (Number.isInteger(m) ? m.toString() : m.toFixed(1));
}

// Aura += Sparks_earned × multiplier. Displayed compactly (e.g. 101.1k).
export function fmtAura(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(n).toString();
}

export function fmtSparks(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(n).toString();
}

// --- date helpers (local, offline-first) ---
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayDiff(aKey: string, bKey: string): number {
  const a = new Date(aKey + 'T00:00:00');
  const b = new Date(bKey + 'T00:00:00');
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

// % of the current year elapsed — the Journal time-awareness nudge.
export function pctOfYear(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 1).getTime();
  const end = new Date(d.getFullYear() + 1, 0, 1).getTime();
  return Math.round(((d.getTime() - start) / (end - start)) * 100);
}

// --- anti-cheese cooldowns (PRD §10) ---
// A quest can't be re-completed for Aura until its cooldown clears, so the same
// quest can't be farmed over and over. Harder quests lock for longer.
//   easy = daily habit · medium = a few days · hard = once a week · epic = monthly
export const COOLDOWN_DAYS: Record<Difficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 7,
  epic: 30,
};

export function cooldownMs(d: Difficulty): number {
  return COOLDOWN_DAYS[d] * 86_400_000;
}

// Milliseconds left before a quest is available again (0 = ready now).
export function cooldownRemainingMs(
  lastCompleted: number | undefined,
  difficulty: Difficulty,
  now = Date.now()
): number {
  if (!lastCompleted) return 0;
  return Math.max(0, lastCompleted + cooldownMs(difficulty) - now);
}

// Compact "ready in" label: 6d / 23h / 45m / <1m.
export function fmtCooldown(ms: number): string {
  if (ms <= 0) return 'ready';
  const d = Math.floor(ms / 86_400_000);
  if (d >= 1) return `${d}d`;
  const h = Math.floor(ms / 3_600_000);
  if (h >= 1) return `${h}h`;
  const m = Math.floor(ms / 60_000);
  return m >= 1 ? `${m}m` : '<1m';
}
