import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { GVAN_SCHOOLS } from '../../data/schools';
import { School } from '../../types';
import MicroLabel from '../../components/MicroLabel';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';

const DISTRICTS = ['All', ...Array.from(new Set(GVAN_SCHOOLS.map((s) => s.district))).sort()];

export default function SchoolPickerScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('All');
  const [selected, setSelected] = useState<School | null>(null);
  const setSchool = useStore((s) => s.setSchool);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  const filtered = useMemo(() => {
    return GVAN_SCHOOLS.filter((s) => {
      const matchDistrict = district === 'All' || s.district === district;
      const matchQuery = s.name.toLowerCase().includes(query.toLowerCase());
      return matchDistrict && matchQuery;
    });
  }, [query, district]);

  function handleNext() {
    if (!selected) return;
    setSchool(selected);
    navigation.navigate('Classes');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <MicroLabel color={theme.accent}>Step 1 of 3</MicroLabel>
        <SerifTitle size={28} style={styles.title}>
          Pick your school.
        </SerifTitle>
      </View>

      <TextInput
        style={[
          styles.search,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
            color: theme.ink,
            fontFamily: theme.fBody,
          },
        ]}
        value={query}
        onChangeText={setQuery}
        placeholder="Search schools…"
        placeholderTextColor={theme.soft}
      />

      <View>
        <FlatList
          data={DISTRICTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(d) => d}
          contentContainerStyle={styles.districtList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.districtPill,
                {
                  backgroundColor: district === item ? theme.accent : theme.surface,
                  borderColor: district === item ? theme.accent : theme.line,
                },
              ]}
              onPress={() => setDistrict(item)}
            >
              <Text
                style={[
                  styles.districtText,
                  { fontFamily: theme.fMono, color: district === item ? '#fff' : theme.sub },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selected?.id === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.schoolRow,
                {
                  backgroundColor: theme.surface,
                  borderColor: isSelected ? theme.accent : theme.line,
                },
              ]}
              onPress={() => setSelected(item)}
              activeOpacity={0.7}
            >
              <View style={styles.schoolInfo}>
                <Text style={[styles.schoolName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>
                  {item.name}
                </Text>
                <Text style={[styles.schoolDistrict, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {item.district}
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
      />

      <View style={[styles.footer, { borderTopColor: theme.line }]}>
        <PrimaryBtn
          label="Next → Classes"
          onPress={handleNext}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12, gap: 8 },
  title: {},
  search: {
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  districtList: { paddingHorizontal: 24, gap: 8, paddingBottom: 12 },
  districtPill: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  districtText: { fontSize: 11, letterSpacing: 0.5 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 24, gap: 8, paddingBottom: 8 },
  schoolRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolInfo: { flex: 1, gap: 2 },
  schoolName: { fontSize: 15 },
  schoolDistrict: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  footer: { padding: 24, borderTopWidth: StyleSheet.hairlineWidth },
});
