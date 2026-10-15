import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../theme';
import { tap } from '../haptics';

export type Tab = 'today' | 'explore' | 'days' | 'growth' | 'profile';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'today', icon: '✦', label: 'Today' },
  { id: 'explore', icon: '◍', label: 'Explore' },
  { id: 'days', icon: '▤', label: 'Days' },
  { id: 'growth', icon: '◈', label: 'Growth' },
  { id: 'profile', icon: '◉', label: 'Profile' },
];

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.pill}>
        <LinearGradient
          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.pillShine}
          pointerEvents="none"
        />
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => {
                tap();
                onChange(t.id);
              }}
            >
              <View style={[styles.iconWrap, on && { backgroundColor: T.accent + '22' }]}>
                <Text
                  style={[
                    styles.icon,
                    {
                      color: on ? T.accent : T.soft,
                      ...(on
                        ? { textShadowColor: T.accent, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } }
                        : {}),
                    },
                  ]}
                >
                  {t.icon}
                </Text>
              </View>
              <Text style={[styles.label, { color: on ? T.accent : T.soft }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 6 },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#151517',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: T.surfaceEdge,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 14,
  },
  pillShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 26, borderRadius: 30 },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { width: 42, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 17 },
  label: { fontFamily: T.fMed, fontSize: 9.5, letterSpacing: 0.2 },
});
