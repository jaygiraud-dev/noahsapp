// data.js — sample data shared across the prototype
window.GVAN_SCHOOLS = [
  { city: 'Vancouver',     name: 'Eric Hamber Secondary' },
  { city: 'Vancouver',     name: 'Lord Byng Secondary' },
  { city: 'Vancouver',     name: 'Kitsilano Secondary' },
  { city: 'Vancouver',     name: 'Magee Secondary' },
  { city: 'Vancouver',     name: 'Point Grey Secondary' },
  { city: 'Vancouver',     name: 'Prince of Wales Secondary' },
  { city: 'Vancouver',     name: 'Sir Winston Churchill Secondary' },
  { city: 'Vancouver',     name: 'Vancouver Technical Secondary' },
  { city: 'Vancouver',     name: 'David Thompson Secondary' },
  { city: 'Vancouver',     name: 'Gladstone Secondary' },
  { city: 'Vancouver',     name: 'John Oliver Secondary' },
  { city: 'Vancouver',     name: 'Killarney Secondary' },
  { city: 'Vancouver',     name: 'Templeton Secondary' },
  { city: 'Vancouver',     name: 'Britannia Secondary' },
  { city: 'Burnaby',       name: 'Burnaby North Secondary' },
  { city: 'Burnaby',       name: 'Burnaby South Secondary' },
  { city: 'Burnaby',       name: 'Burnaby Central Secondary' },
  { city: 'Burnaby',       name: 'Alpha Secondary' },
  { city: 'Burnaby',       name: 'Byrne Creek Community Secondary' },
  { city: 'Burnaby',       name: 'Cariboo Hill Secondary' },
  { city: 'Burnaby',       name: 'Moscrop Secondary' },
  { city: 'Richmond',      name: 'Richmond Secondary' },
  { city: 'Richmond',      name: 'Steveston-London Secondary' },
  { city: 'Richmond',      name: 'McMath Secondary' },
  { city: 'Richmond',      name: 'McNair Secondary' },
  { city: 'Richmond',      name: 'McRoberts Secondary' },
  { city: 'Richmond',      name: 'Palmer Secondary' },
  { city: 'Richmond',      name: 'Boyd Secondary' },
  { city: 'Richmond',      name: 'Burnett Secondary' },
  { city: 'Richmond',      name: 'Cambie Secondary' },
  { city: 'Surrey',        name: 'Earl Marriott Secondary' },
  { city: 'Surrey',        name: 'Elgin Park Secondary' },
  { city: 'Surrey',        name: 'Semiahmoo Secondary' },
  { city: 'Surrey',        name: 'Sullivan Heights Secondary' },
  { city: 'Surrey',        name: 'Lord Tweedsmuir Secondary' },
  { city: 'Surrey',        name: 'Panorama Ridge Secondary' },
  { city: 'Surrey',        name: 'Kwantlen Park Secondary' },
  { city: 'Surrey',        name: 'Frank Hurt Secondary' },
  { city: 'Surrey',        name: 'Guildford Park Secondary' },
  { city: 'Surrey',        name: 'Johnston Heights Secondary' },
  { city: 'Surrey',        name: 'Princess Margaret Secondary' },
  { city: 'Surrey',        name: 'Queen Elizabeth Secondary' },
  { city: 'North Vancouver', name: 'Argyle Secondary' },
  { city: 'North Vancouver', name: 'Carson Graham Secondary' },
  { city: 'North Vancouver', name: 'Handsworth Secondary' },
  { city: 'North Vancouver', name: 'Seycove Secondary' },
  { city: 'North Vancouver', name: 'Sutherland Secondary' },
  { city: 'North Vancouver', name: 'Windsor Secondary' },
  { city: 'West Vancouver',  name: 'West Vancouver Secondary' },
  { city: 'West Vancouver',  name: 'Rockridge Secondary' },
  { city: 'West Vancouver',  name: 'Sentinel Secondary' },
  { city: 'Coquitlam',     name: 'Centennial Secondary' },
  { city: 'Coquitlam',     name: 'Dr. Charles Best Secondary' },
  { city: 'Coquitlam',     name: 'Gleneagle Secondary' },
  { city: 'Coquitlam',     name: 'Heritage Woods Secondary' },
  { city: 'Coquitlam',     name: 'Pinetree Secondary' },
  { city: 'Coquitlam',     name: 'Port Moody Secondary' },
  { city: 'Coquitlam',     name: 'Riverside Secondary' },
  { city: 'Coquitlam',     name: 'Terry Fox Secondary' },
  { city: 'New Westminster', name: 'New Westminster Secondary' },
  { city: 'Delta',         name: 'Burnsview Secondary' },
  { city: 'Delta',         name: 'Delta Secondary' },
  { city: 'Delta',         name: 'North Delta Secondary' },
  { city: 'Delta',         name: 'Sands Secondary' },
  { city: 'Delta',         name: 'Seaquam Secondary' },
  { city: 'Delta',         name: 'South Delta Secondary' },
  { city: 'Langley',       name: 'Brookswood Secondary' },
  { city: 'Langley',       name: 'D.W. Poppy Secondary' },
  { city: 'Langley',       name: 'Langley Secondary' },
  { city: 'Langley',       name: 'R.E. Mountain Secondary' },
  { city: 'Langley',       name: 'Walnut Grove Secondary' },
  { city: 'Maple Ridge',   name: 'Maple Ridge Secondary' },
  { city: 'Maple Ridge',   name: 'Pitt Meadows Secondary' },
  { city: 'Maple Ridge',   name: 'Westview Secondary' },
];

// Default sample timetable (used after onboarding if user goes through quickly)
window.SAMPLE_CLASSES = [
  { id: 'c1', name: 'English 11',      teacher: 'Ms. Tran',     start: '08:45', end: '09:55', color: '#ec4899', emoji: '📖' },
  { id: 'c2', name: 'Pre-Calc 11',     teacher: 'Mr. Chen',     start: '10:00', end: '11:10', color: '#a78bfa', emoji: '🧮' },
  { id: 'c3', name: 'Chemistry 11',    teacher: 'Mr. Singh',    start: '11:15', end: '12:25', color: '#06d6e0', emoji: '🧪' },
  { id: 'c4', name: 'Socials 11',      teacher: 'Mme. Côté',    start: '13:10', end: '14:20', color: '#fbbf24', emoji: '🌎' },
  { id: 'c5', name: 'PE / Athletics',  teacher: 'Coach Patel',  start: '14:25', end: '15:25', color: '#34d399', emoji: '🏐' },
];

// Sample friends + leaderboard
window.FRIEND_REQUESTS = [
  { id: 'fr1', name: 'Ben K.',     school: 'Eric Hamber',   mutual: 4, color: '#06d6e0', avatar: 'B', when: '2h' },
  { id: 'fr2', name: 'Ines M.',    school: 'Lord Byng',     mutual: 1, color: '#a78bfa', avatar: 'I', when: 'Yesterday' },
  { id: 'fr3', name: 'Tariq S.',   school: 'Eric Hamber',   mutual: 7, color: '#fbbf24', avatar: 'T', when: 'Mon' },
];

window.FRIEND_SUGGESTIONS = [
  { id: 'sg1', name: 'Riley T.',  school: 'Eric Hamber', mutual: 8, color: '#34d399', avatar: 'R' },
  { id: 'sg2', name: 'Noor A.',   school: 'Eric Hamber', mutual: 6, color: '#f472b6', avatar: 'N' },
  { id: 'sg3', name: 'Marcus L.', school: 'Eric Hamber', mutual: 5, color: '#06d6e0', avatar: 'M' },
  { id: 'sg4', name: 'Sienna P.', school: 'Eric Hamber', mutual: 3, color: '#fbbf24', avatar: 'S' },
  { id: 'sg5', name: 'Devon W.',  school: 'Eric Hamber', mutual: 2, color: '#a78bfa', avatar: 'D' },
];

window.SAMPLE_FRIENDS = [
  { id: 'u1', name: 'You',          school: 'Eric Hamber',   pts: 1840, streak: 12, avatar: 'Y', color: '#ec4899' },
  { id: 'u2', name: 'Maya R.',      school: 'Eric Hamber',   pts: 2210, streak: 18, avatar: 'M', color: '#a78bfa' },
  { id: 'u3', name: 'Jordan K.',    school: 'Eric Hamber',   pts: 1995, streak: 7,  avatar: 'J', color: '#06d6e0' },
  { id: 'u4', name: 'Priya S.',     school: 'Eric Hamber',   pts: 1610, streak: 4,  avatar: 'P', color: '#34d399' },
  { id: 'u5', name: 'Alex T.',      school: 'Eric Hamber',   pts: 1420, streak: 9,  avatar: 'A', color: '#fbbf24' },
  { id: 'u6', name: 'Sam W.',       school: 'Eric Hamber',   pts: 1180, streak: 2,  avatar: 'S', color: '#f472b6' },
];

window.SAMPLE_SCHOOL_BOARD = [
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

window.SAMPLE_CHAT = [
  { id: 1, who: 'Maya R.',   text: 'did anyone do the chem lab writeup yet 😩', ts: '3:42 pm', mine: false, color: '#a78bfa' },
  { id: 2, who: 'You',       text: 'started it last night, gonna finish after dinner', ts: '3:44 pm', mine: true },
  { id: 3, who: 'Jordan K.', text: 'wait its due TOMORROW?', ts: '3:45 pm', mine: false, color: '#06d6e0' },
  { id: 4, who: 'Maya R.',   text: 'yes lol. study sesh at the library after school?', ts: '3:46 pm', mine: false, color: '#a78bfa' },
  { id: 5, who: 'You',       text: 'i\'m in. 4pm?', ts: '3:47 pm', mine: true },
];

// Sample event types
window.EVENT_TYPES = [
  { id: 'practice', label: 'Practice', icon: '🏐', tone: 'cyan' },
  { id: 'game',     label: 'Game',     icon: '🏆', tone: 'amber' },
  { id: 'work',     label: 'Work',     icon: '💵', tone: 'mint' },
  { id: 'appt',     label: 'Appt',     icon: '📍', tone: 'red' },
  { id: 'study',    label: 'Study',    icon: '📚', tone: 'purple' },
  { id: 'club',     label: 'Club',     icon: '🎸', tone: 'magenta' },
  { id: 'social',   label: 'Social',   icon: '✨', tone: 'magenta' },
];

window.HW_TAGS = [
  { id: 'assignment',   label: 'Homework',  icon: '📝', tone: 'magenta' },
  { id: 'quiz',         label: 'Quiz',      icon: '✨', tone: 'amber' },
  { id: 'test',         label: 'Test',      icon: '💯', tone: 'red' },
  { id: 'project',      label: 'Project',   icon: '🖖',  tone: 'purple' },
  { id: 'reading',      label: 'Reading',   icon: '📖', tone: 'cyan' },
  { id: 'worksheet',    label: 'Worksheet', icon: '📋', tone: 'mint' },
  { id: 'lab',          label: 'Lab',       icon: '🧪', tone: 'mint' },
  { id: 'essay',        label: 'Essay',     icon: '✍️',  tone: 'purple' },
  { id: 'presentation', label: 'Present',   icon: '🎤', tone: 'magenta' },
];

window.DUE_OPTIONS = [
  { id: 'today',    label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'nextweek', label: 'Next week' },
  { id: 'pick',     label: 'Pick a day' },
];

window.REMINDER_OPTIONS = [
  { id: 'breakfast',     label: 'Tomorrow at breakfast' },
  { id: 'afterschool',   label: 'After school' },
  { id: 'afterdinner',   label: 'After dinner' },
  { id: 'lunchtmrw',     label: 'Tomorrow at lunch' },
  { id: 'morningof',     label: 'Morning it\u2019s due' },
];
