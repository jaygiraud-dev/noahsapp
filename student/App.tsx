import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Caveat_500Medium } from '@expo-google-fonts/caveat';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { useStore } from './src/store/useStore';
import { supabase } from './src/lib/supabase';
import { enterApp } from './src/lib/session';
import { scheduleClassNotifications } from './src/lib/classNotifications';

export default function App() {
  const setPhase = useStore((s) => s.setPhase);
  const hasHydrated = useStore((s) => s._hasHydrated);
  const setPasswordRecovery = useStore((s) => s.setPasswordRecovery);
  const [sessionReady, setSessionReady] = useState(false);

  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Caveat_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  // Wait for local state to load before checking the session, otherwise the
  // stored user id is always empty and every launch looks like a new account.
  useEffect(() => {
    if (!hasHydrated) return;
    const recovery = Platform.OS === 'web' && typeof window !== 'undefined'
      && window.location.hash.includes('type=recovery');
    if (recovery) setPasswordRecovery(true);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && !recovery) {
        await enterApp(session.user);
      } else if (recovery) {
        setPhase('auth');
      } else {
        // No account session. Demo mode keeps its screen; real accounts go to sign-in.
        const { phase, userId } = useStore.getState();
        const isDemo = userId === '' && phase !== 'auth';
        if (!isDemo) setPhase('auth');
      }
      // Tidy the address bar after an email link
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      setSessionReady(true);
    }).catch(() => setSessionReady(true));

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setPhase('auth');
      if (event === 'PASSWORD_RECOVERY') { setPasswordRecovery(true); setPhase('auth'); }
    });
    return () => sub.subscription.unsubscribe();
  }, [hasHydrated]);

  // Re-schedule class bells whenever the timetable changes (phone only)
  useEffect(() => {
    const unsub = useStore.subscribe((state, prev) => {
      if ((state.classes !== prev.classes || state.timetable !== prev.timetable) && state.userRole === 'student') {
        scheduleClassNotifications(state.classes, state.timetable).catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  if (!fontsLoaded || !sessionReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e8453a" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0d0d' },
});
