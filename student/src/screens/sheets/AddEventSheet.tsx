import React, { useState } from 'react';
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
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { EVENT_TYPES, REMINDER_OPTIONS } from '../../data/constants';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';
import Pill from '../../components/Pill';
import SerifTitle from '../../components/SerifTitle';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

export default function AddEventSheet({ visible, onClose, defaultDate }: Props) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('3:30 PM');
  const [type, setType] = useState(EVENT_TYPES[0].label);
  const [reminder, setReminder] = useState(REMINDER_OPTIONS[0].label);
  const addEvent = useStore((s) => s.addEvent);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  function handleAdd() {
    if (!title.trim()) return;
    const date = defaultDate ?? new Date();
    addEvent({
      id: Date.now().toString(),
      title: title.trim(),
      location: location.trim() || undefined,
      time,
      type,
      reminder,
      date: date.toISOString(),
      done: false,
    });
    setTitle('');
    setLocation('');
    setTime('3:30 PM');
    setType(EVENT_TYPES[0].label);
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
            <SerifTitle size={24}>Add event.</SerifTitle>
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
              placeholder="What's happening?"
              placeholderTextColor={theme.soft}
              autoFocus
            />
          </View>

          <View style={styles.fieldGroup}>
            <MicroLabel>Type</MicroLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {EVENT_TYPES.map((t) => (
                <Pill
                  key={t.id}
                  label={t.label}
                  active={type === t.label}
                  tone={theme.purple}
                  onPress={() => setType(t.label)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.twoCol}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <MicroLabel>Time</MicroLabel>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fMono },
                ]}
                value={time}
                onChangeText={setTime}
                placeholder="3:30 PM"
                placeholderTextColor={theme.soft}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <MicroLabel>Location</MicroLabel>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody },
                ]}
                value={location}
                onChangeText={setLocation}
                placeholder="Where? (optional)"
                placeholderTextColor={theme.soft}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <MicroLabel>Remind me</MicroLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {REMINDER_OPTIONS.map((r) => (
                <Pill
                  key={r.id}
                  label={r.label}
                  active={reminder === r.label}
                  tone={theme.cyan}
                  onPress={() => setReminder(r.label)}
                />
              ))}
            </ScrollView>
          </View>

          <PrimaryBtn label="Add event +" onPress={handleAdd} disabled={!title.trim()} style={styles.addBtn} />
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
  twoCol: { flexDirection: 'row', gap: 12 },
  addBtn: { marginTop: 8 },
});
