export type Vibe = 'twilight' | 'paper' | 'mono';

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
      bg: '#0c0820',
      surface: 'rgba(255,255,255,0.035)',
      surfaceHi: 'rgba(255,255,255,0.07)',
      surfaceEdge: 'rgba(255,255,255,0.08)',
      ink: '#f4ecff',
      sub: 'rgba(244,236,255,0.62)',
      soft: 'rgba(244,236,255,0.38)',
      line: 'rgba(244,236,255,0.10)',
      magenta: '#ec4899',
      purple: '#a78bfa',
      cyan: '#06d6e0',
      mint: '#34d399',
      amber: '#fbbf24',
      red: '#f87171',
      accent: '#ec4899',
      accentDk: '#db2777',
      accentGrad: ['#a78bfa', '#ec4899'],
      overlay: 'rgba(8,4,20,0.7)',
      isTwilight: true, isPaper: false, isMono: false,
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
      isTwilight: false, isPaper: true, isMono: false,
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
    isTwilight: false, isPaper: false, isMono: true,
  };
}

export const DEFAULT_THEME = makeTheme('twilight', true);
