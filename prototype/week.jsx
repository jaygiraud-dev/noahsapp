// week.jsx — landscape Week view (paper agenda spread)
// Exposes: WeekScreen

function WeekScreen({ T, classes, hw, events, onAddHw, onToggleHw, onRotateBack }) {
  // Render a "two-page spread" — Mon-Wed left, Thu-Sun right, with the
  // class column down the left side. Like an opened paper agenda.
  const days = [
    { id: 'mon', wd: 'Mon', n: 11 },
    { id: 'tue', wd: 'Tue', n: 12 },
    { id: 'wed', wd: 'Wed', n: 13, today: true },
    { id: 'thu', wd: 'Thu', n: 14 },
    { id: 'fri', wd: 'Fri', n: 15 },
    { id: 'sat', wd: 'Sat', n: 16, weekend: true },
    { id: 'sun', wd: 'Sun', n: 17, weekend: true },
  ];

  // Build sample homework distribution per day per class
  const grid = React.useMemo(() => {
    const g = {};
    classes.forEach(c => { g[c.id] = {}; days.forEach(d => g[c.id][d.id] = []); });
    // place visible items on Wed (today), some on Thu/Fri/Tue
    hw.forEach((h, i) => {
      const dayId = ['wed','thu','fri','tue','wed','mon'][i % 6];
      if (g[h.classId]) g[h.classId][dayId].push(h);
    });
    // add some sample placeholders for variety
    const samples = [
      { classId: classes[0]?.id, day: 'mon', title: 'Read ch. 7', tag: 'Reading', done: true },
      { classId: classes[1]?.id, day: 'tue', title: 'Worksheet 3.2', tag: 'Worksheet', done: true },
      { classId: classes[2]?.id, day: 'thu', title: 'Lab report due', tag: 'Lab' },
      { classId: classes[3]?.id, day: 'fri', title: 'Essay outline', tag: 'Essay' },
      { classId: classes[0]?.id, day: 'thu', title: 'Vocab quiz', tag: 'Quiz' },
      { classId: classes[1]?.id, day: 'fri', title: 'Test ch. 1–3', tag: 'Test' },
    ];
    samples.forEach((s, i) => {
      if (s.classId && g[s.classId]) {
        g[s.classId][s.day].push({ ...s, id: 'w' + i });
      }
    });
    return g;
  }, [classes, hw]);

  return (
    <div style={{
      width: '100%', height: '100%',
      ...paperBg(T),
      display: 'flex', flexDirection: 'column',
      fontFamily: T.fBody, color: T.ink, overflow: 'hidden', position: 'relative',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 14,
        padding: '14px 24px 8px',
        borderBottom: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
      }}>
        <SerifTitle T={T} size={28}>May 11–17</SerifTitle>
        <div style={{ fontFamily: T.fHand, fontSize: 18, color: T.accent, transform: 'rotate(-1.5deg)' }}>
          this week
        </div>
        <div style={{ flex: 1 }} />
        <MicroLabel T={T}>Week 19</MicroLabel>
        <button onClick={onRotateBack} style={{
          padding: '6px 12px', borderRadius: 999, border: 'none',
          background: T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.06)',
          color: T.ink, fontFamily: T.fBody, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>↻ Portrait</button>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Class column */}
        <div style={{
          width: 130, flexShrink: 0, borderRight: `0.5px solid ${T.line}`,
          paddingTop: 38, display: 'flex', flexDirection: 'column',
        }}>
          {classes.map(c => (
            <div key={c.id} style={{
              flex: 1, padding: '8px 10px 8px 14px',
              borderBottom: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.05)'}`,
              display: 'flex', alignItems: 'flex-start', gap: 8,
              minHeight: 0,
            }}>
              <div style={{
                width: 4, alignSelf: 'stretch', borderRadius: 2, background: c.color, flexShrink: 0,
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: T.fDisplay, fontSize: 16, color: T.ink, lineHeight: 1.1, letterSpacing: -0.1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{c.name}</div>
                <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.sub, marginTop: 2, letterSpacing: 0.3 }}>
                  {c.start}–{c.end}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          {days.map(d => (
            <div key={d.id} style={{
              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
              borderRight: `0.5px solid ${T.line}`,
              background: d.today
                ? (T.dark ? 'rgba(216,160,74,0.06)' : 'rgba(217,119,6,0.05)')
                : (d.weekend
                    ? (T.dark ? 'rgba(255,255,255,0.015)' : 'rgba(28,25,23,0.015)')
                    : 'transparent'),
            }}>
              {/* Header */}
              <div style={{
                padding: '10px 8px 6px', textAlign: 'center',
                borderBottom: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
              }}>
                <div style={{
                  fontFamily: T.fBody, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.2,
                  color: d.today ? T.accent : T.sub, textTransform: 'uppercase',
                }}>{d.wd}</div>
                <div style={{
                  fontFamily: T.fDisplay, fontSize: 22, color: d.today ? T.accent : T.ink,
                  lineHeight: 1, marginTop: 2, fontWeight: d.today ? 600 : 400,
                }}>{d.n}</div>
              </div>
              {/* Cells per class */}
              {classes.map(c => {
                const items = grid[c.id]?.[d.id] || [];
                return (
                  <div key={c.id} onClick={() => onAddHw && onAddHw(c)} style={{
                    flex: 1, padding: 6, position: 'relative', cursor: 'pointer',
                    borderBottom: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.05)'}`,
                    minHeight: 0, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', gap: 3,
                  }}>
                    {items.slice(0, 3).map(h => (
                      <WeekHwChip key={h.id} T={T} hw={h} classColor={c.color}
                                  onToggle={() => onToggleHw && onToggleHw(h.id)} />
                    ))}
                    {items.length > 3 && (
                      <div style={{
                        fontFamily: T.fBody, fontSize: 10, color: T.sub, padding: '0 4px',
                      }}>+{items.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom band: events strip per day */}
      <div style={{
        display: 'flex', borderTop: `0.5px solid ${T.line}`,
        background: T.dark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)',
      }}>
        <div style={{
          width: 130, flexShrink: 0, padding: '10px 14px',
          borderRight: `0.5px solid ${T.line}`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <MicroLabel T={T}>Other</MicroLabel>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          {days.map(d => {
            const dayEvs = sampleEventsForDay(d.id, events);
            return (
              <div key={d.id} style={{
                flex: 1, padding: '8px 6px', minWidth: 0,
                borderRight: `0.5px solid ${T.line}`,
                display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                {dayEvs.map((ev, i) => (
                  <div key={i} style={{
                    fontFamily: T.fBody, fontSize: 10.5, color: T.ink, letterSpacing: -0.1,
                    padding: '3px 6px', borderRadius: 6,
                    background: T.dark ? 'rgba(255,255,255,0.04)' : 'rgba(28,25,23,0.04)',
                    display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.2,
                    overflow: 'hidden',
                  }}>
                    <span style={{ color: T.accent, fontSize: 10 }}>{ev.icon}</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ev.title}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function sampleEventsForDay(dayId, events) {
  // Today's events show on Wed
  if (dayId === 'wed') return events;
  const m = {
    mon: [{ icon: '▲', title: 'Volleyball 3pm' }],
    tue: [{ icon: '$',  title: 'Work 4–8pm' }],
    thu: [{ icon: '▲', title: 'Volleyball' }],
    fri: [{ icon: '◆', title: 'Game @ Kits' }, { icon: '★', title: 'Movie w/ Maya' }],
    sat: [{ icon: '$',  title: 'Work 11–5' }],
    sun: [{ icon: '+', title: 'Dentist 2pm' }],
  };
  return m[dayId] || [];
}

function WeekHwChip({ T, hw, classColor, onToggle }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }} style={{
      fontFamily: T.fBody, fontSize: 10.5, color: T.ink, letterSpacing: -0.1,
      padding: '3px 6px 3px 5px', borderRadius: 6,
      background: hw.done
        ? (T.dark ? 'rgba(255,255,255,0.025)' : 'rgba(28,25,23,0.03)')
        : (T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)'),
      borderLeft: `2px solid ${classColor}`,
      display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.2,
      opacity: hw.done ? 0.55 : 1,
      textDecoration: hw.done ? 'line-through' : 'none',
      textDecorationColor: hw.done ? T.accent : undefined,
      overflow: 'hidden',
    }}>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {hw.title}
      </span>
    </div>
  );
}

Object.assign(window, { WeekScreen });
