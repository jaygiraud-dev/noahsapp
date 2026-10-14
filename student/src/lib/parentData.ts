import { create } from 'zustand';
import { supabase } from './supabase';
import { fetchLinkedStudents, fetchStudentData, fetchActivity, signPhotoPaths, StudentSnapshot, Profile } from './db';
import { ActivityItem } from '../types';
import { useStore } from '../store/useStore';

export interface Kid {
  id: string;
  name: string;
  snap: StudentSnapshot | null;
}

interface ParentDataState {
  parentId: string;
  kids: Kid[];
  activity: ActivityItem[];
  loading: boolean;
  loaded: boolean;
  error: string;
  load: () => Promise<void>;
  reloadKid: (id: string) => Promise<void>;
  loadActivity: () => Promise<void>;
  removeKidLocal: (id: string) => void;
}

/** Turns the student's own local demo data into what a parent would see. */
function demoKid(): Kid {
  const s = useStore.getState();
  const profile: Profile = {
    id: 'demo', role: 'student', display_name: 'Noah', pairing_code: 'DEMO42',
    school_name: s.school.name, school_city: s.school.city, grade: s.grade,
    classes: s.classes, timetable: s.timetable, points: s.points, streak: s.streak,
    last_activity_date: s.lastActivityDate || null, avatar: null, onboarded: true, push_token: null,
  };
  return {
    id: 'demo',
    name: 'Noah',
    snap: { homework: s.homework, events: s.events, profile, weekStats: { completedThisWeek: 0, totalThisWeek: 0, pointsThisWeek: 0, upcomingTests: [] } },
  };
}

async function withPhotos(snap: StudentSnapshot): Promise<StudentSnapshot> {
  const paths = snap.homework.flatMap((h) => h.photos ?? []);
  if (paths.length === 0) return snap;
  const urls = await signPhotoPaths(paths);
  return { ...snap, homework: snap.homework.map((h) => ({ ...h, attachedImages: (h.photos ?? []).map((p) => urls[p]).filter(Boolean) })) };
}

export const useParentData = create<ParentDataState>()((set, get) => ({
  parentId: '',
  kids: [],
  activity: [],
  loading: false,
  loaded: false,
  error: '',

  load: async () => {
    set({ loading: true, error: '' });
    const { data } = await supabase.auth.getUser();
    const parentId = data.user?.id ?? '';
    if (!parentId) {
      // Parent demo: show the demo student's data
      set({ parentId: '', kids: [demoKid()], activity: [], loading: false, loaded: true });
      return;
    }
    try {
      const links = await fetchLinkedStudents(parentId);
      const kids: Kid[] = await Promise.all(
        links.map(async (l) => {
          const snap = await withPhotos(await fetchStudentData(l.student_id));
          return { id: l.student_id, name: snap.profile?.display_name ?? l.student_name ?? 'Student', snap };
        })
      );
      set({ parentId, kids, loading: false, loaded: true });
      get().loadActivity();
    } catch {
      set({ parentId, loading: false, loaded: true, error: "Couldn't load your kids' homework. Pull down to try again." });
    }
  },

  reloadKid: async (id) => {
    if (id === 'demo') { set({ kids: [demoKid()] }); return; }
    const snap = await withPhotos(await fetchStudentData(id));
    set((s) => ({ kids: s.kids.map((k) => (k.id === id ? { ...k, name: snap.profile?.display_name ?? k.name, snap } : k)) }));
  },

  loadActivity: async () => {
    const ids = get().kids.map((k) => k.id).filter((id) => id !== 'demo');
    set({ activity: await fetchActivity(ids, 150) });
  },

  removeKidLocal: (id) => set((s) => ({ kids: s.kids.filter((k) => k.id !== id), activity: s.activity.filter((a) => a.studentId !== id) })),
}));
