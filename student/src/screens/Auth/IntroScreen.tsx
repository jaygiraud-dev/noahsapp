import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, useWindowDimensions,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

// The intro always uses the app's default look, whatever vibe is saved later.
const C = {
  bg: '#0d0d0d', card: '#1c1c1c', cardHi: '#262626', edge: 'rgba(255,255,255,0.07)',
  ink: '#f5f0eb', sub: 'rgba(245,240,235,0.72)', soft: 'rgba(245,240,235,0.55)', dotOff: 'rgba(245,240,235,0.20)',
  coral: '#e8453a', orange: '#f5a623', step: '#f07a6f', mint: '#34d399', purple: '#a78bfa', cyan: '#06d6e0', amber: '#f0c040',
};
const F = {
  display: 'InstrumentSerif_400Regular_Italic', body: 'Inter_400Regular', medium: 'Inter_500Medium',
  semi: 'Inter_600SemiBold', mono: 'JetBrainsMono_400Regular', monoMed: 'JetBrainsMono_500Medium',
};

/** iPhone/iPad Safari that hasn't been saved to the Home Screen yet. */
export function shouldShowAddToHomeScreen(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV/.test(ua);
  const installed = (navigator as any).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
  return iOS && safari && !installed;
}

// ─── Small icons ─────────────────────────────────────────────────────────────

const Check = ({ color = C.mint, size = 20 }) => <Ionicons name="checkmark" size={size + 2} color={color} />;
const Lock = ({ size = 20 }) => <Ionicons name="lock-closed-outline" size={size} color={C.step} />;
const AppGlyph = ({ size = 32 }) => <Ionicons name="calendar-outline" size={size} color={C.bg} />;

// ─── Previews (a slice of the real app on each slide) ────────────────────────

const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => <View style={[s.card, style]}>{children}</View>;
const Mono = ({ children, style }: { children: React.ReactNode; style?: any }) => <Text style={[s.mono, style]}>{children}</Text>;

function ClassRow({ name, time, color, glyph, now }: { name: string; time: string; color: string; glyph: React.ReactNode; now?: boolean }) {
  return (
    <View style={s.row}>
      <View style={[s.circle, { backgroundColor: color + '33' }]}>{glyph}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.className}>{name}</Text>
        <Mono>{time}</Mono>
      </View>
      {now && <View style={[s.nowPill, { backgroundColor: color }]}><Text style={s.nowText}>NOW</Text></View>}
    </View>
  );
}

function PreviewWeek() {
  return (
    <Card>
      <Mono style={s.label}>TUESDAY · OCT 20</Mono>
      <ClassRow name="Science 9" time="9:15 – 10:25 · Block 1" color={C.cyan} now
        glyph={<Ionicons name="flask-outline" size={20} color={C.cyan} />} />
      <ClassRow name="Math 9" time="10:35 – 11:45 · Block 2" color={C.purple}
        glyph={<Ionicons name="calculator-outline" size={20} color={C.purple} />} />
      <View style={[s.chip, { backgroundColor: 'rgba(232,69,58,0.14)' }]}>
        <Ionicons name="time-outline" size={18} color={C.orange} />
        <Text style={s.chipText}>Soccer practice</Text>
        <Mono style={{ marginLeft: 'auto' }}>5 – 6 PM</Mono>
      </View>
    </Card>
  );
}

function PreviewHomework() {
  return (
    <View style={{ gap: 12 }}>
      <View style={s.alert}>
        <Ionicons name="notifications" size={22} color={C.bg} />
        <View style={{ flex: 1 }}>
          <Text style={[s.mono, { color: C.bg, fontFamily: F.monoMed, letterSpacing: 1.2 }]}>DUE TOMORROW</Text>
          <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.bg }}>Math quiz, chapter 3</Text>
        </View>
        <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.bg }}>Open</Text>
      </View>
      <Card>
        <View style={s.row}>
          <View style={[s.tick, { backgroundColor: C.mint, borderColor: C.mint }]}><Check color={C.bg} size={14} /></View>
          <Text style={[s.rowText, { color: C.soft, textDecorationLine: 'line-through' }]}>Worksheet 3.2</Text>
          <Mono style={{ color: C.amber, fontSize: 13 }}>+10 pts</Mono>
        </View>
        <View style={s.row}>
          <View style={[s.tick, { borderColor: C.orange }]} />
          <Text style={s.rowText}>Read chapter 5</Text>
          <Mono>Thu</Mono>
        </View>
        <View style={s.row}>
          <View style={[s.tick, { borderColor: C.purple }]} />
          <Text style={s.rowText}>Science lab write-up</Text>
          <View style={s.thumb}>
            <Ionicons name="camera-outline" size={18} color={'rgba(245,240,235,0.8)'} />
          </View>
        </View>
      </Card>
    </View>
  );
}

function PreviewSchool() {
  const days: [string, string[]][] = [['MON', [C.cyan, C.purple, C.amber, C.coral]], ['TUE', [C.amber, C.cyan, C.purple, C.coral]], ['WED', [C.purple, C.amber, C.cyan, C.coral]]];
  return (
    <Card>
      <View style={[s.row, { gap: 10 }]}>
        <Ionicons name="school-outline" size={18} color={C.purple} />
        <Mono style={[s.label, { color: 'rgba(245,240,235,0.65)' }]}>SUTHERLAND SECONDARY</Mono>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {days.map(([d, colors]) => (
          <View key={d} style={s.dayBox}>
            <Mono style={{ fontSize: 11, letterSpacing: 1 }}>{d}</Mono>
            {colors.map((c, i) => <View key={i} style={[s.bar, { backgroundColor: c }]} />)}
          </View>
        ))}
      </View>
      <View style={[s.chip, { backgroundColor: 'rgba(240,192,64,0.14)' }]}>
        <Ionicons name="calendar-outline" size={18} color={C.amber} />
        <Text style={s.chipText}>Fri Oct 23 · Pro-D Day</Text>
        <Mono style={{ marginLeft: 'auto', color: C.amber }}>NO SCHOOL</Mono>
      </View>
    </Card>
  );
}

function Avatar({ letter, colors }: { letter: string; colors: [string, string] }) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
      <Text style={{ fontFamily: F.display, fontSize: 20, color: C.bg }}>{letter}</Text>
    </LinearGradient>
  );
}

function PreviewSquad() {
  return (
    <View style={{ gap: 10 }}>
      <Card style={s.squadRow}>
        <Mono style={{ color: C.amber, fontSize: 13, width: 22 }}>#1</Mono>
        <Avatar letter="S" colors={[C.mint, C.cyan]} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.medium, fontSize: 16, color: C.ink }}>Sam</Text>
          <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.ink }}>Sent a photo</Text>
        </View>
        <View style={s.badge}><Text style={s.badgeText}>2</Text></View>
      </Card>
      <Card style={s.squadRow}>
        <Mono style={{ fontSize: 13, width: 22 }}>#2</Mono>
        <Avatar letter="Y" colors={[C.coral, C.orange]} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.medium, fontSize: 16, color: C.ink }}>You</Text>
          <Mono>340 pts · 4-day streak</Mono>
        </View>
      </Card>
      <View style={[s.bubble, s.bubbleTheirs]}><Text style={s.bubbleText}>did you finish the worksheet?</Text></View>
      <View style={[s.bubble, s.bubbleMine]}><Text style={[s.bubbleText, { color: C.bg, fontFamily: F.medium }]}>yep, 4-day streak 🔥</Text></View>
    </View>
  );
}

function SeesList({ label, rows }: { label?: string; rows: [boolean, string][] }) {
  return (
    <Card>
      {label && <Mono style={s.label}>{label}</Mono>}
      {rows.map(([ok, text], i) => (
        <React.Fragment key={text}>
          {i > 0 && rows[i - 1][0] && !ok && <View style={s.divider} />}
          <View style={s.row}>
            {ok ? <Check /> : <Lock />}
            <Text style={s.rowText}>{text}</Text>
          </View>
        </React.Fragment>
      ))}
    </Card>
  );
}

const PreviewParents = () => (
  <SeesList label="WHAT A PARENT SEES" rows={[
    [true, 'Your agenda: classes and plans you add'], [true, 'Homework you add, and if it’s done'],
    [false, 'Never your friends'], [false, 'Never your messages or photos'],
  ]} />
);

function PreviewHomeScreen() {
  const steps: [React.ReactNode, React.ReactNode][] = [
    [<Text key="t" style={s.stepText}>Tap <Text style={s.bold}>Share</Text> in Safari. On newer iPhones, tap <Text style={s.bold}>•••</Text> first.</Text>,
      <Ionicons name="share-outline" size={20} color={'#4da3ff'} />],
    [<Text key="t" style={s.stepText}>Scroll down and tap <Text style={s.bold}>Add to Home Screen</Text>.</Text>,
      <Ionicons name="add-circle-outline" size={20} color={C.ink} />],
    [<Text key="t" style={s.stepText}>Tap <Text style={s.bold}>Add</Text>. Then open it from your Home Screen.</Text>,
      <Text style={{ color: '#4da3ff', fontFamily: F.semi, fontSize: 15 }}>Add</Text>],
  ];
  return (
    <View style={{ gap: 12 }}>
      <Card style={[s.row, { gap: 16 }]}>
        <LinearGradient colors={[C.coral, C.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.appIcon}><AppGlyph /></LinearGradient>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>Opens like a real app</Text>
          <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: 'rgba(245,240,235,0.65)' }}>Full screen and one tap away.</Text>
        </View>
      </Card>
      {steps.map(([text, icon], i) => (
        <View key={i} style={s.stepRow}>
          <View style={s.stepNum}><Text style={{ fontFamily: F.semi, fontSize: 15, color: C.bg }}>{i + 1}</Text></View>
          <View style={{ flex: 1 }}>{text}</View>
          <View style={s.stepIcon}>{icon}</View>
        </View>
      ))}
    </View>
  );
}

function PreviewParentHomework() {
  const rows: [string, string, string, 'done' | 'open' | 'later'][] = [
    ['Worksheet 3.2 · Math', 'DONE', C.mint, 'done'], ['Lab write-up · Science', 'TODAY', C.orange, 'open'], ['Unit test · Math', 'MON', C.soft, 'later'],
  ];
  return (
    <Card>
      <View style={s.row}>
        <Avatar letter="N" colors={[C.coral, C.orange]} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>Noah</Text>
          <Mono>Due today: 1 of 2 done</Mono>
        </View>
      </View>
      <View style={s.divider} />
      {rows.map(([t, tag, color, kind]) => (
        <View key={t} style={s.row}>
          <View style={[s.tick, { width: 24, height: 24, borderColor: kind === 'later' ? 'rgba(245,240,235,0.35)' : color, backgroundColor: kind === 'done' ? C.mint : 'transparent' }]}>
            {kind === 'done' && <Check color={C.bg} size={13} />}
          </View>
          <Text style={[s.rowText, { fontSize: 15 }]}>{t}</Text>
          <Mono style={{ color }}>{tag}</Mono>
        </View>
      ))}
    </Card>
  );
}

function PreviewParentWeek() {
  const items: [string, string, string][] = [
    ['Science 9', '9:15', C.cyan], ['Math 9', '10:35', C.purple], ['Soccer practice', '5 PM', C.coral], ['Shift at work', 'Sat 10 AM', C.mint],
  ];
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row' }}>
        {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d) => (
          <Mono key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: d === 'TUE' ? C.step : C.soft }}>{d}</Mono>
        ))}
      </View>
      {items.map(([t, time, color]) => (
        <View key={t} style={[s.weekItem, { backgroundColor: color + '24' }]}>
          <View style={[s.weekBar, { backgroundColor: color }]} />
          <Text style={[s.rowText, { fontSize: 15 }]}>{t}</Text>
          <Mono style={{ color: 'rgba(245,240,235,0.65)' }}>{time}</Mono>
        </View>
      ))}
    </Card>
  );
}

function PreviewParentNudge() {
  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Mono style={s.label}>ACTIVITY</Mono>
        {[['finished', 'Worksheet 3.2', '4:12 PM', C.mint], ['added', 'Unit test, Mon', '3:40 PM', C.purple]].map(([verb, what, time, color]) => (
          <View key={what} style={[s.row, { alignItems: 'flex-start' }]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginTop: 7 }} />
            <View style={{ flex: 1 }}>
              <Text style={[s.rowText, { fontSize: 15 }]}>Noah {verb} <Text style={s.bold}>{what}</Text></Text>
              <Mono>{time}</Mono>
            </View>
          </View>
        ))}
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['Homework time?', 'Proud of you', 'Dinner at 6'].map((t, i) => (
          <View key={t} style={[s.nudgePill, i === 0 && { borderColor: 'rgba(245,166,35,0.6)', backgroundColor: 'rgba(245,166,35,0.14)' }]}>
            <Text style={{ fontFamily: i === 0 ? F.medium : F.body, fontSize: 14, color: C.ink }}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PreviewParentPrivacy() {
  return (
    <Card>
      <Mono style={s.label}>CONNECT WITH THEIR CODE</Mono>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {'K7MQ2P'.split('').map((ch, i) => (
          <View key={i} style={[s.codeBox, i === 5 && { backgroundColor: 'transparent', borderWidth: 2, borderColor: C.coral }]}>
            <Text style={{ fontFamily: F.mono, fontSize: 22, color: C.ink }}>{ch}</Text>
          </View>
        ))}
      </View>
      <View style={s.divider} />
      <View style={s.row}><Check /><Text style={[s.rowText, { fontSize: 15 }]}>Homework, classes and plans</Text></View>
      <View style={s.row}><Lock /><Text style={[s.rowText, { fontSize: 15 }]}>Not their friends, messages or photos</Text></View>
    </Card>
  );
}

// ─── Slides ──────────────────────────────────────────────────────────────────

interface Slide {
  key: string;
  title: string;
  note?: string;       // small orange line under the title
  body?: string;
  glow: string;
  Preview: () => JSX.Element;
  isHomeScreen?: boolean;
}

const HOME_SCREEN: Slide = { key: 'home', title: 'Save it to your Home Screen.', glow: 'rgba(232,69,58,0.26)', Preview: PreviewHomeScreen, isHomeScreen: true };

const KID_SLIDES: Slide[] = [
  { key: 'week', title: 'Your whole week, one screen.', body: 'Classes, homework and everything after school. Open it, see your day.', glow: 'rgba(232,69,58,0.30)', Preview: PreviewWeek },
  { key: 'hw', title: 'Never miss a due date.', body: 'Add homework in seconds, snap the whiteboard, get a heads-up. Tick it off for points.', glow: 'rgba(245,166,35,0.24)', Preview: PreviewHomework },
  { key: 'school', title: 'Made for your school.', body: 'Rotating blocks? Easy. Holidays and Pro-D days are already in your calendar.', glow: 'rgba(167,139,250,0.24)', Preview: PreviewSchool },
  { key: 'squad', title: 'Bring your squad.', body: 'Add friends with your code. Chat, send photos, race for points and streaks.', glow: 'rgba(52,211,153,0.20)', Preview: PreviewSquad },
  { key: 'parents', title: "Parents don't have to nag.", body: 'They only see your agenda and the homework you add. So less “did you do it yet?”', glow: 'rgba(6,214,224,0.20)', Preview: PreviewParents },
];

const PARENT_SLIDES: Slide[] = [
  { key: 'p-hw', title: 'See homework without asking.', body: "What's due, when, and whether it's done. Tap any item for the details.", glow: 'rgba(232,69,58,0.28)', Preview: PreviewParentHomework },
  { key: 'p-week', title: 'Their week at a glance.', body: 'Classes, practices, games and work shifts, by day or by week. No more guessing who needs a ride.', glow: 'rgba(167,139,250,0.24)', Preview: PreviewParentWeek },
  { key: 'p-nudge', title: 'A nudge, not a nag.', body: 'See progress as it happens. Need to step in? Send a quick nudge that pops up on their screen.', glow: 'rgba(245,166,35,0.24)', Preview: PreviewParentNudge },
  { key: 'p-privacy', title: 'Their privacy stays theirs.', body: 'Your teen shares a 6-letter code with you. You see school stuff, never their social life.', glow: 'rgba(6,214,224,0.20)', Preview: PreviewParentPrivacy },
];

type Stage = 'kid' | 'start' | 'parent';

/** The first screens after installing: what the app does, before making an account. */
export default function IntroScreen({ navigation }: any) {
  const setSeenIntro = useStore((st) => st.setSeenIntro);
  const { width, height } = useWindowDimensions();
  const pageW = Math.min(width, 560);
  const compact = height < 760;
  const [stage, setStage] = useState<Stage>('kid');
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const a2hs = useMemo(shouldShowAddToHomeScreen, []);

  const slides = stage === 'parent'
    ? [...PARENT_SLIDES, ...(a2hs ? [HOME_SCREEN] : [])]
    : [...KID_SLIDES, ...(a2hs ? [HOME_SCREEN] : [])];
  const last = index === slides.length - 1;

  function finish(params: { mode: 'signin' | 'signup'; accountType?: 'student' | 'parent' }) {
    navigation.replace('SignIn', params);
    setSeenIntro(true);
  }

  function goTo(i: number) {
    scrollRef.current?.scrollTo({ x: i * pageW, animated: true });
    setIndex(i);
  }

  function next() {
    if (!last) { goTo(index + 1); return; }
    if (stage === 'parent') finish({ mode: 'signup', accountType: 'parent' });
    else setStage('start');
  }

  function skip() {
    if (stage === 'parent') finish({ mode: 'signup', accountType: 'parent' });
    else setStage('start');
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageW);
    if (i !== index && i >= 0 && i < slides.length) setIndex(i);
  }

  if (stage === 'start') {
    return (
      <SafeAreaView style={s.safe}>
        <LinearGradient colors={['rgba(232,69,58,0.38)', 'rgba(245,166,35,0.08)', 'rgba(13,13,13,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.65 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={[s.startTop, { width: pageW, paddingTop: compact ? 60 : 130 }]}>
          <LinearGradient colors={[C.coral, C.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logo}><AppGlyph size={40} /></LinearGradient>
          <Text style={s.startTitle} accessibilityRole="header">my agenda</Text>
          <Text style={s.startBody}>Your school life, sorted. Takes about a minute to set up.</Text>
        </View>
        <View style={[s.bottom, { width: pageW, gap: 12 }]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => finish({ mode: 'signup', accountType: 'student' })} accessibilityRole="button">
            <LinearGradient colors={[C.coral, C.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}><Text style={s.ctaText}>I'm a student</Text></LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} style={s.secondary} onPress={() => { setIndex(0); setStage('parent'); }} accessibilityRole="button">
            <Text style={s.secondaryText}>I'm a parent</Text>
          </TouchableOpacity>
          <View style={s.loginRow}>
            <Text style={s.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => finish({ mode: 'signin' })} accessibilityRole="button" hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <Text style={s.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const current = slides[index];
  return (
    <SafeAreaView style={s.safe}>
      <LinearGradient key={current.key} colors={[current.glow, 'rgba(13,13,13,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={[s.top, { width: pageW }]}>
        <Text style={s.brand}>my agenda{stage === 'parent' && <Text style={s.parentTag}>  PARENT</Text>}</Text>
        {!(last && stage === 'parent') && (
          <TouchableOpacity onPress={skip} accessibilityRole="button" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.skip}>{current.isHomeScreen ? 'Later' : 'Skip'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        key={stage}
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={{ width: pageW, flex: 1 }}
      >
        {slides.map((sl, i) => (
          <ScrollView key={sl.key} style={{ width: pageW }} contentContainerStyle={[s.slide, compact && { paddingTop: 8 }]} showsVerticalScrollIndicator={false}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <sl.Preview />
            </View>
            <View style={[s.copy, compact && { paddingTop: 22 }]}>
              <Text style={s.step}>{i + 1} OF {slides.length}</Text>
              <Text style={[s.title, sl.isHomeScreen && { fontSize: 40, lineHeight: 42 }]} accessibilityRole="header">{sl.title}</Text>
              {sl.note && sl.key === 'parents' && <Text style={s.note}>{sl.note}</Text>}
              {sl.body && <Text style={s.body}>{sl.body}</Text>}
              {sl.note && sl.key !== 'parents' && <Text style={s.note}>{sl.note}</Text>}
            </View>
          </ScrollView>
        ))}
      </ScrollView>

      <View style={[s.bottom, { width: pageW }]}>
        <View style={s.dots} accessibilityLabel={`Page ${index + 1} of ${slides.length}`}>
          {slides.map((sl, i) => (
            <TouchableOpacity key={sl.key} onPress={() => goTo(i)} hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }} accessibilityLabel={`Go to page ${i + 1}`}>
              <View style={[s.dot, i === index && s.dotOn]} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={next} accessibilityRole="button">
          <LinearGradient colors={[C.coral, C.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
            <Text style={s.ctaText}>{current.isHomeScreen ? 'Got it' : last && stage === 'parent' ? 'Create parent account' : 'Next'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, minHeight: 56 },
  brand: { fontFamily: F.display, fontSize: 24, color: C.ink },
  parentTag: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1.4, color: C.orange },
  skip: { fontFamily: F.medium, fontSize: 16, color: C.sub, paddingVertical: 10 },
  slide: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  copy: { paddingTop: 34, gap: 12 },
  step: { fontFamily: F.mono, fontSize: 12, letterSpacing: 1.8, color: C.step },
  title: { fontFamily: F.display, fontSize: 44, lineHeight: 46, letterSpacing: -0.5, color: C.ink },
  note: { fontFamily: F.mono, fontSize: 13, letterSpacing: 0.4, color: C.orange },
  body: { fontFamily: F.body, fontSize: 17, lineHeight: 25, color: C.sub },
  bottom: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 8, gap: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.dotOff },
  dotOn: { width: 24, backgroundColor: C.coral },
  cta: { height: 56, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  ctaText: { fontFamily: F.semi, fontSize: 17, color: C.bg },
  secondary: { height: 56, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(245,240,235,0.22)', backgroundColor: C.card, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontFamily: F.medium, fontSize: 17, color: C.ink },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 6 },
  loginText: { fontFamily: F.body, fontSize: 15, color: 'rgba(245,240,235,0.65)' },
  loginLink: { fontFamily: F.semi, fontSize: 15, color: C.ink, textDecorationLine: 'underline', paddingVertical: 8 },
  startTop: { flex: 1, alignItems: 'center', paddingHorizontal: 28, gap: 18 },
  logo: { width: 84, height: 84, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  startTitle: { fontFamily: F.display, fontSize: 52, lineHeight: 56, color: C.ink, textAlign: 'center' },
  startBody: { fontFamily: F.body, fontSize: 18, lineHeight: 26, color: 'rgba(245,240,235,0.75)', textAlign: 'center', maxWidth: 300 },

  card: { backgroundColor: C.card, borderColor: C.edge, borderWidth: 1, borderRadius: 24, padding: 16, gap: 12 },
  mono: { fontFamily: F.mono, fontSize: 12, color: C.soft },
  label: { fontSize: 11, letterSpacing: 1.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, fontFamily: F.body, fontSize: 16, color: C.ink },
  bold: { fontFamily: F.semi },
  circle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  className: { fontFamily: F.display, fontSize: 21, color: C.ink },
  nowPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  nowText: { fontFamily: F.monoMed, fontSize: 11, letterSpacing: 1, color: C.bg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  chipText: { fontFamily: F.medium, fontSize: 15, color: C.ink },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.coral, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14 },
  tick: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  thumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#33475a', justifyContent: 'center', alignItems: 'center' },
  dayBox: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 6 },
  bar: { alignSelf: 'stretch', height: 8, borderRadius: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  squadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 14 },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: C.coral, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: F.semi, fontSize: 13, color: C.bg },
  bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: C.card, borderBottomLeftRadius: 6 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: C.coral, borderBottomRightRadius: 6 },
  bubbleText: { fontFamily: F.body, fontSize: 16, color: C.ink },
  divider: { height: 1, backgroundColor: C.edge },
  appIcon: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.coral, justifyContent: 'center', alignItems: 'center' },
  stepText: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.ink },
  stepIcon: { minWidth: 40, height: 40, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  weekItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  weekBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  nudgePill: { borderWidth: 1, borderColor: 'rgba(245,240,235,0.18)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  codeBox: { flex: 1, height: 48, borderRadius: 12, backgroundColor: C.cardHi, justifyContent: 'center', alignItems: 'center' },
});
