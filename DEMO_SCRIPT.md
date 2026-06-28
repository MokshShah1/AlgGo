# AlgGo — Demo Video Script (3–5 minutes)

**Subject:** 8th-grade Algebra — Linear Relationships (slope / rise over run)
**Live app:** https://alg-go.vercel.app

Tip: have two things ready before recording — (1) a fresh account to show onboarding, and (2) the seeded demo account that already has progress, so the mastery / spaced-repetition visuals have real data. Switch to the seeded account around the "course path" beat.

---

### 0:00 — Hook (20s)
> "This is AlgGo. It teaches one thing deeply — slope, for 8th graders — by letting you *do* it, not watch a video. It works on a phone, supports multiple learners at once, and still teaches with the AI turned off. Let me walk a full loop."

On screen: landing → sign in. Show the mobile layout (new bottom nav with the raised **Practice** button) for a second.

### 0:20 — Onboarding + placement (25s)
> "New learners take a 2-minute placement quiz. AlgGo uses it to drop you on the *right* lesson instead of lesson one, and it locks the lessons ahead so you can't skip the foundation."

On screen: quick placement, land on the recommended lesson, show locked lessons on the course path.

### 0:45 — One full interactive lesson (60s) *(the core)*
> "Here's the part that matters most: a hands-on lesson."

On screen, narrate as you go:
- Drag points on the **interactive coordinate plane**; show the slope and the rise-over-run triangle update live.
- Answer a step correctly → **instant feedback**, with confetti on the hard ones.
- **Get one wrong on purpose.** Show the deterministic feedback, then the **hint ladder** that escalates, then the **"Teach me this" narrated mini-lesson**.
> "Wrong answers don't just say 'try again.' They diagnose the specific misconception, then escalate help: a nudge, then a hint, then a full narrated re-teach."

### 1:45 — Type your reasoning (20s)
> "It also checks *why*, not just the final number. I'll explain my thinking in words."

On screen: type a short, correct-but-informal explanation (with a typo) and submit.
> "The judge grades the math, not your spelling — right reasoning comes back as solid even if it's messy. It's a math class, not an English class."

### 2:05 — Course path, progress, mastery (40s)
*(switch to seeded account)*
> "Progress persists across sessions. The dashboard shows where you left off, and the skill tree shows a live **mastery score** per concept."

On screen: dashboard → **concept mastery meters** → Skill Tree.
> "Mastery isn't just 'did you pass.' Each concept blends first-try accuracy, spaced reviews, and **transfer** — you only hit 'Mastered' once you can do it as a graph, a table, *and* with numbers. That's understanding slope, not memorizing one question type."

### 2:45 — AI features: meet AXIOM (55s)
> "On top of the working app I layered AI, all of it grounded in the real lesson state. The coach is AXIOM."

Show 3 quickly (don't do all):
- **AXIOM "explain my mistake"** inside a question (uses the stored misconception tag).
- **Snap-a-problem**: photograph a homework problem → AXIOM turns it into an interactive question.
- **AXIOM coach card** on the dashboard: "what to study next," in plain English.
- **Sammy**, the AI rival on the leaderboard, whose XP climbs over real time so there's always someone to chase.

> "And the trust piece: every problem AXIOM *generates* — the personalized daily set and Snap-a-problem — gets recomputed by a deterministic math checker before you ever see it. If the math doesn't verify, it's dropped. The AI can't show you a problem with a wrong answer."

> "Key design choice: all of this is optional. Turn the AI off and the app still teaches. The AI sharpens the experience, it doesn't hold it up."

### 3:40 — Learning science (45s) *(Phase 3)*
> "Then I made the learning *stick* with real techniques, not buzzwords."
- **Spaced repetition**: show the Smart Review schedule — each concept has its own interval, and miss something and it comes back sooner.
- **Interleaving**: review mixes concepts so no two of the same idea land back to back.
- **Retention metric**: the dashboard card showing first-try accuracy and how many missed questions you've *recovered* through review — measurable proof it's working.

### 4:25 — Architecture + AI-off + close (30s)
> "Architecture: React, TypeScript, and Vite on the front end; Firebase Auth and Firestore for accounts and progress; and a serverless AI proxy on Vercel that keeps the API key off the client. Content is a typed lesson model, so adding lessons doesn't touch code. AI-generated math is gated by a deterministic verifier."

On screen: briefly show it running with the AI disabled (AI buttons gone, lesson still works).
> "One subject, taught deeply, that works before the AI is even on. That's AlgGo. Thanks for watching."

---

**Total: ~4:55.** If you run long, cut the placement beat (0:20) and show only 2 AI features. If you run short, demo the avatar menu / theme toggle and the mastery transfer chips.
