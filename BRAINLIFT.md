# Brainlift — Building AlgGo (AI-first build process)

**Subject:** 8th-grade Algebra, Linear Relationships (slope). **Live:** https://alg-go.vercel.app

## 1. Tools & workflow
I built AlgGo almost entirely through an AI coding agent (Cursor) rather than typing code line-by-line. My workflow was a tight loop: **plan in plain English → review the agent's diff → run it → break it on purpose → feed the failure back.** I leaned on a few habits that mattered: I wrote a detailed PRD/spec up front and made the agent treat it as the source of truth; I worked in **plan mode** for anything with architectural trade-offs and only switched to writing code once the approach was settled; and I used **parallel subagents** for independent, page-level features (e.g., the daily challenge, snap-a-problem, and the rival) so they could be built at once without stepping on each other. For ground truth I kept answer-checking deterministic in hand-written validators, and let the model handle language, not correctness.

## 2. Prompting strategies (what actually worked)
- **Spec-as-contract:** "Treat this plan and PRD as the source of truth. Build Phase 1 only, no AI, no extra subjects." Constraining scope up front prevented the agent from inventing features.
- **Build-then-verify:** "Implement X, then build, typecheck, run tests, and fix anything you broke." Forcing the agent to close its own loop caught most regressions before I saw them.
- **Interactive-lesson prompting:** I described the *learner's manipulation* ("drag two points on a coordinate plane; slope updates live; wrong answers reveal the misconception, then a hint, then a narrated re-teach") rather than UI specifics. Describing the *interaction and the feedback* produced far better lessons than describing components.
- **Grounding the AI:** "Hints and explanations get the known correct answer and the stored misconception tag, but must never reveal the final answer." This kept the AI tutor consistent with the deterministic validator.
- **Persona tuning by example:** for the AI rival I gave concrete do/don't examples ("short, cocky, standing-aware; never praise; no em dashes"), which worked better than adjectives alone.

## 3. Phase decisions
**Phase 2 — AI I chose:** AI tutor chat, dynamic hints, "explain my mistake" (built on the misconception tags I already stored), type-your-reasoning, snap-a-problem (vision), scratchpad work-checker, a "what to study next" coach (AXIOM), lesson recaps, and an AI rival (Sammy). The rule for inclusion: *the AI had to be grounded in real lesson/mastery state and the app had to still work without it.* **AI I skipped:** auto-generating whole lessons (I wanted hand-authored, verified content for the one subject) and any chatbot that could state a wrong answer as fact (math correctness stays deterministic).
**Phase 3 — Learning science I added, and why:** I already had retrieval practice, scaffolding/fading hints, and immediate explanatory feedback. I added (a) **spaced repetition** — per-concept SM-2/Leitner intervals, because retention across days is the whole point of a tutor; (b) **interleaving** — mixing concepts so learners pick the right method, which fits slope's many representations; (c) a **concept-mastery signal with transfer** — a 0–100 score that only reaches "Mastered" once a concept is shown across graph/table/numeric/verbal, directly addressing reviewer feedback to keep gamification serving the slope concept; and (d) a **retention metric** to actually show the effect. I deliberately left strict mastery-*gating* optional to avoid frustrating learners while still surfacing the signal.

## 4. Code analysis (AI-generated vs hand-written)
Roughly **90% AI-generated, 10% hand-written/-directed.** The agent wrote the vast majority of components, services, and scoring logic. My hand-written share was the high-leverage 10%: the PRD/spec and data model, the XP/streak/mastery rules and scheduling math (which I reviewed and corrected closely), prompt engineering, content decisions, and a lot of "no, do it this way" steering on UX and architecture (e.g., choosing Vercel over the Firebase Blaze plan for the proxy).

## 5. Key learnings (spiky opinions)
- **Constraints make agents better.** A tight spec and "build one subject deeply, AI off first" produced a far stronger app than open-ended prompting ever did.
- **AI should be the seasoning, not the meal.** The features that landed were grounded in state the app already owned; the app teaching fully with AI off is what makes the AI feel trustworthy instead of gimmicky.
- **Keep correctness deterministic, give the model language.** Letting a model grade math invites confident wrong answers; letting it *explain* a known-correct answer is where it shines.
- **Steering is the skill.** With agents, the bottleneck isn't typing — it's knowing what good looks like, reviewing diffs critically, and redirecting fast.
