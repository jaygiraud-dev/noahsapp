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
import { upsertProfile, savePushToken } from './src/lib/db';
import { registerForPushNotificationsAsync } from './src/lib/pushNotifications';

export default function App() {
  const setPhase = useStore((s) => s.setPhase);
  const storedUserId = useStore((s) => s.userId);
  const storedUserRole = useStore((s) => s.userRole);
  const hasHydrated = useStore((s) => s._hasHydrated);
  const resetForUser = useStore((s) => s.resetForUser);
  const setUserRole = useStore((s) => s.setUserRole);
  const loadDataFromSupabase = useStore((s) => s.loadDataFromSupabase);
  const pairingCode = useStore((s) => s.pairingCode);
  const school = useStore((s) => s.school);
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

  // Wait for the Zustand store to rehydrate from AsyncStorage before checking the
  // Supabase session — otherwise storedUserId is always '' and resetForUser fires.
  useEffect(() => {
    if (!hasHydrated) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setPhase('auth');
        setSessionReady(true);
        return;
      }

      const role = (session.user.user_metadata?.role ?? storedUserRole) as 'student' | 'parent';

      if (session.user.id !== storedUserId) {
        // New or different user — wipe previous data
        resetForUser(session.user.id, role);
      } else {
        // Same returning user — trust persisted role and go straight to app
        setUserRole(role);
        setPhase(storedUserRole === 'parent' ? 'parent' : 'main');
        // Re-upsert profile on every load so pairing code is always in Supabase
        const displayName = session.user.email?.split('@')[0] ?? '';
        upsertProfile(
          session.user.id,
          storedUserRole,
          storedUserRole === 'student' ? pairingCode : undefined,
          storedUserRole === 'student' ? school.name : undefined,
          displayName
        ).catch(() => {});
        // Sync latest data from Supabase in background
        if (storedUserRole === 'student') {
          loadDataFromSupabase().catch(() => {});
        }
      }
      // Register push token for students (fire-and-forget)
      if (role === 'student') {
        registerForPushNotificationsAsync().then((token) => {
          if (token) savePushToken(session.user.id, token).catch(() => {});
        }).catch(() => {});
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
