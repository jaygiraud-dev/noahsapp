import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildDays(centerDate: Date, count = 14) {
  const days: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface Props {
  selected: Date;
  onSelect: (date: Date) => void;
}

export default function DayPicker({ selected, onSelect }: Props) {
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const scrollRef = useRef<ScrollView>(null);
  const today = new Date();
  const days = buildDays(selected);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day, i) => {
        const isSelected = isSameDay(day, selected);
        const isToday = isSameDay(day, today);
        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.day,
              { borderColor: theme.line },
              isSelected && { backgroundColor: theme.accent, borderColor: theme.accent },
            ]}
            onPress={() => onSelect(day)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dayName,
                { fontFamily: theme.fMono, color: isSelected ? '#fff' : theme.soft },
              ]}
            >
              {DAY_ABBR[day.getDay()]}
            </Text>
            <Text
              style={[
                styles.dayNum,
                {
                  fontFamily: theme.fBodySemiBold,
                  color: isSelected ? '#fff' : isToday ? theme.accent : theme.ink,
                },
              ]}
            >
              {day.getDate()}
            </Text>
            {isToday && !isSelected && (
              <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
    flexDirection: 'row',
  },
  day: {
    width: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayName: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
