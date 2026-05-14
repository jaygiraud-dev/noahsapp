export const HW_TAGS = [
  { id: 'assignment',   label: 'Homework',  icon: '📝', tone: 'magenta' },
  { id: 'quiz',         label: 'Quiz',      icon: '✨',       tone: 'amber' },
  { id: 'test',         label: 'Test',      icon: '💯', tone: 'red' },
  { id: 'project',      label: 'Project',   icon: '🖖', tone: 'purple' },
  { id: 'reading',      label: 'Reading',   icon: '📖', tone: 'cyan' },
  { id: 'worksheet',    label: 'Worksheet', icon: '📋', tone: 'mint' },
  { id: 'lab',          label: 'Lab',       icon: '🧪', tone: 'mint' },
  { id: 'essay',        label: 'Essay',     icon: '✍️', tone: 'purple' },
  { id: 'presentation', label: 'Present',   icon: '🎤', tone: 'magenta' },
] as const;

export const EVENT_TYPES = [
  { id: 'practice', label: 'Practice', icon: '🏐', tone: 'cyan' },
  { id: 'game',     label: 'Game',     icon: '🏆', tone: 'amber' },
  { id: 'work',     label: 'Work',     icon: '💵', tone: 'mint' },
  { id: 'appt',     label: 'Appt',     icon: '📍', tone: 'red' },
  { id: 'study',    label: 'Study',    icon: '📚', tone: 'purple' },
  { id: 'club',     label: 'Club',     icon: '🎸', tone: 'magenta' },
  { id: 'social',   label: 'Social',   icon: '✨',       tone: 'magenta' },
] as const;

export const DUE_OPTIONS = [
  { id: 'today',    label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'nextweek', label: 'Next week' },
  { id: 'pick',     label: 'Pick a day' },
] as const;

export const REMINDER_OPTIONS = [
  { id: 'breakfast',   label: 'Tomorrow at breakfast' },
  { id: 'afterschool', label: 'After school' },
  { id: 'afterdinner', label: 'After dinner' },
  { id: 'lunchtmrw',   label: 'Tomorrow at lunch' },
  { id: 'morningof',   label: "Morning it's due" },
] as const;

export const CLASS_COLORS = [
  '#ec4899', '#a78bfa', '#06d6e0', '#fbbf24',
  '#34d399', '#f472b6', '#06b6d4', '#d97706',
];

export const SAMPLE_SCHOOL_BOARD = [
  { rank: 1,  name: 'Ethan L.',   pts: 4120, school: 'Eric Hamber' },
  { rank: 2,  name: 'Naomi K.',   pts: 3890, school: 'Eric Hamber' },
  { rank: 3,  name: 'Wei Z.',     pts: 3640, school: 'Eric Hamber' },
  { rank: 4,  name: 'Hana M.',    pts: 3210, school: 'Eric Hamber' },
  { rank: 5,  name: 'Devon B.',   pts: 3055, school: 'Eric Hamber' },
  { rank: 6,  name: 'Maya R.',    pts: 2210, school: 'Eric Hamber', friend: true },
  { rank: 7,  name: 'Jordan K.',  pts: 1995, school: 'Eric Hamber', friend: true },
  { rank: 8,  name: 'You',        pts: 1840, school: 'Eric Hamber', isMe: true },
  { rank: 9,  name: 'Liam P.',    pts: 1755, school: 'Eric Hamber' },
  { rank: 10, name: 'Priya S.',   pts: 1610, school: 'Eric Hamber', friend: true },
];

export const FRIEND_SUGGESTIONS = [
  { id: 'sg1', name: 'Riley T.',  school: 'Eric Hamber', mutual: 8, color: '#34d399', avatar: 'R' },
  { id: 'sg2', name: 'Noor A.',   school: 'Eric Hamber', mutual: 6, color: '#f472b6', avatar: 'N' },
  { id: 'sg3', name: 'Marcus L.', school: 'Eric Hamber', mutual: 5, color: '#06d6e0', avatar: 'M' },
  { id: 'sg4', name: 'Sienna P.', school: 'Eric Hamber', mutual: 3, color: '#fbbf24', avatar: 'S' },
  { id: 'sg5', name: 'Devon W.',  school: 'Eric Hamber', mutual: 2, color: '#a78bfa', avatar: 'D' },
];

export const SAMPLE_CHAT = [
  { id: 1, who: 'Maya R.',   text: 'did anyone do the chem lab writeup yet 😩', ts: '3:42 pm', mine: false, color: '#a78bfa' },
  { id: 2, who: 'You',       text: 'started it last night, gonna finish after dinner', ts: '3:44 pm', mine: true },
  { id: 3, who: 'Jordan K.', text: 'wait its due TOMORROW?', ts: '3:45 pm', mine: false, color: '#06d6e0' },
  { id: 4, who: 'Maya R.',   text: 'yes lol. study sesh at the library after school?', ts: '3:46 pm', mine: false, color: '#a78bfa' },
  { id: 5, who: 'You',       text: "i'm in. 4pm?", ts: '3:47 pm', mine: true },
];
