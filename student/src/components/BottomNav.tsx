import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';
import type { Tab } from '../navigation/MainTabNavigator';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'today', icon: '◈' },
  { id: 'week', label: 'week', icon: '▦' },
  { id: 'squad', label: 'squad', icon: '⬡' },
  { id: 'me', label: 'me', icon: '◉' },
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
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.line,
          paddingBottom: insets.bottom + 4,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrap,
                isActive && {
                  shadowColor: theme.magenta,
                  shadowOpacity: 0.6,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  { color: isActive ? theme.magenta : theme.soft },
                ]}
              >
                {tab.icon}
              </Text>
            </View>
            <Text
              style={[
                styles.label,
                {
                  fontFamily: theme.fMono,
                  color: isActive ? theme.magenta : theme.soft,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
