# Handoff — **plan.** Teen Agenda App

## Overview

**plan.** is a paper‑agenda replacement for high‑school students. The kid uses it to log homework per class, track non‑class commitments (sports practices/games, work shifts, appointments, study sessions), and stay competitive with friends through points/streaks/leaderboards. A linked **parent app** lets parents see what the kid is adding/finishing and get a real‑time activity feed.

Core product principles:

1. **Speed of entry.** Teens won't fight with date pickers. Every commitment is logged in 4–5 taps: pick a tag pill, pick a due‑date pill, pick a reminder pill, hit save. No drop‑downs, no calendars (except as an opt‑in option).
2. **Multimodal capture.** The student can type, **🎙 dictate**, or **📷 snap a photo** of the whiteboard.
3. **Gamification without being childish.** Twilight‑neon vibe with juicy confetti on completion, points, streaks, leaderboards. Inspired by reference (`scholarquest-twilight`) — not Duolingo.
4. **Three vibes.** The student can pick **Twilight** (default — dark neon), **Paper** (warm cream agenda), or **Mono** (clean) from Profile → Theme.
5. **Parent visibility.** Pairing via a 6‑character code. Parent sees today's homework dashboard + a notification timeline of every add / completion / event / streak milestone.

---

## About the design files

The bundled files in `prototype/` are a **design reference**: a React + Babel prototype written as static `.jsx` files that render in‑browser. They are **not the production codebase**. The task is to **recreate these designs in the target codebase's environment** (React Native + Expo recommended for iOS/Android — but match whatever framework the engineering team uses) following the codebase's existing patterns, component library, and state management.

**To view the prototype:** open `prototype/index.html` in any modern browser (Chrome, Safari, Firefox). It is fully self‑contained — no build step.

You can navigate the prototype through:
- **Scene‑jumper pills** above the phone (Sign in / School / Classes / Pair / Today / Week ↻ / Friends / Me)
- **Student / Parent toggle** in the top‑right
- **Tweaks** in the toolbar to change vibe / dark mode / reward intensity

---

## Fidelity

**High‑fidelity.** This is a hi‑fi prototype with final palettes, spacing, type, copy, interactions, and animations. Recreate pixel‑perfect, using your codebase's existing libraries.

---

## Target stack (recommended)

| Concern | Recommendation |
|---|---|
| Mobile platform | iOS first → Android | 
| Framework | React Native + Expo (or SwiftUI for native iOS) |
| State | Redux Toolkit or Zustand for student app state; React Query for server sync |
| Auth | Email/password + reset (Firebase Auth, Supabase, or AWS Cognito) |
| Push notifications | APNs (iOS), FCM (Android) — needed for reminders + parent activity |
| Realtime | WebSocket or Firebase for friend requests, chat, parent activity feed |
| Database | Postgres (Supabase) or Firestore — schema below |
| Camera / mic | `expo-image-picker` + `expo-av` (or native `AVAudioRecorder` / `UIImagePickerController`) |
| Voice transcription | `expo-speech-recognition`, Whisper API, or `SFSpeechRecognizer` (iOS native) |
| OCR (for snap‑the‑whiteboard) | Apple Vision (`VNRecognizeTextRequest`) on‑device, or Google Cloud Vision |
| Analytics | PostHog, Amplitude, or Mixpanel |

A real production build is **two apps + one backend**:
1. **Student app** (kid) — full prototype
2. **Parent app** (parent) — companion
3. **Backend** — auth, sync, push, school directory, leaderboard

---

## Design tokens

### Vibe: Twilight (default)

```js
{
  // Backgrounds
  bg:           '#0c0820',  // deep indigo
  bgGlow:       'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(236,72,153,0.22), transparent 70%),' +
                'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(124,58,237,0.14), transparent 70%),' +
                '#0c0820',

  // Surfaces (cards, sheets, inputs)
  surface:      'rgba(255,255,255,0.035)',
  surfaceHi:    'rgba(255,255,255,0.070)',  // emphasised cards / inputs
  surfaceEdge:  'rgba(255,255,255,0.080)',  // 1px borders

  // Text
  ink:          '#f4ecff',  // primary
  sub:          'rgba(244,236,255,0.62)',  // secondary
  soft:         'rgba(244,236,255,0.38)',  // placeholder
  line:         'rgba(244,236,255,0.10)',  // dividers

  // Accents (use individual tones for tag colors)
  magenta:      '#ec4899',  // primary accent · Homework, social, magenta pills
  purple:       '#a78bfa',  // Project, Essay, study
  cyan:         '#06d6e0',  // Reading, practice
  mint:         '#34d399',  // Worksheet, Lab, work
  amber:        '#fbbf24',  // Quiz, game
  red:          '#f87171',  // Test, urgent due, appointments
  pink:         '#f472b6',  // chat accent

  // Gradient primary action
  accentGrad:   'linear-gradient(95deg, #a78bfa 0%, #ec4899 100%)',

  // Modal overlay
  overlay:      'rgba(8,4,20,0.7)' + ' + backdrop-blur(4px)',
}
```

### Vibe: Paper

```js
{
  bg:         '#f3eee3',  // warm cream
  surface:    'rgba(255,255,255,0.60)',
  ink:        '#1c1917',
  sub:        'rgba(28,25,23,0.62)',
  accent:     '#d97706',  // amber
  margin:     '#b91c1c',  // ruled-line red margin (if "lined" sub-aesthetic)
  // dark version inverts: bg #1a1714, ink #f4ece0
}
```

### Vibe: Mono

```js
{
  bg:         '#fafaf7',  // or #0a0a0a dark
  ink:        '#0a0a0a',  // or #fafafa dark
  accent:     '#22c55e',  // green
  // greyscale + single accent
}
```

### Type scale

| Use | Family | Weight | Size | Line‑height | Letter‑spacing |
|---|---|---|---|---|---|
| Hero italic display ("today", "Welcome back.") | Instrument Serif | 400, italic | 38–46px | 0.95–1.02 | -0.3 to -0.5 |
| Sheet titles ("Add homework") | Instrument Serif | 400, italic | 30px | 1.02 | -0.3 |
| Section labels ("WED · MAY 13") | JetBrains Mono | 500 | 10.5–11px | 1.0 | 1.6–1.8 (uppercase) |
| Body | Geist | 400/500 | 14.5px | 1.4 | -0.1 |
| Class names | Instrument Serif | 400, italic | 22px | 1.05 | -0.2 |
| Pill labels | Geist | 500/600 | 13.5px | 1.1 | -0.1 |
| Times | JetBrains Mono | 400/500 | 10.5–13px | 1.0 | 0.3–0.4 |
| Hand accents ("nothing else today —") | Caveat | 500 | 22px | 1.0 | 0 |

**Google Font imports:**
```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Caveat:wght@500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Spacing & radii

- **Padding scale**: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 (px)
- **Border radii**: 6 (chip), 10–14 (small card), 16–18 (card), 20 (class block), 24–28 (sheet top), 999 (pill)
- **Sheet bottom safe area**: 40px (clears iOS home indicator)

### Shadows / glow

```css
/* Active pill — neon outline glow */
box-shadow: 0 0 0 3px {tone}1f, 0 0 16px {tone}55;

/* Gradient button glow (twilight only) */
box-shadow: 0 0 0 1px {magenta}33, 0 8px 32px {magenta}55, 0 4px 14px {purple}44;

/* "Now" class block ring */
box-shadow: 0 0 0 1px {classColor}33, 0 0 28px {classColor}55;

/* Soft drop on emoji tile */
box-shadow: 0 4px 12px {classColor}66;
```

### Animations

| Name | Duration | Easing | What |
|---|---|---|---|
| `slideUp` | 320ms | cubic-bezier(.2,.7,.4,1) | sheet slides up from bottom |
| `fade` | 200ms | ease-out | scrim |
| `flash` | 240ms | ease-out | camera capture flash overlay |
| `pop` | 1000ms | cubic-bezier(.2,.7,.4,1) | +points reward bounce |
| `confetti` | 1100ms | cubic-bezier(.2,.6,.3,1) | each bit translates(dx,dy) + rotates |
| `ticker` | 95s linear infinite | linear | news ticker scroll |
| `pulse2` | 1.6s infinite | ease-in-out | live‑news dot, mic recording dot |
| `twinkle` | 1.8s, staggered | ease-in-out | sparkles around the quote card |

Pill press feedback should use a brief scale `0.96 → 1.0` on tap (~120ms). Checkmark fill is 200ms with a 12px glow on the box.

---

## Screens

### 1. Auth — Sign in / Sign up / Reset

**Layout** — single-column, 24px horizontal padding.

- **Pre‑title** (handwritten, optional flourish): `my agenda` in Caveat 28, magenta, rotated -2°. *Considered removing this so it doesn't feel "schooly"; product can decide.*
- **Title**: "Welcome back." (sign‑in) / "Make yours." (sign‑up) — Instrument Serif italic 44, ink, line‑height 1.
- **Subtitle**: 15px Geist, sub color.
- **Email** + **Password** fields — see Field component.
- **Forgot password?** — right‑aligned link in accentDk magenta.
- **Sign in / Create account** — `PrimaryBtn` (gradient).
- **Toggle**: "New here? Make an account" / "Already have an account? Sign in" — ghost button.

**Reset password screen** has a "← Back" pill, then "Forgot password?" title and email field. On submit, shows confirmation card and lets the user return.

**Component: `Field`**
```
label    — JetBrains Mono 12, 600, letter-spacing 0.5, uppercase, sub color, bottom margin 6
input    — full width, padding 14×16, font Geist 16, border 0.5px surfaceEdge
           background surface, radius 14, no outline, ink color
```

### 2. School picker

**Source data**: `data.js → window.GVAN_SCHOOLS` — ~70 real Greater Vancouver public high schools (Vancouver, Burnaby, Richmond, Surrey, North Van, West Van, Coquitlam, New West, Delta, Langley, Maple Ridge). In production, fetch from a `/schools?region=…` endpoint that can be expanded.

**Layout**
- Back button → "Step 1 of 3" micro‑label → "Which school?" serif title → search field
- List grouped by city. Each group has a `MicroLabel` city header, then a card with rows.
- Each row: school name → `›` chevron. Tap commits.

**Search**: filters by school name OR city, case‑insensitive.

### 3. Classes setup

**Layout**
- Back → "Step 2 of 3 · {school.name}" → "Your classes" title → instructions
- **"My school's schedule changes daily"** toggle — when ON, hides the time fields per class.
- List of class rows. Each row: color stripe, sequence number, editable name, start/end time on the right.
- Tap a row to expand: shows TimeField start/end, color swatches (8 options), Remove button.
- "+ Add a class" dashed‑border button.
- Sticky footer: PrimaryBtn "{N} classes — continue".

**Default 8 class colors** (use these even if the student tweaks):
`#ec4899` `#a78bfa` `#06d6e0` `#fbbf24` `#34d399` `#f472b6` `#06b6d4` `#d97706`

**Default emoji per class** (assigned by name keyword on creation):
- english/lit/lang → 📖
- math/calc/algebra → 🧮
- chem/bio/science → 🧪
- social/history/geo → 🌎
- pe/athletics/sport → 🏐
- art/music/drama → 🎨
- code/cs → 💻
- spanish/french/german → 🗣
- fallback → 📚

### 4. Parent pair (onboarding step 3, optional)

**Layout**
- Back → "Step 3 of 3 · Optional" → "Pair with a parent?"
- Big card with `MicroLabel` "Your pairing code", followed by the 6‑char code in JetBrains Mono 38, letter-spacing 4.
- Hand‑scribbled "show this to mom or dad ↑" in Caveat.
- Instructions: parent downloads the Parent app, taps "Pair with a kid", and enters this code.
- Footer: PrimaryBtn "Done — open my agenda" + ghost "Skip for now".

**Code format**: 6 characters, A–Z (no I/O to avoid confusion with 1/0) + 0–9. Server generates and stores against the student account.

### 5. Today (main screen)

**Layout — top to bottom**

1. **Header row** — "WED · MAY 13" micro‑label, "today" italic display 46, and the **PointsChip** in top right.
2. **Daily quote card** — sparkles in twilight, " quote-mark glyph top-left, italic serif body 20, "— Author" caption.
3. **News ticker** — full-width horizontal scroll, animation `ticker 95s`. Pulsing mint dot + "Good things happening · live" label. Each item: source in Mono cyan, headline in Geist.
4. **Class blocks** — one per class, padded 12px between.
5. **After school events** — section divider with "+ Event" link.
6. **Bottom nav** (sticky overlay with gradient fade) — Today, Week, Squad, Me.

**Daily quote source**: `quotes-and-news.js → window.DAILY_QUOTES` (110 entries). Deterministic by date — `quoteOfDay(dateStr)` hashes the date and picks. In production, this should be a server endpoint so the curation can grow.

**News ticker source**: curated list in `window.POSITIVE_NEWS`. The intent is to pull from a positive-news API (Good News Network, Positive.News, BBC's "Best of Good News") — proxy through your backend to control rate limits and curation.

**Class block detail (`ClassBlock`)**
- Outer: padding 14, radius 20, surface bg, 1px surfaceEdge border. If `isNow`: bg becomes a soft gradient of the class color (`{color}26 → {color}10`), border becomes `{color}88` (≈53% alpha), glow `0 0 28px {color}55`.
- **"NOW" badge**: absolute -8px above top-right, padding 3×9, radius 999, class color bg, white text, Mono 9.5/700, letter-spacing 1.2, uppercase, glow.
- **Emoji tile**: 38×38, radius 11, linear gradient `{color} → {color}aa`, shadow `0 4px 12px {color}66`.
- **Title**: class name in Instrument Serif italic 22, ink, ellipsis on overflow.
- **Meta** (if `showTimes`): Mono 10.5, sub color, "{start} – {end} · {teacher}".
- **+ button**: 32×32 magenta `CircleBtn` (subtle glow).
- **Homework rows** (inside the block, paddingLeft 8): `HwRow` — 20px checkbox, title, tag chip + due text below.

**HwRow detail**
- Checkbox 20×20, radius 7, 1.5px border. Checked: filled accent (magenta), 12px glow.
- Title 14.5 Geist, ink. When done: strikethrough with accent color, opacity 0.5.
- **Tag chip** (using the emoji+tone for that tag from `HW_TAGS`):
  - padding 2×8, radius 999, bg `{tone}20`, text `{tone}`, Geist 10.5, font-weight 500.
  - Shows the emoji + label.
- **Due text**: Mono 10.5. If urgent (due today, not done): `T.red` color, prefix "⚠ ", weight 600.
- **Points** (when done): Mono 10.5 700, accent color, "+15".

**EventBlock**
- 36×36 rounded tile with the event tone (cyan/amber/mint/red/purple/magenta) at 0.13 alpha bg, 0.2 alpha glow.
- Title 14.5 Geist 500, ink. Below: Mono 10.5 "PRACTICE · 3:30 pm".
- Tap toggles done.

**Points chip (`PointsChip`)**
- Outer: padding 6×13/6, radius 999, 1px magenta66 border, gradient bg (twilight) or surface, magenta66 glow.
- Avatar circle 28×28 with gradient `accentGrad`, magenta99 glow. Shows "🔥{streak}" white 12/700.
- Number "{points.toLocaleString()} pts" Mono 13/600.

**Bottom nav (`BottomNav`)**
- Sticky bottom, paddingBottom 32 (home indicator clearance), paddingTop 10.
- Background: gradient fade from transparent to `bg` with `backdrop-filter: blur(12px)`.
- 4 buttons: Today (◐) / Week (▦) / Squad (◍) / Me (●).
- Active item: magenta icon with `drop-shadow(0 0 8px magenta)`.

### 6. Add Homework sheet

The most-used screen. Optimize ruthlessly for speed.

**Layout (modal, slides up from bottom, 94% max height)**

1. **Header bar**: 40×4 grab handle pill at top, "Add homework" italic serif 30 on left, ✕ button on right.
2. **Class chip** (compact pill, paddingLeft 7, paddingRight 11)
   - 22×22 rounded square with class emoji on gradient class‑color bg.
   - Mono 10/700 uppercase "CLASS" in class color.
   - Native `<select>` so the kid can switch classes without re-opening.
3. **Tag pills** — `Tag this entry as` micro-label, then a wrapping pill row from `HW_TAGS`. **Default selected: Homework** (`assignment` id). Each pill has an emoji + label and uses its assigned tone (Homework=magenta, Quiz=amber, Test=red, Project=purple, Reading=cyan, Worksheet=mint, Lab=mint, Essay=purple, Present=magenta).
4. **Title input** — single-line, 16px font, placeholder "What's the assignment?". Border 1.5px in the currently-selected tag's tone with glow `0 0 0 3px {tone}22, 0 0 24px {tone}44`. **Auto-focus** when sheet opens.
5. **Notes block** — `MicroLabel` "Notes", then a multi-line textarea with placeholder "Add details, page numbers… tap 🎙 to dictate or 📷 to snap the whiteboard". Inside the block, two side-by-side capture buttons:
   - **🎙 Dictate** (magenta tone). On tap: shows red recording pulse; in production this opens the system mic + speech-to-text. Demo behaviour: fills title with sample text after 1.5s.
   - **📷 Whiteboard** (cyan tone). On tap: flash overlay + opens camera + (production) runs OCR via Apple Vision / Google Vision. Demo behaviour: fills title+notes after 240ms.
6. **Due pills** — `Due` micro-label, then a row of 4 pills: **Today / Tomorrow / Next week / Pick a day** (`window.DUE_OPTIONS`). Default: Tomorrow. "Pick a day" expands a horizontal 14-day day-picker strip (`DayPicker`) below.
7. **Reminder pills** — `Remind me` micro-label, then 5 pills (`window.REMINDER_OPTIONS`):
   - Tomorrow at breakfast
   - After school
   - After dinner
   - Tomorrow at lunch
   - Morning it's due
   - + None
8. **Action footer** — PrimaryBtn "✨ Save assignment" + GhostBtn "Cancel". Bottom padding 40 to clear the home indicator.

**Validation**: Save is disabled until title is non-empty.

**On save**: Create homework with `{ classId, title, notes, tag, due, dueUrgent: due === 'today', reminder, points: 10 }`. Award +5 points immediately (entry bonus) and trigger the reward overlay. Push notification to parent's activity feed.

### 7. Add Event sheet

Same shell as Add Homework. Pillboxes for:

- **Type** (`window.EVENT_TYPES`): Practice 🏐 / Game 🏆 / Work 💵 / Appt 📍 / Study 📚 / Club 🎸 / Social ✨ — each with a tone.
- **Title input** with glow border in the selected type's tone.
- **When** (same as Due): Today / Tomorrow / Next week / Pick a day.
- **Time** pills: 7:30 am / 12:00 pm / 2:00 pm / 3:30 pm / 4:00 pm / 6:00 pm / 7:30 pm / All day.
- **Remind me**: Right now / Morning of / 30 min before / No reminder.

### 8. Reward overlay (on homework completion)

Fullscreen overlay (z-index 220), non-interactive (`pointer-events: none`), auto-dismisses in 1700ms.

- **Confetti**: 48 bits (playful intensity) flying out from center. Each bit has random size 4–12px, color from accent palette, random rotation, 1100ms animation. Each bit has a `0 0 12px {color}99` glow.
- **+{points}** number — Instrument Serif italic 88, with `WebkitBackgroundClip: text` on `accentGrad`. Drop shadow `0 0 30px magentaaa` for glow.
- **🔥 {streak}-day streak** — Caveat 32, ink color, rotated -2°, magenta66 text shadow.

Intensity tweaks (see Tweaks section): subtle (12 bits), mid (28 bits), playful (48 bits, default).

### 9. Week view (landscape paper-agenda spread)

When the device rotates to landscape (or the user taps the "Week ↻" pill), render a full Mon–Sun grid:

- **Top bar**: "May 11–17" serif title, "this week" caveat accent (twilight: serif italic without caveat).
- **Class column** (left, fixed 130px wide): each class as a row with color stripe + name + time.
- **Day columns** (7 equal-width): header with weekday + day number, current day uses accent color. Each cell is a click target that opens Add Homework prefilled with that class+day. Homework items render as small chips with left border in class color.
- **Bottom band**: "Other" row — events per day shown as compact chips.
- **"↻ Portrait" button** in the top bar to rotate back.

In production this is **landscape-only** on phone, or **default** on tablet.

### 10. Squad (Leaderboard + Friends + Chat)

**Layout**
- Header: "Squad" micro-label, "Friends & ranks" serif title, **+ circle** button in top-right to add friends.
- **Top tabs (segmented)**: **School** | **Friends** — full-width pill tabs, active uses `accentGrad`.

**School board** (`SchoolBoard`)
- Top "You're 8th at Eric Hamber, 215 pts from #5" highlight card with accent border + glow.
- 10-row leaderboard with rank | avatar | name + (✦ friend if applicable) | points. "You" row is highlighted with magenta tint.

**Friends tab** has sub-tabs:
- **Rank** — your friend leaderboard. Your row highlighted.
- **Groups** — list of friend groups (chat-enabled). Default sample group "Chem Buddies", "Volleyball", "Eng 11 grind". Tap to open chat.
- **Requests** — pending friend requests with badge count. Each request card shows avatar, name, school, mutual count, when received, **Accept** (gradient) and **Decline** (ghost) buttons.

**Group chat** (`GroupChat`)
- Header: "← Back", group name, member count.
- Bubble layout: incoming bubbles align left with 26×26 avatar + sender name + bubble (surface bg, ink text, rounded-with-tail). Outgoing bubbles align right, accent magenta bg, white text.
- Message timestamps below each bubble in 10px soft color.
- Composer: pill input + circular send button (becomes magenta gradient when text is present, with glow).

**Add Friend sheet** (`AddFriendSheet`)
- Search bar at top (name or @username).
- 3 quick pills: **🔗 Add by code** (cyan, toggles), **📲 Contacts** (purple, stub), **🔗 Share link** (magenta, stub).
- "Add by code" expanded view: cyan-glow card with 6-char Mono input. Note: "They'll see your name and have to accept."
- **From your school** list (`window.FRIEND_SUGGESTIONS`) — each row has avatar + name + "{N} mutual friends" + **Add** gradient pill. After tap, becomes "Sent ✓" in surface style.

**Accept/decline behaviour**: Accepting a request removes it from the request list, prepends the user to your friends array with a starter `pts` and `streak`. Declining just removes from the list.

### 11. Profile (Me)

**Layout (scroll, paddingBottom 100 for nav)**

1. Header: "Profile" micro-label, "Alex Chen" serif 36, "Eric Hamber Secondary · Grade 11" sub.
2. **Stats row** — 3 cards: Points (accent-tinted), Streak ({N}d), Done (count).
3. **Theme section** — 3 swatch cards (Twilight / Paper / Mono) in a row. Each shows a preview of the bg + 3 colored dots; the active card has a magenta ring, glow, and a ✓ checkmark in the top-right.
4. **Pair with parent** — if unpaired, shows the 6-character pairing code in Mono 34 letter-spacing 4. If paired, shows mint "Paired with Mom" status + Unpair button.
5. **Classes** — list rows: Edit classes / Class schedule / Switch school.
6. **Account** — Notifications / Privacy / Help / Sign out (red text).

### 12. Parent app — Pair

The parent installs the Parent app, opens it, and lands on the pair screen.

- "for parents" caveat accent, "Pair with your kid" serif title, instructions.
- **6-segment code input**: 6 boxes (40×56, radius 10) showing the typed characters one at a time. The current box has a magenta border.
- **Keypad** below: 4×3 grid with 0–9, A (alpha-num), and ⌫. Mono 24 font on each key.
- **Demo: paste {code}** shortcut button (prototype-only, remove in prod).
- **Pair** primary button — disabled until 6 chars entered.

On pair success: navigate to Parent Dashboard.

### 13. Parent app — Dashboard

The "today" view for parents.

- **Summary card**: avatar circle + "This week" + 3 stats (done count, open count, streak).
- **Open homework** section: card list of incomplete homework with class color stripe, title, class+tag+due.
- **Completed today** section: dimmer card list with checked items, class name, +points earned.
- **After school** section: events list with type emoji tile.

All data is derived from the same backend collection the student writes to.

### 14. Parent app — Activity timeline

- "Activity" micro-label, "Notifications" serif title.
- Vertical timeline with a 1px line down the left at x=30. Each item:
  - Dot (28×28) on the line. Color depends on type: `done` → magenta, `streak` → mint, `add` → class color, `event` → cyan.
  - Glyph inside dot: ✓ (done), + (add), ◆ (event), ★ (streak).
  - Card to the right: type label (uppercase mono) + timestamp on right, then content (title), then class name (if applicable) in sub color.
- The student's actions (add homework, complete homework, add event, hit streak milestone) push new entries to the top with "just now" stamp.

In production: push notifications also fire on these events, configurable per type in the parent's settings.

---

## State management

### Student app

```ts
type Student = {
  id: string;
  email: string;
  name: string;
  school: { id: string; name: string; city: string };
  grade: number;
  pairingCode: string;
  parentIds: string[];
  vibe: 'twilight' | 'paper' | 'mono';
  dark: boolean;
  rewardIntensity: 'subtle' | 'mid' | 'playful';
  useClassTimes: boolean;
};

type Class = {
  id: string;
  name: string;
  teacher?: string;
  start?: string;  // 'HH:MM'
  end?: string;
  color: string;   // hex
  emoji?: string;
  weekdays: ('mon'|'tue'|'wed'|'thu'|'fri')[];
};

type Homework = {
  id: string;
  studentId: string;
  classId: string;
  title: string;
  notes?: string;
  tag?: 'quiz'|'test'|'project'|'assignment'|'reading'|'worksheet'|'lab'|'essay'|'presentation';
  due: ISO8601;   // resolved server-side from the chosen pill
  dueUrgent: boolean;
  reminder?: 'breakfast'|'afterschool'|'afterdinner'|'lunchtmrw'|'morningof' | { customAt: ISO };
  points: number;
  done: boolean;
  doneAt?: ISO;
  createdAt: ISO;
  attachedImage?: string;  // optional photo url
};

type Event = {
  id: string;
  studentId: string;
  title: string;
  kind: 'practice'|'game'|'work'|'appt'|'study'|'club'|'social';
  time: string;
  date: ISO;
  reminder?: string;
  done: boolean;
};

type Friend = { id: string; userId: string; pts: number; streak: number };
type FriendRequest = { id: string; fromUserId: string; toUserId: string; createdAt: ISO; status: 'pending'|'accepted'|'declined' };

type Group = { id: string; name: string; memberIds: string[] };
type Message = { id: string; groupId: string; senderId: string; text: string; sentAt: ISO };
```

### Backend collections

| Collection | Indexes |
|---|---|
| `users` | email (unique), school+grade |
| `classes` | studentId |
| `homework` | studentId+due, studentId+done, classId |
| `events` | studentId+date |
| `friendships` | userId+friendId composite |
| `friendRequests` | fromUserId, toUserId, status |
| `groups` | memberIds (array-contains) |
| `messages` | groupId+sentAt |
| `parentLinks` | studentId+parentId, code (unique) |
| `notifications` | parentId+createdAt |
| `schools` | region+city |
| `dailyQuotes` | date |
| `news` | curatedAt |

### Due-date resolution

When the student picks "Today" the server resolves to end-of-day of the current local date. "Tomorrow" → end of next day. "Next week" → end of next Sunday. "Pick a day" → the chosen ISO date. Store the resolved ISO **and** the original choice (for analytics / understanding usage).

### Reminders → push notifications

Each reminder pill maps to a schedule expression:

| Pill | Schedule |
|---|---|
| Tomorrow at breakfast | next 7:30am local |
| After school | today 3:30pm local (or, if it's after, tomorrow same time) |
| After dinner | today 7:00pm local |
| Tomorrow at lunch | tomorrow 12:00pm local |
| Morning it's due | due_date − 12h, clamped to 7:30am of due day |

Schedule via APNs / FCM. Cancel if homework is marked done before the fire time.

---

## Behaviour notes

- **Auth**: Standard email/password with reset-by-email. Magic-link option preferable for teens (they forget passwords). 
- **Class entry order**: when listing on Today, **always preserve creation order**. Don't sort by time unless `useClassTimes` is true AND the student chose to sort.
- **Current-class highlight**: only when `useClassTimes` is true AND the current local time falls in the class's range.
- **Quote rotation**: deterministic by date so it doesn't change mid-day. Hash the local date string.
- **Friend requests**: notify the recipient via push. Allow blocking.
- **Group chat**: text-only for v1. Image attachments later.
- **Parent visibility scope**: parent sees homework titles + class names + due dates + completion status. Parent does NOT see chat content or social. Parent CAN'T edit anything.
- **Multiple kids per parent**: Parent dashboard should support a top picker if more than one student is paired.
- **Privacy/COPPA**: Greater Vancouver high schoolers are typically 14–18 — generally clear of COPPA but plan FERPA-aware data handling. Parental email verification before pairing.

---

## Components inventory (prototype → production)

Files to study in `prototype/`:

| File | What it contains |
|---|---|
| `theme.jsx` | Canonical design tokens, `Pill`, `PrimaryBtn`, `GhostBtn`, `SerifTitle`, `MicroLabel`, `CircleBtn`, `Confetti`, `Sparkles`, `makeTheme(t)` |
| `onboarding.jsx` | `AuthScreen`, `ResetPwdScreen`, `SchoolPickerScreen`, `ClassesScreen`, `ParentPairScreen`, `Field`, `ClassRow`, `TimeField` |
| `today.jsx` | `TodayScreen`, `QuoteCard`, `NewsTicker`, `ClassBlock`, `HwRow`, `EventBlock`, `PointsChip`, `BottomNav`, `AddHomeworkSheet`, `AddEventSheet`, `Sheet`, `RewardOverlay`, `DayPicker`, `CaptureBtn`, `PillSection` |
| `week.jsx` | `WeekScreen`, `WeekHwChip` |
| `social.jsx` | `SocialScreen`, `SchoolBoard`, `FriendsTab`, `SubTab`, `FriendBoard`, `GroupList`, `GroupChat`, `RequestsList`, `AddFriendSheet`, `ProfileScreen`, `ThemeCard`, `Stat`, `Section`, `Row` |
| `parent.jsx` | `ParentApp`, `ParentPair`, `KeypadInline`, `ParentDash`, `ParentNotif`, `ParentNav` |
| `data.js` | Sample data: `GVAN_SCHOOLS` (70 schools), `HW_TAGS`, `EVENT_TYPES`, `DUE_OPTIONS`, `REMINDER_OPTIONS`, `SAMPLE_FRIENDS`, `FRIEND_REQUESTS`, `FRIEND_SUGGESTIONS`, `SAMPLE_SCHOOL_BOARD`, `SAMPLE_CHAT` |
| `quotes-and-news.js` | 110 daily quotes + `quoteOfDay(date)`, curated `POSITIVE_NEWS` |
| `app.jsx` | App shell + state + scene routing + Tweaks panel + page chrome |
| `ios-frame.jsx` | iOS device frame + status bar (decorative, not needed in production) |
| `tweaks-panel.jsx` | In-prototype UI for designers to tweak vibe/intensity (not for production) |

In production the device frame goes away — you build native screens. But the **internal** screen content, components, and interaction model from these files should map 1:1.

---

## Open questions for product

These came up while building and the team should answer before shipping:

1. **Photo capture**: store the snapped whiteboard image and attach to the homework, or just OCR and discard? Storage costs differ enormously.
2. **Voice transcription**: on-device (free, slower, iOS-only nice) vs. server (Whisper, costs money but better)?
3. **Parent app**: separate app on the store or a parent mode toggle in the same app?
4. **School directory**: maintained manually for v1 (Greater Vancouver only), or scraped from a province-wide source?
5. **Leaderboard scope**: school-wide ranking — opt-in privacy concerns, especially for younger users.
6. **Chat moderation**: do we need profanity filtering or reporting in friend group chat? Almost certainly yes.
7. **Streak forgiveness**: does the streak break on a day with no homework, or only on a day with un-done homework? Recommend: streak counts days where ≥1 task was completed OR no tasks were due.
8. **Reminder default**: should the system pick a default reminder based on the time of day the homework was added? (E.g., logged at 8pm → "morning of" by default.)

---

## How to run the prototype

1. Unzip the package.
2. From `prototype/`, open `index.html` in a modern browser. No server needed.
3. Click the scene-jumper pills above the phone to navigate.
4. Toggle Student / Parent in the top right.
5. Click "Tweaks" in the toolbar (if available) to switch vibes.

---

## Contact

Designed in conversation with the product owner. All decisions reflect direct feedback through the conversation. Questions on intent → ask the PM, not the designer.
