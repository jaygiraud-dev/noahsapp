import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Caveat_500Medium } from '@expo-google-fonts/caveat';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { useStore } from './src/store/useStore';
import { supabase } from './src/lib/supabase';

export default function App() {
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const setPhase = useStore((s) => s.setPhase);
  const storedUserId = useStore((s) => s.userId);
  const storedUserRole = useStore((s) => s.userRole);
  const hasHydrated = useStore((s) => s._hasHydrated);
  const resetForUser = useStore((s) => s.resetForUser);
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

  useEffect(() => {
    if (!hasHydrated) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setPhase('auth');
      } else {
        if (session.user.id !== storedUserId) {
          // Different (or new) user — determine role from metadata, fallback to student
          const role = (session.user.user_metadata?.role ?? 'student') as 'student' | 'parent';
          resetForUser(session.user.id, role);
        } else {
          // Same user returning — trust the persisted role, not metadata
          setPhase(storedUserRole === 'parent' ? 'parent' : 'main');
        }
      }
      setSessionReady(true);
    });
  }, [hasHydrated]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setPhase('auth');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || !sessionReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#a78bfa" />
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
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0820' },
});
