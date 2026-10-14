export interface School {
  city: string;
  name: string;
  district?: string;
}

export interface Class {
  id: string;
  name: string;
  teacher?: string;
  start?: string;   // "HH:MM" 24-hour
  end?: string;     // "HH:MM" 24-hour
  color: string;
  emoji?: string;
  /** The block this class is usually in (0-based), set during setup */
  slot?: number | null;
}

/** One class slot in the school day ("Block 1", 9:15–10:25). */
export interface Period {
  id: string;
  label: string;
  start: string;   // "HH:MM"
  end: string;     // "HH:MM"
}

/**
 * Which class sits in each slot on each weekday. Keys are 1–5 (Mon–Fri);
 * each value has one class id (or null for a free block) per period.
 */
export interface Timetable {
  periods: Period[];
  sameEveryDay: boolean;
  days: Record<'1' | '2' | '3' | '4' | '5', Array<string | null>>;
}

export interface Homework {
  id: string;
  classId?: string;
  subject?: string;
  classColor?: string;
  title: string;
  notes?: string;
  tag?: string;
  due?: string;
  dueDate?: string;
  dueUrgent?: boolean;
  reminder?: string | null;
  points: number;
  done: boolean;
  doneAt?: string;
  /** Storage paths of uploaded photos (signed-in students) */
  photos?: string[];
  /** Displayable URIs, same order as photos. Never persisted. */
  attachedImages?: string[];
}

export interface CalEvent {
  id: string;
  title: string;
  kind?: string;
  type?: string;
  icon?: string;
  time?: string;
  endTime?: string;
  date?: string;
  location?: string;
  reminder?: string;
  done: boolean;
}

export interface Friend {
  id: string;
  name: string;
  school: string;
  grade?: number | null;
  pts: number;
  streak: number;
  avatar?: string | null;
  color: string;
}

export interface ParentConnection {
  parentId: string;
  name: string;
  linkedAt: string;
}

export interface ActivityItem {
  id: string;
  studentId: string;
  type: 'hw_added' | 'hw_done' | 'event_added' | 'streak' | string;
  text: string;
  subject?: string | null;
  color?: string | null;
  createdAt: string;
}
