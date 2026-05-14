// Mirrors the student theme — same token shape, same makeTheme
export type Vibe = 'twilight' | 'paper' | 'mono';

export interface Theme {
  bg: string; surface: string; surfaceHi: string; surfaceEdge: string;
  ink: string; sub: string; soft: string; line: string;
  magenta: string; purple: string; cyan: string; mint: string; amber: string; red: string;
  accent: string; accentDk: string; accentGrad: [string, string]; overlay: string;
  isTwilight: boolean; isPaper: boolean; isMono: boolean; vibe: Vibe; dark: boolean;
  fDisplay: string; fDisplayItalic: string; fBody: string; fBodyMedium: string;
  fBodySemiBold: string; fHand: string; fMono: string; fMonoMedium: string;
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

  const common = {
    magenta: '#ec4899', purple: '#a78bfa', cyan: '#06d6e0',
    mint: '#34d399', amber: '#fbbf24', red: '#f87171',
  };

  if (vibe === 'twilight') {
    const bg = dark ? '#0c0820' : '#f5f3ff';
    return {
      ...fonts, ...common, vibe, dark,
      bg, surface: dark ? '#1a1035' : '#ede9fe',
      surfaceHi: dark ? '#241848' : '#ddd6fe',
      surfaceEdge: dark ? '#2e1f5e' : '#c4b5fd',
      ink: dark ? '#f0ebff' : '#1e1b4b',
      sub: dark ? '#c4b5fd' : '#4c1d95',
      soft: dark ? '#7c6fa0' : '#7c3aed',
      line: dark ? '#2e1f5e' : '#ddd6fe',
      accent: '#a78bfa', accentDk: '#7c3aed',
      accentGrad: ['#a78bfa', '#ec4899'],
      overlay: 'rgba(12,8,32,0.85)',
      isTwilight: true, isPaper: false, isMono: false,
    };
  }

  if (vibe === 'paper') {
    const bg = dark ? '#1a1714' : '#f3eee3';
    return {
      ...fonts, ...common, vibe, dark,
      bg, surface: dark ? '#252017' : '#ede5d0',
      surfaceHi: dark ? '#2e2a1e' : '#e2d9be',
      surfaceEdge: dark ? '#3d3525' : '#c9b99a',
      ink: dark ? '#f5f0e8' : '#1c1609',
      sub: dark ? '#d4c9a8' : '#78350f',
      soft: dark ? '#8a7d5a' : '#92400e',
      line: dark ? '#3d3525' : '#e2d9be',
      accent: '#d97706', accentDk: '#b45309',
      accentGrad: ['#f59e0b', '#d97706'],
      overlay: 'rgba(26,23,20,0.85)',
      isTwilight: false, isPaper: true, isMono: false,
    };
  }

  // mono
  const bg = dark ? '#0a0a0a' : '#fafaf7';
  return {
    ...fonts, ...common, vibe, dark,
    bg, surface: dark ? '#141414' : '#f0f0ec',
    surfaceHi: dark ? '#1e1e1e' : '#e0e0dc',
    surfaceEdge: dark ? '#2a2a2a' : '#c8c8c4',
    ink: dark ? '#f5f5f2' : '#0a0a0a',
    sub: dark ? '#a0a09c' : '#404040',
    soft: dark ? '#606060' : '#808080',
    line: dark ? '#2a2a2a' : '#e0e0dc',
    accent: '#22c55e', accentDk: '#16a34a',
    accentGrad: ['#22c55e', '#16a34a'],
    overlay: 'rgba(10,10,10,0.85)',
    isTwilight: false, isPaper: false, isMono: true,
  };
}

export const DEFAULT_THEME = makeTheme('twilight', true);
