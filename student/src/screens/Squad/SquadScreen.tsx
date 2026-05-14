import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { SAMPLE_SCHOOL_BOARD, SAMPLE_CHAT } from '../../data/constants';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';
import Pill from '../../components/Pill';
import AddFriendSheet from '../sheets/AddFriendSheet';

type SquadTab = 'board' | 'friends' | 'groups';

function BoardEntry({ entry, rank, theme }: any) {
  return (
    <View style={[styles.boardRow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.boardRank, { fontFamily: theme.fMono, color: theme.soft }]}>#{rank}</Text>
      <View style={[styles.avatar, { backgroundColor: theme.accent + '33' }]}>
        <Text style={[styles.avatarText, { fontFamily: theme.fDisplayItalic, color: theme.accent }]}>
          {entry.name[0]}
        </Text>
      </View>
      <View style={styles.boardInfo}>
        <Text style={[styles.boardName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>
          {entry.name}
        </Text>
        <Text style={[styles.boardSchool, { fontFamily: theme.fMono, color: theme.soft }]}>
          {entry.school}
        </Text>
      </View>
      <Text style={[styles.boardPts, { fontFamily: theme.fMono, color: theme.accent }]}>
        {entry.points}
      </Text>
    </View>
  );
}

function FriendRow({ friend, theme }: any) {
  return (
    <View style={[styles.friendRow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={[styles.avatar, { backgroundColor: friend.color + '33' }]}>
        <Text style={[styles.avatarText, { fontFamily: theme.fDisplayItalic, color: friend.color }]}>
          {friend.name[0]}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>
          {friend.name}
        </Text>
        <Text style={[styles.friendPts, { fontFamily: theme.fMono, color: theme.soft }]}>
          {friend.points} pts · {friend.streak}️’ streak
        </Text>
      </View>
      <View style={[styles.streakBadge, { backgroundColor: friend.color + '22' }]}>
        <Text style={[styles.streakBadgeText, { fontFamily: theme.fMono, color: friend.color }]}>
          #{friend.rank ?? '?'}
        </Text>
      </View>
    </View>
  );
}

function FriendRequest({ req, theme, onAccept, onDecline }: any) {
  return (
    <View style={[styles.requestRow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={[styles.avatar, { backgroundColor: theme.magenta + '33' }]}>
        <Text style={[styles.avatarText, { fontFamily: theme.fDisplayItalic, color: theme.magenta }]}>
          {req.name[0]}
        </Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={[styles.friendName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>
          {req.name}
        </Text>
        <Text style={[styles.friendPts, { fontFamily: theme.fMono, color: theme.soft }]}>
          {req.school}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: theme.mint }]}
          onPress={onAccept}
        >
          <Text style={[styles.acceptText, { fontFamily: theme.fMono }]}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: theme.line }]}
          onPress={onDecline}
        >
          <Text style={[styles.declineText, { fontFamily: theme.fMono, color: theme.soft }]}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GroupChatView({ theme }: any) {
  const [msg, setMsg] = useState('');
  const [msgs, setMsgs] = useState(SAMPLE_CHAT);

  function send() {
    if (!msg.trim()) return;
    setMsgs((prev) => [
      ...prev,
      { id: Date.now().toString(), author: 'You', text: msg, time: 'now', mine: true },
    ]);
    setMsg('');
  }

  return (
    <View style={styles.groupChat}>
      <FlatList
        data={msgs}
        keyExtractor={(m) => m.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.mine && styles.bubbleMine]}>
            {!item.mine && (
              <Text style={[styles.bubbleAuthor, { fontFamily: theme.fMono, color: theme.soft }]}>
                {item.author}
              </Text>
            )}
            <View
              style={[
                styles.bubbleBody,
                { backgroundColor: item.mine ? theme.accent : theme.surface },
              ]}
            >
              <Text style={[
                styles.bubbleText,
                { fontFamily: theme.fBody, color: item.mine ? '#fff' : theme.ink },
              ]}>
                {item.text}
              </Text>
            </View>
            <Text style={[styles.bubbleTime, { fontFamily: theme.fMono, color: theme.soft }]}>
              {item.time}
            </Text>
          </View>
        )}
      />
      <View style={[styles.chatInputRow, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
        <TextInput
          style={[styles.chatInput, { fontFamily: theme.fBody, color: theme.ink }]}
          value={msg}
          onChangeText={setMsg}
          placeholder="Message…"
          placeholderTextColor={theme.soft}
          onSubmitEditing={send}
        />
        <TouchableOpacity onPress={send} style={[styles.sendBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.sendIcon, { color: '#fff' }]}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SquadScreen() {
  const [tab, setTab] = useState<SquadTab>('board');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const friends = useStore((s) => s.friends);
  const friendRequests = useStore((s) => s.friendRequests);
  const acceptFriendRequest = useStore((s) => s.acceptFriendRequest);
  const declineFriendRequest = useStore((s) => s.declineFriendRequest);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <SerifTitle size={28}>squad.</SerifTitle>
        <TouchableOpacity
          style={[styles.addFriendBtn, { borderColor: theme.accent }]}
          onPress={() => setShowAddFriend(true)}
        >
          <Text style={[styles.addFriendText, { fontFamily: theme.fMono, color: theme.accent }]}>
            + friend
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['board', 'friends', 'groups'] as SquadTab[]).map((t) => (
          <Pill
            key={t}
            label={t}
            active={tab === t}
            tone={theme.accent}
            onPress={() => setTab(t)}
          />
        ))}
        {friendRequests.length > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.magenta }]}>
            <Text style={[styles.badgeText, { fontFamily: theme.fMono }]}>{friendRequests.length}</Text>
          </View>
        )}
      </View>

      {tab === 'board' && (
        <FlatList
          data={SAMPLE_SCHOOL_BOARD}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <BoardEntry entry={item} rank={index + 1} theme={theme} />
          )}
        />
      )}

      {tab === 'friends' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {friendRequests.length > 0 && (
            <View style={styles.requestsSection}>
              <MicroLabel color={theme.magenta}>Requests</MicroLabel>
              {friendRequests.map((req) => (
                <FriendRequest
                  key={req.id}
                  req={req}
                  theme={theme}
                  onAccept={() => acceptFriendRequest(req.id)}
                  onDecline={() => declineFriendRequest(req.id)}
                />
              ))}
            </View>
          )}
          <MicroLabel style={{ marginBottom: 8 }}>Your squad</MicroLabel>
          {friends.map((f) => (
            <FriendRow key={f.id} friend={f} theme={theme} />
          ))}
        </ScrollView>
      )}

      {tab === 'groups' && (
        <GroupChatView theme={theme} />
      )}

      <AddFriendSheet visible={showAddFriend} onClose={() => setShowAddFriend(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addFriendBtn: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addFriendText: { fontSize: 12, letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  badge: { borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  boardRank: { fontSize: 13, letterSpacing: 0.5, minWidth: 28 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18 },
  boardInfo: { flex: 1 },
  boardName: { fontSize: 15 },
  boardSchool: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  boardPts: { fontSize: 14, letterSpacing: 0.5 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 15 },
  friendPts: { fontSize: 11, letterSpacing: 0.3 },
  streakBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  streakBadgeText: { fontSize: 12, letterSpacing: 0.5 },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  requestInfo: { flex: 1 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  declineBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  declineText: { fontSize: 18 },
  requestsSection: { gap: 8, marginBottom: 16 },
  groupChat: { flex: 1 },
  chatList: { flex: 1 },
  chatContent: { padding: 16, gap: 12 },
  bubble: { gap: 2 },
  bubbleMine: { alignItems: 'flex-end' },
  bubbleAuthor: { fontSize: 10, letterSpacing: 0.5, marginLeft: 4 },
  bubbleBody: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, maxWidth: '80%' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 9, marginHorizontal: 4 },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chatInput: { flex: 1, fontSize: 15, paddingVertical: 8 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { fontSize: 18, fontWeight: '700' },
});
