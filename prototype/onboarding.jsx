// onboarding.jsx — auth → school picker → classes → parent pair
// Exposes: AuthScreen, SchoolPickerScreen, ClassesScreen, ParentPairScreen, ResetPwdScreen

function Field({ T, label, value, onChange, placeholder, type = 'text', autoFocus }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{
        fontFamily: T.fBody, fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
        textTransform: 'uppercase', color: T.soft, marginBottom: 6,
      }}>{label}</div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '14px 16px',
          fontFamily: T.fBody, fontSize: 16, color: T.ink,
          background: T.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
          border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.12)' : 'rgba(28,25,23,0.14)'}`,
          borderRadius: 14, outline: 'none',
        }}
      />
    </label>
  );
}

// ─── Auth ───────────────────────────────────────────────────────────────
function AuthScreen({ T, onContinue, onReset, mode, setMode }) {
  const [email, setEmail] = React.useState('alex@email.com');
  const [pwd, setPwd] = React.useState('••••••••');
  const signup = mode === 'signup';
  return (
    <div style={{ padding: '60px 24px 24px', height: '100%', display: 'flex',
      flexDirection: 'column', gap: 24, boxSizing: 'border-box' }}>
      <div>
        <div style={{ fontFamily: T.fHand, fontSize: 28, color: T.accent, lineHeight: 1,
          transform: 'rotate(-2deg)', marginBottom: 4 }}>my agenda</div>
        <SerifTitle T={T} size={44} style={{ lineHeight: 1 }}>
          {signup ? 'Make yours.' : 'Welcome back.'}
        </SerifTitle>
        <div style={{ fontFamily: T.fBody, color: T.sub, fontSize: 15, marginTop: 8 }}>
          {signup
            ? 'A paper agenda for high schoolers \u2014 without the paper.'
            : 'Pick up where you left off.'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field T={T} label="Email" value={email} onChange={setEmail} placeholder="you@school.com" />
        <Field T={T} label="Password" value={pwd} onChange={setPwd} type="password" />
        {!signup && (
          <button onClick={onReset} style={{
            alignSelf: 'flex-end', background: 'transparent', border: 'none',
            color: T.accentDk, fontFamily: T.fBody, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', padding: 4,
          }}>Forgot password?</button>
        )}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PrimaryBtn T={T} onClick={onContinue}>
          {signup ? 'Create account' : 'Sign in'}
        </PrimaryBtn>
        <button onClick={() => setMode(signup ? 'signin' : 'signup')} style={{
          background: 'transparent', border: 'none',
          color: T.sub, fontFamily: T.fBody, fontSize: 14,
          cursor: 'pointer', padding: 8,
        }}>
          {signup ? 'Already have an account? Sign in' : 'New here? Make an account'}
        </button>
      </div>
    </div>
  );
}

function ResetPwdScreen({ T, onBack, onDone }) {
  const [email, setEmail] = React.useState('alex@email.com');
  const [sent, setSent] = React.useState(false);
  return (
    <div style={{ padding: '60px 24px 24px', height: '100%', display: 'flex',
      flexDirection: 'column', gap: 24, boxSizing: 'border-box' }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', textAlign: 'left', padding: 0,
        fontFamily: T.fBody, fontSize: 15, color: T.sub, cursor: 'pointer',
      }}>← Back</button>
      <div>
        <SerifTitle T={T} size={38}>Forgot password?</SerifTitle>
        <div style={{ fontFamily: T.fBody, color: T.sub, fontSize: 15, marginTop: 8 }}>
          Pop in your email. We'll send a reset link.
        </div>
      </div>
      {!sent ? (
        <Field T={T} label="Email" value={email} onChange={setEmail} />
      ) : (
        <div style={{
          padding: 16, borderRadius: 14,
          background: T.dark ? 'rgba(216,160,74,0.12)' : 'rgba(217,119,6,0.10)',
          border: `0.5px solid ${T.accent}55`,
          fontFamily: T.fBody, fontSize: 14, color: T.ink, lineHeight: 1.5,
        }}>
          Sent! Check <b>{email}</b> for a link to reset your password.
          It might take a minute.
        </div>
      )}
      <div style={{ marginTop: 'auto' }}>
        <PrimaryBtn T={T} onClick={sent ? onDone : () => setSent(true)}>
          {sent ? 'Back to sign in' : 'Send reset link'}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── School picker ─────────────────────────────────────────────────────
function SchoolPickerScreen({ T, onPick, onBack }) {
  const [q, setQ] = React.useState('');
  const groups = React.useMemo(() => {
    const filt = window.GVAN_SCHOOLS.filter(s =>
      !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.city.toLowerCase().includes(q.toLowerCase()));
    const map = new Map();
    filt.forEach(s => {
      if (!map.has(s.city)) map.set(s.city, []);
      map.get(s.city).push(s);
    });
    return [...map.entries()];
  }, [q]);

  return (
    <div style={{ padding: '54px 0 0', height: '100%', display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ padding: '0 24px 16px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 0,
          fontFamily: T.fBody, fontSize: 15, color: T.sub, cursor: 'pointer',
          marginBottom: 12,
        }}>← Back</button>
        <MicroLabel T={T}>Step 1 of 3</MicroLabel>
        <SerifTitle T={T} size={36} style={{ marginTop: 4 }}>
          Which school?
        </SerifTitle>
        <div style={{ fontFamily: T.fBody, color: T.sub, fontSize: 14, marginTop: 6 }}>
          Greater Vancouver public high schools.
        </div>
        <div style={{ marginTop: 16, position: 'relative' }}>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search schools or cities"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 40px',
              fontFamily: T.fBody, fontSize: 15, color: T.ink,
              background: T.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
              border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.12)' : 'rgba(28,25,23,0.14)'}`,
              borderRadius: 12, outline: 'none',
            }}
          />
          <span style={{
            position: 'absolute', left: 14, top: 12, color: T.soft,
            fontFamily: T.fBody, fontSize: 16,
          }}>⌕</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        {groups.map(([city, schools]) => (
          <div key={city} style={{ marginBottom: 18 }}>
            <MicroLabel T={T} style={{ marginBottom: 8 }}>{city}</MicroLabel>
            <div style={{
              background: T.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
              border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
              borderRadius: 14, overflow: 'hidden',
            }}>
              {schools.map((s, i) => (
                <button key={s.name} onClick={() => onPick(s)} style={{
                  width: '100%', textAlign: 'left',
                  padding: '14px 16px', display: 'flex', alignItems: 'center',
                  background: 'transparent', border: 'none',
                  borderTop: i === 0 ? 'none' : `0.5px solid ${T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(28,25,23,0.07)'}`,
                  fontFamily: T.fBody, fontSize: 15, color: T.ink, cursor: 'pointer',
                }}>
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span style={{ color: T.soft, fontSize: 14 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div style={{ fontFamily: T.fBody, color: T.sub, padding: 24, textAlign: 'center' }}>
            No matches.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Class entry ──────────────────────────────────────────────────────
const CLASS_COLORS = ['#d97706', '#475569', '#3d6b41', '#a04848', '#6b4f3d', '#7a5230', '#5e6b8b', '#856d3d'];

function ClassesScreen({ T, school, onDone, onBack, useTimes, setUseTimes }) {
  const [classes, setClasses] = React.useState(() => [
    { id: 'c1', name: 'English 11',  start: '08:45', end: '09:55', color: CLASS_COLORS[0] },
    { id: 'c2', name: 'Pre-Calc 11', start: '10:00', end: '11:10', color: CLASS_COLORS[1] },
    { id: 'c3', name: 'Chemistry 11',start: '11:15', end: '12:25', color: CLASS_COLORS[2] },
    { id: 'c4', name: 'Socials 11',  start: '13:10', end: '14:20', color: CLASS_COLORS[3] },
  ]);
  const [editingId, setEditingId] = React.useState(null);

  const update = (id, patch) => setClasses(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  const remove = (id) => setClasses(cs => cs.filter(c => c.id !== id));
  const add = () => {
    const id = 'c' + (Date.now() % 100000);
    const color = CLASS_COLORS[classes.length % CLASS_COLORS.length];
    setClasses(cs => [...cs, { id, name: '', start: '13:00', end: '14:00', color }]);
    setEditingId(id);
  };

  return (
    <div style={{ padding: '54px 0 0', height: '100%', display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ padding: '0 24px 12px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 0,
          fontFamily: T.fBody, fontSize: 15, color: T.sub, cursor: 'pointer',
          marginBottom: 12,
        }}>← Back</button>
        <MicroLabel T={T}>Step 2 of 3 · {school?.name || 'Your school'}</MicroLabel>
        <SerifTitle T={T} size={34} style={{ marginTop: 4 }}>
          Your classes
        </SerifTitle>
        <div style={{ fontFamily: T.fBody, color: T.sub, fontSize: 14, marginTop: 6, lineHeight: 1.4 }}>
          Add them in the order they appear in your day. Tap one to edit.
        </div>
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          background: T.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
          border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
        }}>
          <div style={{ flex: 1, fontFamily: T.fBody, fontSize: 14, color: T.ink }}>
            My school's schedule changes daily
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>Skip times \u2014 just list classes.</div>
          </div>
          <button onClick={() => setUseTimes(!useTimes)} style={{
            width: 44, height: 26, borderRadius: 999, border: 'none',
            background: !useTimes ? T.accent : (T.dark ? 'rgba(255,255,255,0.15)' : 'rgba(28,25,23,0.15)'),
            position: 'relative', cursor: 'pointer', padding: 0, transition: 'background .15s',
          }}>
            <span style={{
              position: 'absolute', top: 3, left: !useTimes ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .15s',
            }} />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {classes.map((c, i) => (
            <ClassRow
              key={c.id} T={T} c={c} useTimes={useTimes} index={i + 1}
              editing={editingId === c.id}
              onEdit={() => setEditingId(editingId === c.id ? null : c.id)}
              onChange={(patch) => update(c.id, patch)}
              onRemove={() => remove(c.id)}
            />
          ))}
          <button onClick={add} style={{
            marginTop: 4, padding: '14px 16px', borderRadius: 14,
            background: 'transparent',
            border: `1px dashed ${T.dark ? 'rgba(255,255,255,0.18)' : 'rgba(28,25,23,0.22)'}`,
            color: T.sub, fontFamily: T.fBody, fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>+ Add a class</button>
        </div>
      </div>
      <div style={{ padding: '12px 24px 28px',
        borderTop: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(28,25,23,0.06)'}` }}>
        <PrimaryBtn T={T} onClick={() => onDone(classes)}>
          {classes.length} {classes.length === 1 ? 'class' : 'classes'} \u2014 continue
        </PrimaryBtn>
      </div>
    </div>
  );
}

function ClassRow({ T, c, useTimes, index, editing, onEdit, onChange, onRemove }) {
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.55)',
      border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
    }}>
      <div onClick={onEdit} style={{
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      }}>
        <div style={{
          width: 4, alignSelf: 'stretch', borderRadius: 2, background: c.color,
        }} />
        <div style={{
          fontFamily: T.fBody, fontSize: 12, color: T.soft, fontWeight: 600, minWidth: 18,
        }}>{index}</div>
        <input
          value={c.name} onChange={e => onChange({ name: e.target.value })}
          placeholder="Class name (e.g. English 11)"
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontFamily: T.fBody, fontSize: 15.5, color: T.ink, fontWeight: 500,
            padding: 0,
          }}
        />
        {useTimes && !editing && (
          <div style={{ fontFamily: T.fMono, fontSize: 12, color: T.sub }}>
            {c.start}–{c.end}
          </div>
        )}
      </div>
      {editing && (
        <div style={{
          padding: '4px 14px 14px 36px',
          borderTop: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(28,25,23,0.06)'}`,
        }}>
          {useTimes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <TimeField T={T} label="Start" value={c.start} onChange={v => onChange({ start: v })} />
              <span style={{ color: T.soft, fontFamily: T.fBody }}>→</span>
              <TimeField T={T} label="End" value={c.end} onChange={v => onChange({ end: v })} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.sub, marginRight: 4 }}>Color</div>
            {CLASS_COLORS.map(col => (
              <button key={col} onClick={() => onChange({ color: col })} style={{
                width: 22, height: 22, borderRadius: '50%', background: col,
                border: c.color === col ? `2px solid ${T.ink}` : '0.5px solid rgba(0,0,0,0.15)',
                cursor: 'pointer', padding: 0,
              }} />
            ))}
            <button onClick={onRemove} style={{
              marginLeft: 'auto', background: 'transparent', border: 'none',
              color: T.rose, fontFamily: T.fBody, fontSize: 13, cursor: 'pointer', padding: 4,
            }}>Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeField({ T, label, value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: T.fBody, fontSize: 10, color: T.soft, fontWeight: 600,
        letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</span>
      <input type="time" value={value} onChange={e => onChange(e.target.value)} style={{
        fontFamily: T.fMono, fontSize: 14, color: T.ink, background: 'transparent',
        border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.14)' : 'rgba(28,25,23,0.15)'}`,
        borderRadius: 8, padding: '6px 8px', width: 92, outline: 'none',
        colorScheme: T.dark ? 'dark' : 'light',
      }} />
    </label>
  );
}

// ─── Parent pair ──────────────────────────────────────────────────────
function ParentPairScreen({ T, code, onDone, onSkip, onBack }) {
  return (
    <div style={{ padding: '54px 24px 28px', height: '100%', display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box' }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', padding: 0,
        fontFamily: T.fBody, fontSize: 15, color: T.sub, cursor: 'pointer',
        marginBottom: 12, textAlign: 'left', alignSelf: 'flex-start',
      }}>← Back</button>
      <MicroLabel T={T}>Step 3 of 3 · Optional</MicroLabel>
      <SerifTitle T={T} size={34} style={{ marginTop: 4 }}>
        Pair with a parent?
      </SerifTitle>
      <div style={{ fontFamily: T.fBody, color: T.sub, fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
        They'll see your homework list and get a ping when stuff is added or done.
        You can also pair later from your profile.
      </div>
      <div style={{
        marginTop: 28, padding: '24px 20px', borderRadius: 22,
        background: T.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
        border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.1)' : 'rgba(28,25,23,0.1)'}`,
        textAlign: 'center',
      }}>
        <MicroLabel T={T}>Your pairing code</MicroLabel>
        <div style={{
          fontFamily: T.fMono, fontSize: 38, fontWeight: 500, letterSpacing: 4,
          color: T.ink, marginTop: 10,
        }}>{code}</div>
        <div style={{
          fontFamily: T.fHand, fontSize: 18, color: T.accent, transform: 'rotate(-1.5deg)',
          marginTop: 6,
        }}>show this to mom or dad ↑</div>
        <div style={{
          marginTop: 18, fontFamily: T.fBody, fontSize: 13, color: T.sub, lineHeight: 1.5,
        }}>
          They'll download the <b>Parent</b> app and tap "Pair with a kid", then enter this code.
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryBtn T={T} onClick={onDone}>Done — open my agenda</PrimaryBtn>
        <button onClick={onSkip} style={{
          background: 'transparent', border: 'none',
          color: T.sub, fontFamily: T.fBody, fontSize: 14,
          cursor: 'pointer', padding: 8,
        }}>Skip for now</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  AuthScreen, ResetPwdScreen, SchoolPickerScreen, ClassesScreen, ParentPairScreen,
});
