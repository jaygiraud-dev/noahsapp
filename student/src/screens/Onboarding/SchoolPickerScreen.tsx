import React, { useState, useMemo, useRef } from 'react';
import { View, Text, TextInput, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { SCHOOLS } from '../../data/schools';
import { hasSchoolCalendar } from '../../data/schoolCalendars';
import { School } from '../../types';
import MicroLabel from '../../components/MicroLabel';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';

const SORTED = [...SCHOOLS].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

function firstLetter(name: string) {
  const c = name.normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}

export default function SchoolPickerScreen({ navigation }: any) {
  const current = useStore((s) => s.school);
  const displayName = useStore((s) => s.displayName);
  const setSchool = useStore((s) => s.setSchool);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<School | null>(current?.name ? current : null);
  const listRef = useRef<SectionList<School>>(null);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? SORTED.filter((s) => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q))
      : SORTED;
    const groups = new Map<string, School[]>();
    for (const s of matches) {
      const k = firstLetter(s.name);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(s);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [query]);

  const letters = sections.map((s) => s.title);
  const resultCount = sections.reduce((n, s) => n + s.data.length, 0);
  const typed = query.trim();
  const exactMatch = SORTED.some((s) => s.name.toLowerCase() === typed.toLowerCase());

  function jumpTo(letter: string) {
    const idx = sections.findIndex((s) => s.title === letter);
    if (idx >= 0) listRef.current?.scrollToLocation({ sectionIndex: idx, itemIndex: 0, viewOffset: 0, animated: true });
  }

  function chooseTypedSchool() {
    const name = typed.replace(/\b\w/g, (c) => c.toUpperCase());
    setSelected({ name, city: '' });
  }

  function handleNext() {
    if (!selected) return;
    setSchool(selected);
    navigation.navigate('Classes');
  }

  const firstName = displayName && displayName !== 'Student' ? displayName.split(' ')[0] : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <MicroLabel color={theme.accent}>Step 1 of 4</MicroLabel>
        <SerifTitle size={30}>{firstName ? `Hi ${firstName}. Which school?` : 'Which school do you go to?'}</SerifTitle>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Text style={[styles.searchIcon, { color: theme.soft }]}>⌕</Text>
        <TextInput
          style={[styles.search, { color: theme.ink, fontFamily: theme.fBody }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by school or city"
          placeholderTextColor={theme.soft}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search schools"
        />
        {query !== '' && (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <Text style={[styles.clear, { color: theme.soft }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listRow}>
        <SectionList
          ref={listRef}
          sections={sections}
          keyExtractor={(s) => s.name + s.city}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={() => {}}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.bg }]}>
              <Text style={[styles.sectionLetter, { fontFamily: theme.fMono, color: theme.accent }]}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isSelected = selected?.name === item.name;
            return (
              <TouchableOpacity
                style={[styles.schoolRow, { backgroundColor: isSelected ? theme.accent + '1f' : 'transparent', borderColor: isSelected ? theme.accent : 'transparent' }]}
                onPress={() => setSelected(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.schoolInfo}>
                  <Text style={[styles.schoolName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{item.name}</Text>
                  <Text style={[styles.schoolCity, { fontFamily: theme.fMono, color: theme.soft }]}>
                    {item.city}{hasSchoolCalendar(item.name) ? '  ·  bell times + calendar' : ''}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.check, { backgroundColor: theme.accent }]}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { fontFamily: theme.fBody, color: theme.sub }]}>
              No school matches “{typed}”.
            </Text>
          }
          ListFooterComponent={
            typed !== '' && !exactMatch ? (
              <TouchableOpacity style={[styles.customRow, { borderColor: theme.line }]} onPress={chooseTypedSchool}>
                <Text style={[styles.customText, { fontFamily: theme.fBody, color: theme.accent }]}>
                  My school isn’t listed — use “{typed}”
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.count, { fontFamily: theme.fMono, color: theme.soft }]}>
                {resultCount} public high schools in the Lower Mainland
              </Text>
            )
          }
        />
        {query === '' && (
          <View style={styles.alphaRail}>
            {letters.map((l) => (
              <TouchableOpacity key={l} onPress={() => jumpTo(l)} hitSlop={{ left: 8, right: 8 }} accessibilityLabel={`Jump to ${l}`}>
                <Text style={[styles.alphaLetter, { fontFamily: theme.fMono, color: theme.accent }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.line }]}>
        {selected && (
          <Text style={[styles.selectedLabel, { fontFamily: theme.fBody, color: theme.sub }]} numberOfLines={1}>
            Selected: <Text style={{ color: theme.ink, fontFamily: theme.fBodyMedium }}>{selected.name}</Text>
          </Text>
        )}
        <PrimaryBtn label="Next → your classes" onPress={handleNext} disabled={!selected} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12, gap: 8 },
  searchWrap: { marginHorizontal: 24, marginBottom: 8, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  searchIcon: { fontSize: 20, marginRight: 6 },
  search: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 16 },
  clear: { fontSize: 22, paddingHorizontal: 4 },
  listRow: { flex: 1, flexDirection: 'row' },
  list: { flex: 1 },
  listContent: { paddingLeft: 24, paddingRight: 8, paddingBottom: 16 },
  sectionHeader: { paddingTop: 10, paddingBottom: 4 },
  sectionLetter: { fontSize: 12, letterSpacing: 1.5 },
  schoolRow: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  schoolInfo: { flex: 1, gap: 2 },
  schoolName: { fontSize: 15 },
  schoolCity: { fontSize: 11, letterSpacing: 0.3 },
  check: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty: { fontSize: 15, paddingVertical: 24 },
  customRow: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 14, marginTop: 12 },
  customText: { fontSize: 15 },
  count: { fontSize: 10, letterSpacing: 0.5, paddingVertical: 16, textAlign: 'center' },
  alphaRail: { width: 22, alignItems: 'center', justifyContent: 'center', gap: 1, paddingRight: 6 },
  alphaLetter: { fontSize: 10, paddingVertical: 1 },
  footer: { padding: 20, paddingBottom: 24, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  selectedLabel: { fontSize: 13 },
});
