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
      bg: d ? '#1a1714' : '#f3eee3',
      surface: d ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
      surfaceHi: d ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
      surfaceEdge: d ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.10)',
      ink: d ? '#f4ece0' : '#1c1917',
      sub: d ? 'rgba(244,236,224,0.62)' : 'rgba(28,25,23,0.62)',
      soft: d ? 'rgba(244,236,224,0.38)' : 'rgba(28,25,23,0.40)',
      line: d ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.10)',
      magenta: '#d97706', purple: '#6b4f3d', cyan: '#3d6b41',
      mint: '#3d6b41', amber: '#d97706', red: '#a04848',
      accent: '#d97706', accentDk: '#b45309',
      accentGrad: ['#b45309', '#d97706'],
      overlay: 'rgba(0,0,0,0.45)',
      isTwilight: false, isPaper: true, isMono: false, isClay: false,
    };
  }

  // clay — always light, pastel 3D feel
  if (vibe === 'clay') {
    return {
      ...fonts,
      vibe, dark: false,
      bg: '#f0ebff',
      surface: 'rgba(255,255,255,0.75)',
      surfaceHi: 'rgba(255,255,255,0.95)',
      surfaceEdge: 'rgba(167,139,250,0.15)',
      ink: '#2d1b69',
      sub: 'rgba(45,27,105,0.60)',
      soft: 'rgba(45,27,105,0.38)',
      line: 'rgba(167,139,250,0.20)',
      magenta: '#ec4899',
      purple: '#a78bfa',
      cyan: '#06d6e0',
      mint: '#34d399',
      amber: '#fbbf24',
      red: '#f87171',
      accent: '#a78bfa',
      accentDk: '#7c3aed',
      accentGrad: ['#a78bfa', '#ec4899'],
      overlay: 'rgba(45,27,105,0.35)',
      isTwilight: false, isPaper: false, isMono: false, isClay: true,
    };
  }

  // mono
  const d = dark;
  return {
    ...fonts,
    vibe, dark: d,
    bg: d ? '#0a0a0a' : '#fafaf7',
    surface: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    surfaceHi: d ? 'rgba(255,255,255,0.07)' : '#fff',
    surfaceEdge: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
    ink: d ? '#fafafa' : '#0a0a0a',
    sub: d ? 'rgba(250,250,250,0.62)' : 'rgba(10,10,10,0.62)',
    soft: d ? 'rgba(250,250,250,0.38)' : 'rgba(10,10,10,0.40)',
    line: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
    magenta: '#22c55e', purple: '#3b82f6', cyan: '#06b6d4',
    mint: '#22c55e', amber: '#f59e0b', red: '#ef4444',
    accent: '#22c55e', accentDk: '#16a34a',
    accentGrad: ['#22c55e', '#06b6d4'],
    overlay: 'rgba(0,0,0,0.45)',
    isTwilight: false, isPaper: false, isMono: true, isClay: false,
  };
}

export const DEFAULT_THEME = makeTheme('twilight', true);
