import type { Pillar, QuestType, Difficulty } from '../theme';

export interface Quest {
  id: string;
  title: string;
  type: QuestType;
  difficulty: Difficulty;
  stats: Partial<Record<Pillar, number>>; // which pillars it raises, and by how much
  desc: string; // editorial, second-person, lightly poetic
  emoji: string; // motif used in the card collage
}

// 64 curated quests across all four pillars and every difficulty band.
export const QUESTS: Quest[] = [
  // ——— BODY ———
  { id: 'q-run', title: 'Running', type: 'Health', difficulty: 'medium', stats: { body: 4 }, emoji: '🏃', desc: 'The art of leaving and coming back as a slightly upgraded version of yourself. Lace up, pick a direction, and let the road do the talking.' },
  { id: 'q-cold', title: 'Cold Shower', type: 'Health', difficulty: 'easy', stats: { body: 2, soul: 1 }, emoji: '🚿', desc: 'Two minutes of voluntary discomfort that makes the rest of the day feel easy. Turn the dial. Breathe. Win before 8am.' },
  { id: 'q-10k', title: '10k Steps', type: 'Health', difficulty: 'easy', stats: { body: 2 }, emoji: '👟', desc: 'Motion is medicine. Get the steps in — on a call, between meetings, under the stars.' },
  { id: 'q-lift', title: 'Lift Heavy', type: 'Health', difficulty: 'medium', stats: { body: 5 }, emoji: '🏋️', desc: 'Pick it up, put it down, repeat. The body keeps the score and today it scores in your favour.' },
  { id: 'q-sleep', title: 'Sleep by 11', type: 'Health', difficulty: 'easy', stats: { body: 2, mind: 1 }, emoji: '🌙', desc: 'The most underrated cheat code. Phone in another room, lights low, tomorrow-you says thanks.' },
  { id: 'q-water', title: 'Hydrate', type: 'Health', difficulty: 'easy', stats: { body: 1 }, emoji: '💧', desc: 'Two litres. That headache, that fog, that 3pm slump — water first, then judge.' },
  { id: 'q-cook', title: 'Cook a Real Meal', type: 'Health', difficulty: 'medium', stats: { body: 3, soul: 1 }, emoji: '🍳', desc: 'No wrapper, no delivery driver. Just you, a knife, and something you made with your own hands.' },
  { id: 'q-yoga', title: 'Morning Stretch', type: 'Health', difficulty: 'easy', stats: { body: 2, soul: 1 }, emoji: '🧘', desc: 'Ten minutes of unknotting yourself before the world asks anything of you.' },
  { id: 'q-marathon', title: 'Run a Half', type: 'Adventure', difficulty: 'epic', stats: { body: 14, soul: 4 }, emoji: '🏅', desc: 'Twenty-one kilometres of finding out who you are when it gets quiet. A boss fight with your own excuses.' },
  { id: 'q-noalc', title: 'Dry Week', type: 'Health', difficulty: 'hard', stats: { body: 7, mind: 3 }, emoji: '🚱', desc: 'Seven clear mornings. Notice how loud your energy gets when nothing is dulling it.' },

  // ——— MIND ———
  { id: 'q-read20', title: 'Read 20 Pages', type: 'Mind', difficulty: 'easy', stats: { mind: 2 }, emoji: '📖', desc: 'A book is a conversation with the smartest person who ever thought about your problem. Show up for 20 pages.' },
  { id: 'q-deep', title: 'Deep Work Block', type: 'Career', difficulty: 'medium', stats: { mind: 4 }, emoji: '🎯', desc: 'Ninety minutes, one tab, phone face-down across the room. The cathedral gets built one focused hour at a time.' },
  { id: 'q-nophone', title: 'Phone-Free Morning', type: 'Mind', difficulty: 'medium', stats: { mind: 4, soul: 2 }, emoji: '📵', desc: 'Your first thought belongs to you, not to an algorithm. Keep the screen dark until the day is yours.' },
  { id: 'q-learn', title: 'Learn Something New', type: 'Mind', difficulty: 'medium', stats: { mind: 4 }, emoji: '🧠', desc: 'A chord, a phrase, a theorem. Curiosity is a muscle — give it one rep today.' },
  { id: 'q-write', title: 'Write 500 Words', type: 'Career', difficulty: 'medium', stats: { mind: 4, personality: 1 }, emoji: '✍️', desc: 'You do not know what you think until you watch yourself say it. Fill the blank page.' },
  { id: 'q-ship', title: 'Ship the Thing', type: 'Career', difficulty: 'hard', stats: { mind: 6, personality: 3 }, emoji: '🚀', desc: 'Done beats perfect. Push it live, send it, hit publish — and let the world meet what you made.' },
  { id: 'q-language', title: 'Language Lesson', type: 'Mind', difficulty: 'easy', stats: { mind: 2 }, emoji: '🗣️', desc: 'A new language is a second pair of eyes. Fifteen minutes a day and the world gets bigger.' },
  { id: 'q-chess', title: 'Play Chess', type: 'Hobby', difficulty: 'easy', stats: { mind: 2 }, emoji: '♟️', desc: 'Sixty-four squares, infinite stories. Think two moves ahead — in the game and in your life.' },
  { id: 'q-course', title: 'Finish the Course', type: 'Career', difficulty: 'epic', stats: { mind: 12, personality: 4 }, emoji: '🎓', desc: 'The certificate is nothing. The person who finishes hard things is everything. Cross the line.' },
  { id: 'q-budget', title: 'Do Your Budget', type: 'Career', difficulty: 'medium', stats: { mind: 3, soul: 1 }, emoji: '📊', desc: 'Money likes attention. Spend an hour looking it in the eye and watch the anxiety shrink.' },

  // ——— SOUL ———
  { id: 'q-meditate', title: 'Meditate 10', type: 'Soul', difficulty: 'easy', stats: { soul: 2, mind: 1 }, emoji: '🪷', desc: 'Sit. Breathe. Be catastrophically present. The mind you train at dawn carries the whole day.' },
  { id: 'q-grat', title: 'Gratitude List', type: 'Soul', difficulty: 'easy', stats: { soul: 2 }, emoji: '🙏', desc: 'Three things, written down. You cannot be anxious and grateful in the same breath — pick the one that builds you.' },
  { id: 'q-nature', title: 'Touch Grass', type: 'Adventure', difficulty: 'easy', stats: { soul: 2, body: 1 }, emoji: '🌿', desc: 'Trees do not check their phones. Stand under one. Let your nervous system remember what calm feels like.' },
  { id: 'q-sunrise', title: 'Watch the Sunrise', type: 'Soul', difficulty: 'medium', stats: { soul: 3, body: 1 }, emoji: '🌅', desc: 'The best show on earth and it is free every single morning. Be there once and you will understand.' },
  { id: 'q-journal', title: 'Evening Journal', type: 'Soul', difficulty: 'easy', stats: { soul: 2, mind: 1 }, emoji: '📓', desc: 'Empty the day onto the page before you sleep. What happened, what it meant, who you were.' },
  { id: 'q-digital', title: 'Digital Sabbath', type: 'Soul', difficulty: 'hard', stats: { soul: 7, mind: 4 }, emoji: '🕯️', desc: 'One full day, no feeds. Terrifying for an hour, holy by sundown. Reclaim your own attention.' },
  { id: 'q-forgive', title: 'Make Peace', type: 'Soul', difficulty: 'hard', stats: { soul: 6, personality: 3 }, emoji: '🤍', desc: 'Send the text you have been rehearsing for months. Resentment is a tax you stop paying today.' },
  { id: 'q-volunteer', title: 'Give Your Time', type: 'Social', difficulty: 'hard', stats: { soul: 6, personality: 3 }, emoji: '🫶', desc: 'Show up for someone who can do nothing for you back. The fastest route out of your own head.' },
  { id: 'q-silence', title: 'Hour of Silence', type: 'Soul', difficulty: 'medium', stats: { soul: 3, mind: 2 }, emoji: '🔕', desc: 'No music, no podcast, no scrolling. Just you and the quiet you have been avoiding.' },
  { id: 'q-pilgrimage', title: 'Solo Retreat', type: 'Adventure', difficulty: 'epic', stats: { soul: 14, mind: 4 }, emoji: '⛰️', desc: 'Disappear for a weekend with no agenda but your own thoughts. Come back rearranged.' },

  // ——— PERSONALITY ———
  { id: 'q-stranger', title: 'Talk to a Stranger', type: 'Social', difficulty: 'medium', stats: { personality: 4 }, emoji: '👋', desc: 'One real conversation with someone you have never met. Courage is a skill and reps are everywhere.' },
  { id: 'q-compliment', title: 'Give a Compliment', type: 'Social', difficulty: 'easy', stats: { personality: 2 }, emoji: '💬', desc: 'Make a stranger\'s day with one honest sentence. Watch how good it feels to be the warm one.' },
  { id: 'q-call', title: 'Call, Don\'t Text', type: 'Social', difficulty: 'easy', stats: { personality: 2, soul: 1 }, emoji: '📞', desc: 'Hear an actual voice. Ten minutes of someone you love beats an hour of the group chat.' },
  { id: 'q-dance', title: 'Dance in Public', type: 'Adventure', difficulty: 'hard', stats: { personality: 7 }, emoji: '🕺', desc: 'Be cringe on purpose. The cure for caring too much what people think is a small, joyful dose of not.' },
  { id: 'q-ask', title: 'Ask for the Raise', type: 'Career', difficulty: 'epic', stats: { personality: 12, mind: 3 }, emoji: '💼', desc: 'The scariest sentence in the building is also the highest-paid one. Say it out loud. You are worth the ask.' },
  { id: 'q-stage', title: 'Speak on Stage', type: 'Social', difficulty: 'epic', stats: { personality: 14, mind: 4 }, emoji: '🎤', desc: 'The number one fear, conquered once, makes everything else look small. Take the mic.' },
  { id: 'q-no', title: 'Say No', type: 'Social', difficulty: 'medium', stats: { personality: 4, soul: 2 }, emoji: '✋', desc: 'A boundary said kindly is a gift to everyone. Protect your time like the finite thing it is.' },
  { id: 'q-outfit', title: 'Dress Like Main Character', type: 'Hobby', difficulty: 'easy', stats: { personality: 2 }, emoji: '🧥', desc: 'Wear the thing you save for special days. Today is special because you are in it.' },
  { id: 'q-host', title: 'Host a Dinner', type: 'Social', difficulty: 'hard', stats: { personality: 6, soul: 3 }, emoji: '🍽️', desc: 'Gather your people around a table you set. Connection is the whole point and you can build it.' },
  { id: 'q-firstmove', title: 'Make the First Move', type: 'Social', difficulty: 'hard', stats: { personality: 7 }, emoji: '💌', desc: 'Send the message, ask the question, close the gap. Regret weighs more than rejection ever will.' },

  // ——— HOBBY / CREATIVE (mixed pillars) ———
  { id: 'q-photo', title: 'Photo Walk', type: 'Hobby', difficulty: 'easy', stats: { mind: 1, soul: 2 }, emoji: '📷', desc: 'Carry a camera and the whole city becomes a gallery. Notice ten beautiful things you would have walked past.' },
  { id: 'q-paint', title: 'Make Bad Art', type: 'Hobby', difficulty: 'easy', stats: { mind: 2, soul: 1 }, emoji: '🎨', desc: 'Permission to be terrible. The only way to make good things is to make a pile of bad ones first.' },
  { id: 'q-guitar', title: 'Learn a Song', type: 'Hobby', difficulty: 'medium', stats: { mind: 3, personality: 2 }, emoji: '🎸', desc: 'Four chords and you can play half the songs ever written. Calluses today, campfire hero tomorrow.' },
  { id: 'q-garden', title: 'Grow Something', type: 'Hobby', difficulty: 'medium', stats: { soul: 3, body: 1 }, emoji: '🌱', desc: 'Put a seed in dirt and tend it. Patience, made visible. Few things ground you faster than green.' },
  { id: 'q-build', title: 'Build With Hands', type: 'Hobby', difficulty: 'hard', stats: { mind: 5, body: 2 }, emoji: '🔨', desc: 'A shelf, a table, a thing that did not exist this morning. The deep satisfaction of the physical.' },
  { id: 'q-record', title: 'Make a Track', type: 'Hobby', difficulty: 'hard', stats: { mind: 5, personality: 3 }, emoji: '🎧', desc: 'One loop, one melody, one finished idea. Put a piece of your taste into the world.' },
  { id: 'q-film', title: 'Shoot a Short Film', type: 'Hobby', difficulty: 'epic', stats: { mind: 10, personality: 5 }, emoji: '🎬', desc: 'Three minutes that say what you mean. The whole crew is you and that is exactly enough.' },

  // ——— ADVENTURE ———
  { id: 'q-soloeat', title: 'Eat Alone Out', type: 'Adventure', difficulty: 'easy', stats: { personality: 2, soul: 1 }, emoji: '🍜', desc: 'A table for one and a book. Comfort in your own company is a superpower disguised as a Tuesday.' },
  { id: 'q-newroute', title: 'Get Lost on Purpose', type: 'Adventure', difficulty: 'easy', stats: { soul: 2, body: 1 }, emoji: '🧭', desc: 'Walk home a way you have never walked. Wonder lives one wrong turn outside the routine.' },
  { id: 'q-camp', title: 'Sleep Under Stars', type: 'Adventure', difficulty: 'hard', stats: { soul: 6, body: 3 }, emoji: '🏕️', desc: 'No ceiling, no signal, no schedule. Remember how small the day\'s worries look from under the sky.' },
  { id: 'q-summit', title: 'Climb a Mountain', type: 'Adventure', difficulty: 'epic', stats: { body: 10, soul: 6 }, emoji: '🏔️', desc: 'Up is the only direction that matters for a while. The view is the reward; becoming the person who climbs is the prize.' },
  { id: 'q-trip', title: 'Take the Solo Trip', type: 'Adventure', difficulty: 'epic', stats: { personality: 10, soul: 8 }, emoji: '✈️', desc: 'A new city where nobody knows your name. The fastest way to find out who you are is to remove everyone who already decided.' },
  { id: 'q-surf', title: 'Try Something Scary', type: 'Adventure', difficulty: 'hard', stats: { personality: 6, body: 2 }, emoji: '🏄', desc: 'Surf, climb, dive — pick the thing your stomach drops at. Fear is just excitement without breath.' },

  // ——— MORE BODY / HEALTH ———
  { id: 'q-noscreen-bed', title: 'No Screens in Bed', type: 'Health', difficulty: 'easy', stats: { body: 1, mind: 1 }, emoji: '🛏️', desc: 'The bed is for two things and doomscrolling is neither. Reclaim your sleep.' },
  { id: 'q-pushups', title: '50 Push-ups', type: 'Health', difficulty: 'easy', stats: { body: 2 }, emoji: '💪', desc: 'No gym, no excuse. Drop and give the floor fifty. Spread them across the day if you must.' },
  { id: 'q-sun', title: 'Get Morning Sun', type: 'Health', difficulty: 'easy', stats: { body: 1, soul: 1 }, emoji: '☀️', desc: 'Ten minutes of light on your face within an hour of waking. Your whole body clock recalibrates.' },
  { id: 'q-fast', title: '16:8 Fast', type: 'Health', difficulty: 'medium', stats: { body: 3, mind: 2 }, emoji: '⏳', desc: 'Give your gut a rest and your focus a boost. Sometimes the best thing you can add is nothing.' },

  // ——— MORE SOCIAL / PERSONALITY ———
  { id: 'q-thankyou', title: 'Thank Someone Old', type: 'Social', difficulty: 'medium', stats: { personality: 3, soul: 3 }, emoji: '💐', desc: 'Tell someone from your past what they meant. Gratitude unsaid is a debt you carry for free.' },
  { id: 'q-network', title: 'Reconnect', type: 'Career', difficulty: 'medium', stats: { personality: 4, mind: 1 }, emoji: '🤝', desc: 'One "how have you been?" to someone you drifted from. Your network is a garden, not a vault.' },
  { id: 'q-feedback', title: 'Ask for Feedback', type: 'Career', difficulty: 'hard', stats: { personality: 6, mind: 3 }, emoji: '🪞', desc: '"What could I do better?" — and then just listen. The fastest growth hides in the hardest questions.' },
  { id: 'q-mentor', title: 'Be a Mentor', type: 'Social', difficulty: 'hard', stats: { personality: 5, soul: 4 }, emoji: '🧑‍🏫', desc: 'Teach what you know to someone behind you. You learn it twice and lift two people at once.' },

  // ——— MORE MIND / CAREER ———
  { id: 'q-inbox', title: 'Inbox Zero', type: 'Career', difficulty: 'easy', stats: { mind: 2 }, emoji: '📧', desc: 'Clear the digital clutter. A quiet inbox is a quiet mind — archive, reply, or delete, no fourth option.' },
  { id: 'q-plan-week', title: 'Plan Your Week', type: 'Career', difficulty: 'easy', stats: { mind: 2, soul: 1 }, emoji: '🗓️', desc: 'Sunday-you decides so Wednesday-you can just execute. Aim before you fire.' },
  { id: 'q-side', title: 'Work the Side Quest', type: 'Career', difficulty: 'hard', stats: { mind: 6, personality: 2 }, emoji: '🛠️', desc: 'One hour on the project that is actually yours. The dream gets built in the margins of the day job.' },
  { id: 'q-teach-self', title: 'Teach Yourself a Skill', type: 'Career', difficulty: 'epic', stats: { mind: 12, personality: 3 }, emoji: '📚', desc: 'Pick a skill that scares you and grind it for a month. Hard-won competence is the best confidence there is.' },
];

export function sparksForDifficulty(d: Difficulty): number {
  return { easy: 50, medium: 250, hard: 600, epic: 1000 }[d];
}

// Quests spawned from the Growth library ("start as quest") live here so they
// resolve by id everywhere without polluting the curated Explore catalog.
const EXTRA: Quest[] = [];

export function registerQuest(q: Quest) {
  if (!EXTRA.some((e) => e.id === q.id) && !QUESTS.some((e) => e.id === q.id)) EXTRA.push(q);
}

export function getQuest(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id) ?? EXTRA.find((q) => q.id === id);
}
