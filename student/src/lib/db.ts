import { supabase } from './supabase';
import { Homework, CalEvent } from '../types';

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

export async function fetchStudentData(studentId: string): Promise<{
  homework: Homework[];
  events: CalEvent[];
  profile: { school_name: string | null; display_name: string | null } | null;
}> {
  const [hwRes, evRes, profileRes] = await Promise.all([
    supabase.from('homework').select('*').eq('user_id', studentId).order('created_at', { ascending: true }),
    supabase.from('events').select('*').eq('user_id', studentId).order('created_at', { ascending: true }),
    supabase.from('profiles').select('school_name, display_name').eq('id', studentId).maybeSingle(),
  ]);

  return {
    homework: (hwRes.data ?? []).map(rowToHomework),
    events: (evRes.data ?? []).map(rowToEvent),
    profile: profileRes.data ?? null,
  };
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
