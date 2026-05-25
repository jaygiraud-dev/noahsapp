import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { Homework } from '../../types';
import AddHomeworkSheet from './AddHomeworkSheet';

interface Props {
  hw: Homework | null;
  visible: boolean;
  onClose: () => void;
  onToggle: () => void;
}

function ImagePreviewModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.imgBackdrop} activeOpacity={1} onPress={onClose}>
        <Image source={{ uri }} style={styles.imgFull} resizeMode="contain" />
        <TouchableOpacity style={styles.imgClose} onPress={onClose}>
          <Text style={styles.imgCloseText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function HomeworkDetailSheet({ hw, visible, onClose, onToggle }: Props) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  if (!hw) return null;

  const color = hw.classColor ?? theme.accent;
  const dueDateFormatted = hw.dueDate
    ? new Date(hw.dueDate).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
    : hw.due ?? null;

  return (
    <>
      {previewUri && <ImagePreviewModal uri={previewUri} onClose={() => setPreviewUri(null)} />}
      <AddHomeworkSheet visible={editOpen} onClose={() => setEditOpen(false)} editHw={hw} />
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
            <View style={[styles.handle, { backgroundColor: theme.line }]} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={[styles.colorBar, { backgroundColor: color }]} />
                <View style={styles.headerText}>
                  <Text style={[styles.title, { fontFamily: theme.fDisplayItalic, color: theme.ink, textDecorationLine: hw.done ? 'line-through' : 'none', opacity: hw.done ? 0.5 : 1 }]}>
                    {hw.title}
                  </Text>
                  {hw.subject && (
                    <Text style={[styles.subject, { fontFamily: theme.fMono, color }]}>
                      {hw.subject}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Text style={[styles.closeBtn, { color: theme.soft }]}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Meta row */}
              <View style={styles.metaRow}>
                {hw.tag && (
                  <View style={[styles.tagBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
                    <Text style={[styles.tagText, { fontFamily: theme.fMono, color }]}>{hw.tag}</Text>
                  </View>
                )}
                {dueDateFormatted && (
                  <View style={[styles.tagBadge, { backgroundColor: hw.dueUrgent ? theme.amber + '22' : theme.surface, borderColor: hw.dueUrgent ? theme.amber + '66' : theme.line }]}>
                    <Text style={[styles.tagText, { fontFamily: theme.fMono, color: hw.dueUrgent ? theme.amber : theme.soft }]}>
                      {hw.dueUrgent ? '△ ' : ''}Due {dueDateFormatted}
                    </Text>
                  </View>
                )}
              </View>

              {/* Points */}
              <View style={[styles.pointsRow, { borderColor: theme.line }]}>
                <Text style={[styles.pointsLabel, { fontFamily: theme.fMono, color: theme.soft }]}>POINTS</Text>
                <Text style={[styles.pointsVal, { fontFamily: theme.fMono, color: theme.accent }]}>+{hw.points}</Text>
              </View>

              {/* Photos */}
              {(hw.attachedImages ?? []).length > 0 && (
                <View style={styles.photosSection}>
                  <Text style={[styles.sectionLabel, { fontFamily: theme.fMono, color: theme.soft }]}>
                    PHOTOS · {hw.attachedImages!.length}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                    {hw.attachedImages!.map((uri, i) => (
                      <TouchableOpacity key={i} onPress={() => setPreviewUri(uri)} activeOpacity={0.8}>
                        <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Actions */}
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
                onPress={() => { onClose(); setTimeout(() => setEditOpen(true), 300); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, { fontFamily: theme.fMono, color: theme.ink }]}>
                  ✎  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: hw.done ? theme.surface : color, borderColor: hw.done ? theme.line : color }]}
                onPress={() => { onToggle(); onClose(); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, { fontFamily: theme.fMono, color: hw.done ? theme.soft : '#fff' }]}>
                  {hw.done ? '○  Mark as not done' : '✓  Mark as done'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  content: { padding: 20, gap: 20, paddingBottom: 36 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  colorBar: { width: 4, borderRadius: 2, alignSelf: 'stretch', minHeight: 40 },
  headerText: { flex: 1, gap: 4 },
  title: { fontSize: 26, lineHeight: 32 },
  subject: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  closeBtn: { fontSize: 28, lineHeight: 32 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: { borderRadius: 34, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 11, letterSpacing: 0.5 },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 12 },
  pointsLabel: { fontSize: 10, letterSpacing: 1 },
  pointsVal: { fontSize: 16, letterSpacing: 0.5 },
  photosSection: { gap: 10 },
  sectionLabel: { fontSize: 10, letterSpacing: 1 },
  photosRow: { gap: 10 },
  photoThumb: { width: 120, height: 120, borderRadius: 32 },
  editBtn: { borderRadius: 34, borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
  toggleBtn: { borderRadius: 34, borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
  toggleBtnText: { fontSize: 15, letterSpacing: 0.5 },
  imgBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  imgFull: { width: '100%', height: '80%' },
  imgClose: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  imgCloseText: { color: '#fff', fontSize: 32, lineHeight: 36 },
});
