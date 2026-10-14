import { supabase } from './supabase';
import { Homework, CalEvent, Class, ActivityItem, ParentConnection, Timetable } from '../types';

// ─── PROFILES ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  role: 'student' | 'parent';
  display_name: string | null;
  pairing_code: string | null;
  school_name: string | null;
  school_city: string | null;
  grade: number | null;
  classes: Class[] | null;
  timetable: Timetable | null;
  points: number | null;
  streak: number | null;
  last_activity_date: string | null;
  avatar: string | null;
  onboarded: boolean | null;
  push_token: string | null;
}

const PROFILE_COLS =
  'id, role, display_name, pairing_code, school_name, school_city, grade, classes, timetable, points, streak, last_activity_date, avatar, onboarded, push_token';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLS).eq('id', userId).maybeSingle();
  if (error) { console.warn('[db] getProfile:', error.message); throw error; }
  return (data as Profile) ?? null;
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * The database trigger normally creates the profile at sign-up. This is the
 * fallback for accounts made before the trigger existed. Never overwrites.
 */
export async function ensureProfile(userId: string, role: 'student' | 'parent', displayName: string): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    { id: userId, role, display_name: displayName, pairing_code: role === 'student' ? randomCode() : null },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error) console.warn('[db] ensureProfile:', error.message);
}

export interface ProfilePatch {
  displayName?: string;
  classes?: Class[];
  timetable?: Timetable | null;
  points?: number;
  streak?: number;
  lastActivityDate?: string;
  schoolName?: string;
  schoolCity?: string;
  grade?: number;
  avatar?: string | null;
  onboarded?: boolean;
  pushToken?: string;
}

export async function updateProfile(userId: string, p: ProfilePatch): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (p.displayName !== undefined) row.display_name = p.displayName;
  if (p.classes !== undefined) row.classes = p.classes;
  if (p.timetable !== undefined) row.timetable = p.timetable;
  if (p.points !== undefined) row.points = p.points;
  if (p.streak !== undefined) row.streak = p.streak;
  if (p.lastActivityDate !== undefined) row.last_activity_date = p.lastActivityDate;
  if (p.schoolName !== undefined) row.school_name = p.schoolName;
  if (p.schoolCity !== undefined) row.school_city = p.schoolCity;
  if (p.grade !== undefined) row.grade = p.grade;
  if (p.avatar !== undefined) row.avatar = p.avatar;
  if (p.onboarded !== undefined) row.onboarded = p.onboarded;
  if (p.pushToken !== undefined) row.push_token = p.pushToken;
  const { error } = await supabase.from('profiles').update(row).eq('id', userId);
  if (error) console.warn('[db] updateProfile:', error.message);
}

// ─── HOMEWORK ────────────────────────────────────────────────────────────────

export async function fetchHomework(userId: string): Promise<Homework[]> {
  const { data, error } = await supabase
    .from('homework').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) { console.warn('[db] fetchHomework:', error.message); throw error; }
  return (data ?? []).map(rowToHomework);
}

/** Saves one homework row. Returns null on success, or the error message. */
export async function upsertHomework(userId: string, hw: Homework): Promise<string | null> {
  const { error } = await supabase.from('homework').upsert(
    {
      id: hw.id,
      user_id: userId,
      class_id: hw.classId ?? null,
      subject: hw.subject ?? null,
      class_color: hw.classColor ?? null,
      title: hw.title,
      notes: hw.notes ?? null,
      tag: hw.tag ?? null,
      due: hw.due ?? null,
      due_date: hw.dueDate ?? null,
      due_urgent: hw.dueUrgent ?? false,
      reminder: hw.reminder ?? null,
      points: hw.points,
      done: hw.done,
      done_at: hw.doneAt ?? null,
      photos: hw.photos ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  ).then((r) => r, (e) => ({ error: { message: e?.message ?? 'Network request failed' } as any }));
  if (error) { console.warn('[db] upsertHomework:', error.message); return error.message; }
  return null;
}

export async function deleteHomeworkRow(id: string): Promise<void> {
  const { error } = await supabase.from('homework').delete().eq('id', id);
  if (error) console.warn('[db] deleteHomework:', error.message);
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export async function fetchEvents(userId: string): Promise<CalEvent[]> {
  const { data, error } = await supabase
    .from('events').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) { console.warn('[db] fetchEvents:', error.message); throw error; }
  return (data ?? []).map(rowToEvent);
}

/** Saves one event row. Returns null on success, or the error message. */
export async function upsertEvent(userId: string, ev: CalEvent): Promise<string | null> {
  const { error } = await supabase.from('events').upsert(
    {
      id: ev.id,
      user_id: userId,
      title: ev.title,
      kind: ev.kind ?? null,
      type: ev.type ?? null,
      icon: ev.icon ?? null,
      time: ev.time ?? null,
      end_time: ev.endTime ?? null,
      date: ev.date ?? null,
      location: ev.location ?? null,
      reminder: ev.reminder ?? null,
      done: ev.done,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  ).then((r) => r, (e) => ({ error: { message: e?.message ?? 'Network request failed' } as any }));
  if (error) { console.warn('[db] upsertEvent:', error.message); return error.message; }
  return null;
}

export async function deleteEventRow(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) console.warn('[db] deleteEvent:', error.message);
}

// ─── ACTIVITY ────────────────────────────────────────────────────────────────

export async function logActivity(
  studentId: string, type: string, text: string, subject?: string, color?: string
): Promise<void> {
  const { error } = await supabase.from('activity').insert({
    student_id: studentId, type, text, subject: subject ?? null, color: color ?? null,
  });
  if (error) console.warn('[db] logActivity:', error.message);
}

export async function fetchActivity(studentIds: string[], limit = 100): Promise<ActivityItem[]> {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from('activity').select('*').in('student_id', studentIds)
    .order('created_at', { ascending: false }).limit(limit);
  if (error) { console.warn('[db] fetchActivity:', error.message); return []; }
  return (data ?? []).map((r: any) => ({
    id: r.id, studentId: r.student_id, type: r.type, text: r.text,
    subject: r.subject, color: r.color, createdAt: r.created_at,
  }));
}

// ─── PARENT ↔ STUDENT ────────────────────────────────────────────────────────

export type LinkResult =
  | { ok: true; studentId: string; name: string | null; school: string | null }
  | { ok: false; reason: 'code_not_found' | 'not_a_parent' | 'not_signed_in' | 'network' };

export async function linkStudentByCode(code: string): Promise<LinkResult> {
  const { data, error } = await supabase.rpc('link_student_by_code', { p_code: code.trim().toUpperCase() });
  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('code_not_found')) return { ok: false, reason: 'code_not_found' };
    if (msg.includes('not_a_parent')) return { ok: false, reason: 'not_a_parent' };
    if (msg.includes('not_signed_in')) return { ok: false, reason: 'not_signed_in' };
    console.warn('[db] linkStudentByCode:', msg);
    return { ok: false, reason: 'network' };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, studentId: row.student_id, name: row.display_name, school: row.school_name };
}

export async function fetchLinkedStudents(parentId: string): Promise<Array<{ student_id: string; student_name: string | null; pairing_code: string }>> {
  const { data, error } = await supabase
    .from('parent_student_links').select('student_id, student_name, pairing_code').eq('parent_id', parentId);
  if (error) { console.warn('[db] fetchLinkedStudents:', error.message); throw error; }
  return data ?? [];
}

export async function deleteParentLink(parentId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from('parent_student_links').delete().eq('parent_id', parentId).eq('student_id', studentId);
  if (error) console.warn('[db] deleteParentLink:', error.message);
}

export async function getMyParents(): Promise<ParentConnection[]> {
  const { data, error } = await supabase.rpc('get_my_parents');
  if (error) { console.warn('[db] getMyParents:', error.message); return []; }
  return (data ?? []).map((r: any) => ({ parentId: r.parent_id, name: r.display_name ?? 'Parent', linkedAt: r.linked_at }));
}

export async function getParentPushTokens(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_parent_push_tokens');
  if (error) return [];
  return (data ?? []).map((r: any) => (typeof r === 'string' ? r : r.get_parent_push_tokens)).filter(Boolean);
}

export interface WeekStats {
  completedThisWeek: number;
  totalThisWeek: number;
  pointsThisWeek: number;
  upcomingTests: Array<{ title: string; subject?: string; dueDate?: string; classColor?: string; tag?: string }>;
}

export interface StudentSnapshot {
  homework: Homework[];
  events: CalEvent[];
  profile: Profile | null;
  weekStats: WeekStats;
}

export async function fetchStudentData(studentId: string): Promise<StudentSnapshot> {
  const [hwRes, evRes, profileRes] = await Promise.all([
    supabase.from('homework').select('*').eq('user_id', studentId).order('created_at', { ascending: true }),
    supabase.from('events').select('*').eq('user_id', studentId).order('created_at', { ascending: true }),
    supabase.from('profiles').select(PROFILE_COLS).eq('id', studentId).maybeSingle(),
  ]);

  const homework = (hwRes.data ?? []).map(rowToHomework);

  // "This week" = Monday 00:00 through Sunday 23:59 of the current week
  const now = new Date();
  const monday = new Date(now); monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);
  const twoWeeksOut = new Date(now); twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  const thisWeek = homework.filter((h) => h.dueDate && new Date(h.dueDate) >= monday && new Date(h.dueDate) < nextMonday);
  const completed = thisWeek.filter((h) => h.done);
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);

  const testKeywords = /test|quiz|exam|project|presentation|essay/i;
  const upcomingTests = homework
    .filter((h) => {
      if (h.done || !h.dueDate) return false;
      const d = new Date(h.dueDate);
      if (d < startOfToday || d > twoWeeksOut) return false;
      return testKeywords.test(h.title) || testKeywords.test(h.tag ?? '');
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .map((h) => ({ title: h.title, subject: h.subject, dueDate: h.dueDate, classColor: h.classColor, tag: h.tag }));

  return {
    homework,
    events: (evRes.data ?? []).map(rowToEvent),
    profile: (profileRes.data as Profile) ?? null,
    weekStats: {
      completedThisWeek: completed.length,
      totalThisWeek: thisWeek.length,
      pointsThisWeek: completed.reduce((s, h) => s + (h.points ?? 10), 0),
      upcomingTests,
    },
  };
}

// ─── NUDGES ──────────────────────────────────────────────────────────────────

export async function sendNudge(parentId: string, studentId: string, message: string): Promise<boolean> {
  const { error } = await supabase.from('nudges').insert({ parent_id: parentId, student_id: studentId, message });
  if (error) { console.warn('[db] sendNudge:', error.message); return false; }
  return true;
}

export async function fetchUnseenNudges(studentId: string): Promise<Array<{ id: string; message: string; sentAt: string }>> {
  const { data, error } = await supabase
    .from('nudges').select('id, message, sent_at').eq('student_id', studentId).eq('seen', false)
    .order('sent_at', { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: any) => ({ id: r.id, message: r.message, sentAt: r.sent_at }));
}

export async function markNudgeSeen(id: string): Promise<void> {
  await supabase.from('nudges').update({ seen: true }).eq('id', id);
}

// ─── FRIENDS ─────────────────────────────────────────────────────────────────

export type AddFriendResult = 'added' | 'already' | 'not_found' | 'self' | 'not_signed_in' | 'error';

export async function addFriendByCode(code: string): Promise<AddFriendResult> {
  const { data, error } = await supabase.rpc('add_friend_by_code', { p_code: code.trim().toUpperCase() });
  if (error) { console.warn('[db] addFriendByCode:', error.message); return 'error'; }
  return (data as AddFriendResult) ?? 'error';
}

export async function removeFriendRow(friendId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_friend', { p_friend: friendId });
  if (error) console.warn('[db] removeFriend:', error.message);
}

export async function getFriends(): Promise<Array<{
  id: string; display_name: string | null; school_name: string | null; grade: number | null;
  points: number; streak: number; last_activity_date: string | null; avatar: string | null;
}>> {
  const { data, error } = await supabase.rpc('get_friends');
  if (error) { console.warn('[db] getFriends:', error.message); throw error; }
  return data ?? [];
}

// ─── HOMEWORK PHOTOS (private bucket) ────────────────────────────────────────

const BUCKET = 'homework-photos';

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return await res.blob();
}

export async function uploadHomeworkPhoto(userId: string, hwId: string, uri: string): Promise<string | null> {
  try {
    const path = `${userId}/${hwId}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.jpg`;
    const blob = await uriToBlob(uri);
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) { console.warn('[db] uploadHomeworkPhoto:', error.message); return null; }
    return path;
  } catch (e: any) {
    console.warn('[db] uploadHomeworkPhoto:', e?.message);
    return null;
  }
}

/** Returns a map path → temporary URL (valid for a day). */
export async function signPhotoPaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 24);
  if (error || !data) { console.warn('[db] signPhotoPaths:', error?.message); return {}; }
  const out: Record<string, string> = {};
  data.forEach((d: any) => { if (d.signedUrl && d.path) out[d.path] = d.signedUrl; });
  return out;
}

export async function deletePhotoPaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.warn('[db] deletePhotoPaths:', error.message);
}

// ─── PUSH ────────────────────────────────────────────────────────────────────

export async function sendExpoPush(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
    });
  } catch {
    // Push is best-effort; the in-app feed is the source of truth.
  }
}

// ─── ROW MAPPERS ─────────────────────────────────────────────────────────────

function rowToHomework(row: any): Homework {
  return {
    id: row.id,
    classId: row.class_id ?? undefined,
    subject: row.subject ?? undefined,
    classColor: row.class_color ?? undefined,
    title: row.title,
    notes: row.notes ?? undefined,
    tag: row.tag ?? undefined,
    due: row.due ?? undefined,
    dueDate: row.due_date ?? undefined,
    dueUrgent: row.due_urgent ?? false,
    reminder: row.reminder ?? null,
    points: row.points ?? 10,
    done: row.done ?? false,
    doneAt: row.done_at ?? undefined,
    createdAt: row.created_at ?? undefined,
    photos: Array.isArray(row.photos) ? row.photos : [],
  };
}

function rowToEvent(row: any): CalEvent {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind ?? undefined,
    type: row.type ?? undefined,
    icon: row.icon ?? undefined,
    time: row.time ?? undefined,
    endTime: row.end_time ?? undefined,
    date: row.date ?? undefined,
    location: row.location ?? undefined,
    reminder: row.reminder ?? undefined,
    done: row.done ?? false,
  };
}
