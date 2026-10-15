import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { Class, Homework } from '../../types';
import { HW_TAGS, DUE_OPTIONS } from '../../data/constants';
import { HW_REMINDERS } from '../../lib/classNotifications';
import { pickImage } from '../../lib/images';
import { isSameDay } from '../../lib/time';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';
import Pill from '../../components/Pill';
import SerifTitle from '../../components/SerifTitle';

const MAX_PHOTOS = 3;
const NO_CLASS = '__none__';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultDate?: Date;
  defaultClass?: Class | null;
  editHw?: Homework | null;
}

/** Due dates are stored as the end of that day so "due today" is never overdue early. */
function endOfDay(d: Date): Date { const x = new Date(d); x.setHours(23, 59, 0, 0); return x; }

export default function AddHomeworkSheet({ visible, onClose, defaultDate, defaultClass, editHw }: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [classId, setClassId] = useState<string>(NO_CLASS);
  const [tag, setTag] = useState<string>(HW_TAGS[0].label);
  const [due, setDue] = useState<string>(DUE_OPTIONS[0].label);
  const [pickedDate, setPickedDate] = useState<Date>(new Date());
  const [reminder, setReminder] = useState<string>('None');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const addHomework = useStore((s) => s.addHomework);
  const editHomework = useStore((s) => s.editHomework);
  const classes = useStore((s) => s.classes);
  const userId = useStore((s) => s.userId);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  useEffect(() => {
    if (!visible) return;
    if (editHw) {
      setTitle(editHw.title);
      setNotes(editHw.notes ?? '');
      setClassId(editHw.classId && classes.some((c) => c.id === editHw.classId) ? editHw.classId : NO_CLASS);
      setTag(editHw.tag ?? HW_TAGS[0].label);
      // Editing always shows the exact due day, so nothing moves by accident
      setDue('Pick a day');
      setPickedDate(editHw.dueDate ? new Date(editHw.dueDate) : new Date());
      setReminder(editHw.reminder && (HW_REMINDERS as readonly string[]).includes(editHw.reminder) ? editHw.reminder : 'None');
      setAttachedImages(editHw.attachedImages ?? []);
    } else {
      setTitle('');
      setNotes('');
      setClassId(defaultClass?.id ?? (classes[0]?.id ?? NO_CLASS));
      setTag(HW_TAGS[0].label);
      setDue(DUE_OPTIONS[0].label);
      setPickedDate(defaultDate ? new Date(defaultDate) : new Date());
      setReminder('None');
      setAttachedImages([]);
    }
  }, [visible, defaultClass, editHw]);

  async function addPhoto(source: 'library' | 'camera') {
    if (attachedImages.length >= MAX_PHOTOS) return;
    setPhotoBusy(true);
    try {
      const img = await pickImage({ source, maxSize: 1600, quality: 0.7 });
      if (img) setAttachedImages((prev) => [...prev, img.uri]);
    } finally {
      setPhotoBusy(false);
    }
  }

  function handleAttachPhoto() {
    if (Platform.OS === 'web') { addPhoto('library'); return; }
    Alert.alert('Add a photo', 'Snap the whiteboard or pick a photo', [
      { text: 'Camera', onPress: () => addPhoto('camera') },
      { text: 'Photo library', onPress: () => addPhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function computeDueDate(): Date {
    if (due === 'Pick a day') return endOfDay(pickedDate);
    const base = defaultDate ? new Date(defaultDate) : new Date();
    if (due === 'Tomorrow') base.setDate(base.getDate() + 1);
    else if (due === 'Next week') base.setDate(base.getDate() + 7);
    return endOfDay(base);
  }

  function dueLabel(d: Date): string {
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, tomorrow)) return 'Tomorrow';
    return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function handleSave() {
    if (!title.trim()) return;
    const cls = classes.find((c) => c.id === classId);
    const dueDate = computeDueDate();
    const fields = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      classId: cls?.id,
      subject: cls?.name ?? 'Other',
      classColor: cls?.color,
      tag,
      due: dueLabel(dueDate),
      dueDate: dueDate.toISOString(),
      reminder,
      attachedImages,
    };
    if (editHw) editHomework(editHw.id, fields);
    else addHomework({ ...fields, points: 10 });
    onClose();
  }

  const pickDays = Array.from({ length: 21 }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i - 1); return d; });
  const input = [styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.titleRow}>
              <SerifTitle size={24}>{editHw ? 'Edit homework.' : 'Add homework.'}</SerifTitle>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
                <Text style={[styles.close, { color: theme.soft }]}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>What's the assignment?</MicroLabel>
              <TextInput style={input} value={title} onChangeText={setTitle} placeholder="Worksheet 3.2, read ch. 5…" placeholderTextColor={theme.soft} autoFocus={!editHw} />
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>Class</MicroLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {classes.map((c) => (
                  <Pill key={c.id} label={c.name} active={classId === c.id} tone={c.color} onPress={() => setClassId(c.id)} />
                ))}
                <Pill label="No class" active={classId === NO_CLASS} tone={theme.accent} onPress={() => setClassId(NO_CLASS)} />
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>Type</MicroLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {HW_TAGS.map((t) => (
                  <Pill key={t.id} label={`${t.icon} ${t.label}`} active={tag === t.label} tone={theme.accent} onPress={() => setTag(t.label)} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>Due</MicroLabel>
              <View style={styles.dueRow}>
                {DUE_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dueBtn, { backgroundColor: due === d.label ? theme.accent : theme.surface, borderColor: due === d.label ? theme.accent : theme.line }]}
                    onPress={() => setDue(d.label)}
                  >
                    <Text style={[styles.dueBtnText, { fontFamily: theme.fMono, color: due === d.label ? '#fff' : theme.sub }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {due === 'Pick a day' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickRow}>
                  {pickDays.map((d) => {
                    const active = isSameDay(d, pickedDate);
                    return (
                      <TouchableOpacity
                        key={d.toISOString()}
                        style={[styles.pickDay, { backgroundColor: active ? theme.accent : theme.surface, borderColor: active ? theme.accent : theme.line }]}
                        onPress={() => setPickedDate(d)}
                      >
                        <Text style={[styles.pickDayName, { fontFamily: theme.fMono, color: active ? '#fff' : theme.soft }]}>{d.toLocaleDateString('en-CA', { weekday: 'short' })}</Text>
                        <Text style={[styles.pickDayNum, { fontFamily: theme.fBodySemiBold, color: active ? '#fff' : theme.ink }]}>{d.getDate()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>Remind me</MicroLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {HW_REMINDERS.map((r) => (
                  <Pill key={r} label={r} active={reminder === r} tone={theme.accent} onPress={() => setReminder(r)} />
                ))}
              </ScrollView>
              {reminder !== 'None' && Platform.OS === 'web' && (
                <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>Reminders pop up on the phone app.</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>Notes (optional)</MicroLabel>
              <TextInput style={[...input, styles.notes]} value={notes} onChangeText={setNotes} placeholder="Pages, questions, what the teacher said…" placeholderTextColor={theme.soft} multiline />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.photoLabelRow}>
                <MicroLabel>Photos</MicroLabel>
                <Text style={[styles.photoCount, { fontFamily: theme.fMono, color: theme.soft }]}>{attachedImages.length}/{MAX_PHOTOS}</Text>
              </View>
              <View style={styles.photoRow}>
                {attachedImages.map((uri, idx) => (
                  <View key={idx} style={styles.thumbWrap}>
                    <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                    <TouchableOpacity style={[styles.thumbRemove, { backgroundColor: theme.bg }]} onPress={() => setAttachedImages((p) => p.filter((_, i) => i !== idx))} accessibilityLabel="Remove photo">
                      <Text style={[styles.thumbRemoveText, { color: theme.ink }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {attachedImages.length < MAX_PHOTOS && (
                  <TouchableOpacity style={[styles.addPhotoTile, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={handleAttachPhoto} disabled={photoBusy} activeOpacity={0.7}>
                    <Text style={styles.addPhotoIcon}>📷</Text>
                    <Text style={[styles.addPhotoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>{photoBusy ? 'Loading…' : 'Add photo'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!userId && attachedImages.length > 0 && (
                <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>Demo mode: photos stay on this device only.</Text>
              )}
            </View>

            <PrimaryBtn label={editHw ? 'Save changes' : 'Add homework +'} onPress={handleSave} disabled={!title.trim()} style={styles.addBtn} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const THUMB = 92;

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  content: { padding: 20, gap: 18, paddingBottom: 36 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: 28, lineHeight: 32 },
  fieldGroup: { gap: 8 },
  input: { borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16 },
  notes: { minHeight: 64, textAlignVertical: 'top' },
  pillRow: { gap: 8, flexDirection: 'row' },
  dueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dueBtn: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  dueBtnText: { fontSize: 14, letterSpacing: 0.5 },
  pickRow: { gap: 8, flexDirection: 'row', paddingTop: 4 },
  pickDay: { width: 48, height: 56, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pickDayName: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  pickDayNum: { fontSize: 17 },
  hint: { fontSize: 14 },
  photoLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoCount: { fontSize: 12, letterSpacing: 0.5 },
  photoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  thumbWrap: { position: 'relative', width: THUMB, height: THUMB },
  thumb: { width: THUMB, height: THUMB, borderRadius: 18 },
  thumbRemove: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  thumbRemoveText: { fontSize: 16, lineHeight: 19 },
  addPhotoTile: { width: THUMB, height: THUMB, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoIcon: { fontSize: 22 },
  addPhotoLabel: { fontSize: 11, letterSpacing: 0.5 },
  addBtn: { marginTop: 4 },
});
