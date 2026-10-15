import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { T, PILLARS, PILLAR_KEYS, Pillar } from '../theme';
import { QUESTS } from '../data/quests';
import Backdrop from '../components/Backdrop';
import Sparkle from '../components/Sparkle';
import { tap, pop } from '../haptics';

const VALUE_CARDS = [
  { plain: 'Save your', em: 'Progress', sub: 'Every quest, every day — written into a save file that is yours.', tint: '#FF8A3D' },
  { plain: 'Watch yourself', em: 'Grow', sub: 'Four stats that move in real time as you live. Growth you can finally see.', tint: '#FF49B0' },
  { plain: 'A better', em: 'You', sub: 'Not a chore list. An identity you build, one honest action at a time.', tint: '#FF4D5E' },
  { plain: 'Like a', em: 'Videogame', sub: 'Sparks, streaks, levels, boss fights — except the game is your actual life.', tint: '#F5C04A' },
];

const STUCK = ['Screen addiction', 'No motivation', 'Stuck in a rut', 'Post-breakup / reset', 'Just want more'];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const finish = useStore((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [valueIdx, setValueIdx] = useState(0);
  const [name, setName] = useState('');
  const [focus, setFocus] = useState<Pillar[]>([]);
  const [stuck, setStuck] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(1)).current;

  const transition = (fn: () => void) => {
    Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    });
  };

  const next = () => {
    tap();
    transition(() => setStep((s) => s + 1));
  };

  const advanceValue = () => {
    tap();
    if (valueIdx < VALUE_CARDS.length - 1) transition(() => setValueIdx((i) => i + 1));
    else transition(() => setStep((s) => s + 1));
  };

  const toggleFocus = (p: Pillar) => {
    pop();
    setFocus((f) => (f.includes(p) ? f.filter((x) => x !== p) : f.length >= 3 ? f : [...f, p]));
  };

  // First suggested quest from the chosen focus.
  const firstQuest =
    QUESTS.find((q) => focus.length && Object.keys(q.stats).some((p) => focus.includes(p as Pillar)) && q.difficulty !== 'epic') ??
    QUESTS[0];

  const skip = step > 0 && step < 5;

  return (
    <View style={styles.root}>
      <Backdrop tint={step === 1 ? VALUE_CARDS[valueIdx].tint : T.accent} />

      {skip && (
        <TouchableOpacity
          style={[styles.skip, { top: insets.top + 8 }]}
          onPress={() => transition(() => setStep(5))}
        >
          <Text style={styles.skipTxt}>Skip</Text>
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.page, { opacity: fade, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* 0 — Welcome */}
        {step === 0 && (
          <Pressable style={styles.tapPage} onPress={next}>
            <View style={styles.welcomeMid}>
              <Sparkle size={64} />
              <Text style={styles.kicker}>WELCOME</Text>
              <Text style={styles.welcomeHead}>
                You just made the first step to{'\n'}
                <Text style={styles.welcomeEm}>feel alive again.</Text>
              </Text>
            </View>
            <Text style={styles.tapHint}>tap to continue</Text>
          </Pressable>
        )}

        {/* 1 — Value cards */}
        {step === 1 && (
          <Pressable style={styles.tapPage} onPress={advanceValue}>
            <View style={styles.valueMid}>
              <Text style={styles.valuePlain}>{VALUE_CARDS[valueIdx].plain}</Text>
              <Text style={[styles.valueEm, { color: VALUE_CARDS[valueIdx].tint }]}>
                {VALUE_CARDS[valueIdx].em}
              </Text>
              <Text style={styles.valueSub}>{VALUE_CARDS[valueIdx].sub}</Text>
            </View>
            <View style={styles.dots}>
              {VALUE_CARDS.map((_, i) => (
                <View key={i} style={[styles.pdot, i === valueIdx && styles.pdotOn]} />
              ))}
            </View>
            <Text style={styles.tapHint}>tap to continue</Text>
          </Pressable>
        )}

        {/* 2 — Name */}
        {step === 2 && (
          <View style={styles.formPage}>
            <Text style={styles.qKicker}>FIRST — WHO IS THE HERO?</Text>
            <Text style={styles.qHead}>What should we{'\n'}<Text style={styles.qEm}>call you?</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={T.soft}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={next}
            />
            <View style={{ flex: 1 }} />
            <PrimaryButton label="Continue" onPress={next} disabled={!name.trim()} insets={insets} />
          </View>
        )}

        {/* 3 — Focus pillars */}
        {step === 3 && (
          <View style={styles.formPage}>
            <Text style={styles.qKicker}>PICK 1–3 TO FOCUS</Text>
            <Text style={styles.qHead}>Where do you want{'\n'}<Text style={styles.qEm}>to grow?</Text></Text>
            <View style={styles.pillarGrid}>
              {PILLAR_KEYS.map((p) => {
                const on = focus.includes(p);
                const m = PILLARS[p];
                return (
                  <TouchableOpacity
                    key={p}
                    activeOpacity={0.85}
                    onPress={() => toggleFocus(p)}
                    style={[styles.pillarCard, { borderColor: on ? m.color : T.line, backgroundColor: on ? m.color + '1A' : T.surface }]}
                  >
                    <Text style={[styles.pillarGlyph, { color: m.color }]}>{m.glyph}</Text>
                    <Text style={styles.pillarLabel}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flex: 1 }} />
            <PrimaryButton label="Continue" onPress={next} disabled={focus.length === 0} insets={insets} />
          </View>
        )}

        {/* 4 — What's stuck */}
        {step === 4 && (
          <View style={styles.formPage}>
            <Text style={styles.qKicker}>BE HONEST</Text>
            <Text style={styles.qHead}>What feels{'\n'}<Text style={styles.qEm}>stuck?</Text></Text>
            <View style={{ gap: 10, marginTop: 6 }}>
              {STUCK.map((s) => {
                const on = stuck === s;
                return (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.85}
                    onPress={() => { pop(); setStuck(s); }}
                    style={[styles.choice, { borderColor: on ? T.accent : T.line, backgroundColor: on ? T.accent + '18' : T.surface }]}
                  >
                    <Text style={[styles.choiceTxt, { color: on ? T.ink : T.sub }]}>{s}</Text>
                    {on && <Text style={styles.choiceCheck}>✦</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flex: 1 }} />
            <PrimaryButton label="Continue" onPress={next} disabled={!stuck} insets={insets} />
          </View>
        )}

        {/* 5 — First quest */}
        {step === 5 && (
          <ScrollView contentContainerStyle={[styles.questPage, { paddingTop: insets.top + 30 }]} showsVerticalScrollIndicator={false}>
            <Text style={styles.qKicker}>YOUR FIRST SIDE QUEST</Text>
            <Text style={styles.firstQuestEmoji}>{firstQuest.emoji}</Text>
            <Text style={styles.firstQuestTitle}>{firstQuest.title}</Text>
            <Text style={styles.firstQuestDesc}>{firstQuest.desc}</Text>
            <View style={styles.firstQuestMeta}>
              {Object.entries(firstQuest.stats).map(([p, amt]) => (
                <View key={p} style={[styles.metaChip, { borderColor: PILLARS[p as Pillar].color + '66' }]}>
                  <Text style={[styles.metaChipTxt, { color: PILLARS[p as Pillar].color }]}>
                    {PILLARS[p as Pillar].label} +{amt}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ height: 24 }} />
            <PrimaryButton
              label={`Begin, ${name.trim() || 'hero'} →`}
              onPress={() => { pop(); finish(name.trim() || 'Hero', focus.length ? focus : ['mind']); }}
              insets={insets}
              noBottom
            />
            <Text style={styles.legal}>No account needed. Your save file lives on this device.</Text>
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  insets,
  noBottom,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  insets: { bottom: number };
  noBottom?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={{ marginBottom: noBottom ? 0 : insets.bottom + 16, opacity: disabled ? 0.4 : 1 }}
    >
      <LinearGradient colors={T.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primary}>
        <Text style={styles.primaryTxt}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  page: { flex: 1, paddingHorizontal: 26 },
  skip: { position: 'absolute', right: 22, zIndex: 10, padding: 8 },
  skipTxt: { fontFamily: T.fMed, fontSize: 14, color: T.soft },
  tapPage: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  welcomeMid: { alignItems: 'center', gap: 22, flex: 1, justifyContent: 'center' },
  kicker: { fontFamily: T.fMono, fontSize: 12, color: T.accent, letterSpacing: 4, marginTop: 8 },
  welcomeHead: { fontFamily: T.fDisplay, fontSize: 34, color: T.ink, textAlign: 'center', lineHeight: 42 },
  welcomeEm: { fontFamily: T.fDisplayIt, color: T.accent },
  tapHint: { fontFamily: T.fMono, fontSize: 12, color: T.soft, letterSpacing: 2, marginBottom: 30 },

  valueMid: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  valuePlain: { fontFamily: T.fDisplay, fontSize: 40, color: T.ink, textAlign: 'center' },
  valueEm: { fontFamily: T.fDisplayIt, fontSize: 64, textAlign: 'center', lineHeight: 70 },
  valueSub: { fontFamily: T.fBody, fontSize: 15, color: T.sub, textAlign: 'center', lineHeight: 23, marginTop: 18, paddingHorizontal: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 },
  pdot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.faint },
  pdotOn: { backgroundColor: T.accent, width: 22 },

  formPage: { flex: 1, paddingTop: 70 },
  qKicker: { fontFamily: T.fMono, fontSize: 11, color: T.accent, letterSpacing: 3 },
  qHead: { fontFamily: T.fDisplay, fontSize: 38, color: T.ink, lineHeight: 44, marginTop: 12 },
  qEm: { fontFamily: T.fDisplayIt, color: T.accent },
  input: {
    marginTop: 28,
    fontFamily: T.fDisplay,
    fontSize: 30,
    color: T.ink,
    borderBottomWidth: 1,
    borderBottomColor: T.line,
    paddingVertical: 10,
  },

  pillarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 26 },
  pillarCard: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 8,
  },
  pillarGlyph: { fontSize: 28 },
  pillarLabel: { fontFamily: T.fSemi, fontSize: 15, color: T.ink },

  choice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 17,
  },
  choiceTxt: { fontFamily: T.fMed, fontSize: 16 },
  choiceCheck: { color: T.accent, fontSize: 15 },

  questPage: { paddingHorizontal: 26, alignItems: 'center', paddingBottom: 40 },
  firstQuestEmoji: { fontSize: 72, marginTop: 30 },
  firstQuestTitle: { fontFamily: T.fDisplayIt, fontSize: 46, color: T.ink, marginTop: 14, textAlign: 'center' },
  firstQuestDesc: { fontFamily: T.fBody, fontSize: 15, color: T.sub, textAlign: 'center', lineHeight: 24, marginTop: 14 },
  firstQuestMeta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 22 },
  metaChip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  metaChipTxt: { fontFamily: T.fMed, fontSize: 12 },
  legal: { fontFamily: T.fBody, fontSize: 12, color: T.soft, textAlign: 'center', marginTop: 16 },

  primary: { borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  primaryTxt: { fontFamily: T.fSemi, fontSize: 16, color: '#fff', letterSpacing: 0.2 },
});
