// Questline design language — dark, cinematic, editorial.
// Near-black canvas under a warm gradient glow (orange → red → pink).

export const T = {
  // Canvas
  bg: '#0A0A0B',
  bgGlow: '#161013', // warm near-black used for ambient glows
  surface: '#161618',
  surfaceHi: '#1E1E22',
  surfaceEdge: 'rgba(255,255,255,0.06)',
  line: 'rgba(255,255,255,0.07)',

  // Ink
  ink: '#F5F1EC',
  sub: 'rgba(245,241,236,0.62)',
  soft: 'rgba(245,241,236,0.34)',
  faint: 'rgba(245,241,236,0.16)',

  // Warm accent — the sparkle / Aura line / active states
  accent: '#FF5A2C',
  accentDk: '#D8431D',
  // orange → red → pink
  accentGrad: ['#FFB13D', '#FF4D2E', '#FF2E8B'] as [string, string, string],
  glowGrad: ['rgba(255,90,44,0.45)', 'rgba(255,46,139,0.0)'] as [string, string],

  overlay: 'rgba(0,0,0,0.78)',

  // Fonts (loaded in App.tsx)
  fDisplay: 'InstrumentSerif_400Regular',
  fDisplayIt: 'InstrumentSerif_400Regular_Italic',
  fBody: 'Inter_400Regular',
  fMed: 'Inter_500Medium',
  fSemi: 'Inter_600SemiBold',
  fBold: 'Inter_700Bold',
  fMono: 'JetBrainsMono_500Medium',
  fMonoB: 'JetBrainsMono_700Bold',

  radius: 22,
};

// The four pillars and their colors.
export const PILLARS = {
  personality: { label: 'Personality', color: '#FF4D5E', glyph: '◇' }, // red
  body: { label: 'Body', color: '#FF49B0', glyph: '✦' }, // magenta/pink
  mind: { label: 'Mind', color: '#FF8A3D', glyph: '◈' }, // orange
  soul: { label: 'Soul', color: '#F5C04A', glyph: '✶' }, // amber/gold
} as const;

export type Pillar = keyof typeof PILLARS;
export const PILLAR_KEYS = Object.keys(PILLARS) as Pillar[];

// Quest "type" pills (category) — distinct from which stat a quest raises.
export const QUEST_TYPES = ['Hobby', 'Health', 'Social', 'Career', 'Mind', 'Adventure', 'Soul'] as const;
export type QuestType = (typeof QUEST_TYPES)[number];

export const TYPE_COLOR: Record<QuestType, string> = {
  Hobby: '#FF8A3D',
  Health: '#FF49B0',
  Social: '#FF4D5E',
  Career: '#7C9CFF',
  Mind: '#FF8A3D',
  Adventure: '#34D399',
  Soul: '#F5C04A',
};

export type Difficulty = 'easy' | 'medium' | 'hard' | 'epic';

export const DIFF_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  epic: 'Epic',
};

export const DIFF_COLOR: Record<Difficulty, string> = {
  easy: '#34D399',
  medium: '#FF8A3D',
  hard: '#FF4D2E',
  epic: '#FF2E8B',
};
