import type { Pillar } from '../theme';

export interface IdeaCard {
  id: string;
  title: string;
  source: string;
  read: string; // read time
  blurb: string;
  pillar: Pillar;
  // the quest it can spawn ("take action")
  spawn: { title: string; difficulty: 'easy' | 'medium' | 'hard' | 'epic'; stats: Partial<Record<Pillar, number>>; emoji: string; desc: string };
}

export interface BookCard {
  id: string;
  title: string;
  author: string;
  progress: number; // 0..1, "continue reading"
  emoji: string;
  oneLine: string;
}

export interface ChallengeCard {
  id: string;
  title: string;
  days: number;
  pillar: Pillar;
  emoji: string;
  blurb: string;
  perDay: { title: string; difficulty: 'easy' | 'medium' | 'hard'; stats: Partial<Record<Pillar, number>>; emoji: string; desc: string };
}

export const IDEAS: IdeaCard[] = [
  {
    id: 'i-attention',
    title: 'Life Is an Attention Game',
    source: 'Idea',
    read: '2 min',
    pillar: 'mind',
    blurb: 'Where your attention goes, your life follows. The feeds are not free — you pay in the only currency you can never earn back. Guard the spotlight of your mind like the asset it is.',
    spawn: { title: 'Phone-Free Morning', difficulty: 'medium', stats: { mind: 4, soul: 2 }, emoji: '📵', desc: 'Keep the screen dark until the day is yours. Your first thought belongs to you, not to an algorithm.' },
  },
  {
    id: 'i-discomfort',
    title: 'Do the Hard Thing First',
    source: 'Idea',
    read: '2 min',
    pillar: 'personality',
    blurb: 'Eat the frog. The task you dread is quietly running your whole day from the back of your mind. Touch it first and the rest of the hours go gentle.',
    spawn: { title: 'Eat the Frog', difficulty: 'medium', stats: { personality: 3, mind: 3 }, emoji: '🐸', desc: 'Do the one thing you have been avoiding before you do anything else. Momentum is built on the hard rep.' },
  },
  {
    id: 'i-identity',
    title: 'You Are What You Repeat',
    source: 'Idea',
    read: '3 min',
    pillar: 'soul',
    blurb: 'Goals are direction; systems are destiny. Every action is a vote for the person you are becoming. Stop trying to be motivated and start being someone who shows up.',
    spawn: { title: 'Cast One Vote', difficulty: 'easy', stats: { soul: 2, personality: 1 }, emoji: '🗳️', desc: 'Do one small thing the person you want to be would do. Identity is built one vote at a time.' },
  },
  {
    id: 'i-compound',
    title: 'The Magic of 1% Better',
    source: 'Idea',
    read: '2 min',
    pillar: 'body',
    blurb: 'Tiny gains feel like nothing and compound into everything. One percent a day is thirty-seven times better in a year. The trick is to fall in love with the boring, repeatable rep.',
    spawn: { title: 'One Percent Today', difficulty: 'easy', stats: { body: 2 }, emoji: '📈', desc: 'Make today one percent better than yesterday in one measurable way. The slope is the whole story.' },
  },
  {
    id: 'i-boredom',
    title: 'Boredom Is a Doorway',
    source: 'Idea',
    read: '2 min',
    pillar: 'mind',
    blurb: 'Every time you reach for the phone in a dull moment, you trade a creative idea for a hit of nothing. Sit in the boredom. On the other side of it is where you actually think.',
    spawn: { title: 'Sit in the Boredom', difficulty: 'easy', stats: { mind: 2, soul: 1 }, emoji: '🪑', desc: 'Wait in a line, ride the elevator, sit with your coffee — and do not reach for the phone. Let the mind wander.' },
  },
];

export const BOOKS: BookCard[] = [
  { id: 'b-bed', title: 'Make Your Bed', author: 'William H. McRaven', progress: 0.42, emoji: '🛏️', oneLine: 'Small things, done well, change everything. Start with the first task of the day.' },
  { id: 'b-atomic', title: 'Atomic Habits', author: 'James Clear', progress: 0.18, emoji: '⚛️', oneLine: 'You do not rise to your goals; you fall to your systems. Make the good thing easy.' },
  { id: 'b-mountain', title: 'The Comfort Crisis', author: 'Michael Easter', progress: 0.0, emoji: '🏔️', oneLine: 'We engineered away every discomfort and lost something. Go find a little hardship on purpose.' },
  { id: 'b-meditations', title: 'Meditations', author: 'Marcus Aurelius', progress: 0.66, emoji: '🏛️', oneLine: 'A Roman emperor\'s private notes to himself on staying sane and good. Still the best.' },
];

export const CHALLENGES: ChallengeCard[] = [
  {
    id: 'c-nosocial',
    title: '30 Days No Socials',
    days: 30,
    pillar: 'mind',
    emoji: '📵',
    blurb: 'A month with the feeds deleted. The first week is loud, the rest is the quietest, clearest your head has been in years.',
    perDay: { title: 'No Socials — Day', difficulty: 'medium', stats: { mind: 3, soul: 1 }, emoji: '📵', desc: 'Another day with the apps off the phone. Notice what fills the space they used to take.' },
  },
  {
    id: 'c-75',
    title: '75 Hard-ish',
    days: 75,
    pillar: 'body',
    emoji: '🔥',
    blurb: 'Two workouts, a gallon of water, a chapter of a book, a clean diet — every day, no compromise. A mental toughness program disguised as a fitness one.',
    perDay: { title: '75 Hard — Day', difficulty: 'hard', stats: { body: 4, mind: 2 }, emoji: '🔥', desc: 'Two workouts, the water, the reading, the diet. No zero days. Check the box and keep the chain alive.' },
  },
  {
    id: 'c-cold',
    title: '14 Days Cold Showers',
    days: 14,
    pillar: 'soul',
    emoji: '🚿',
    blurb: 'Two weeks of starting every morning with a small, freezing victory. By day five you stop dreading it and start chasing it.',
    perDay: { title: 'Cold Shower — Day', difficulty: 'easy', stats: { soul: 1, body: 1 }, emoji: '🚿', desc: 'Turn the dial all the way cold. Two minutes. Win the morning before it can win you.' },
  },
  {
    id: 'c-gratitude',
    title: '21 Days of Gratitude',
    days: 21,
    pillar: 'soul',
    emoji: '🙏',
    blurb: 'Three weeks, three things a day. Long enough to rewire how your brain scans the world — toward what is good instead of what is missing.',
    perDay: { title: 'Gratitude — Day', difficulty: 'easy', stats: { soul: 2 }, emoji: '🙏', desc: 'Three things, written down before you sleep. Train the eye to find the good first.' },
  },
];
