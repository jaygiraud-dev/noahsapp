import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useStore } from './store';
import { T } from './theme';
import Backdrop from './components/Backdrop';
import TabBar, { Tab } from './components/TabBar';
import RewardOverlay from './components/RewardOverlay';
import Onboarding from './screens/Onboarding';
import Today from './screens/Today';
import Explore from './screens/Explore';
import Days from './screens/Days';
import Growth from './screens/Growth';
import Profile from './screens/Profile';

const TINT: Record<Tab, string> = {
  today: T.accent,
  explore: '#FF8A3D',
  days: '#FF49B0',
  growth: '#F5C04A',
  profile: T.accent,
};

export default function Root() {
  const phase = useStore((s) => s.phase);
  const reward = useStore((s) => s.reward);
  const [tab, setTab] = useState<Tab>('today');

  if (phase === 'onboarding') {
    return <Onboarding />;
  }

  return (
    <View style={styles.root}>
      <Backdrop tint={TINT[tab]} />
      <View style={styles.screen}>
        {tab === 'today' && <Today onNavigate={setTab} />}
        {tab === 'explore' && <Explore />}
        {tab === 'days' && <Days />}
        {tab === 'growth' && <Growth />}
        {tab === 'profile' && <Profile />}
      </View>
      <TabBar active={tab} onChange={setTab} />
      {reward && <RewardOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  screen: { flex: 1 },
});
