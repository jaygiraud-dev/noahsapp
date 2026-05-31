import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';
import Pill from '../../components/Pill';
import AddFriendSheet from '../sheets/AddFriendSheet';

type SquadTab = 'friends' | 'groups';

function FriendRow({ friend, theme, onChat }: any) {
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
        <Text style={[styles.friendSub, { fontFamily: theme.fMono, color: theme.soft }]}>
          {friend.pts?.toLocaleString() ?? '0'} pts · {friend.streak ?? 0}🔥
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.chatBtn, { backgroundColor: theme.accent + '22', borderColor: theme.accent + '44' }]}
        onPress={() => onChat(friend)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chatBtnText, { fontFamily: theme.fMono, color: theme.accent }]}>💬</Text>
      </TouchableOpacity>
    </View>
  );
}

function FriendRequestRow({ req, theme, onAccept, onDecline }: any) {
  return (
    <View style={[styles.friendRow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={[styles.avatar, { backgroundColor: theme.accent + '22' }]}>
        <Text style={[styles.avatarText, { fontFamily: theme.fDisplayItalic, color: theme.accent }]}>
          {req.name[0]}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{req.name}</Text>
        <Text style={[styles.friendSub, { fontFamily: theme.fMono, color: theme.soft }]}>{req.school}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: theme.mint }]} onPress={onAccept}>
          <Text style={[styles.actionText, { fontFamily: theme.fMono }]}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.declineBtn, { borderColor: theme.line }]} onPress={onDecline}>
          <Text style={[styles.actionText, { fontFamily: theme.fMono, color: theme.soft }]}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({ icon, title, sub, theme }: any) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{title}</Text>
      <Text style={[styles.emptySub, { fontFamily: theme.fBody, color: theme.soft }]}>{sub}</Text>
    </View>
  );
}

export default function SquadScreen() {
  const [tab, setTab] = useState<SquadTab>('friends');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const friends = useStore((s) => s.friends);
  const friendRequests = useStore((s) => s.friendRequests);
  const acceptFriendRequest = useStore((s) => s.acceptFriendRequest);
  const declineFriendRequest = useStore((s) => s.declineFriendRequest);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  function handleChatWithFriend(_friend: any) {
    // Group chat feature coming — for now just open AddFriend to acknowledge
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <SerifTitle size={28}>squad.</SerifTitle>
        <TouchableOpacity
          style={[styles.addFriendBtn, { borderColor: theme.accent }]}
          onPress={() => setShowAddFriend(true)}
        >
          <Text style={[styles.addFriendText, { fontFamily: theme.fMono, color: theme.accent }]}>+ friend</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['friends', 'groups'] as SquadTab[]).map((t) => (
          <Pill key={t} label={t} active={tab === t} tone={theme.accent} onPress={() => setTab(t)} />
        ))}
        {friendRequests.length > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={[styles.badgeText, { fontFamily: theme.fMono }]}>{friendRequests.length}</Text>
          </View>
        )}
      </View>

      {tab === 'friends' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {friendRequests.length > 0 && (
            <View style={styles.section}>
              <MicroLabel>Requests</MicroLabel>
              {friendRequests.map((req) => (
                <FriendRequestRow
                  key={req.id}
                  req={req}
                  theme={theme}
                  onAccept={() => acceptFriendRequest(req.id)}
                  onDecline={() => declineFriendRequest(req.id)}
                />
              ))}
            </View>
          )}
          <MicroLabel>Your friends</MicroLabel>
          {friends.length === 0 ? (
            <EmptyState
              icon="👋"
              title="No friends yet."
              sub={"Tap \"+ friend\" to add someone using their pairing code."}
              theme={theme}
            />
          ) : (
            friends.map((f) => (
              <FriendRow key={f.id} friend={f} theme={theme} onChat={handleChatWithFriend} />
            ))
          )}
        </ScrollView>
      )}

      {tab === 'groups' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          <EmptyState
            icon="💬"
            title="No groups yet."
            sub="Add friends first, then tap 💬 on a friend to start a group chat."
            theme={theme}
          />
          {friends.length > 0 && (
            <TouchableOpacity
              style={[styles.createGroupBtn, { backgroundColor: theme.accent }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.createGroupText, { fontFamily: theme.fMono, color: '#fff' }]}>
                + Create group chat
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <AddFriendSheet visible={showAddFriend} onClose={() => setShowAddFriend(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addFriendBtn: { borderRadius: 100, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  addFriendText: { fontSize: 12, letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  badge: { borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  section: { gap: 8, marginBottom: 8 },
  friendRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 0, padding: 12, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20 },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 15 },
  friendSub: { fontSize: 11, letterSpacing: 0.3, marginTop: 2 },
  chatBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  chatBtnText: { fontSize: 16 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  declineBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 22 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
  createGroupBtn: { borderRadius: 32, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  createGroupText: { fontSize: 14, letterSpacing: 0.5 },
});
