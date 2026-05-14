export interface School {
  city: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
  teacher?: string;
  start?: string;
  end?: string;
  color: string;
  emoji?: string;
}

export interface Homework {
  id: string;
  classId: string;
  title: string;
  notes?: string;
  tag?: string;
  due?: string;
  dueUrgent?: boolean;
  reminder?: string | null;
  points: number;
  done: boolean;
  attachedImage?: string;
}

export interface CalEvent {
  id: string;
  title: string;
  kind: string;
  icon: string;
  time: string;
  done: boolean;
}

export interface Friend {
  id: string;
  name: string;
  school: string;
  pts: number;
  streak: number;
  avatar: string;
  color: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  school: string;
  mutual: number;
  color: string;
  avatar: string;
  when: string;
}

export interface FriendSuggestion {
  id: string;
  name: string;
  school: string;
  mutual: number;
  color: string;
  avatar: string;
}

export interface ActivityNotif {
  type: 'done' | 'add' | 'event' | 'streak';
  who: string;
  what: string;
  cls?: string;
  when: string;
  clr?: string;
}

export interface SchoolBoardEntry {
  rank: number;
  name: string;
  pts: number;
  school: string;
  friend?: boolean;
  isMe?: boolean;
}
