import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';
import BottomNav from '../components/BottomNav';
import RewardOverlay from '../components/RewardOverlay';
import TodayScreen from '../screens/Today/TodayScreen';
import WeekScreen from '../screens/Week/WeekScreen';
import SquadScreen from '../screens/Squad/SquadScreen';
import MeScreen from '../screens/Me/MeScreen';

export type Tab = 'today' | 'week' | 'squad' | 'me';

export default function MainTabNavigator() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const reward = useStore((s) => s.reward);
  const theme = makeTheme(vibe, darkMode);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={styles.screen}>
        {activeTab === 'today' && <TodayScreen />}
        {activeTab === 'week' && <WeekScreen />}
        {activeTab === 'squad' && <SquadScreen />}
        {activeTab === 'me' && <MeScreen />}
      </View>
      <BottomNav activeTab={activeTab} onTabPress={setActiveTab} />
      {reward && <RewardOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
});
