export const HW_TAGS = [
  { id: 'assignment',   label: 'Homework',  icon: '📝' },
  { id: 'quiz',         label: 'Quiz',      icon: '✨' },
  { id: 'test',         label: 'Test',      icon: '💯' },
  { id: 'project',      label: 'Project',   icon: '🛠️' },
  { id: 'reading',      label: 'Reading',   icon: '📖' },
  { id: 'worksheet',    label: 'Worksheet', icon: '📋' },
  { id: 'lab',          label: 'Lab',       icon: '🧪' },
  { id: 'essay',        label: 'Essay',     icon: '✍️' },
  { id: 'presentation', label: 'Present',   icon: '🎤' },
] as const;

export const EVENT_TYPES = [
  { id: 'personal', label: 'Personal', icon: '🙂' },
  { id: 'practice', label: 'Practice', icon: '🏐' },
  { id: 'game',     label: 'Game',     icon: '🏆' },
  { id: 'work',     label: 'Work',     icon: '💵' },
  { id: 'appt',     label: 'Appt',     icon: '📍' },
  { id: 'study',    label: 'Study',    icon: '📚' },
  { id: 'club',     label: 'Club',     icon: '🎸' },
  { id: 'social',   label: 'Social',   icon: '✨' },
] as const;

export function eventIcon(type?: string): string {
  return EVENT_TYPES.find((t) => t.label === type)?.icon ?? '📅';
}

/** Plans that belong on the Personal card: your own time, hanging out, friends */
export function isPersonalPlan(type?: string): boolean {
  return !type || type === 'Personal' || type === 'Social';
}

export function tagIcon(tag?: string): string {
  return HW_TAGS.find((t) => t.label === tag)?.icon ?? '•';
}

export const DUE_OPTIONS = [
  { id: 'today',    label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'nextweek', label: 'Next week' },
  { id: 'pick',     label: 'Pick a day' },
] as const;

export const CLASS_COLORS = [
  '#ec4899', '#a78bfa', '#06d6e0', '#fbbf24',
  '#34d399', '#f472b6', '#06b6d4', '#d97706',
];
