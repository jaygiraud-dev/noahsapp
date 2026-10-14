import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { CalEvent } from '../../types';
import { eventIcon } from '../../data/constants';
import { confirmAction } from '../../lib/confirm';
import { fmt12 } from '../../lib/time';

interface Props {
  ev: CalEvent | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (ev: CalEvent) => void;
}

export default function EventDetailSheet({ ev, visible, onClose, onEdit }: Props) {
  const deleteEvent = useStore((s) => s.deleteEvent);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  if (!ev) return null;

  const when = [
    ev.date ? new Date(ev.date).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }) : '',
    ev.time ? `${fmt12(ev.time)}${ev.endTime ? ` – ${fmt12(ev.endTime)}` : ''}` : '',
  ].filter(Boolean).join(' · ');

  function handleDelete() {
    const target = ev!;
    confirmAction('Delete event?', `“${target.title}” will be removed for good.`, 'Delete', () => {
      onClose();
      deleteEvent(target.id);
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.icon}>{ev.icon ?? eventIcon(ev.type)}</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.title, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{ev.title}</Text>
                {ev.type && <Text style={[styles.type, { fontFamily: theme.fMono, color: theme.accent }]}>{ev.type.toUpperCase()}</Text>}
              </View>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
                <Text style={[styles.closeBtn, { color: theme.soft }]}>×</Text>
              </TouchableOpacity>
            </View>
            {when !== '' && <Text style={[styles.line, { fontFamily: theme.fBody, color: theme.ink }]}>🕒  {when}</Text>}
            {ev.location && <Text style={[styles.line, { fontFamily: theme.fBody, color: theme.ink }]}>📍  {ev.location}</Text>}
            {ev.reminder && ev.reminder !== 'None' && (
              <Text style={[styles.line, { fontFamily: theme.fBody, color: theme.sub }]}>⏰  Reminder: {ev.reminder}</Text>
            )}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.halfBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
                onPress={() => { const t = ev; onClose(); setTimeout(() => onEdit(t), 250); }}
              >
                <Text style={[styles.btnText, { fontFamily: theme.fMono, color: theme.ink }]}>✎  Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.halfBtn, { borderColor: theme.red + '66' }]} onPress={handleDelete}>
                <Text style={[styles.btnText, { fontFamily: theme.fMono, color: theme.red }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  content: { padding: 20, gap: 14, paddingBottom: 36 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { fontSize: 30 },
  title: { fontSize: 26, lineHeight: 32 },
  type: { fontSize: 10, letterSpacing: 1.2 },
  closeBtn: { fontSize: 28, lineHeight: 32 },
  line: { fontSize: 15, lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  halfBtn: { flex: 1, borderRadius: 34, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 14, letterSpacing: 0.5 },
});
