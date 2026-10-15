import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';
import type { Tab } from '../navigation/MainTabNavigator';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { id: Tab; icon: IconName; activeIcon: IconName; label: string }[] = [
  { id: 'today', icon: 'home-outline',          activeIcon: 'home',          label: 'Home'  },
  { id: 'week',  icon: 'calendar-outline',      activeIcon: 'calendar',      label: 'Week'  },
  { id: 'squad', icon: 'people-outline',        activeIcon: 'people',        label: 'Squad' },
  { id: 'me',    icon: 'person-circle-outline', activeIcon: 'person-circle', label: 'Me'    },
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
  const light = theme.isClay || !theme.dark;
  const idle = light ? '#6b6478' : 'rgba(255,255,255,0.55)';

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.pill, { backgroundColor: light ? 'rgba(255,255,255,0.92)' : '#1c1c1c', shadowColor: '#000' }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.pillShine}
          pointerEvents="none"
        />
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const color = isActive ? theme.accent : idle;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.65}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
            >
              <View style={[styles.iconWrap, isActive && { backgroundColor: theme.accent + '22' }]}>
                <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={color} />
              </View>
              <Text style={[styles.label, { color, fontFamily: isActive ? theme.fBodySemiBold : theme.fBodyMedium }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, paddingTop: 8 },
  pill: {
    flexDirection: 'row',
    borderRadius: 32,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 2 },
  iconWrap: { width: 48, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 11, letterSpacing: 0.2 },
  pillShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 28, borderRadius: 32 },
});
