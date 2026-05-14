// parent.jsx — Parent app: pair screen, dashboard, notifications timeline
// Exposes: ParentApp

function ParentApp({ T, code, kidName, kidPoints, kidStreak, hw, classes, events, notifications }) {
  const [view, setView] = React.useState('pair'); // pair | dash | notif
  const [paired, setPaired] = React.useState(false);
  const [entry, setEntry] = React.useState('');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: paired ? 100 : 0 }}>
        {!paired && (
          <ParentPair T={T} entry={entry} setEntry={setEntry} code={code}
                      onPair={() => { setPaired(true); setView('dash'); }} />
        )}
        {paired && view === 'dash' && <ParentDash T={T} kidName={kidName} kidPoints={kidPoints} kidStreak={kidStreak} hw={hw} classes={classes} events={events} />}
        {paired && view === 'notif' && <ParentNotif T={T} kidName={kidName} notifications={notifications} />}
      </div>
      {paired && <ParentNav T={T} active={view} onNav={setView} />}
    </div>
  );
}

function ParentPair({ T, entry, setEntry, code, onPair }) {
  // Pretend user is the parent — the kid's actual code is `code` from app state
  const cleaned = entry.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 6);
  const filled = cleaned.split('');
  while (filled.length < 6) filled.push('');
  return (
    <div style={{ padding: '54px 24px 28px', height: '100%', display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ fontFamily: T.fHand, fontSize: 24, color: T.accent, transform: 'rotate(-2deg)' }}>
        for parents
      </div>
      <SerifTitle T={T} size={36} style={{ marginTop: 4 }}>Pair with your kid</SerifTitle>
      <div style={{ fontFamily: T.fBody, fontSize: 14, color: T.sub, marginTop: 8, lineHeight: 1.5 }}>
        Ask them to open <b>Me</b> in their agenda app and read you their 6-character code.
      </div>
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 6 }}>
        {filled.map((ch, i) => (
          <div key={i} style={{
            width: 40, height: 56, borderRadius: 10,
            background: T.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
            border: `1px solid ${cleaned.length === i
              ? T.accent
              : (T.dark ? 'rgba(255,255,255,0.12)' : 'rgba(28,25,23,0.12)')}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fMono, fontSize: 26, fontWeight: 500, color: T.ink,
          }}>{ch}</div>
        ))}
      </div>

      <KeypadInline T={T} value={entry} onChange={setEntry} />

      <div style={{ marginTop: 'auto' }}>
        <button onClick={() => setEntry(code)} style={{
          width: '100%', padding: '10px', background: 'transparent', border: 'none',
          fontFamily: T.fBody, fontSize: 13, color: T.accentDk, cursor: 'pointer',
        }}>Demo: paste {code}</button>
        <PrimaryBtn T={T} onClick={onPair} disabled={cleaned.length < 6}>
          Pair
        </PrimaryBtn>
      </div>
    </div>
  );
}

function KeypadInline({ T, value, onChange }) {
  const keys = ['1','2','3','4','5','6','7','8','9','A','0','⌫'];
  const press = (k) => {
    if (k === '⌫') onChange(value.slice(0, -1));
    else if (value.length < 6) onChange((value + k).toUpperCase());
  };
  return (
    <div style={{
      marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
    }}>
      {keys.map(k => (
        <button key={k} onClick={() => press(k)} style={{
          padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
          background: T.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
          fontFamily: T.fDisplay, fontSize: 24, color: T.ink,
        }}>{k}</button>
      ))}
    </div>
  );
}

function ParentDash({ T, kidName, kidPoints, kidStreak, hw, classes, events }) {
  const active = hw.filter(h => !h.done);
  const completed = hw.filter(h => h.done);
  const classOf = (id) => classes.find(c => c.id === id);

  return (
    <div>
      <div style={{ padding: '54px 20px 8px' }}>
        <MicroLabel T={T}>Wed · May 13</MicroLabel>
        <SerifTitle T={T} size={36} style={{ marginTop: 2 }}>{kidName}'s day</SerifTitle>
      </div>

      {/* Summary card */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{
          padding: 18, borderRadius: 18,
          background: T.dark ? 'rgba(216,160,74,0.10)' : 'rgba(217,119,6,0.06)',
          border: `0.5px solid ${T.accent}55`,
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: T.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fBody, fontSize: 20, fontWeight: 600, color: '#fff',
          }}>{kidName[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.sub }}>This week</div>
            <div style={{ display: 'flex', gap: 18, marginTop: 4, alignItems: 'baseline' }}>
              <div>
                <span style={{ fontFamily: T.fDisplay, fontSize: 26, color: T.ink, lineHeight: 1 }}>
                  {completed.length}
                </span>
                <span style={{ fontFamily: T.fBody, fontSize: 12, color: T.sub, marginLeft: 4 }}>done</span>
              </div>
              <div>
                <span style={{ fontFamily: T.fDisplay, fontSize: 26, color: T.ink, lineHeight: 1 }}>
                  {active.length}
                </span>
                <span style={{ fontFamily: T.fBody, fontSize: 12, color: T.sub, marginLeft: 4 }}>open</span>
              </div>
              <div>
                <span style={{ fontFamily: T.fDisplay, fontSize: 26, color: T.accentDk, lineHeight: 1 }}>
                  {kidStreak}d
                </span>
                <span style={{ fontFamily: T.fBody, fontSize: 12, color: T.sub, marginLeft: 4 }}>streak</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today */}
      <div style={{ padding: '4px 24px 8px' }}>
        <MicroLabel T={T}>Open homework</MicroLabel>
      </div>
      <div style={{
        margin: '0 16px 16px', borderRadius: 16, overflow: 'hidden',
        background: T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)',
        border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
      }}>
        {active.length === 0 ? (
          <div style={{ padding: 18, textAlign: 'center', fontFamily: T.fHand, fontSize: 20, color: T.soft }}>
            All clear today ✓
          </div>
        ) : active.map((h, i) => {
          const c = classOf(h.classId);
          return (
            <div key={h.id} style={{
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderTop: i === 0 ? 'none' : `0.5px solid ${T.dark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.05)'}`,
            }}>
              <div style={{ width: 4, height: 28, borderRadius: 2, background: c?.color || T.accent }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.fBody, fontSize: 15, color: T.ink, letterSpacing: -0.1 }}>{h.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.sub }}>{c?.name}</span>
                  {h.tag && <span style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.sub }}>· {h.tag}</span>}
                  {h.due && <span style={{ fontFamily: T.fBody, fontSize: 11.5, color: h.dueUrgent ? T.rose : T.sub }}>
                    · {h.dueUrgent && '⚠ '}{h.due}
                  </span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '4px 24px 8px' }}>
        <MicroLabel T={T}>Completed today</MicroLabel>
      </div>
      <div style={{
        margin: '0 16px 16px', borderRadius: 16, overflow: 'hidden',
        background: T.dark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.45)',
        border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(28,25,23,0.06)'}`,
      }}>
        {completed.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', fontFamily: T.fBody, fontSize: 13, color: T.sub }}>
            Nothing checked off yet.
          </div>
        ) : completed.map((h, i) => {
          const c = classOf(h.classId);
          return (
            <div key={h.id} style={{
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderTop: i === 0 ? 'none' : `0.5px solid ${T.dark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.05)'}`,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5, background: T.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6.5L4.8 9 10 3.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: T.fBody, fontSize: 14, color: T.ink, opacity: 0.55,
                  textDecoration: 'line-through', textDecorationColor: T.accent,
                }}>{h.title}</div>
                <div style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.sub, marginTop: 2 }}>
                  {c?.name}
                </div>
              </div>
              <span style={{ fontFamily: T.fBody, fontSize: 11.5, fontWeight: 700, color: T.accent }}>+{h.points || 10}</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '4px 24px 8px' }}>
        <MicroLabel T={T}>After school</MicroLabel>
      </div>
      <div style={{
        margin: '0 16px 24px', borderRadius: 16, overflow: 'hidden',
        background: T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)',
        border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
      }}>
        {events.length === 0 ? (
          <div style={{ padding: 14, textAlign: 'center', fontFamily: T.fBody, fontSize: 13, color: T.sub }}>
            No events.
          </div>
        ) : events.map((e, i) => (
          <div key={e.id} style={{
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
            borderTop: i === 0 ? 'none' : `0.5px solid ${T.dark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.05)'}`,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: T.dark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.fBody, fontSize: 14, color: T.accent, fontWeight: 600,
            }}>{e.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fBody, fontSize: 14.5, color: T.ink, fontWeight: 500 }}>{e.title}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.sub, marginTop: 2 }}>{e.kind} · {e.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParentNotif({ T, kidName, notifications }) {
  const fallback = [
    { type: 'done', who: kidName, what: 'Vocab quiz — chapter 5', cls: 'English 11', when: '11:42 am', clr: '#ec4899' },
    { type: 'add',  who: kidName, what: 'Lab writeup — page 124', cls: 'Chemistry 11', when: '11:18 am', clr: '#06d6e0' },
    { type: 'event', who: kidName, what: 'Volleyball at school gym, 3:30pm', when: '10:55 am' },
  ];
  const items = (notifications && notifications.length ? notifications : fallback);
  const labelOf = {
    done: 'Marked done',
    add:  'Added',
    event: 'Added event',
    streak: 'Streak update',
  };
  return (
    <div>
      <div style={{ padding: '54px 20px 16px' }}>
        <MicroLabel T={T}>Activity</MicroLabel>
        <SerifTitle T={T} size={36} style={{ marginTop: 2 }}>Notifications</SerifTitle>
      </div>
      <div style={{ padding: '0 16px 24px', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 30, top: 8, bottom: 8, width: 1,
          background: T.dark ? 'rgba(255,255,255,0.1)' : 'rgba(28,25,23,0.1)',
        }} />
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: '10px 0', position: 'relative',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: it.type === 'done' ? T.accent
                : it.type === 'streak' ? T.green
                : it.clr || T.slate,
              border: `3px solid ${T.paper}`, marginLeft: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.fBody, fontSize: 12, fontWeight: 700, color: '#fff', zIndex: 1,
            }}>{it.type === 'done' ? '✓' : it.type === 'add' ? '+' : it.type === 'streak' ? '★' : '◆'}</div>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: 14,
              background: T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)',
              border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontFamily: T.fBody, fontSize: 11.5, fontWeight: 600,
                  letterSpacing: 0.4, textTransform: 'uppercase', color: T.sub }}>{labelOf[it.type]}</div>
                <div style={{ fontFamily: T.fBody, fontSize: 11, color: T.soft }}>{it.when}</div>
              </div>
              <div style={{ fontFamily: T.fBody, fontSize: 14.5, color: T.ink, marginTop: 3, letterSpacing: -0.1 }}>
                {it.what}
              </div>
              {it.cls && (
                <div style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.sub, marginTop: 2 }}>
                  {it.cls}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParentNav({ T, active, onNav }) {
  const items = [
    { id: 'dash',  label: 'Today',         icon: '◐' },
    { id: 'notif', label: 'Activity',      icon: '◍' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 32, paddingTop: 8,
      background: T.dark
        ? 'linear-gradient(to bottom, rgba(26,24,21,0) 0%, rgba(26,24,21,0.85) 30%, rgba(26,24,21,0.95) 100%)'
        : 'linear-gradient(to bottom, rgba(243,238,227,0) 0%, rgba(243,238,227,0.9) 30%, rgba(243,238,227,1) 100%)',
      backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'space-around',
    }}>
      {items.map(it => (
        <button key={it.id} onClick={() => onNav(it.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 24px',
          color: active === it.id ? T.ink : T.soft,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1, color: active === it.id ? T.accent : T.soft }}>
            {it.icon}
          </span>
          <span style={{ fontFamily: T.fBody, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3 }}>
            {it.label}
          </span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { ParentApp });
