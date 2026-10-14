import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { CalEvent } from '../../types';
import { EVENT_TYPES, eventIcon } from '../../data/constants';
import { EVENT_REMINDERS } from '../../lib/classNotifications';
import { parseTime, fmt12 } from '../../lib/time';
import { weekdayName } from '../../lib/events';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';
import Pill from '../../components/Pill';
import SerifTitle from '../../components/SerifTitle';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultDate?: Date;
  defaultTime?: string;
  editEvent?: CalEvent | null;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AddEventSheet({ visible, onClose, defaultDate, defaultTime, editEvent }: Props) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate ?? new Date());
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<string>(EVENT_TYPES[0].label);
  const [reminder, setReminder] = useState<string>('None');
  const [weekly, setWeekly] = useState(false);
  const [error, setError] = useState('');
  const addEvent = useStore((s) => s.addEvent);
  const editEventAction = useStore((s) => s.editEvent);
  const userId = useStore((s) => s.userId);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  useEffect(() => {
    if (!visible) return;
    setError('');
    if (editEvent) {
      setTitle(editEvent.title);
      setLocation(editEvent.location ?? '');
      setSelectedDate(editEvent.date ? new Date(editEvent.date) : new Date());
      setTime(editEvent.time ? fmt12(editEvent.time) : '');
      setEndTime(editEvent.endTime ? fmt12(editEvent.endTime) : '');
      setType(editEvent.type ?? EVENT_TYPES[0].label);
      setReminder(editEvent.reminder && (EVENT_REMINDERS as readonly string[]).includes(editEvent.reminder) ? editEvent.reminder : 'None');
      setWeekly(editEvent.repeat === 'weekly');
    } else {
      setTitle('');
      setLocation('');
      setEndTime('');
      setSelectedDate(defaultDate ?? new Date());
      setTime(defaultTime ? fmt12(defaultTime) : '3:30 PM');
      setType(EVENT_TYPES[0].label);
      setReminder('None');
      setWeekly(false);
    }
  }, [visible, editEvent]);

  function shiftDate(days: number) {
    setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });
  }

  function handleSave() {
    if (!title.trim()) return;
    const start = parseTime(time);
    const end = endTime.trim() ? parseTime(endTime) : null;
    if (time.trim() && start === null) { setError('Type the start time like 3:30 PM.'); return; }
    if (endTime.trim() && end === null) { setError('Type the end time like 5:00 PM.'); return; }
    if (start !== null && end !== null && end <= start) { setError('The end time needs to be after the start time.'); return; }
    const data = {
      title: title.trim(),
      location: location.trim() || undefined,
      time: start !== null ? fmt12(start) : undefined,
      endTime: end !== null ? fmt12(end) : undefined,
      type,
      icon: eventIcon(type),
      reminder,
      date: selectedDate.toISOString(),
      repeat: weekly ? ('weekly' as const) : null,
      // Turning repeat off (or back on) starts the series fresh
      ...(editEvent && (editEvent.repeat === 'weekly') !== weekly ? { repeatUntil: null, skipDates: [] } : {}),
    };
    if (editEvent) editEventAction(editEvent.id, data);
    else addEvent(data);
    onClose();
  }

  const input = [styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.outer}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modal, { backgroundColor: theme.bg }]}>
            <View style={[styles.handle, { backgroundColor: theme.line }]} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.titleRow}>
                <SerifTitle size={24}>{editEvent ? 'Edit event.' : 'Add event.'}</SerifTitle>
                <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
                  <Text style={[styles.close, { color: theme.soft }]}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <MicroLabel>What</MicroLabel>
                <TextInput style={input} value={title} onChangeText={setTitle} placeholder="Soccer practice, dentist, shift at work…" placeholderTextColor={theme.soft} autoFocus={!editEvent} />
              </View>

              <View style={styles.fieldGroup}>
                <MicroLabel>Type</MicroLabel>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                  {EVENT_TYPES.map((t) => (
                    <Pill key={t.id} label={`${t.icon} ${t.label}`} active={type === t.label} tone={theme.accent} onPress={() => setType(t.label)} />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.fieldGroup}>
                <MicroLabel>Date</MicroLabel>
                <View style={[styles.datePicker, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                  <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateArrow} accessibilityLabel="Previous day">
                    <Text style={[styles.dateArrowText, { color: theme.accent }]}>‹</Text>
                  </TouchableOpacity>
                  <Text style={[styles.dateLabel, { fontFamily: theme.fMono, color: theme.ink }]}>{formatDate(selectedDate)}</Text>
                  <TouchableOpacity onPress={() => shiftDate(1)} style={styles.dateArrow} accessibilityLabel="Next day">
                    <Text style={[styles.dateArrowText, { color: theme.accent }]}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <MicroLabel>Repeat</MicroLabel>
                <View style={styles.repeatRow}>
                  {[false, true].map((w) => {
                    const active = weekly === w;
                    return (
                      <TouchableOpacity
                        key={String(w)}
                        style={[styles.repeatBtn, { backgroundColor: active ? theme.accent : theme.surface, borderColor: active ? theme.accent : theme.line }]}
                        onPress={() => setWeekly(w)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.repeatText, { fontFamily: theme.fMono, color: active ? '#fff' : theme.sub }]}>
                          {w ? `🔁 Every ${weekdayName(selectedDate)}` : 'Doesn’t repeat'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {weekly && (
                  <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>
                    Shows every {weekdayName(selectedDate)} until you remove it. You can skip a single week from the event.
                  </Text>
                )}
              </View>

              <View style={styles.twoCol}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <MicroLabel>Starts</MicroLabel>
                  <TextInput style={[...input, { fontFamily: theme.fMono }]} value={time} onChangeText={(v) => { setTime(v); setError(''); }} placeholder="3:30 PM" placeholderTextColor={theme.soft} />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <MicroLabel>Ends</MicroLabel>
                  <TextInput style={[...input, { fontFamily: theme.fMono }]} value={endTime} onChangeText={(v) => { setEndTime(v); setError(''); }} placeholder="5:00 PM" placeholderTextColor={theme.soft} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <MicroLabel>Where (optional)</MicroLabel>
                <TextInput style={input} value={location} onChangeText={setLocation} placeholder="Where?" placeholderTextColor={theme.soft} />
              </View>

              <View style={styles.fieldGroup}>
                <MicroLabel>Remind me</MicroLabel>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                  {EVENT_REMINDERS.map((r) => (
                    <Pill key={r} label={r} active={reminder === r} tone={theme.accent} onPress={() => setReminder(r)} />
                  ))}
                </ScrollView>
                {reminder !== 'None' && Platform.OS === 'web' && (
                  <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>Reminders pop up on the phone app.</Text>
                )}
              </View>

              {error !== '' && <Text style={[styles.error, { fontFamily: theme.fBody, color: theme.red }]}>{error}</Text>}
              {!userId && <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>Demo mode: this stays on this device only.</Text>}

              <PrimaryBtn label={editEvent ? 'Save changes' : 'Add event +'} onPress={handleSave} disabled={!title.trim()} style={styles.addBtn} />
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
  content: { padding: 20, gap: 18, paddingBottom: 36 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: 28, lineHeight: 32 },
  fieldGroup: { gap: 8 },
  input: { minWidth: 0, borderRadius: 32, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  pillRow: { gap: 8, flexDirection: 'row' },
  datePicker: { flexDirection: 'row', alignItems: 'center', borderRadius: 32, borderWidth: 1, overflow: 'hidden' },
  dateArrow: { paddingHorizontal: 16, paddingVertical: 14 },
  dateArrowText: { fontSize: 22, lineHeight: 26 },
  dateLabel: { flex: 1, textAlign: 'center', fontSize: 14, letterSpacing: 0.3 },
  twoCol: { flexDirection: 'row', gap: 12 },
  repeatRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  repeatBtn: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  repeatText: { fontSize: 12, letterSpacing: 0.3 },
  hint: { fontSize: 12 },
  error: { fontSize: 13 },
  addBtn: { marginTop: 4 },
});
