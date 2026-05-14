// today.jsx — Today view, Add Homework sheet, Add Event sheet, completion fx
// Twilight neon vibe — modern, fun, gamified.

// ─── Quote header ─────────────────────────────────────────────────────
function QuoteCard({ T, dateStr }) {
  const q = window.quoteOfDay(dateStr);
  return (
    <div style={{
      margin: '0 20px 14px', padding: '16px 18px 14px',
      borderRadius: 18, position: 'relative', overflow: 'hidden',
      background: T.isTwilight
        ? 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(236,72,153,0.06) 100%)'
        : T.surface,
      border: `1px solid ${T.isTwilight ? 'rgba(167,139,250,0.18)' : T.surfaceEdge}`,
    }}>
      {T.isTwilight && <Sparkles T={T} count={4} color={T.purple} />}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
      }}>
        <span style={{ fontSize: 11 }}>✨</span>
        <MicroLabel T={T} color={T.purple}>Daily fuel</MicroLabel>
      </div>
      <div style={{
        fontFamily: T.fDisplay, fontStyle: 'italic',
        fontSize: 20, lineHeight: 1.25, color: T.ink, letterSpacing: -0.2,
        position: 'relative', zIndex: 1,
      }}>“{q.t}”</div>
      <div style={{
        fontFamily: T.fBody, fontSize: 11.5, color: T.sub, marginTop: 6,
        letterSpacing: 0.2,
      }}>— {q.a}</div>
    </div>
  );
}

// ─── News ticker ─────────────────────────────────────────────────────
function NewsTicker({ T }) {
  const items = window.POSITIVE_NEWS;
  const loop = [...items, ...items];
  return (
    <div style={{
      margin: '0 0 16px', padding: '8px 0 10px',
      background: T.isTwilight
        ? 'linear-gradient(90deg, rgba(6,214,224,0.06), rgba(52,211,153,0.04))'
        : T.surface,
      borderTop: `1px solid ${T.isTwilight ? 'rgba(6,214,224,0.16)' : T.surfaceEdge}`,
      borderBottom: `1px solid ${T.isTwilight ? 'rgba(6,214,224,0.16)' : T.surfaceEdge}`,
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: 28, zIndex: 2,
        background: `linear-gradient(to right, ${T.bg}, transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: 28, zIndex: 2,
        background: `linear-gradient(to left, ${T.bg}, transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 4px' }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: T.mint,
          boxShadow: `0 0 0 4px ${T.mint}22, 0 0 10px ${T.mint}`,
          animation: 'pulse2 1.6s ease-in-out infinite',
        }} />
        <MicroLabel T={T} color={T.cyan}>Good things happening · live</MicroLabel>
      </div>
      <div style={{
        display: 'flex', gap: 30, whiteSpace: 'nowrap',
        animation: 'ticker 95s linear infinite', width: 'max-content',
      }}>
        {loop.map((n, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: T.fMono, fontSize: 10.5, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 1, color: T.cyan,
            }}>{n.src}</span>
            <span style={{ fontFamily: T.fBody, fontSize: 13.5, color: T.ink, letterSpacing: -0.1 }}>
              {n.text}
            </span>
            <span style={{ color: T.soft, marginLeft: 14 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Class block ─────────────────────────────────────────────────────
function ClassBlock({ T, cls, items, onAddHw, onToggleHw, useTimes, isNow }) {
  return (
    <div style={{
      margin: '0 16px 12px', padding: '14px 14px 12px',
      borderRadius: 20, position: 'relative',
      background: isNow
        ? (T.isTwilight
            ? `linear-gradient(135deg, ${cls.color}26, ${cls.color}10)`
            : T.surfaceHi)
        : T.surface,
      border: `1px solid ${isNow ? cls.color + '88' : T.surfaceEdge}`,
      boxShadow: isNow
        ? `0 0 0 1px ${cls.color}33, 0 0 28px ${cls.color}55`
        : 'none',
      transition: 'all 200ms',
    }}>
      {isNow && (
        <div style={{
          position: 'absolute', top: -9, right: 14,
          padding: '3px 9px', borderRadius: 999,
          background: cls.color, color: '#fff',
          fontFamily: T.fMono, fontSize: 9.5, fontWeight: 700,
          letterSpacing: 1.2, textTransform: 'uppercase',
          boxShadow: `0 0 14px ${cls.color}aa`,
        }}>● NOW</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: `linear-gradient(135deg, ${cls.color}, ${cls.color}aa)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: `0 4px 12px ${cls.color}66`,
        }}>{cls.emoji || cls.icon || '✏️'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.fDisplay, fontStyle: 'italic',
            fontSize: 22, color: T.ink, lineHeight: 1.05, letterSpacing: -0.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{cls.name}</div>
          {useTimes && (
            <div style={{
              fontFamily: T.fMono, fontSize: 10.5, color: T.sub, marginTop: 3, letterSpacing: 0.4,
            }}>{cls.start} – {cls.end}{cls.teacher ? ` · ${cls.teacher}` : ''}</div>
          )}
          {!useTimes && cls.teacher && (
            <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.sub, marginTop: 3 }}>
              {cls.teacher}
            </div>
          )}
        </div>
        <CircleBtn T={T} size={32} onClick={() => onAddHw(cls)} label="Add homework" tone="magenta">
          +
        </CircleBtn>
      </div>
      {items.length > 0 && (
        <div style={{ marginTop: 12, paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(hw => (
            <HwRow key={hw.id} T={T} hw={hw} onToggle={() => onToggleHw(hw.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function HwRow({ T, hw, onToggle }) {
  const done = hw.done;
  const tagInfo = window.HW_TAGS.find(t => t.label === hw.tag);
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'flex-start', gap: 11, padding: '7px 4px',
      cursor: 'pointer', borderRadius: 10,
      transition: 'background 120ms',
    }}>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
        width: 20, height: 20, borderRadius: 7, flexShrink: 0, marginTop: 1,
        border: `1.5px solid ${done ? T.accent : T.surfaceEdge}`,
        background: done ? T.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 200ms', padding: 0, cursor: 'pointer',
        boxShadow: done ? `0 0 12px ${T.accent}66` : 'none',
      }}>
        {done && (
          <svg width="13" height="13" viewBox="0 0 12 12">
            <path d="M2 6.5L4.8 9 10 3.5" stroke="#fff" strokeWidth="2.2"
              fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.fBody, fontSize: 14.5, color: T.ink, letterSpacing: -0.1,
          textDecoration: done ? 'line-through' : 'none',
          textDecorationColor: done ? T.accent : undefined,
          opacity: done ? 0.5 : 1,
        }}>{hw.title}</div>
        {(hw.tag || hw.due) && (
          <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            {hw.tag && (
              <span style={{
                fontFamily: T.fBody, fontSize: 10.5, fontWeight: 500, letterSpacing: 0.1,
                padding: '2px 8px', borderRadius: 999,
                background: tagInfo
                  ? (T[tagInfo.tone] || T.magenta) + '20'
                  : T.surface,
                color: tagInfo ? (T[tagInfo.tone] || T.magenta) : T.sub,
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                {tagInfo?.icon && <span>{tagInfo.icon}</span>}
                {hw.tag}
              </span>
            )}
            {hw.due && (
              <span style={{
                fontFamily: T.fMono, fontSize: 10.5, color: hw.dueUrgent ? T.red : T.sub,
                letterSpacing: 0.3, fontWeight: hw.dueUrgent ? 600 : 400,
              }}>
                {hw.dueUrgent && '⚠ '}{hw.due}
              </span>
            )}
            {hw.points && done && (
              <span style={{
                fontFamily: T.fMono, fontSize: 10.5, fontWeight: 700, color: T.accent,
                letterSpacing: 0.4,
              }}>+{hw.points}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Event block ──────────────────────────────────────────────────
function EventBlock({ T, ev, onToggle }) {
  const evInfo = window.EVENT_TYPES.find(e => e.label === ev.kind);
  const tone = evInfo ? T[evInfo.tone] : T.cyan;
  return (
    <div onClick={onToggle} style={{
      margin: '0 16px 10px', padding: '12px 14px',
      borderRadius: 16, cursor: 'pointer',
      background: T.surface,
      border: `1px solid ${T.surfaceEdge}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
        background: `${tone}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17,
        boxShadow: `0 0 14px ${tone}33`,
      }}>{ev.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: T.fBody, fontSize: 14.5, fontWeight: 500, color: T.ink,
          letterSpacing: -0.1, textDecoration: ev.done ? 'line-through' : 'none',
          opacity: ev.done ? 0.5 : 1,
        }}>{ev.title}</div>
        <div style={{ fontFamily: T.fMono, fontSize: 10.5, color: T.sub, marginTop: 2, letterSpacing: 0.4 }}>
          {ev.kind.toUpperCase()} · {ev.time}
        </div>
      </div>
    </div>
  );
}

// ─── Today screen ─────────────────────────────────────────────────────
function TodayScreen({ T, classes, hw, events, useTimes, onAddHw, onAddEv, onToggleHw, onToggleEv, points, streak, onNav }) {
  const byClass = React.useMemo(() => {
    const m = {};
    hw.forEach(h => { (m[h.classId] = m[h.classId] || []).push(h); });
    return m;
  }, [hw]);

  const nowHHMM = '11:30';
  const inNow = (c) => useTimes && c.start <= nowHHMM && nowHHMM <= c.end;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: '54px 20px 8px', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <MicroLabel T={T}>Wed · May 13</MicroLabel>
            <SerifTitle T={T} size={46} style={{ marginTop: 2, lineHeight: 0.95 }}>
              today
            </SerifTitle>
          </div>
          <PointsChip T={T} points={points} streak={streak} onClick={() => onNav('profile')} />
        </div>

        <QuoteCard T={T} dateStr="2026-05-13" />
        <NewsTicker T={T} />

        {/* Class blocks */}
        <div style={{ paddingTop: 4 }}>
          {classes.map(c => (
            <ClassBlock
              key={c.id} T={T} cls={c}
              items={byClass[c.id] || []}
              useTimes={useTimes}
              isNow={inNow(c)}
              onAddHw={onAddHw}
              onToggleHw={onToggleHw}
            />
          ))}
        </div>

        {/* Events */}
        <div style={{ marginTop: 18 }}>
          <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <MicroLabel T={T}>After school</MicroLabel>
            <div style={{ flex: 1, height: 1, background: T.line }} />
            <button onClick={() => onAddEv()} style={{
              background: 'transparent', border: 'none', padding: 0,
              fontFamily: T.fMono, fontSize: 11, fontWeight: 600, color: T.magenta,
              cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase',
            }}>+ Event</button>
          </div>
          {events.length === 0 ? (
            <div style={{
              margin: '0 16px', padding: '18px 16px',
              borderRadius: 14, textAlign: 'center',
              border: `1px dashed ${T.surfaceEdge}`,
              fontFamily: T.fHand, fontSize: 22, color: T.soft,
            }}>nothing else today —</div>
          ) : events.map(ev => (
            <EventBlock key={ev.id} T={T} ev={ev} onToggle={() => onToggleEv(ev.id)} />
          ))}
        </div>
      </div>

      <BottomNav T={T} onNav={onNav} active="today" />
    </div>
  );
}

function PointsChip({ T, points, streak, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 13px 6px 6px',
      borderRadius: 999, border: `1px solid ${T.magenta}66`,
      background: T.isTwilight
        ? 'linear-gradient(95deg, rgba(167,139,250,0.18), rgba(236,72,153,0.18))'
        : T.surface,
      cursor: 'pointer', position: 'relative',
      boxShadow: T.isTwilight ? `0 0 16px ${T.magenta}33` : 'none',
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: '50%',
        background: T.accentGrad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fBody, fontSize: 12, fontWeight: 700, color: '#fff',
        boxShadow: `0 0 14px ${T.magenta}99`,
      }}>🔥{streak}</span>
      <span style={{
        fontFamily: T.fMono, fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: 0.2,
      }}>{points.toLocaleString()} pts</span>
    </button>
  );
}

function BottomNav({ T, onNav, active }) {
  const items = [
    { id: 'today',   label: 'Today',   icon: '◐' },
    { id: 'week',    label: 'Week',    icon: '▦' },
    { id: 'friends', label: 'Squad',   icon: '◍' },
    { id: 'profile', label: 'Me',      icon: '●' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 32, paddingTop: 10,
      background: T.isTwilight
        ? 'linear-gradient(to bottom, transparent, rgba(12,8,32,0.92) 40%, rgba(12,8,32,1) 100%)'
        : `linear-gradient(to bottom, transparent, ${T.bg} 40%, ${T.bg} 100%)`,
      backdropFilter: 'blur(12px)',
      display: 'flex', justifyContent: 'space-around',
    }}>
      {items.map(it => (
        <button key={it.id} onClick={() => onNav(it.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 12px',
          color: active === it.id ? T.ink : T.soft,
        }}>
          <span style={{
            fontSize: 18, lineHeight: 1,
            color: active === it.id ? T.magenta : T.soft,
            filter: active === it.id ? `drop-shadow(0 0 8px ${T.magenta})` : 'none',
          }}>{it.icon}</span>
          <span style={{ fontFamily: T.fBody, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3 }}>
            {it.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Add Homework Sheet ───────────────────────────────────────────────
function AddHomeworkSheet({ T, classes, classId, onClose, onSave }) {
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [cid, setCid] = React.useState(classId || classes[0]?.id);
  const [tag, setTag] = React.useState('assignment');
  const [due, setDue] = React.useState('tomorrow');
  const [reminder, setReminder] = React.useState('afterdinner');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [cameraFlash, setCameraFlash] = React.useState(false);

  const cls = classes.find(c => c.id === cid) || classes[0];
  const tagInfo = window.HW_TAGS.find(t => t.id === tag);

  const handleMic = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setTitle(t => t || 'Read pages 88–102 + answer questions');
    }, 1500);
  };

  const handleCam = () => {
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 240);
    setTimeout(() => {
      setTitle(t => t || 'Lab writeup');
      setNotes(n => n || 'page 124 — full procedure + analysis');
    }, 260);
  };

  return (
    <Sheet T={T} onClose={onClose} title="Add homework">
      {cameraFlash && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fff', zIndex: 200,
          animation: 'flash 240ms ease-out forwards', pointerEvents: 'none',
        }} />
      )}

      {/* Class chip */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 11px 6px 7px', borderRadius: 999,
          background: `${cls.color}1f`,
          border: `1px solid ${cls.color}66`,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 7,
            background: `linear-gradient(135deg, ${cls.color}, ${cls.color}aa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11,
          }}>{cls.emoji || '📚'}</span>
          <span style={{
            fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
            color: cls.color, textTransform: 'uppercase',
          }}>Class</span>
          <select value={cid} onChange={e => setCid(e.target.value)} style={{
            border: 'none', background: 'transparent', outline: 'none',
            fontFamily: T.fBody, fontSize: 14, fontWeight: 500, color: T.ink,
            appearance: 'none', WebkitAppearance: 'none', paddingRight: 4,
          }}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Tag pills */}
      <PillSection T={T} title="Tag this entry as">
        {window.HW_TAGS.map(t => (
          <Pill key={t.id} T={T} active={tag === t.id} tone={t.tone}
                icon={t.icon}
                onClick={() => setTag(t.id)}>
            {t.label}
          </Pill>
        ))}
      </PillSection>

      {/* Title input with glow */}
      <div style={{ padding: '14px 20px 4px' }}>
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: T.isTwilight ? 'rgba(255,255,255,0.03)' : T.surfaceHi,
          border: `1.5px solid ${tagInfo ? T[tagInfo.tone] : T.magenta}`,
          boxShadow: T.isTwilight
            ? `0 0 0 3px ${tagInfo ? T[tagInfo.tone] : T.magenta}22, 0 0 24px ${tagInfo ? T[tagInfo.tone] : T.magenta}44`
            : 'none',
        }}>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="What's the assignment?"
            autoFocus
            style={{
              width: '100%', border: 'none', background: 'transparent', outline: 'none',
              fontFamily: T.fBody, fontSize: 16, color: T.ink, fontWeight: 500,
              padding: 0, lineHeight: 1.3,
            }}
          />
        </div>
      </div>

      {/* Notes section */}
      <div style={{ padding: '14px 20px 4px' }}>
        <MicroLabel T={T} style={{ marginBottom: 9 }}>Notes</MicroLabel>
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: T.surface,
          border: `1px solid ${T.surfaceEdge}`,
        }}>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Add details, page numbers… tap 🎙 to dictate or 📷 to snap the whiteboard"
            rows={2}
            style={{
              width: '100%', border: 'none', background: 'transparent', outline: 'none',
              fontFamily: T.fBody, fontSize: 14, color: T.ink,
              padding: 0, resize: 'none', lineHeight: 1.4,
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <CaptureBtn T={T} active={recording} tone="magenta"
                        icon="🎙" label="Dictate" onClick={handleMic} pulse={recording} />
            <CaptureBtn T={T} tone="cyan"
                        icon="📷" label="Whiteboard" onClick={handleCam} />
          </div>
        </div>
      </div>

      {/* Due */}
      <PillSection T={T} title="Due">
        {window.DUE_OPTIONS.map(d => (
          <Pill key={d.id} T={T} active={due === d.id} tone="magenta"
                onClick={() => { setDue(d.id); if (d.id === 'pick') setShowDatePicker(true); }}>
            {d.label}
          </Pill>
        ))}
      </PillSection>

      {showDatePicker && (
        <div style={{ padding: '0 20px 12px' }}>
          <DayPicker T={T} onPick={() => setShowDatePicker(false)} />
        </div>
      )}

      {/* Reminder */}
      <PillSection T={T} title="Remind me">
        {window.REMINDER_OPTIONS.map(r => (
          <Pill key={r.id} T={T} active={reminder === r.id} tone="cyan" onClick={() => setReminder(r.id)}>
            {r.label}
          </Pill>
        ))}
        <Pill T={T} onClick={() => setReminder(null)} active={reminder === null} tone="cyan">
          None
        </Pill>
      </PillSection>

      <div style={{ padding: '14px 20px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryBtn T={T} disabled={!title.trim()}
          onClick={() => onSave({
            classId: cid, title: title.trim(), notes: notes.trim(),
            tag: tagInfo?.label,
            due: window.DUE_OPTIONS.find(d => d.id === due)?.label,
            dueUrgent: due === 'today',
            reminder, points: 10,
          })}>
          ✨ Save assignment
        </PrimaryBtn>
        <GhostBtn T={T} onClick={onClose}>Cancel</GhostBtn>
      </div>
    </Sheet>
  );
}

function CaptureBtn({ T, icon, label, onClick, tone = 'magenta', active, pulse }) {
  const color = T[tone] || T.magenta;
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 12px', borderRadius: 11,
      background: active ? `${color}22` : T.surface,
      border: `1px solid ${active ? color : color + '66'}`,
      color: T.ink, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center',
      fontFamily: T.fBody, fontSize: 13, fontWeight: 500,
      boxShadow: active ? `0 0 0 3px ${color}22, 0 0 18px ${color}66` : 'none',
      position: 'relative',
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
      {pulse && (
        <span style={{
          position: 'absolute', right: 8, width: 6, height: 6, borderRadius: '50%',
          background: color, boxShadow: `0 0 8px ${color}`,
          animation: 'pulse2 0.8s ease-in-out infinite',
        }} />
      )}
    </button>
  );
}

function PillSection({ T, title, children }) {
  return (
    <div style={{ padding: '14px 20px 4px' }}>
      <MicroLabel T={T} style={{ marginBottom: 9 }}>{title}</MicroLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{children}</div>
    </div>
  );
}

function DayPicker({ T, onPick }) {
  const days = [];
  const start = new Date('2026-05-13');
  for (let i = 0; i < 14; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    days.push({
      wd: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
      n: d.getDate(),
      mon: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()],
    });
  }
  const [pick, setPick] = React.useState(2);
  return (
    <div style={{
      borderRadius: 14, padding: '10px',
      background: T.surface,
      border: `1px solid ${T.surfaceEdge}`,
      overflowX: 'auto',
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {days.map((d, i) => (
          <button key={i} onClick={() => { setPick(i); onPick && onPick(d); }} style={{
            flexShrink: 0, width: 48, padding: '8px 0', borderRadius: 11,
            background: i === pick ? T.accentGrad : 'transparent',
            color: i === pick ? '#fff' : T.ink,
            border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            fontFamily: T.fBody,
            boxShadow: i === pick && T.isTwilight ? `0 0 14px ${T.magenta}66` : 'none',
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75, letterSpacing: 0.5 }}>{d.wd}</span>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{d.n}</span>
            <span style={{ fontSize: 9, opacity: 0.65, letterSpacing: 0.5 }}>{d.mon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Add Event Sheet ──────────────────────────────────────────────────
function AddEventSheet({ T, onClose, onSave }) {
  const [title, setTitle] = React.useState('');
  const [kind, setKind] = React.useState('practice');
  const [when, setWhen] = React.useState('today');
  const [time, setTime] = React.useState('4:00 pm');
  const [reminder, setReminder] = React.useState('afterschool');
  const evInfo = window.EVENT_TYPES.find(e => e.id === kind);

  return (
    <Sheet T={T} onClose={onClose} title="Add event">
      <PillSection T={T} title="Type">
        {window.EVENT_TYPES.map(e => (
          <Pill key={e.id} T={T} active={kind === e.id} tone={e.tone}
                icon={e.icon} onClick={() => setKind(e.id)}>
            {e.label}
          </Pill>
        ))}
      </PillSection>

      <div style={{ padding: '14px 20px 4px' }}>
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: T.isTwilight ? 'rgba(255,255,255,0.03)' : T.surfaceHi,
          border: `1.5px solid ${T[evInfo.tone]}`,
          boxShadow: T.isTwilight
            ? `0 0 0 3px ${T[evInfo.tone]}22, 0 0 22px ${T[evInfo.tone]}44`
            : 'none',
        }}>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Volleyball at school gym"
            autoFocus
            style={{
              width: '100%', border: 'none', background: 'transparent', outline: 'none',
              fontFamily: T.fBody, fontSize: 16, color: T.ink, fontWeight: 500, padding: 0,
            }}
          />
        </div>
      </div>

      <PillSection T={T} title="When">
        {window.DUE_OPTIONS.map(d => (
          <Pill key={d.id} T={T} active={when === d.id} tone="magenta" onClick={() => setWhen(d.id)}>
            {d.label}
          </Pill>
        ))}
      </PillSection>

      <PillSection T={T} title="Time">
        {['7:30 am','12:00 pm','2:00 pm','3:30 pm','4:00 pm','6:00 pm','7:30 pm','All day'].map(tm => (
          <Pill key={tm} T={T} active={time === tm} tone="purple" onClick={() => setTime(tm)}>{tm}</Pill>
        ))}
      </PillSection>

      <PillSection T={T} title="Remind me">
        {[
          { id: 'now',  label: 'Right now' },
          { id: 'morningof', label: 'Morning of' },
          { id: 'afterschool', label: '30 min before' },
          { id: 'no', label: 'No reminder' },
        ].map(r => (
          <Pill key={r.id} T={T} active={reminder === r.id} tone="cyan" onClick={() => setReminder(r.id)}>
            {r.label}
          </Pill>
        ))}
      </PillSection>

      <div style={{ padding: '14px 20px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryBtn T={T} disabled={!title.trim()}
          onClick={() => onSave({
            title: title.trim(),
            kind: evInfo.label,
            icon: evInfo.icon,
            time, when, reminder,
          })}>
          ✨ Save event
        </PrimaryBtn>
        <GhostBtn T={T} onClick={onClose}>Cancel</GhostBtn>
      </div>
    </Sheet>
  );
}

// ─── Bottom sheet shell ───────────────────────────────────────────────
function Sheet({ T, onClose, title, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 150,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: T.overlay,
        backdropFilter: 'blur(4px)',
        animation: 'fade 200ms ease-out',
      }} />
      <div style={{
        position: 'relative', zIndex: 2,
        background: T.isTwilight
          ? 'linear-gradient(180deg, #14102b 0%, #0c0820 100%)'
          : T.bg,
        borderRadius: '28px 28px 0 0',
        maxHeight: '94%',
        boxShadow: T.isTwilight
          ? `0 -8px 60px rgba(167,139,250,0.25), 0 -1px 0 ${T.magenta}66`
          : '0 -10px 40px rgba(0,0,0,0.4)',
        border: T.isTwilight ? `1px solid ${T.magenta}55` : 'none',
        borderBottom: 'none',
        animation: 'slideUp 320ms cubic-bezier(.2,.7,.4,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 20px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            width: 40, height: 4, borderRadius: 2, background: T.line,
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          }} />
          <SerifTitle T={T} size={30} style={{ marginTop: 8 }}>{title}</SerifTitle>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: '50%', border: `1px solid ${T.surfaceEdge}`, marginTop: 8,
            background: T.surface, color: T.sub, fontSize: 14, cursor: 'pointer',
          }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Reward overlay — juicy ──────────────────────────────────────────
function RewardOverlay({ T, points, streak, onDone }) {
  React.useEffect(() => {
    const id = setTimeout(onDone, 1700);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 220, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <Confetti T={T} intensity={T.reward} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: 'pop 1000ms cubic-bezier(.2,.7,.4,1)',
        position: 'relative',
      }}>
        <div style={{
          fontFamily: T.fDisplay, fontStyle: 'italic',
          fontSize: 88,
          background: T.accentGrad,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1, letterSpacing: -2,
          filter: T.isTwilight ? `drop-shadow(0 0 30px ${T.magenta}aa)` : 'none',
        }}>+{points}</div>
        <div style={{
          fontFamily: T.fHand, fontSize: 32, color: T.ink,
          marginTop: 4, transform: 'rotate(-2deg)',
          textShadow: T.isTwilight ? `0 0 12px ${T.magenta}66` : 'none',
        }}>🔥 {streak}-day streak</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TodayScreen, AddHomeworkSheet, AddEventSheet, BottomNav, RewardOverlay,
});
