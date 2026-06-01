# Questline ✦

*Save your progress. Watch yourself grow. Like a videogame.*

Questline turns real life into an RPG. You complete **side quests** (real-world
challenges), earn **Sparks (✦)**, level up four character stats —
**Personality, Body, Mind, Soul** — and grow your lifetime **Aura** score over
time. A daily streak loop, a photo journal, and a curated **Growth** library
keep the loop honest.

This is the **Phase 1 (MVP)** build of the [PRD](#) — the full core loop, running
offline-first.

## Stack

- **Expo + React Native** (`react-native-web` for the browser, iOS-ready).
- **Zustand + AsyncStorage** for offline-first local state (the "save file").
- No backend or secrets required for the v1 demo. Sign-in with Apple, push
  notifications and Supabase sync are stubbed for Phase 2 per the PRD.

## Run it

```bash
cd questline
npm install --legacy-peer-deps
npm run web        # browser
npm run ios        # iOS simulator (needs Xcode)
```

Build the static web bundle (same command Netlify would run):

```bash
npx expo export --platform web --no-minify   # → dist/
```

## What's implemented (maps to PRD §9)

| Surface | Status |
|---|---|
| **Onboarding** — cinematic welcome, value cards, 3 personalization steps, first quest | ✅ |
| **Today** — streak header, Mo–Su dots + multiplier, quick-log (✦/☀/💀), mood check-in, quest list, completion animation | ✅ |
| **Explore** — 85 curated quests (incl. trending "side quests": plogging, rucking, polar plunge, skydive, raw-dog a flight…), pillar/difficulty filters, accept → appears in Today, share | ✅ |
| **Days + Journal** — reverse-chron day cards, mood, multiplier, points, completed quests, journal entries with photo motifs, time-passed nudge | ✅ |
| **Growth** — idea cards, challenges, "Continue Reading" books, one-tap *Start as quest* | ✅ |
| **Profile** — Aura hero + trend graph (Now/7d/30d/90d/1y), four stat bars, streak, settings | ✅ |
| **Economy** — Sparks per difficulty, streak multiplier (x1→x3), `Aura += Sparks × multiplier`, independent stat gains | ✅ |

## Economy (PRD §10)

| Difficulty | Sparks | Stat gain |
|---|---|---|
| Easy | 50 ✦ | +1–2 |
| Medium | 250 ✦ | +3–5 |
| Hard | 600 ✦ | +6–10 |
| Epic | 1000 ✦ | +10–20 |

Multiplier: `1–2 days = x1`, `3–6 = x1.5`, `7–13 = x2`, `14+ = x3`. Missing a day
resets the multiplier, never the lifetime Aura.

**Anti-cheese cooldowns (PRD §10):** a quest can't be re-completed for Aura until
its cooldown clears, so the same quest can't be farmed: `easy = 1 day`,
`medium = 3 days`, `hard = once a week`, `epic = once a month`. On-cooldown quests
show a 🔒 "ready in Xd" state everywhere they appear (Explore, quick-log, Growth).

## Design language (PRD §11)

Near-black canvas (`#0A0A0B`) under a warm orange→red→pink glow. Instrument Serif
display type with italic emphasis on the emotional word, Inter for UI, JetBrains
Mono for numbers. Stat colors: Personality red, Body magenta, Mind orange, Soul
amber/gold. Large-radius glassy cards, sparkle particles on the completion frame.

> Quest imagery uses generative gradient "collages" rather than stock photos so
> the build stays fully offline and deterministic. Swapping in real photography
> is a drop-in change to `QuestCard`.

## Not in this build (Phase 2+ per PRD §14)

Supabase sync / Apple auth, AI Coach, HealthKit, widgets, social graph,
leaderboards, and at-scale custom user quests.
