export type Vibe = 'twilight' | 'paper' | 'mono' | 'clay';

export interface Theme {
  bg: string;
  surface: string;
  surfaceHi: string;
  surfaceEdge: string;
  ink: string;
  sub: string;
  soft: string;
  line: string;
  magenta: string;
  purple: string;
  cyan: string;
  mint: string;
  amber: string;
  red: string;
  accent: string;
  accentDk: string;
  accentGrad: [string, string];
  overlay: string;
  isTwilight: boolean;
  isPaper: boolean;
  isMono: boolean;
  isClay: boolean;
  vibe: Vibe;
  dark: boolean;
  fDisplay: string;
  fDisplayItalic: string;
  fBody: string;
  fBodyMedium: string;
  fBodySemiBold: string;
  fHand: string;
  fMono: string;
  fMonoMedium: string;
}

export function makeTheme(vibe: Vibe = 'twilight', dark: boolean = true): Theme {
  const fonts = {
    fDisplay: 'InstrumentSerif_400Regular',
    fDisplayItalic: 'InstrumentSerif_400Regular_Italic',
    fBody: 'Inter_400Regular',
    fBodyMedium: 'Inter_500Medium',
    fBodySemiBold: 'Inter_600SemiBold',
    fHand: 'Caveat_500Medium',
    fMono: 'JetBrainsMono_400Regular',
    fMonoMedium: 'JetBrainsMono_500Medium',
  };

  if (vibe === 'twilight') {
    return {
      ...fonts,
      vibe, dark: true,
      bg: '#0d0d0d',
      surface: '#1c1c1c',
      surfaceHi: '#262626',
      surfaceEdge: 'rgba(255,255,255,0.05)',
      ink: '#f5f0eb',
      sub: 'rgba(245,240,235,0.60)',
      soft: 'rgba(245,240,235,0.32)',
      line: 'rgba(255,255,255,0.07)',
      magenta: '#e8453a',
      purple: '#a78bfa',
      cyan: '#f5a623',
      mint: '#34d399',
      amber: '#f0c040',
      red: '#e8453a',
      accent: '#e8453a',
      accentDk: '#c73b31',
      accentGrad: ['#e8453a', '#f5a623'],
      overlay: 'rgba(0,0,0,0.75)',
      isTwilight: true, isPaper: false, isMono: false, isClay: false,
    };
  }

  if (vibe === 'paper') {
    const d = dark;
    return {
      ...fonts,
      vibe, dark: d,
      // dark: solid warm-brown cards so text has a real backing
      // light: solid warm-white cards so sub/soft text pops on cream bg
      bg: d ? '#1a1714' : '#f3eee3',
      surface: d ? '#272420' : '#fffdf8',
      surfaceHi: d ? '#312d29' : '#ffffff',
      surfaceEdge: d ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.10)',
      ink: d ? '#f4ece0' : '#1c1917',
      sub: d ? 'rgba(244,236,224,0.72)' : 'rgba(28,25,23,0.75)',
      soft: d ? 'rgba(244,236,224,0.48)' : 'rgba(28,25,23,0.55)',
      line: d ? 'rgba(255,255,255,0.09)' : 'rgba(28,25,23,0.12)',
      magenta: '#d97706', purple: d ? '#c4873a' : '#92500a', cyan: d ? '#5a8a60' : '#2e6635',
      mint: d ? '#5a8a60' : '#2e6635', amber: '#d97706', red: d ? '#c05050' : '#a04040',
      accent: '#d97706', accentDk: '#b45309',
      accentGrad: ['#b45309', '#d97706'],
      overlay: 'rgba(0,0,0,0.50)',
      isTwilight: false, isPaper: true, isMono: false, isClay: false,
    };
  }

  // clay — always light, pastel 3D feel
  if (vibe === 'clay') {
    return {
      ...fonts,
      vibe, dark: false,
      bg: '#ede8ff',
      // solid white cards = maximum contrast for text on light bg
      surface: '#ffffff',
      surfaceHi: '#ffffff',
      surfaceEdge: 'rgba(139,92,246,0.18)',
      ink: '#1a0f4a',          // deep indigo — strong contrast on white
      sub: '#5b4494',          // solid medium purple — clearly readable
      soft: '#9580c8',         // solid lighter purple — still readable as secondary
      line: 'rgba(139,92,246,0.18)',
      magenta: '#db2777',
      purple: '#8b5cf6',
      cyan: '#0891b2',
      mint: '#059669',
      amber: '#d97706',
      red: '#dc2626',
      accent: '#7c3aed',       // darker purple = better contrast on white
      accentDk: '#5b21b6',
      accentGrad: ['#7c3aed', '#db2777'],
      overlay: 'rgba(45,27,105,0.40)',
      isTwilight: false, isPaper: false, isMono: false, isClay: true,
    };
  }

  // mono
  const d = dark;
  return {
    ...fonts,
    vibe, dark: d,
    bg: d ? '#0a0a0a' : '#fafaf7',
    // solid cards instead of near-invisible rgba
    surface: d ? '#161616' : '#f0f0ed',
    surfaceHi: d ? '#1f1f1f' : '#ffffff',
    surfaceEdge: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
    ink: d ? '#fafafa' : '#0a0a0a',
    sub: d ? 'rgba(250,250,250,0.72)' : 'rgba(10,10,10,0.72)',
    soft: d ? 'rgba(250,250,250,0.48)' : 'rgba(10,10,10,0.50)',
    line: d ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)',
    magenta: '#22c55e', purple: '#3b82f6', cyan: '#06b6d4',
    mint: '#22c55e', amber: '#f59e0b', red: '#ef4444',
    accent: '#22c55e', accentDk: '#16a34a',
    accentGrad: ['#22c55e', '#06b6d4'],
    overlay: 'rgba(0,0,0,0.50)',
    isTwilight: false, isPaper: false, isMono: true, isClay: false,
  };
}

export const DEFAULT_THEME = makeTheme('twilight', true);
