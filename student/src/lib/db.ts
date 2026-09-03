import { supabase } from './supabase';
import { Homework, CalEvent, Class } from '../types';

export async function upsertProfile(
  userId: string,
  role: 'student' | 'parent',
  pairingCode?: string,
  schoolName?: string,
  displayName?: string
): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      role,
      pairing_code: pairingCode ?? null,
      school_name: schoolName ?? null,
      display_name: displayName ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) console.warn('[db] upsertProfile:', error.message);
}

export async function fetchHomework(userId: string): Promise<Homework[]> {
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) { console.warn('[db] fetchHomework:', error.message); return []; }
  return (data ?? []).map(rowToHomework);
}

export async function upsertHomework(userId: string, hw: Homework): Promise<void> {
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) console.warn('[db] upsertHomework:', error.message);
}

export async function fetchEvents(userId: string): Promise<CalEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) { console.warn('[db] fetchEvents:', error.message); return []; }
  return (data ?? []).map(rowToEvent);
}

export async function upsertEvent(userId: string, ev: CalEvent): Promise<void> {
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
  );
  if (error) console.warn('[db] upsertEvent:', error.message);
}

export async function lookupStudentByCode(
  code: string
): Promise<{ id: string; school_name: string | null; display_name: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, school_name, display_name')
    .eq('pairing_code', code.toUpperCase())
    .eq('role', 'student')
    .maybeSingle();
  if (error) { console.warn('[db] lookupStudentByCode:', error.message); return null; }
  return data ?? null;
}

export async function createParentLink(
  parentId: string,
  studentId: string,
  code: string,
  studentName: string
): Promise<void> {
  const { error } = await supabase.from('parent_student_links').upsert(
    {
      parent_id: parentId,
      student_id: studentId,
      pairing_code: code.toUpperCase(),
      student_name: studentName,
    },
    { onConflict: 'parent_id,student_id' }
  );
  if (error) console.warn('[db] createParentLink:', error.message);
}

export async function fetchLinkedStudents(
  parentId: string
): Promise<Array<{ student_id: string; student_name: string | null; pairing_code: string }>> {
  const { data, error } = await supabase
    .from('parent_student_links')
    .select('student_id, student_name, pairing_code')
    .eq('parent_id', parentId);
  if (error) { console.warn('[db] fetchLinkedStudents:', error.message); return []; }
  return data ?? [];
}

export interface WeekStats {
  completedThisWeek: number;
  totalThisWeek: number;
  pointsThisWeek: number;
  upcomingTests: Array<{ title: string; subject?: string; dueDate?: string; classColor?: string; tag?: string }>;
}

export async function fetchStudentData(studentId: string): Promise<{
  homework: Homework[];
  events: CalEvent[];
  profile: { school_name: string | null; display_name: string | null } | null;
  weekStats: WeekStats;
}> {
  const [hwRes, evRes, profileRes] = await Promise.all([
    supabase.from('homework').select('*').eq('user_id', studentId).order('created_at', { ascending: true }),
    supabase.from('events').select('*').eq('user_id', studentId).order('created_at', { ascending: true }),
    supabase.from('profiles').select('school_name, display_name').eq('id', studentId).maybeSingle(),
  ]);

  const homework = (hwRes.data ?? []).map(rowToHomework);
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksOut = new Date(now); twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  const thisWeekHw = homework.filter((h) => {
    if (!h.dueDate) return false;
    const d = new Date(h.dueDate);
    return d >= weekAgo && d <= twoWeeksOut;
  });
  const completedThisWeek = thisWeekHw.filter((h) => h.done && new Date(h.dueDate!) <= now).length;
  const totalThisWeek = thisWeekHw.filter((h) => new Date(h.dueDate!) <= now).length;
  const pointsThisWeek = thisWeekHw.filter((h) => h.done && new Date(h.dueDate!) <= now)
    .reduce((s, h) => s + (h.points ?? 10), 0);

  const testKeywords = /test|quiz|exam|project|presentation/i;
  const upcomingTests = homework.filter((h) => {
    if (!h.dueDate) return false;
    const d = new Date(h.dueDate);
    if (d < now || d > twoWeeksOut) return false;
    return testKeywords.test(h.title) || testKeywords.test(h.tag ?? '') || testKeywords.test(h.subject ?? '');
  }).map((h) => ({ title: h.title, subject: h.subject, dueDate: h.dueDate, classColor: h.classColor, tag: h.tag }));

  return {
    homework,
    events: (evRes.data ?? []).map(rowToEvent),
    profile: profileRes.data ?? null,
    weekStats: { completedThisWeek, totalThisWeek, pointsThisWeek, upcomingTests },
  };
}

// ─── Profile state sync (classes, points, streak) so a student can sign in on any device ───
export interface ProfileState {
  classes?: Class[];
  points?: number;
  streak?: number;
  lastActivityDate?: string;
  pairingCode?: string;
  schoolName?: string;
  schoolCity?: string;
  grade?: number;
}

export async function saveProfileState(userId: string, state: ProfileState): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (state.classes !== undefined) row.classes = state.classes;
  if (state.points !== undefined) row.points = state.points;
  if (state.streak !== undefined) row.streak = state.streak;
  if (state.lastActivityDate !== undefined) row.last_activity_date = state.lastActivityDate;
  if (state.pairingCode !== undefined) row.pairing_code = state.pairingCode;
  if (state.schoolName !== undefined) row.school_name = state.schoolName;
  if (state.schoolCity !== undefined) row.school_city = state.schoolCity;
  if (state.grade !== undefined) row.grade = state.grade;
  const { error } = await supabase.from('profiles').update(row).eq('id', userId);
  if (error) console.warn('[db] saveProfileState:', error.message);
}

export async function fetchProfileState(userId: string): Promise<{
  classes: Class[] | null;
  points: number | null;
  streak: number | null;
  lastActivityDate: string | null;
  pairingCode: string | null;
  schoolName: string | null;
  schoolCity: string | null;
  grade: number | null;
  displayName: string | null;
} | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('classes, points, streak, last_activity_date, pairing_code, school_name, school_city, grade, display_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) { console.warn('[db] fetchProfileState:', error.message); return null; }
  if (!data) return null;
  const d = data as any;
  return {
    classes: Array.isArray(d.classes) ? (d.classes as Class[]) : null,
    points: typeof d.points === 'number' ? d.points : null,
    streak: typeof d.streak === 'number' ? d.streak : null,
    lastActivityDate: d.last_activity_date ?? null,
    pairingCode: d.pairing_code ?? null,
    schoolName: d.school_name ?? null,
    schoolCity: d.school_city ?? null,
    grade: typeof d.grade === 'number' ? d.grade : null,
    displayName: d.display_name ?? null,
  };
}

/** Students can read their own links — used to know whether a parent is connected. */
export async function fetchStudentParentLinks(studentId: string): Promise<number> {
  const { data, error } = await supabase
    .from('parent_student_links')
    .select('id')
    .eq('student_id', studentId);
  if (error) { console.warn('[db] fetchStudentParentLinks:', error.message); return 0; }
  return (data ?? []).length;
}

export async function deleteParentLink(parentId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from('parent_student_links')
    .delete()
    .eq('parent_id', parentId)
    .eq('student_id', studentId);
  if (error) console.warn('[db] deleteParentLink:', error.message);
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) console.warn('[db] savePushToken:', error.message);
}

export async function getParentPushToken(studentId: string): Promise<string | null> {
  const { data: link, error: linkError } = await supabase
    .from('parent_student_links')
    .select('parent_id')
    .eq('student_id', studentId)
    .maybeSingle();
  if (linkError || !link) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', link.parent_id)
    .maybeSingle();
  if (profileError || !profile) return null;

  return (profile as any).push_token ?? null;
}

export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
  });
}

export async function sendNudge(
  parentId: string,
  studentId: string,
  message: string
): Promise<void> {
  const { error } = await supabase.from('nudges').insert({
    parent_id: parentId,
    student_id: studentId,
    message,
  });
  if (error) console.warn('[db] sendNudge:', error.message);
}

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
