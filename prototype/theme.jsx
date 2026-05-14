// theme.jsx — twilight (default) + paper + mono vibes
// Modern dark, neon-accented look targeted at high schoolers.

function makeTheme(t) {
  const vibe = t.vibe || 'twilight';
  const dark = vibe === 'twilight' || (vibe === 'paper' && t.dark) || (vibe === 'mono' && t.dark);

  // Three palettes, three personalities
  const palettes = {
    twilight: {
      bg:        '#0c0820',       // deep indigo
      bgGlow:    'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(236,72,153,0.22), transparent 70%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(124,58,237,0.14), transparent 70%), #0c0820',
      surface:   'rgba(255,255,255,0.035)',
      surfaceHi: 'rgba(255,255,255,0.07)',
      surfaceEdge:'rgba(255,255,255,0.08)',
      ink:       '#f4ecff',
      sub:       'rgba(244,236,255,0.62)',
      soft:      'rgba(244,236,255,0.38)',
      line:      'rgba(244,236,255,0.10)',
      margin:    '#ec4899',
      // accents (kept separate so we can place them deliberately)
      magenta:   '#ec4899',
      purple:    '#a78bfa',
      cyan:      '#06d6e0',
      mint:      '#34d399',
      amber:     '#fbbf24',
      red:       '#f87171',
      // primary action
      accent:    '#ec4899',
      accentDk:  '#db2777',
      accentGrad: 'linear-gradient(95deg, #a78bfa 0%, #ec4899 100%)',
      overlay:   'rgba(8,4,20,0.7)',
      isTwilight: true, isPaper: false, isMono: false,
    },
    paper: {
      bg:        t.dark ? '#1a1714' : '#f3eee3',
      bgGlow:    t.dark ? '#1a1714' : '#f3eee3',
      surface:   t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
      surfaceHi: t.dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
      surfaceEdge:t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.1)',
      ink:       t.dark ? '#f4ece0' : '#1c1917',
      sub:       t.dark ? 'rgba(244,236,224,0.62)' : 'rgba(28,25,23,0.62)',
      soft:      t.dark ? 'rgba(244,236,224,0.38)' : 'rgba(28,25,23,0.40)',
      line:      t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.10)',
      margin:    '#b91c1c',
      magenta:   '#d97706', purple: '#6b4f3d', cyan: '#3d6b41',
      mint:      '#3d6b41', amber: '#d97706', red: '#a04848',
      accent:    '#d97706', accentDk: '#b45309',
      accentGrad:'linear-gradient(95deg, #b45309 0%, #d97706 100%)',
      overlay:   'rgba(0,0,0,0.45)',
      isTwilight: false, isPaper: true, isMono: false,
    },
    mono: {
      bg:        t.dark ? '#0a0a0a' : '#fafaf7',
      bgGlow:    t.dark ? '#0a0a0a' : '#fafaf7',
      surface:   t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      surfaceHi: t.dark ? 'rgba(255,255,255,0.07)' : '#fff',
      surfaceEdge:t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
      ink:       t.dark ? '#fafafa' : '#0a0a0a',
      sub:       t.dark ? 'rgba(250,250,250,0.62)' : 'rgba(10,10,10,0.62)',
      soft:      t.dark ? 'rgba(250,250,250,0.38)' : 'rgba(10,10,10,0.40)',
      line:      t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
      margin:    '#22c55e',
      magenta:   '#22c55e', purple: '#3b82f6', cyan: '#06b6d4',
      mint:      '#22c55e', amber: '#f59e0b', red: '#ef4444',
      accent:    '#22c55e', accentDk: '#16a34a',
      accentGrad:'linear-gradient(95deg, #22c55e 0%, #06b6d4 100%)',
      overlay:   'rgba(0,0,0,0.45)',
      isTwilight: false, isPaper: false, isMono: true,
    },
  };

  const p = palettes[vibe] || palettes.twilight;
  return {
    ...p,
    // Compat aliases — keep older screens (onboarding/social/parent) working
    paper: p.bg,
    paperEdge: p.line,
    card: p.surface,
    cardEdge: p.surfaceEdge,
    green: p.mint,
    rose: p.red,
    slate: p.purple,
    vibe, dark,
    showTimes: t.showTimes !== false,
    reward: t.reward || 'playful',
    fDisplay: '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
    fBody:    '"Geist", ui-sans-serif, system-ui, -apple-system, sans-serif',
    fHand:    '"Caveat", cursive',
    fMono:    '"JetBrains Mono", ui-monospace, monospace',
  };
}

// Apply theme to the phone "screen" (inside the bezel)
function paperBg(T) {
  return { background: T.bgGlow || T.bg };
}

// ─── Pill (one-tap chip) ──────────────────────────────────────────
// Active state in twilight: neon outline + matching glow.
// `tone` lets you pick the neon color (magenta default, cyan, mint, purple, amber)
function Pill({ active, onClick, children, T, tone = 'magenta', size = 'm', icon, glow = true }) {
  const pad = size === 's' ? '5px 11px' : size === 'l' ? '11px 18px' : '8px 14px';
  const fs = size === 's' ? 12 : size === 'l' ? 15 : 13.5;
  const color = T[tone] || T.magenta;
  return (
    <button onClick={onClick} style={{
      padding: pad,
      borderRadius: 999,
      border: active
        ? `1.5px solid ${color}`
        : `1px solid ${T.surfaceEdge}`,
      background: active
        ? (T.isTwilight ? `${color}1c` : `${color}1f`)
        : T.surface,
      color: active ? (T.isTwilight ? T.ink : color) : T.ink,
      fontFamily: T.fBody, fontSize: fs, fontWeight: 500,
      letterSpacing: -0.1, cursor: 'pointer', display: 'inline-flex',
      alignItems: 'center', gap: 6, lineHeight: 1.1, whiteSpace: 'nowrap',
      boxShadow: active && glow ? `0 0 0 3px ${color}1f, 0 0 16px ${color}55` : 'none',
      transition: 'all 180ms cubic-bezier(.2,.7,.4,1)',
    }}>
      {icon && <span style={{ fontSize: fs * 1.05, lineHeight: 1 }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// Big rounded primary button — gradient in twilight, solid otherwise
function PrimaryBtn({ children, onClick, T, disabled, style = {}, glow = true }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      width: '100%', padding: '16px 20px', borderRadius: 16,
      border: 'none',
      background: disabled
        ? (T.isTwilight ? 'rgba(255,255,255,0.06)' : T.surfaceHi)
        : T.accentGrad,
      color: disabled ? T.soft : '#fff',
      fontFamily: T.fBody, fontSize: 16.5, fontWeight: 600, letterSpacing: -0.1,
      cursor: disabled ? 'default' : 'pointer',
      boxShadow: disabled || !glow ? 'none'
        : (T.isTwilight
            ? `0 0 0 1px ${T.magenta}33, 0 8px 32px ${T.magenta}55, 0 4px 14px ${T.purple}44`
            : `0 4px 14px ${T.accent}44`),
      transition: 'transform 120ms, box-shadow 200ms',
      ...style,
    }}>{children}</button>
  );
}

// Secondary outlined button
function GhostBtn({ children, onClick, T, style = {} }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 20px', borderRadius: 16,
      border: `1px solid ${T.surfaceEdge}`, background: 'transparent',
      color: T.ink, fontFamily: T.fBody, fontSize: 15.5, fontWeight: 500,
      cursor: 'pointer', ...style,
    }}>{children}</button>
  );
}

// Serif italic title (the signature look from the reference)
function SerifTitle({ children, T, size = 38, style = {}, italic = true }) {
  return (
    <h1 style={{
      margin: 0, fontFamily: T.fDisplay, fontWeight: 400,
      fontStyle: italic ? 'italic' : 'normal',
      fontSize: size, lineHeight: 1.02, letterSpacing: -0.3,
      color: T.ink, ...style,
    }}>{children}</h1>
  );
}

// Tiny circular accent button
function CircleBtn({ children, size = 32, onClick, T, style = {}, label, tone }) {
  const color = tone ? T[tone] : null;
  return (
    <button onClick={onClick} aria-label={label} style={{
      width: size, height: size, borderRadius: '50%',
      border: `1px solid ${color ? color + '88' : T.surfaceEdge}`,
      background: color ? `${color}22` : T.surface,
      color: color || T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.fBody, fontSize: size * 0.55, lineHeight: 1, cursor: 'pointer',
      padding: 0,
      boxShadow: color ? `0 0 12px ${color}55` : 'none',
      transition: 'transform 120ms',
      ...style,
    }}>{children}</button>
  );
}

// Small mono label used for section headers / dates
function MicroLabel({ children, T, style = {}, color }) {
  return (
    <div style={{
      fontFamily: T.fMono, fontSize: 10.5, fontWeight: 500,
      letterSpacing: 1.8, textTransform: 'uppercase',
      color: color || T.soft, ...style,
    }}>{children}</div>
  );
}

// Tape sticker (paper vibe only)
function Tape({ T, style = {} }) {
  return (
    <div style={{
      width: 56, height: 18, background: T.magenta, opacity: 0.45,
      borderRadius: 1, transform: 'rotate(-2deg)', ...style,
    }} />
  );
}

// Confetti — colorful neon bits that fly out from center
function Confetti({ T, intensity }) {
  if (intensity === 'off') return null;
  const count = intensity === 'subtle' ? 12 : intensity === 'mid' ? 28 : 48;
  const colors = T.isTwilight
    ? ['#ec4899', '#a78bfa', '#06d6e0', '#34d399', '#fbbf24', '#f472b6']
    : [T.magenta, T.purple, T.cyan, T.mint, T.amber];
  const bits = Array.from({ length: count }, (_, i) => {
    const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = 80 + Math.random() * 220;
    return {
      i,
      dx: Math.cos(ang) * dist,
      dy: Math.sin(ang) * dist - 40,
      color: colors[i % colors.length],
      rot: (Math.random() - 0.5) * 540,
      delay: Math.random() * 60,
      kind: i % 4,
      scale: 0.7 + Math.random() * 0.8,
    };
  });
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, overflow: 'hidden',
    }}>
      {bits.map(b => (
        <span key={b.i} style={{
          position: 'absolute',
          width: b.kind === 0 ? 8 : b.kind === 1 ? 4 : 6,
          height: b.kind === 1 ? 12 : b.kind === 3 ? 6 : 6,
          background: b.color, borderRadius: b.kind === 2 ? '50%' : 1,
          animation: `confetti 1100ms cubic-bezier(.2,.6,.3,1) ${b.delay}ms forwards`,
          boxShadow: `0 0 12px ${b.color}99`,
          '--dx': `${b.dx}px`, '--dy': `${b.dy}px`,
          '--rot': `${b.rot}deg`, '--scale': b.scale,
        }} />
      ))}
    </div>
  );
}

// Animated star sparkle — used to garnish things
function Sparkles({ T, count = 5, color }) {
  const c = color || T.magenta;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{
          position: 'absolute',
          top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
          width: 4, height: 4, borderRadius: '50%', background: c,
          boxShadow: `0 0 8px ${c}, 0 0 16px ${c}88`,
          animation: `twinkle 1800ms ease-in-out ${i * 240}ms infinite`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

Object.assign(window, {
  makeTheme, paperBg, Pill, PrimaryBtn, GhostBtn, SerifTitle, Tape,
  MicroLabel, CircleBtn, Confetti, Sparkles,
});
