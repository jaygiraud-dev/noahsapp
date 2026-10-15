import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { Homework } from '../../types';
import { Profile } from '../../lib/db';
import { tagIcon } from '../../data/constants';
import { classesOnDate } from '../../lib/timetable';
import { isSameDay, startOfDay, fmt12, parseTime, relativeTime } from '../../lib/time';

interface Props {
  hw: Homework | null;
  kidName: string;
  profile: Profile | null | undefined;
  onClose: () => void;
  onNudge: (message: string) => void;
}

const longDate = (d: Date) => d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
const shortTime = (d: Date) => d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });

/** Plain-language status for a parent: what state it's in and how close the deadline is. */
function describe(hw: Homework): { tone: 'done' | 'overdue' | 'today' | 'soon' | 'later'; headline: string; sub: string } {
  const sod = startOfDay(new Date());
  const due = hw.dueDate ? new Date(hw.dueDate) : null;
  const days = due ? Math.round((startOfDay(due).getTime() - sod.getTime()) / 86400000) : null;
  if (hw.done) {
    const when = hw.doneAt ? new Date(hw.doneAt) : null;
    let sub = when ? `Finished ${longDate(when)} at ${shortTime(when)}` : 'Marked as finished';
    if (when && due) {
      const early = Math.round((startOfDay(due).getTime() - startOfDay(when).getTime()) / 86400000);
      sub += early > 0 ? ` · ${early} day${early === 1 ? '' : 's'} early` : early < 0 ? ` · ${-early} day${early === -1 ? '' : 's'} late` : ' · on the due date';
    }
    return { tone: 'done', headline: '✓ Done', sub };
  }
  if (!due || days === null) return { tone: 'later', headline: 'Not done yet', sub: 'No due date set' };
  if (days < 0) return { tone: 'overdue', headline: `⚠ Overdue by ${-days} day${days === -1 ? '' : 's'}`, sub: `Was due ${longDate(due)}` };
  if (days === 0) return { tone: 'today', headline: 'Due today', sub: `Not marked done yet · ${longDate(due)}` };
  if (days === 1) return { tone: 'soon', headline: 'Due tomorrow', sub: longDate(due) };
  return { tone: 'later', headline: `Due in ${days} days`, sub: longDate(due) };
}

/** Next time this class meets, from the kid's timetable (looks two weeks ahead). */
function nextClass(hw: Homework, profile: Profile | null | undefined): string | null {
  if (!hw.classId || !profile?.classes?.length) return null;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < 15; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const hit = classesOnDate(d, profile.classes, profile.timetable, profile.school_name ?? undefined)
      .find((c) => c.cls.id === hw.classId && (i > 0 || (parseTime(c.start) ?? 0) > nowMin));
    if (hit) {
      const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
      const dayLabel = i === 0 ? 'Today' : isSameDay(d, tomorrow) ? 'Tomorrow' : d.toLocaleDateString('en-CA', { weekday: 'long' });
      return `${dayLabel} at ${fmt12(hit.start)}`;
    }
  }
  return null;
}

export default function ParentHomeworkSheet({ hw, kidName, profile, onClose, onNudge }: Props) {
  const [bigPhoto, setBigPhoto] = useState<string | null>(null);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  if (!hw) return null;

  const color = hw.classColor ?? theme.accent;
  const st = describe(hw);
  const toneColor = st.tone === 'done' ? theme.mint : st.tone === 'overdue' ? theme.red : st.tone === 'today' || st.tone === 'soon' ? theme.amber : theme.accent;
  const cls = profile?.classes?.find((c) => c.id === hw.classId);
  const next = nextClass(hw, profile);
  const photos = hw.attachedImages ?? [];

  const rows: Array<[string, string]> = [
    ['Type', hw.tag ? `${tagIcon(hw.tag)}  ${hw.tag}` : '—'],
    ['Due', hw.dueDate ? longDate(new Date(hw.dueDate)) : '—'],
    ['Class', [cls?.name ?? hw.subject ?? 'Not tied to a class', cls?.teacher].filter(Boolean).join(' · ')],
    ...(next ? [['Next class', next] as [string, string]] : []),
    ...(hw.createdAt ? [['Added', relativeTime(hw.createdAt)] as [string, string]] : []),
    ...(hw.reminder && hw.reminder !== 'None' ? [[`${kidName}'s reminder`, hw.reminder] as [string, string]] : []),
    ['Points', hw.done ? `Earned +${hw.points}` : `+${hw.points} when finished`],
  ];

  const nudgeText = hw.done
    ? `Nice work finishing ${hw.title} 💪`
    : st.tone === 'overdue'
      ? `Hey, ${hw.title} is overdue. Can you get it done tonight?`
      : `How’s ${hw.title} going? 📚`;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={[styles.colorBar, { backgroundColor: color }]} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.subject, { fontFamily: theme.fMono, color }]}>{(cls?.name ?? hw.subject ?? 'Homework').toUpperCase()}</Text>
                <Text style={[styles.title, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{hw.title}</Text>
              </View>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close"><Text style={[styles.close, { color: theme.soft }]}>×</Text></TouchableOpacity>
            </View>

            <View style={[styles.statusBox, { backgroundColor: toneColor + '1a', borderColor: toneColor + '66' }]}>
              <Text style={[styles.statusHead, { fontFamily: theme.fBodySemiBold, color: toneColor }]}>{st.headline}</Text>
              <Text style={[styles.statusSub, { fontFamily: theme.fBody, color: theme.ink }]}>{st.sub}</Text>
            </View>

            <View style={[styles.table, { backgroundColor: theme.surface }]}>
              {rows.map(([k, v], i) => (
                <View key={k} style={[styles.row, { borderBottomColor: theme.line, borderBottomWidth: i < rows.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
                  <Text style={[styles.rowKey, { fontFamily: theme.fMono, color: theme.soft }]}>{k.toUpperCase()}</Text>
                  <Text style={[styles.rowVal, { fontFamily: theme.fBody, color: theme.ink }]}>{v}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { fontFamily: theme.fMono, color: theme.soft }]}>NOTES</Text>
              <Text style={[styles.notes, { fontFamily: theme.fBody, color: hw.notes ? theme.ink : theme.soft }]}>
                {hw.notes || `${kidName} didn’t add any notes.`}
              </Text>
            </View>

            {photos.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.label, { fontFamily: theme.fMono, color: theme.soft }]}>PHOTOS · {photos.length}</Text>
                <View style={styles.photoGrid}>
                  {photos.map((uri, i) => (
                    <TouchableOpacity key={i} onPress={() => setBigPhoto(uri)} accessibilityLabel={`Open photo ${i + 1}`}>
                      <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>Tap a photo to see it full size.</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.nudgeBtn, { backgroundColor: theme.accent }]} onPress={() => onNudge(nudgeText)} accessibilityLabel={`Nudge ${kidName} about this`}>
              <Text style={[styles.nudgeText, { fontFamily: theme.fMono }]}>Nudge {kidName} about this 👋</Text>
            </TouchableOpacity>
          </ScrollView>

          {bigPhoto && (
            <TouchableOpacity style={styles.photoOverlay} activeOpacity={1} onPress={() => setBigPhoto(null)} accessibilityLabel="Close photo">
              <Image source={{ uri: bigPhoto }} style={styles.photoFull} resizeMode="contain" />
              <Text style={styles.photoClose}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '90%', overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  colorBar: { width: 4, borderRadius: 2, alignSelf: 'stretch', minHeight: 44 },
  subject: { fontSize: 13, letterSpacing: 1 },
  title: { fontSize: 26, lineHeight: 31 },
  close: { fontSize: 28, lineHeight: 32 },
  statusBox: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 4 },
  statusHead: { fontSize: 17 },
  statusSub: { fontSize: 16, lineHeight: 22 },
  table: { borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  rowKey: { width: 112, fontSize: 12, letterSpacing: 0.8, paddingTop: 2 },
  rowVal: { flex: 1, fontSize: 16, lineHeight: 22 },
  section: { gap: 8 },
  label: { fontSize: 12, letterSpacing: 1.2 },
  notes: { fontSize: 16, lineHeight: 23 },
  photoGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photo: { width: 140, height: 140, borderRadius: 14 },
  hint: { fontSize: 14 },
  nudgeBtn: { borderRadius: 26, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  nudgeText: { color: '#fff', fontSize: 16, letterSpacing: 0.3 },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center', alignItems: 'center' },
  photoFull: { width: '100%', height: '85%' },
  photoClose: { position: 'absolute', top: 16, right: 20, color: '#fff', fontSize: 34 },
});
