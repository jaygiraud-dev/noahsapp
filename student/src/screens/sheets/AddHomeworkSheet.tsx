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
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { Class, Homework } from '../../types';
import { HW_TAGS, DUE_OPTIONS } from '../../data/constants';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';
import Pill from '../../components/Pill';
import SerifTitle from '../../components/SerifTitle';

const MAX_PHOTOS = 3;

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultDate?: Date;
  defaultClass?: Class | null;
  editHw?: Homework | null;
}

export default function AddHomeworkSheet({ visible, onClose, defaultDate, defaultClass, editHw }: Props) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(defaultClass?.name ?? '');
  const [tag, setTag] = useState<string>(HW_TAGS[0].label);
  const [due, setDue] = useState<string>(DUE_OPTIONS[0].label);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [pickedDate, setPickedDate] = useState<Date>(new Date());
  const addHomework = useStore((s) => s.addHomework);
  const editHomework = useStore((s) => s.editHomework);
  const classes = useStore((s) => s.classes);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  useEffect(() => {
    if (visible) {
      if (editHw) {
        setTitle(editHw.title);
        setSubject(editHw.subject ?? '');
        setTag(editHw.tag ?? HW_TAGS[0].label);
        setDue(editHw.due ?? DUE_OPTIONS[0].label);
        setAttachedImages(editHw.attachedImages ?? []);
        setPickedDate(editHw.dueDate ? new Date(editHw.dueDate) : new Date());
      } else {
        setPickedDate(defaultDate ? new Date(defaultDate) : new Date());
        setSubject(defaultClass?.name ?? '');
        setTitle('');
        setTag(HW_TAGS[0].label);
        setDue(DUE_OPTIONS[0].label);
        setAttachedImages([]);
      }
    }
  }, [visible, defaultClass, editHw]);

  async function pickImage(fromCamera: boolean) {
    if (attachedImages.length >= MAX_PHOTOS) return;

    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to take photos.');
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.5,
          base64: Platform.OS === 'web',
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.5,
          base64: Platform.OS === 'web',
        });

    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = Platform.OS === 'web' && asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setAttachedImages((prev) => [...prev, uri]);
    }
  }

  function handleAttachPhoto() {
    if (Platform.OS === 'web') {
      pickImage(false);
      return;
    }
    Alert.alert('Add photo', 'Choose source', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Photo library', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function removeImage(idx: number) {
    setAttachedImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function computeDueDate(): Date {
    if (due === 'Pick a day') return new Date(pickedDate);
    const base = editHw ? new Date() : defaultDate ? new Date(defaultDate) : new Date();
    if (due === 'Tomorrow') base.setDate(base.getDate() + 1);
    else if (due === 'In 3 days') base.setDate(base.getDate() + 3);
    else if (due === 'Next week') base.setDate(base.getDate() + 7);
    return base;
  }

  function handleAdd() {
    if (!title.trim()) return;
    const matchedClass = classes.find((c) => c.name === subject);
    const dueDate = computeDueDate();
    if (editHw) {
      // Only move the due date when the user actually changed the due option
      const dueChanged = due !== (editHw.due ?? DUE_OPTIONS[0].label) || due === 'Pick a day';
      editHomework(editHw.id, {
        title: title.trim(),
        subject: subject || 'General',
        classId: matchedClass?.id,
        classColor: matchedClass?.color,
        tag,
        due,
        ...(dueChanged ? { dueDate: dueDate.toISOString() } : {}),
        attachedImages: attachedImages.length > 0 ? attachedImages : undefined,
      });
    } else {
      addHomework({
        classId: matchedClass?.id,
        subject: subject || 'General',
        classColor: matchedClass?.color,
        title: title.trim(),
        tag,
        due,
        dueDate: dueDate.toISOString(),
        points: 10,
        attachedImages: attachedImages.length > 0 ? attachedImages : undefined,
      });
    }
    onClose();
  }

  // 14 upcoming days for the "Pick a day" option
  const pickDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i); return d;
  });
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const canAddMore = attachedImages.length < MAX_PHOTOS;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.titleRow}>
              <SerifTitle size={24}>{editHw ? 'Edit homework.' : 'Add homework.'}</SerifTitle>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.close, { color: theme.soft }]}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>Title</MicroLabel>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
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
                  <Pill key={c.id} label={c.name} active={subject === c.name} tone={c.color} onPress={() => setSubject(c.name)} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>Tag</MicroLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {HW_TAGS.map((t) => (
                  <Pill key={t.id} label={t.label} active={tag === t.label} tone={theme.accent} onPress={() => setTag(t.label)} />
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
                    <Text style={[styles.dueBtnText, { fontFamily: theme.fMono, color: due === d.label ? '#fff' : theme.sub }]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {due === 'Pick a day' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickRow}>
                  {pickDays.map((d) => {
                    const active = sameDay(d, pickedDate);
                    return (
                      <TouchableOpacity
                        key={d.toISOString()}
                        style={[styles.pickDay, { backgroundColor: active ? theme.accent : theme.surface, borderColor: active ? theme.accent : theme.line }]}
                        onPress={() => setPickedDate(d)}
                      >
                        <Text style={[styles.pickDayName, { fontFamily: theme.fMono, color: active ? '#fff' : theme.soft }]}>
                          {d.toLocaleDateString('en-CA', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.pickDayNum, { fontFamily: theme.fBodySemiBold, color: active ? '#fff' : theme.ink }]}>
                          {d.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Photo attachments — up to 3 */}
            <View style={styles.fieldGroup}>
              <View style={styles.photoLabelRow}>
                <MicroLabel>Photos</MicroLabel>
                <Text style={[styles.photoCount, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {attachedImages.length}/{MAX_PHOTOS}
                </Text>
              </View>
              <View style={styles.photoRow}>
                {attachedImages.map((uri, idx) => (
                  <View key={idx} style={styles.thumbWrap}>
                    <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                    <TouchableOpacity
                      style={[styles.thumbRemove, { backgroundColor: theme.bg }]}
                      onPress={() => removeImage(idx)}
                    >
                      <Text style={[styles.thumbRemoveText, { color: theme.ink }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {canAddMore && (
                  <TouchableOpacity
                    style={[styles.addPhotoTile, { backgroundColor: theme.surface, borderColor: theme.line }]}
                    onPress={handleAttachPhoto}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addPhotoIcon, { color: theme.soft }]}>📷</Text>
                    <Text style={[styles.addPhotoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>
                      Add photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <PrimaryBtn label={editHw ? 'Save changes' : 'Add homework +'} onPress={handleAdd} disabled={!title.trim()} style={styles.addBtn} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const THUMB_SIZE = 96;

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  content: { padding: 20, gap: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: 28, lineHeight: 32 },
  fieldGroup: { gap: 8 },
  input: { borderRadius: 32, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  pillRow: { gap: 8, flexDirection: 'row' },
  dueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dueBtn: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  dueBtnText: { fontSize: 12, letterSpacing: 0.5 },
  pickRow: { gap: 8, flexDirection: 'row', paddingTop: 10 },
  pickDay: { width: 48, height: 56, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pickDayName: { fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  pickDayNum: { fontSize: 16 },
  photoLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoCount: { fontSize: 10, letterSpacing: 0.5 },
  photoRow: { flexDirection: 'row', gap: 10 },
  thumbWrap: { position: 'relative', width: THUMB_SIZE, height: THUMB_SIZE },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 28 },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  thumbRemoveText: { fontSize: 14, lineHeight: 18 },
  addPhotoTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoIcon: { fontSize: 22 },
  addPhotoLabel: { fontSize: 9, letterSpacing: 0.5 },
  addBtn: { marginTop: 8 },
});
