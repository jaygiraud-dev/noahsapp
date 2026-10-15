import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';

/** "Saved · due Mon, Oct 26" confirmation that fades out on its own. */
export function SaveToast() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: false }).start(() => clearToast());
    }, 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.toastWrap, { opacity: fade }]} accessibilityLiveRegion="polite">
      <View style={[styles.toast, { backgroundColor: theme.mint }]}>
        <Text style={[styles.toastText, { fontFamily: theme.fBodySemiBold }]}>✓ {toast}</Text>
      </View>
    </Animated.View>
  );
}

/** Stays on screen while something hasn't reached the account yet. */
export function SyncBanner() {
  const syncError = useStore((s) => s.syncError);
  const unsynced = useStore((s) => s.unsynced);
  const retrySync = useStore((s) => s.retrySync);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!syncError || unsynced.length === 0) return null;
  const n = unsynced.length;

  async function retry() {
    setBusy(true);
    await retrySync();
    setBusy(false);
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.amber + '26', borderColor: theme.amber }]}>
      <TouchableOpacity style={styles.bannerMain} onPress={() => setOpen((v) => !v)} accessibilityRole="button" accessibilityHint="Shows why">
        <Text style={[styles.bannerTitle, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>
          ⚠ {n} item{n === 1 ? '' : 's'} not saved to your account yet
        </Text>
        <Text style={[styles.bannerSub, { fontFamily: theme.fBody, color: theme.sub }]} numberOfLines={open ? undefined : 1}>
          {open ? syncError : 'Kept on this phone. Tap for details.'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.retry, { backgroundColor: theme.amber }]} onPress={retry} disabled={busy}>
        <Text style={[styles.retryText, { fontFamily: theme.fMono }]}>{busy ? 'Saving…' : 'Try again'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 104, alignItems: 'center', zIndex: 200 },
  toast: { borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  toastText: { color: '#0b2a1f', fontSize: 16 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, marginHorizontal: 12, marginTop: 6, padding: 10 },
  bannerMain: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 15 },
  bannerSub: { fontSize: 14, lineHeight: 19 },
  retry: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  retryText: { color: '#1a1206', fontSize: 14 },
});
