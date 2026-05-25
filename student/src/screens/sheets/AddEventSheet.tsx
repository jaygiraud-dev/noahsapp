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
  defaultTime?: string;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AddEventSheet({ visible, onClose, defaultDate, defaultTime }: Props) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate ?? new Date());
  const [time, setTime] = useState(defaultTime ?? '3:30 PM');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState(EVENT_TYPES[0].label);
  const [reminder, setReminder] = useState(REMINDER_OPTIONS[0].label);
  const addEvent = useStore((s) => s.addEvent);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setLocation('');
      setEndTime('');
      setSelectedDate(defaultDate ?? new Date());
      setTime(defaultTime ?? '3:30 PM');
      setType(EVENT_TYPES[0].label);
      setReminder(REMINDER_OPTIONS[0].label);
    }
  }, [visible]);

  function shiftDate(days: number) {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  function handleAdd() {
    if (!title.trim()) return;
    addEvent({
      id: Date.now().toString(),
      title: title.trim(),
      location: location.trim() || undefined,
      time,
      endTime: endTime.trim() || undefined,
      type,
      reminder,
      date: selectedDate.toISOString(),
      done: false,
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* Outer container: backdrop + sheet stacked vertically */}
      <View style={styles.outer}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} />
        {/* KAV wraps only the sheet — pushes it up when keyboard appears */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.modal, { backgroundColor: theme.bg }]}>
            <View style={[styles.handle, { backgroundColor: theme.line }]} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.titleRow}>
                <SerifTitle size={24}>Add event.</SerifTitle>
                <TouchableOpacity onPress={onClose}>
                  <Text style={[styles.close, { color: theme.soft }]}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View style={styles.fieldGroup}>
                <MicroLabel>Title</MicroLabel>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What's happening?"
                  placeholderTextColor={theme.soft}
                  autoFocus
                />
              </View>

              {/* Type */}
              <View style={styles.fieldGroup}>
                <MicroLabel>Type</MicroLabel>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                  {EVENT_TYPES.map((t) => (
                    <Pill key={t.id} label={t.label} active={type === t.label} tone={theme.purple} onPress={() => setType(t.label)} />
                  ))}
                </ScrollView>
              </View>

              {/* Date picker */}
              <View style={styles.fieldGroup}>
                <MicroLabel>Date</MicroLabel>
                <View style={[styles.datePicker, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                  <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateArrow}>
                    <Text style={[styles.dateArrowText, { color: theme.accent }]}>‹</Text>
                  </TouchableOpacity>
                  <Text style={[styles.dateLabel, { fontFamily: theme.fMono, color: theme.ink }]}>
                    {formatDate(selectedDate)}
                  </Text>
                  <TouchableOpacity onPress={() => shiftDate(1)} style={styles.dateArrow}>
                    <Text style={[styles.dateArrowText, { color: theme.accent }]}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time + End time */}
              <View style={styles.twoCol}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <MicroLabel>Start time</MicroLabel>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fMono }]}
                    value={time}
                    onChangeText={setTime}
                    placeholder="3:30 PM"
                    placeholderTextColor={theme.soft}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <MicroLabel>End time</MicroLabel>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fMono }]}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="5:00 PM"
                    placeholderTextColor={theme.soft}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.fieldGroup}>
                <MicroLabel>Location (optional)</MicroLabel>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Where?"
                  placeholderTextColor={theme.soft}
                />
              </View>

              {/* Reminder */}
              <View style={styles.fieldGroup}>
                <MicroLabel>Remind me</MicroLabel>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                  {REMINDER_OPTIONS.map((r) => (
                    <Pill key={r.id} label={r.label} active={reminder === r.label} tone={theme.cyan} onPress={() => setReminder(r.label)} />
                  ))}
                </ScrollView>
              </View>

              <PrimaryBtn label="Add event +" onPress={handleAdd} disabled={!title.trim()} style={styles.addBtn} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdropDismiss: { flex: 1 },
  modal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  content: { padding: 20, gap: 20, paddingBottom: 36 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: 28, lineHeight: 32 },
  fieldGroup: { gap: 8 },
  input: { borderRadius: 32, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  pillRow: { gap: 8, flexDirection: 'row' },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dateArrow: { paddingHorizontal: 16, paddingVertical: 14 },
  dateArrowText: { fontSize: 22, lineHeight: 26 },
  dateLabel: { flex: 1, textAlign: 'center', fontSize: 14, letterSpacing: 0.3 },
  twoCol: { flexDirection: 'row', gap: 12 },
  addBtn: { marginTop: 8 },
});
