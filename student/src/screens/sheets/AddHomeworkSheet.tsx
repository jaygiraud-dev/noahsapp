import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { Class } from '../../types';
import { HW_TAGS, DUE_OPTIONS } from '../../data/constants';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';
import Pill from '../../components/Pill';
import SerifTitle from '../../components/SerifTitle';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultDate?: Date;
  defaultClass?: Class | null;
}

export default function AddHomeworkSheet({ visible, onClose, defaultDate, defaultClass }: Props) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(defaultClass?.name ?? '');
  const [tag, setTag] = useState(HW_TAGS[0].label);
  const [due, setDue] = useState(DUE_OPTIONS[0].label);
  const addHomework = useStore((s) => s.addHomework);
  const classes = useStore((s) => s.classes);

  useEffect(() => {
    if (visible) setSubject(defaultClass?.name ?? '');
  }, [visible, defaultClass]);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  function handleAdd() {
    if (!title.trim()) return;
    const dueDate = defaultDate ?? new Date();
    if (due === 'Tomorrow') dueDate.setDate(dueDate.getDate() + 1);
    else if (due === 'In 3 days') dueDate.setDate(dueDate.getDate() + 3);
    else if (due === 'Next week') dueDate.setDate(dueDate.getDate() + 7);
    const matchedClass = classes.find((c) => c.name === subject);
    addHomework({
      id: Date.now().toString(),
      classId: matchedClass?.id,
      subject: subject || 'General',
      classColor: matchedClass?.color,
      title: title.trim(),
      tag,
      due,
      dueDate: dueDate.toISOString(),
      done: false,
      points: 10,
    });
    setTitle('');
    setSubject('');
    setTag(HW_TAGS[0].label);
    setDue(DUE_OPTIONS[0].label);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modal, { backgroundColor: theme.bg }]}
      >
        <View style={[styles.handle, { backgroundColor: theme.line }]} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.titleRow}>
            <SerifTitle size={24}>Add homework.</SerifTitle>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.close, { color: theme.soft }]}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <MicroLabel>Title</MicroLabel>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="What's the assignment?"
              placeholderTextColor={theme.soft}
              autoFocus
            />
          </View>

          <View style={styles.fieldGroup}>
            <MicroLabel>Class</MicroLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {classes.map((c) => (
                <Pill
                  key={c.id}
                  label={c.name}
                  active={subject === c.name}
                  tone={c.color}
                  onPress={() => setSubject(c.name)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.fieldGroup}>
            <MicroLabel>Tag</MicroLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {HW_TAGS.map((t) => (
                <Pill
                  key={t.id}
                  label={t.label}
                  active={tag === t.label}
                  tone={theme.accent}
                  onPress={() => setTag(t.label)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.fieldGroup}>
            <MicroLabel>Due</MicroLabel>
            <View style={styles.dueRow}>
              {DUE_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.dueBtn,
                    {
                      backgroundColor: due === d.label ? theme.accent : theme.surface,
                      borderColor: due === d.label ? theme.accent : theme.line,
                    },
                  ]}
                  onPress={() => setDue(d.label)}
                >
                  <Text style={[styles.dueBtnText, { fontFamily: theme.fMono, color: due === d.label ? '#fff' : theme.sub }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <PrimaryBtn label="Add homework +" onPress={handleAdd} disabled={!title.trim()} style={styles.addBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  content: { padding: 20, gap: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: 28, lineHeight: 32 },
  fieldGroup: { gap: 8 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
  },
  pillRow: { gap: 8, flexDirection: 'row' },
  dueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dueBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dueBtnText: { fontSize: 12, letterSpacing: 0.5 },
  addBtn: { marginTop: 8 },
});
