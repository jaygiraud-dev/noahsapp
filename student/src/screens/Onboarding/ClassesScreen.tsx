import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { Class } from '../../types';
import { CLASS_COLORS } from '../../data/constants';
import MicroLabel from '../../components/MicroLabel';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';

const PERIOD_TIMES = [
  '8:30', '9:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30',
];

function ClassEditor({
  cls,
  theme,
  onUpdate,
  onRemove,
}: {
  cls: Class;
  theme: ReturnType<typeof makeTheme>;
  onUpdate: (c: Class) => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.cardRow}>
        <TextInput
          style={[
            styles.nameInput,
            { fontFamily: theme.fBodyMedium, color: theme.ink, borderBottomColor: theme.line },
          ]}
          value={cls.name}
          onChangeText={(name) => onUpdate({ ...cls, name })}
          placeholder="Class name"
          placeholderTextColor={theme.soft}
        />
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Text style={{ color: theme.red, fontSize: 18 }}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.colorRow}>
        {CLASS_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              cls.color === c && styles.colorDotActive,
            ]}
            onPress={() => onUpdate({ ...cls, color: c })}
          />
        ))}
      </View>

      <View style={styles.teacherRow}>
        <TextInput
          style={[
            styles.teacherInput,
            {
              fontFamily: theme.fBody,
              color: theme.ink,
              backgroundColor: theme.surfaceHi,
              borderColor: theme.line,
            },
          ]}
          value={cls.teacher ?? ''}
          onChangeText={(teacher) => onUpdate({ ...cls, teacher })}
          placeholder="Teacher (optional)"
          placeholderTextColor={theme.soft}
        />
      </View>
    </View>
  );
}

export default function ClassesScreen({ navigation }: any) {
  const storeClasses = useStore((s) => s.classes);
  const setClasses = useStore((s) => s.setClasses);
  const setPhase = useStore((s) => s.setPhase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  const [classes, setLocalClasses] = useState<Class[]>(storeClasses);

  function addNewClass() {
    const newCls: Class = {
      id: Date.now().toString(),
      name: '',
      color: CLASS_COLORS[classes.length % CLASS_COLORS.length],
      period: classes.length + 1,
    };
    setLocalClasses((prev) => [...prev, newCls]);
  }

  function updateClass(id: string, updated: Class) {
    setLocalClasses((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  function removeClass(id: string) {
    setLocalClasses((prev) => prev.filter((c) => c.id !== id));
  }

  function handleNext() {
    setClasses(classes.filter((c) => c.name.trim().length > 0));
    navigation.navigate('ParentPair');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { fontFamily: theme.fMono, color: theme.accent }]}>← back</Text>
        </TouchableOpacity>
        <MicroLabel color={theme.accent}>Step 2 of 3</MicroLabel>
        <SerifTitle size={28} style={styles.title}>
          Your classes.
        </SerifTitle>
        <Text style={[styles.subtitle, { fontFamily: theme.fBody, color: theme.sub }]}>
          Add your subjects. You can always edit these later.
        </Text>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(c) => c.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ClassEditor
            cls={item}
            theme={theme}
            onUpdate={(updated) => updateClass(item.id, updated)}
            onRemove={() => removeClass(item.id)}
          />
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={[
              styles.addRow,
              { borderColor: theme.line, backgroundColor: theme.surface },
            ]}
            onPress={addNewClass}
          >
            <Text style={[styles.addText, { fontFamily: theme.fBodyMedium, color: theme.accent }]}>
              + Add class
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={[styles.footer, { borderTopColor: theme.line }]}>
        <PrimaryBtn label="Next → Parent pair" onPress={handleNext} />
        <TouchableOpacity onPress={() => setPhase('main')} style={styles.skipWrap}>
          <Text style={[styles.skip, { fontFamily: theme.fMono, color: theme.soft }]}>
            skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, gap: 6 },
  back: { fontSize: 13, letterSpacing: 0.5, marginBottom: 8 },
  title: {},
  subtitle: { fontSize: 14, lineHeight: 20 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 24, gap: 10, paddingBottom: 8 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 4,
  },
  removeBtn: { padding: 4 },
  colorRow: { flexDirection: 'row', gap: 8 },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  teacherRow: {},
  teacherInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  addRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  addText: { fontSize: 15 },
  footer: { padding: 24, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  skipWrap: { alignItems: 'center' },
  skip: { fontSize: 11, letterSpacing: 1 },
});
