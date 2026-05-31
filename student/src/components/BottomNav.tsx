import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';
import type { Tab } from '../navigation/MainTabNavigator';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'today',  icon: '◈', label: 'Today'  },
  { id: 'week',   icon: '▦', label: 'Week'   },
  { id: 'squad',  icon: '⬡', label: 'Squad'  },
  { id: 'me',     icon: '◉', label: 'Me'     },
];

interface Props {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onTabPress }: Props) {
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.pill, { backgroundColor: theme.isClay ? 'rgba(255,255,255,0.85)' : '#1c1c1c', shadowColor: '#000' }]}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.65}
            >
              <View style={[styles.iconWrap, isActive && { backgroundColor: theme.accent + '22' }]}>
                <Text style={[styles.icon, { color: isActive ? theme.accent : theme.soft }]}>
                  {tab.icon}
                </Text>
              </View>
              {isActive && (
                <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 32,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 40,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 44,
    height: 38,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
