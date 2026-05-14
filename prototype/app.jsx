// app.jsx — main App: state, scene routing, tweaks, device frame, scene jumper
// Loaded as the final script

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "vibe": "twilight",
  "dark": true,
  "showTimes": true,
  "reward": "playful"
}/*EDITMODE-END*/;

const STARTING_HW = [
  { id: 'h1', classId: 'c1', title: 'Read Romeo & Juliet Act 2',  tag: 'Reading',     due: 'Tomorrow', points: 10, done: false },
  { id: 'h2', classId: 'c1', title: 'Vocab quiz — chapter 5',     tag: 'Quiz',        due: 'Today',     dueUrgent: true,  points: 15, done: false },
  { id: 'h3', classId: 'c2', title: 'Worksheet 3.2 — derivatives',tag: 'Worksheet',   due: 'Tomorrow', points: 10, done: false },
  { id: 'h4', classId: 'c3', title: 'Lab writeup — page 124',     tag: 'Lab',         due: 'Fri',       points: 15, done: false },
  { id: 'h5', classId: 'c4', title: 'Read pages 88–102',          tag: 'Reading',     due: 'Mon',       points: 10, done: true },
];

const STARTING_EVENTS = [
  { id: 'e1', title: 'Volleyball practice', icon: '▲', kind: 'Practice', time: '3:30 pm', done: false },
  { id: 'e2', title: 'Work shift at Earnest', icon: '$', kind: 'Work', time: '5:00 – 8:00 pm', done: false },
];

// Pairing code (fake)
const KID_CODE = '7K4M2D';

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const T = React.useMemo(() => makeTheme(tweaks), [tweaks]);

  // Which app are we showing in the device — student or parent
  const [persona, setPersona] = React.useState('student'); // student | parent

  // Onboarding state
  const [scene, setScene] = React.useState('auth');
  // scenes: auth, reset, school, classes, parentPair, today, week, friends, profile
  const [authMode, setAuthMode] = React.useState('signin');
  const [school, setSchool] = React.useState({ city: 'Vancouver', name: 'Eric Hamber Secondary' });
  const [useTimes, setUseTimes] = React.useState(true);
  const [classes, setClasses] = React.useState(window.SAMPLE_CLASSES);
  const [parentPaired, setParentPaired] = React.useState(false);
  const [landscape, setLandscape] = React.useState(false);
  const [openChat, setOpenChat] = React.useState(false);

  // Homework + events live state
  const [hw, setHw] = React.useState(STARTING_HW);
  const [events, setEvents] = React.useState(STARTING_EVENTS);
  const [points, setPoints] = React.useState(1840);
  const [streak, setStreak] = React.useState(12);

  // Parent notifications feed — student actions append here
  const [notifications, setNotifications] = React.useState([
    { type: 'streak', who: 'Alex', what: 'Hit a 12-day streak 🔥', when: 'Yesterday 7:30 pm' },
    { type: 'done',  who: 'Alex', what: 'Read pages 88–102',          cls: 'Socials 11',  when: 'Yesterday 8:14 pm', clr: '#fbbf24' },
    { type: 'add',   who: 'Alex', what: 'Essay outline due Friday',   cls: 'English 11',  when: 'Yesterday 4:02 pm', clr: '#ec4899' },
    { type: 'done',  who: 'Alex', what: 'Worksheet 3.2',              cls: 'Pre-Calc 11', when: 'Mon 9:10 pm',      clr: '#a78bfa' },
  ]);
  const pushNotif = (n) => setNotifications(prev => [{ ...n, when: 'just now' }, ...prev]);

  // Modals
  const [showAddHw, setShowAddHw] = React.useState(null); // null or classId
  const [showAddEv, setShowAddEv] = React.useState(false);
  const [reward, setReward] = React.useState(null);

  // Handlers ─────────────────────────────────────────────────────────
  const classNameById = (id) => classes.find(c => c.id === id)?.name || '';
  const classColorById = (id) => classes.find(c => c.id === id)?.color || '#ec4899';

  const toggleHw = (id) => {
    setHw(prev => prev.map(h => {
      if (h.id !== id) return h;
      const next = { ...h, done: !h.done };
      if (next.done && !h.done) {
        const p = h.points || 10;
        setPoints(x => x + p);
        setReward({ points: p, streak });
        pushNotif({ type: 'done', who: 'Alex', what: h.title,
                    cls: classNameById(h.classId), clr: classColorById(h.classId) });
      } else if (!next.done && h.done) {
        setPoints(x => x - (h.points || 10));
      }
      return next;
    }));
  };

  const toggleEv = (id) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e));
  };

  const addHw = (data) => {
    const id = 'h' + Date.now();
    setHw(prev => [...prev, { ...data, id, done: false }]);
    setShowAddHw(null);
    setPoints(p => p + 5);
    setReward({ points: 5, streak });
    pushNotif({ type: 'add', who: 'Alex', what: data.title,
                cls: classNameById(data.classId), clr: classColorById(data.classId) });
  };

  const addEvent = (data) => {
    const id = 'e' + Date.now();
    setEvents(prev => [...prev, { ...data, id, done: false }]);
    setShowAddEv(false);
    pushNotif({ type: 'event', who: 'Alex', what: `${data.title} · ${data.time}` });
  };

  // Auto-enter Today after onboarding completes
  const goToday = () => setScene('today');

  // Device size — landscape swaps w/h
  const deviceW = landscape ? 874 : 402;
  const deviceH = landscape ? 402 : 874;

  // Scene jumper buttons (outside the phone, for nav between flow points)
  const scenes = [
    { id: 'auth',      label: 'Sign in' },
    { id: 'school',    label: 'School' },
    { id: 'classes',   label: 'Classes' },
    { id: 'parentPair',label: 'Pair' },
    { id: 'today',     label: 'Today' },
    { id: 'week',      label: 'Week ↻' },
    { id: 'friends',   label: 'Friends' },
    { id: 'profile',   label: 'Me' },
  ];

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: T.vibe === 'twilight'
        ? 'radial-gradient(ellipse 60% 40% at 20% 0%, rgba(167,139,250,0.18), transparent 70%), radial-gradient(ellipse 50% 40% at 80% 30%, rgba(236,72,153,0.14), transparent 70%), #0a061a'
        : (T.dark ? 'linear-gradient(135deg, #0a0a0a 0%, #14110d 100%)'
                  : 'linear-gradient(135deg, #ece4d2 0%, #efe8d6 100%)'),
      padding: '40px 24px 80px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      fontFamily: T.fBody, color: T.ink,
    }}>
      <Header T={T} persona={persona} setPersona={setPersona} />

      {/* Scene jumper */}
      {persona === 'student' && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
          maxWidth: 720,
        }}>
          {scenes.map(s => {
            const isWeek = s.id === 'week';
            const active = isWeek
              ? scene === 'today' && landscape
              : scene === s.id && !landscape;
            return (
              <button key={s.id} onClick={() => {
                if (isWeek) { setScene('today'); setLandscape(true); return; }
                setScene(s.id); setLandscape(false);
              }} style={{
                padding: '6px 13px', borderRadius: 999,
                background: active ? T.accentGrad : T.surface,
                color: active ? '#fff' : T.ink,
                border: `1px solid ${active ? 'transparent' : T.surfaceEdge}`,
                fontSize: 12, fontWeight: 600, fontFamily: T.fBody, cursor: 'pointer',
                letterSpacing: -0.1,
                boxShadow: active && T.isTwilight ? `0 0 14px ${T.magenta}66` : 'none',
              }}>{s.label}</button>
            );
          })}
        </div>
      )}

      {/* The phone */}
      <div style={{
        transition: 'all 350ms cubic-bezier(.4,.1,.2,1)',
        transformOrigin: 'center',
      }}>
        <Phone
          T={T} width={deviceW} height={deviceH} dark={T.dark}
          landscape={landscape}
        >
          {persona === 'student' ? (
            <StudentApp
              T={T} scene={scene} setScene={setScene}
              authMode={authMode} setAuthMode={setAuthMode}
              school={school} setSchool={setSchool}
              useTimes={useTimes} setUseTimes={setUseTimes}
              classes={classes} setClasses={setClasses}
              hw={hw} events={events}
              points={points} streak={streak}
              showAddHw={showAddHw} setShowAddHw={setShowAddHw}
              showAddEv={showAddEv} setShowAddEv={setShowAddEv}
              addHw={addHw} addEvent={addEvent}
              toggleHw={toggleHw} toggleEv={toggleEv}
              code={KID_CODE} parentPaired={parentPaired}
              setParentPaired={setParentPaired}
              reward={reward} clearReward={() => setReward(null)}
              landscape={landscape} setLandscape={setLandscape}
              openChat={openChat} setOpenChat={setOpenChat}
              tweaks={tweaks} setTweak={setTweak}
            />
          ) : (
            <ParentApp
              T={T} code={KID_CODE}
              kidName="Alex" kidPoints={points} kidStreak={streak}
              hw={hw} classes={classes} events={events}
              notifications={notifications}
            />
          )}
        </Phone>
      </div>

      <Caption T={T} />

      <TweaksPanel>
        <TweakSection label="Vibe">
          <TweakRadio label="Look & feel" value={tweaks.vibe}
            options={[
              { value: 'twilight', label: 'Twilight' },
              { value: 'paper',    label: 'Paper' },
              { value: 'mono',     label: 'Mono' },
            ]}
            onChange={(v) => setTweak('vibe', v)} />
          {tweaks.vibe !== 'twilight' && (
            <TweakToggle label="Dark mode" value={tweaks.dark}
              onChange={(v) => setTweak('dark', v)} />
          )}
        </TweakSection>
        <TweakSection label="Day">
          <TweakToggle label="Show class times" value={tweaks.showTimes}
            onChange={(v) => setTweak('showTimes', v)} />
        </TweakSection>
        <TweakSection label="Reward">
          <TweakRadio label="Intensity" value={tweaks.reward}
            options={[
              { value: 'subtle',  label: 'Subtle' },
              { value: 'mid',     label: 'Mid' },
              { value: 'playful', label: 'Playful' },
            ]}
            onChange={(v) => setTweak('reward', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// Top header outside the phone
function Header({ T, persona, setPersona }) {
  return (
    <div style={{
      width: '100%', maxWidth: 760,
      display: 'flex', alignItems: 'flex-end', gap: 20, justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <div style={{
            fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 400,
            fontSize: 48, color: T.ink, lineHeight: 0.9, letterSpacing: -1.2,
            background: T.isTwilight ? T.accentGrad : 'none',
            WebkitBackgroundClip: T.isTwilight ? 'text' : 'unset',
            WebkitTextFillColor: T.isTwilight ? 'transparent' : 'inherit',
            backgroundClip: T.isTwilight ? 'text' : 'unset',
          }}>plan</div>
          <div style={{
            fontFamily: T.fDisplay, fontStyle: 'italic',
            fontSize: 48, color: T.magenta, lineHeight: 0.9,
            filter: T.isTwilight ? `drop-shadow(0 0 12px ${T.magenta}99)` : 'none',
          }}>.</div>
        </div>
        <div style={{
          fontFamily: T.fBody, fontSize: 13, color: T.sub, marginTop: 6, letterSpacing: -0.1,
        }}>
          The agenda that doesn't feel like homework.
        </div>
      </div>
      <div style={{
        display: 'flex', padding: 3, borderRadius: 999, gap: 2,
        background: T.surface, border: `1px solid ${T.surfaceEdge}`,
      }}>
        {[
          { id: 'student', label: 'Student' },
          { id: 'parent',  label: 'Parent' },
        ].map(p => (
          <button key={p.id} onClick={() => setPersona(p.id)} style={{
            padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: persona === p.id ? T.accentGrad : 'transparent',
            color: persona === p.id ? '#fff' : T.sub,
            fontFamily: T.fBody, fontSize: 12.5, fontWeight: 600,
            boxShadow: persona === p.id && T.isTwilight ? `0 0 14px ${T.magenta}66` : 'none',
          }}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}

function Caption({ T }) {
  return (
    <div style={{
      maxWidth: 620, marginTop: 8, padding: '14px 18px',
      borderRadius: 16, fontFamily: T.fBody, fontSize: 12.5, color: T.sub,
      background: T.surface, border: `1px solid ${T.surfaceEdge}`,
      lineHeight: 1.6,
    }}>
      <b style={{ color: T.ink }}>✨ How to use this prototype</b>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        <li>Tap the pills above the phone to jump through the flow.</li>
        <li>From Today, tap a <b>+</b> on any class to log homework (🎤 dictate, 📷 snap the whiteboard, or type — then one-tap pillboxes for tag, due date, and reminder).</li>
        <li>Check off any homework to get points + a confetti burst 🎉</li>
        <li>Tap <b>Week ↻</b> for the landscape spread.</li>
        <li>Switch to <b>Parent</b> at the top to see the pairing flow + dashboard.</li>
        <li>Open <b>Tweaks</b> in the toolbar to change vibe, reward intensity, etc.</li>
      </ul>
    </div>
  );
}

// Phone wrapper — wraps IOSDevice but with a paper-styled background painted onto the inner area
function Phone({ T, width, height, dark, children, landscape }) {
  return (
    <div style={{
      width, height, borderRadius: 48, overflow: 'hidden', position: 'relative',
      background: dark ? '#000' : '#1a1a1a',
      boxShadow: T.isTwilight
        ? `0 40px 100px rgba(0,0,0,0.5), 0 0 80px ${T.magenta}33, 0 0 0 1px rgba(0,0,0,0.5)`
        : '0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.12)',
      transition: 'width 350ms cubic-bezier(.4,.1,.2,1), height 350ms cubic-bezier(.4,.1,.2,1)',
    }}>
      {/* Inner paper canvas */}
      <div style={{
        position: 'absolute', inset: 4, borderRadius: 44, overflow: 'hidden',
        ...paperBg(T),
      }}>
        {/* Status bar */}
        {!landscape && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
            <IOSStatusBar dark={dark} />
          </div>
        )}
        {landscape && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 28, zIndex: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 30px', fontFamily: '-apple-system', fontSize: 13, fontWeight: 600,
            color: dark ? '#fff' : '#000',
          }}>
            <span>9:41</span>
            <span style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.2 }}>● ● ●</span>
          </div>
        )}
        {/* Dynamic island */}
        {!landscape && (
          <div style={{
            position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
            width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 40,
          }} />
        )}
        {landscape && (
          <div style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            width: 37, height: 126, borderRadius: 24, background: '#000', zIndex: 40,
          }} />
        )}
        {/* Content */}
        <div style={{
          position: 'absolute', inset: 0,
          paddingLeft: landscape ? 32 : 0,
          paddingRight: landscape ? 32 : 0,
          boxSizing: 'border-box',
        }}>
          {children}
        </div>
        {/* Home indicator */}
        <div style={{
          position: 'absolute',
          bottom: landscape ? '50%' : 8,
          left: landscape ? 'auto' : '50%',
          right: landscape ? 6 : 'auto',
          transform: landscape ? 'translateY(50%) rotate(90deg)' : 'translateX(-50%)',
          width: landscape ? 5 : 139, height: landscape ? 139 : 5,
          borderRadius: 100, background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)',
          zIndex: 60, pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

// Student app router
function StudentApp(props) {
  const {
    T, scene, setScene, authMode, setAuthMode,
    school, setSchool, useTimes, setUseTimes, classes, setClasses,
    hw, events, points, streak, code,
    showAddHw, setShowAddHw, showAddEv, setShowAddEv,
    addHw, addEvent, toggleHw, toggleEv,
    parentPaired, setParentPaired,
    reward, clearReward, landscape, setLandscape,
    openChat, setOpenChat,
  } = props;

  // Sub-render based on scene
  let body;
  if (scene === 'auth') {
    body = <AuthScreen T={T} mode={authMode} setMode={setAuthMode}
                       onContinue={() => setScene('school')}
                       onReset={() => setScene('reset')} />;
  } else if (scene === 'reset') {
    body = <ResetPwdScreen T={T} onBack={() => setScene('auth')}
                           onDone={() => setScene('auth')} />;
  } else if (scene === 'school') {
    body = <SchoolPickerScreen T={T} onBack={() => setScene('auth')}
                               onPick={(s) => { setSchool(s); setScene('classes'); }} />;
  } else if (scene === 'classes') {
    body = <ClassesScreen T={T} school={school}
                          useTimes={useTimes} setUseTimes={setUseTimes}
                          onBack={() => setScene('school')}
                          onDone={(cs) => { setClasses(cs.filter(c => c.name.trim())); setScene('parentPair'); }} />;
  } else if (scene === 'parentPair') {
    body = <ParentPairScreen T={T} code={code}
                             onBack={() => setScene('classes')}
                             onDone={() => { setParentPaired(true); setScene('today'); }}
                             onSkip={() => setScene('today')} />;
  } else if (scene === 'today' && landscape) {
    body = <WeekScreen T={T} classes={classes} hw={hw} events={events}
                       onRotateBack={() => setLandscape(false)}
                       onAddHw={(c) => setShowAddHw(c.id)}
                       onToggleHw={toggleHw} />;
  } else if (scene === 'today') {
    body = <TodayScreen T={T} classes={classes} hw={hw} events={events}
                        useTimes={useTimes}
                        onAddHw={(c) => setShowAddHw(c.id)}
                        onAddEv={() => setShowAddEv(true)}
                        onToggleHw={toggleHw} onToggleEv={toggleEv}
                        points={points} streak={streak}
                        onNav={(t) => {
                          if (t === 'week') setLandscape(true);
                          else if (t === 'today') { setScene('today'); setLandscape(false); }
                          else setScene(t);
                        }} />;
  } else if (scene === 'friends') {
    body = <SocialScreen T={T} openChat={openChat} setOpenChat={setOpenChat}
                         onNav={(t) => {
                           if (t === 'week') setLandscape(true);
                           else setScene(t);
                         }} />;
  } else if (scene === 'profile') {
    body = <ProfileScreen T={T} school={school} code={code}
                          points={points} streak={streak}
                          parentPaired={parentPaired}
                          tweaks={props.tweaks} setTweak={props.setTweak}
                          onSignOut={() => setScene('auth')}
                          onNav={(t) => {
                            if (t === 'week') setLandscape(true);
                            else setScene(t);
                          }} />;
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {body}
      {showAddHw && (
        <AddHomeworkSheet T={T} classes={classes} classId={showAddHw}
                          onClose={() => setShowAddHw(null)}
                          onSave={addHw} />
      )}
      {showAddEv && (
        <AddEventSheet T={T}
                       onClose={() => setShowAddEv(false)}
                       onSave={addEvent} />
      )}
      {reward && (
        <RewardOverlay T={T} points={reward.points} streak={reward.streak} onDone={clearReward} />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
