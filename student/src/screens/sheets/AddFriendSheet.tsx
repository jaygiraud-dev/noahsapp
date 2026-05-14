import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { FRIEND_SUGGESTIONS } from '../../data/constants';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';
import SerifTitle from '../../components/SerifTitle';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AddFriendSheet({ visible, onClose }: Props) {
  const [query, setQuery] = useState('');
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  const filtered = FRIEND_SUGGESTIONS.filter(
    (s) =>
      query.length === 0 ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.school.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modal, { backgroundColor: theme.bg }]}
      >
        <View style={[styles.handle, { backgroundColor: theme.line }]} />
        <View style={styles.header}>
          <SerifTitle size={24}>Add a friend.</SerifTitle>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.close, { color: theme.soft }]}>×</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody },
          ]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or school…"
          placeholderTextColor={theme.soft}
          autoFocus
        />

        {filtered.length > 0 && (
          <View style={styles.suggestions}>
            <MicroLabel>Suggestions</MicroLabel>
            <FlatList
              data={filtered}
              keyExtractor={(s) => s.id}
              contentContainerStyle={styles.suggestionList}
              renderItem={({ item }) => (
                <View style={[styles.suggRow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                  <View style={[styles.avatar, { backgroundColor: theme.accent + '33' }]}>
                    <Text style={[styles.avatarText, { fontFamily: theme.fDisplayItalic, color: theme.accent }]}>
                      {item.name[0]}
                    </Text>
                  </View>
                  <View style={styles.suggInfo}>
                    <Text style={[styles.suggName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.suggSchool, { fontFamily: theme.fMono, color: theme.soft }]}>
                      {item.school}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}
                    onPress={() => {
                      // TODO: send friend request via Supabase
                      onClose();
                    }}
                  >
                    <Text style={[styles.addBtnText, { fontFamily: theme.fMono, color: theme.accent }]}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        <View style={styles.codeSection}>
          <MicroLabel>Or share your code</MicroLabel>
          <View style={[styles.codeBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <Text style={[styles.code, { fontFamily: theme.fMono, color: theme.accent }]}>
              {useStore.getState().pairingCode}
            </Text>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: theme.accent }]}
              onPress={() => { /* TODO: Clipboard.setString */ }}
            >
              <Text style={[styles.copyText, { fontFamily: theme.fMono, color: '#fff' }]}>copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  close: { fontSize: 28, lineHeight: 32 },
  search: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  suggestions: { flex: 1, paddingHorizontal: 20, gap: 10 },
  suggestionList: { gap: 8, paddingTop: 8 },
  suggRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18 },
  suggInfo: { flex: 1 },
  suggName: { fontSize: 15 },
  suggSchool: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  addBtn: { borderRadius: 8, borderWidth: 1, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 20, lineHeight: 24 },
  codeSection: { padding: 20, gap: 10 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  code: { fontSize: 22, letterSpacing: 4 },
  copyBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  copyText: { fontSize: 12, letterSpacing: 0.5 },
});
