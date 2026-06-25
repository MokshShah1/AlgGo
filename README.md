# AlgGo — Algebra on the Go

> **Subject:** 8th Grade Algebra: Linear Relationships
> **Chapter:** Slope, Graphing Lines, and `y = mx + b`
> **Flagship lesson:** Slope = Rise / Run

AlgGo is a learn-by-doing web app that teaches **one** chapter of 8th
grade algebra deeply through interactive, visual problem solving. Drag points on
a coordinate plane, watch the line and rise/run triangle update live, and learn
slope by doing rather than by reading.

## Persona

Designed for **Maya**, an anxious 13-year-old learning mostly on her phone. Every
UX decision favors short, low-pressure, touch-first interactions with encouraging
multi-try feedback and specific hints when she makes a common mistake.

## What this app does

### A full, playable chapter

All **9 lessons** in the chapter — _Linear Relationships: Slope & Graphing
Lines_ — are fully playable, ordered from the intuition of constant rate through
real-world modeling with `y = mx + b`:

1. Constant Rate of Change
2. Slope = Rise / Run
3. Slope from Two Points
4. Positive & Negative Slope
5. The y-Intercept
6. Slope–Intercept Form (`y = mx + b`)
7. Proportional Relationships
8. Matching Representations
9. Real-World Lines

Each lesson ends with a couple of harder **mastery-check** questions so that
passing (≥ 80%) really means you've got it.

### 10 interactive question types ("solvables")

Lessons are built from ten hand-authored, locally-validated solvable kinds:

| Kind           | What the learner does                                  |
| -------------- | ------------------------------------------------------ |
| `observe`      | Drag to explore until the idea clicks                  |
| `numeric`      | Type a number or fraction (decimals accepted)          |
| `choice`       | Pick one option from tiles or a list                   |
| `graph-target` | Drag a point until the line hits a target slope        |
| `multi-select` | Select every correct option (and no wrong ones)        |
| `order`        | Put steps/items into the right order                   |
| `slider`       | Estimate a value on a slider                           |
| `categorize`   | Sort items into the correct buckets                    |
| `number-line`  | Place a marker at the right value on a number line     |
| `table-fill`   | Fill in the missing cells of an x/y table              |

### 11+ practice & study modes

Beyond the core lessons, the app offers many ways to practice:

- **Lessons** — the sequential, unlock-gated chapter path.
- **Daily Challenge** — a fresh set of questions each day.
- **Speed Round** — timed rapid-fire questions.
- **Challenge** — a tougher mixed quiz.
- **Smart Review / Practice** — spaced, targeted review of weak concepts.
- **Mistake Notebook** — replay the questions you previously missed.
- **Word Problems** — applied, real-world phrasing.
- **Diagnostic / Placement** — a quick test that places you at the right lesson.
- **Sandbox** — a free-play coordinate plane to experiment with slope.
- **Skill Tree** — a concept map of mastery progress.
- **Weekly Recap** — a summary of the week's learning.
- **Leaderboard** — weekly and all-time XP rankings.

### Gamification

- **XP:** 5 XP per correct solvable, plus a 25 XP lesson-completion bonus (never
  double-counted on replay).
- **Levels:** XP rolls up into learner levels.
- **Streaks:** daily streaks with **streak repair** charges so one missed day
  doesn't wipe your progress.
- **Achievements** and **daily goals** (a configurable number of solvables/day).
- **XP-gated avatars:** unlock new avatar options as you earn XP.
- **Leaderboards:** opt-in **weekly** and **all-time** XP boards.

### Accessibility

- **Light / dark** themes.
- **High-contrast** mode.
- **Dyslexia-friendly font** toggle.
- **Reduced motion** (also respects the OS `prefers-reduced-motion` setting).

### Content & feedback are hand-authored

All lesson content, hints, and answer validation are hand-authored and run
locally and synchronously — there is no generated lesson content and no chatbot.

> **Voice narration exception:** the optional "Teach me" mini-lessons read the
> authored explanation aloud using a text-to-speech voice (this only converts
> the hand-written text to audio — it does not generate any lesson content).

## Voice / TTS narration

The optional mini-lesson narration picks a voice automatically:

1. **Local neural voice (recommended, free, no key).** Run `npm run tts` to start
   a tiny local server that uses Microsoft Edge's "Neural" voices, which sound
   genuinely human. The app auto-detects it.
2. **No-setup online voice.** If that server isn't running, it falls back to a
   free, no-key online voice (Amazon Polly via StreamElements).
3. **Premium voices.** Optionally plug in ElevenLabs or OpenAI via `.env`.
4. **Offline.** Falls back to the device's built-in voice, then to captions.

To get the realistic local voice, open two terminals:

```bash
npm run tts        # starts the Microsoft Edge "Neural" voice server
npm run dev        # in another terminal
```

Provider selection and voice names are configurable in `.env` — see
[`.env.example`](.env.example) (`VITE_TTS_*`, `VITE_ELEVENLABS_*`,
`VITE_OPENAI_*`).

## Tech stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS
- React Router v6
- `motion` (Framer Motion) for page/route transitions
- Firebase Authentication + Firestore
- SVG (not Canvas) for crisp, accessible, state-driven coordinate geometry
- Vitest for unit tests
- Firebase Hosting (deploy target)

## Project setup

### Prerequisites

- Node.js 18+ and npm
- A Firebase project

### 1. Install

```bash
npm install
```

### 2. Firebase setup

1. Create a project at the [Firebase Console](https://console.firebase.google.com).
2. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
3. **Firestore Database → Create database.**
4. **Project settings → Your apps → Web app** (`</>`): copy the config values.
5. **Firestore → Rules:** paste the contents of [`firestore.rules`](firestore.rules)
   and publish (or deploy with the CLI — see below).



### 4. Run

```bash
npm run dev
```

Open the printed `http://localhost:5173` URL.

## npm scripts

| Script                   | What it does                                          |
| ------------------------ | ----------------------------------------------------- |
| `npm run dev`            | Start the Vite dev server.                            |
| `npm run tts`            | Start the optional local neural TTS voice server.     |
| `npm test`               | Run the unit tests once (Vitest).                     |
| `npm run test:watch`     | Run the unit tests in watch mode.                     |
| `npm run build`          | Type-check and build for production.                  |
| `npm run preview`        | Preview the production build locally.                 |
| `npm run firebase:login` | Authenticate the local Firebase CLI.                  |
| `npm run emulators`      | Start the Firebase emulators.                         |
| `npm run deploy`         | Build + deploy hosting and Firestore rules.           |
| `npm run deploy:hosting` | Build + deploy hosting only.                          |
| `npm run deploy:rules`   | Deploy Firestore rules only.                          |

## Tests

Pure, framework-free logic is covered by [Vitest](https://vitest.dev) unit tests:

```bash
npm test            # run once
npm run test:watch  # watch mode
```

The suite focuses on the deterministic core:

- `src/features/lesson/validate.ts` — correct **and** incorrect validation for
  every one of the 10 solvable kinds (including misconception tags).
- `src/features/course/progression.ts` — the pass threshold, placement mapping,
  and the lesson-unlock frontier.

Tests run in a `node` environment (no DOM needed); the `@` import alias mirrors
`vite.config.ts` via [`vitest.config.ts`](vitest.config.ts).

## Firebase CLI tooling

The Firebase CLI is included as a dev dependency, and convenience scripts are
wired up so you don't need a global install:

```bash
npm install            # installs firebase-tools locally
npm run firebase:login # once, to authenticate the CLI
```

### Deploy (Firebase Hosting + Firestore rules)

```bash
npm run deploy           # build + deploy hosting and rules
npm run deploy:hosting   # build + deploy hosting only
npm run deploy:rules     # deploy Firestore rules only
```

### Local emulators

```bash
npm run emulators        # Auth (9099), Firestore (8080), Hosting (5000), UI
```

To make the app talk to the emulators, set `VITE_USE_FIREBASE_EMULATORS=true`
in `.env` and run `npm run dev` in another terminal.

Hosting, rules, indexes, and emulator config live in
[`firebase.json`](firebase.json); the default project is set in
[`.firebaserc`](.firebaserc).

**Deployed link:** _Add your Firebase Hosting URL here after the first deploy._

## Architecture overview

```
src/
  config/        Env reading + validation (Firebase setup gate)
  lib/           Firebase init, fraction/slope math, TTS
  types/         Domain models (user, lesson/solvable, progress, mastery, attempt)
  content/       Static course data + all 9 lessons and mastery checks
  services/      Firestore reads/writes (users, lessonProgress, mastery, attempts)
  features/
    auth/        AuthContext, route guard, error mapping
    lesson/      Lesson player engine, answer validation, completion logic
    scoring/     XP, streak, mastery rules, recommendation
    course/      Lesson display helpers, progression/unlock gating, path cards
    progress/    Learner data hook
  components/    Shared UI (coordinate plane, header, banners, etc.)
  pages/         Route screens (landing, login, onboarding, dashboard, course,
                 lesson, complete, review, practice, leaderboard, profile, …)
```

Routes are **code-split**: only the landing/login and auth wrappers load eagerly;
every other page is lazy-loaded via `React.lazy` + `<Suspense>` so the initial
bundle stays small.

Data flows one direction: static content + the learner's typed answer go through
pure, synchronous validators (`features/lesson/validate.ts`) for instant feedback;
results are then persisted via the `services/` layer. No network call is required
to validate an answer.

## Content model

- A **Lesson** has metadata and an ordered list of **Solvables**.
- A **Solvable** is one of ten kinds — `observe`, `numeric`, `choice`,
  `graph-target`, `multi-select`, `order`, `slider`, `categorize`, `number-line`,
  `table-fill` — each with a prompt, correct feedback, per-wrong-answer hints
  (with misconception tags), a reveal explanation, and the concepts it gives
  mastery evidence for.
- **Mastery** is tracked per concept (`rise`, `run`, `slope-ratio`, …) on a 0–3
  scale, updated from in-lesson evidence and misconceptions.
- **Progression:** lessons unlock sequentially; the next lesson opens only after
  the current one is **passed** (≥ 80%, `PASS_THRESHOLD`). A placement diagnostic
  can start a learner further along the path.
- **XP/streak rules:** 5 XP per correct solvable, 25 XP lesson-completion bonus
  (never double-counted on replay); daily goal is configurable; streak repair
  charges protect against a single missed day.

## Manual testing checklist

- [ ] Create a new account (email/password) and complete onboarding.
- [ ] Sign in with Google.
- [ ] Start the first lesson from the dashboard recommendation.
- [ ] Drag a point on the graph; confirm the line, triangle, rise, run, and slope
      update smoothly.
- [ ] Enter a wrong rise/run value; confirm the targeted hint appears.
- [ ] Enter the run/rise mistake on "compute slope"; confirm the specific hint.
- [ ] Miss the same step twice; confirm "Show explanation" appears.
- [ ] Pass a lesson (≥ 80%); confirm the next lesson unlocks.
- [ ] Try several practice modes (daily, speed, review, mistakes, sandbox, …).
- [ ] Complete a lesson; confirm XP, streak, and mastery update.
- [ ] Refresh the browser mid-lesson; confirm it resumes at the same step.
- [ ] Sign out and back in; confirm progress persists.
- [ ] Toggle dark mode, high contrast, dyslexia font, and reduced motion.
- [ ] Unlock an avatar with XP.
- [ ] Open at 375px width; confirm no horizontal scroll and the CTA stays reachable.
- [ ] Run `npm test`; confirm the unit tests pass.

### Performance targets

- Lesson loads under 2 seconds.
- Feedback appears under 100ms (validation is local and synchronous).
- SVG dragging feels smooth on touch and mouse.

### No generated content / no chatbot

There is no chatbot and no generated lesson content; the only outbound model
service is the optional voice narration in `src/lib/tts.ts` (text-to-speech of
the hand-authored explanation). Excluding that file, the codebase has no model
calls:

```bash
# Should return no matches outside the optional TTS module
grep -riE "\b(openai|anthropic|gemini|llm|chatbot|ai tutor)\b" src/ \
  --exclude=tts.ts
```
