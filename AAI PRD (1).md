

# PRD: Brilliant — 8th Grade Algebra Learn-by-Doing App
## ## 1. Product Summary
Build a Brilliant-inspired learn-by-doing web app for one deep subject area: **8th
## Grade Algebra, Chapter: Linear Relationships — Slope & Graphing Lines**.
The app must teach one chapter deeply through interactive, visual problem solving. It
should work before AI is added. Phase 1 must include no AI features, no chatbot, no
generated content, and no model calls.
The MVP should feel like Brilliant: short interactive lessons, direct manipulation,
visual feedback, multi-try problems, hand-written explanations, persistent progress,
auth, mastery tracking, streaks, and a mobile-first course path.
## ## 2. Chosen Subject
State this at the top of the README and in the app onboarding:
**Subject:** 8th Grade Algebra
**Chapter:** Linear Relationships: Slope, Graphing Lines, and `y = mx + b`
**Primary Concept for MVP Lesson:** Slope as `rise / run`
This chapter is chosen because it is highly visual and interactive. Students can drag
points, tilt lines, adjust slope/intercept sliders, plot coordinates, and see
equations update in real time.
## ## 3. Primary User Persona
## ### Primary Persona: Maya
Maya is a 13-year-old 8th grade student using the app mostly on her phone. She is
capable but anxious about math. She says things like “I’m not a math person” and gets
lost when teachers explain slope too quickly.
Maya needs:
- Short lessons that feel approachable.
- No walls of text.
- A puzzle-first experience where she can try before being taught.
- Encouraging multi-try feedback.
- Specific explanations when she makes common mistakes.
- A visible sense of progress, streaks, XP, and small wins.

- A mobile-friendly interface that works with touch.
The app should optimize every UX decision for Maya.
## ### Secondary Persona: Diego
Diego is a bored fast-finisher. He already understands some algebra and wants
challenge. He needs mastery-based progression, optional harder problems, and fast
feedback.
## ### Secondary Persona: Ms. Carter
Ms. Carter is a parent, tutor, or teacher. She wants proof the learner is progressing.
She needs clear mastery states, progress persistence, and trustworthy content.
## ## 4. Product Goal
By the end of Phase 1, a learner should be able to complete one interactive lesson on
slope, get some answers wrong, recover through specific feedback, finish the lesson,
see progress saved, and return later with their streak and course path intact.
Success sentence:
> Maya should leave saying: “Oh, slope is how much the line rises for each step to the
right.”
## ## 5. Phase 1 Scope
## ### Must Have
- React frontend.
- Firebase auth.
- Firebase persistence for user progress, streaks, lesson attempts, XP, and mastery.
- Mobile-first responsive design.
- One complete hand-built interactive lesson.
- One direct-manipulation problem type beyond multiple choice.
- One interactive visual element that responds in real time.
- Instant hand-written feedback under 100ms.
- Multi-try questions.
- Progress persistence across sessions/devices.
- Course path showing the chapter sequence.
- Mastery tracking and next-step recommendation.

- Streak and XP habit loop.
- README with chosen subject, persona, setup guide, architecture overview, and
deployed link placeholder.
- Public deployment-ready structure.
## ### Must Not Have
- No AI.
- No chatbot.
- No model API calls.
- No generated hints.
- No AI-created lesson content at runtime.
- No video lessons.
- No wall-of-text explanations.
- No shallow multi-subject coverage.
## ## 6. Recommended Tech Stack
## Use:
- React + TypeScript
## - Vite
- Tailwind CSS
## - Firebase Authentication
## - Firestore
- Firebase Hosting or Vercel
- SVG + React for coordinate-plane visuals
Use SVG instead of Canvas because this app needs crisp coordinate geometry, draggable
points, accessible labels, simple hit testing, and easy state-driven rendering. SVG is
sufficient for 60 FPS for this scope.
## ## 7. Core Experience Model
The app should model each lesson as a sequence of **Solvables**, inspired by
## Brilliant.
A Solvable is an interactive step with:

- A short prompt.
- A visual or interaction.
- A learner action.
- A submit button.
- Immediate feedback.
- Retry behavior.
- Optional reveal explanation.
- Continue button.
Every solvable follows the same flow:
- Show prompt and interaction.
- Learner manipulates or answers.
- Learner taps `Check`.
- If correct: show green success feedback and short explanation.
- If wrong: show specific hint in a bottom feedback banner.
- Allow retry.
- After repeated wrong attempts, allow `Show explanation`.
- Learner taps `Continue`.
The primary CTA should stay fixed near the bottom on mobile.
## ## 8. Information Architecture
## Routes:
## - `/`
Landing page or redirect to dashboard if logged in.
## - `/login`
Firebase auth. Support email/password and Google sign-in if simple.
## - `/onboarding`
Ask learner name and comfort level:
- “I’m new to slope”
- “I’ve seen slope but it’s confusing”

- “I’m ready for a challenge”
## - `/dashboard`
Shows welcome message, streak, XP, course path, current recommended lesson, and
mastery summary.
## - `/course`
Visual chapter map for Linear Relationships.
- `/lesson/:lessonId`
Solvable-based lesson player.
- `/lesson/:lessonId/complete`
Celebration screen with XP earned, streak update, mastery update, and next
recommendation.
## - `/profile`
Name, streak, XP, completed lessons, mastery levels.
## ## 9. Course Path
Build the full chapter path as structured data, even if only Lesson 2 is fully
playable in MVP.
Course title:
**Linear Relationships: Slope & Graphing Lines**
## Lessons:
## 1. `constant-rate-change`
Title: What Changes at a Constant Rate?
Status: locked or preview.
## 2. `slope-rise-run`
## Title: Slope = Rise / Run
Status: playable MVP flagship lesson.
## 3. `slope-from-two-points`
Title: Find Slope from Two Points
Status: locked or coming soon.
## 4. `positive-negative-slope`

Title: Positive, Negative, Zero, and Undefined Slope
Status: locked.
## 5. `y-intercept`
Title: The Starting Value: y-Intercept
Status: locked.
## 6. `slope-intercept-form`
Title: Build a Line with `y = mx + b`
Status: locked.
## 7. `proportional-relationships`
Title: When Lines Start at Zero
Status: locked.
## 8. `match-representations`
Title: Match Graphs, Tables, and Equations
Status: locked.
## 9. `real-world-lines`
Title: Lines in the Real World
Status: locked.
Unlock logic for MVP:
- Lesson 1 appears as completed intro or preview.
- Lesson 2 is playable.
- Lesson 3 is recommended after completing Lesson 2, but marked “Coming soon” if not
implemented.
## 10. MVP Lesson: Slope = Rise / Run
Lesson ID: `slope-rise-run`
Estimated time: 5–8 minutes.
Learning objective:
The learner understands slope as the ratio of vertical change to horizontal change
between two points on a line.
Key idea:

> Slope tells how much a line rises or falls for each step to the right.
## ### Required Interactive Visual
Create an SVG coordinate plane with:
- x-axis and y-axis.
- grid lines.
- a draggable point A.
- a draggable point B.
- a line through A and B.
- a right triangle drawn between A and B:
- horizontal leg = run.
- vertical leg = rise.
## - Labels:
## - `rise`
## - `run`
- `slope = rise / run`
- Live values:
## - `rise = Δy`
## - `run = Δx`
## - `slope = Δy / Δx`
The learner should be able to drag one or both points. The line, triangle, rise, run,
and slope update immediately.
Snap points to integer grid coordinates for clarity.
Avoid vertical line division by zero in MVP lesson by either preventing identical
x-values or showing “undefined slope” as a preview.
## ## 11. Lesson Solvables
## ### Solvable 1: Intuition First
Type: interactive observation
## Prompt:
“Drag the blue point. Watch the line. What changes when the point moves higher?”

## Interaction:
- Learner drags point B.
- The rise/run triangle updates live.
Check condition:
- Learner must drag point at least once.
Correct feedback:
“Nice. When the point moves higher, the vertical change gets bigger. That vertical
change is called the rise.”
## Purpose:
Introduce rise visually before formal formula.
## ### Solvable 2: Identify Rise
Type: numeric input
## Prompt:
“The line goes from point A `(1, 1)` to point B `(4, 3)`. What is the rise?”
## Visual:
- Static line and triangle.
- Highlight vertical leg.
Correct answer:
## `2`
Wrong feedback examples:
- If answer is `3`: “That’s the run, the horizontal change. Rise is the up-and-down
change.”
- If answer is `-2`: “The line goes upward from A to B, so the rise is positive.”
- Generic: “Count the vertical steps from y = 1 to y = 3.”
## ### Solvable 3: Identify Run
Type: numeric input
## Prompt:
“Now find the run from `(1, 1)` to `(4, 3)`.”
Correct answer:

## `3`
Wrong feedback:
- If answer is `2`: “That’s the rise. Run is the side-to-side change.”
- Generic: “Count the horizontal steps from x = 1 to x = 4.”
### Solvable 4: Build the Formula
Type: drag/select tiles
## Prompt:
“Slope compares rise to run. Build the slope fraction.”
## Interaction:
- Learner chooses between:
- `rise / run`
- `run / rise`
- `rise + run`
## Correct:
`rise / run`
Wrong feedback:
- `run / rise`: “You found the right two pieces, but the order matters. Slope is
vertical change over horizontal change.”
- `rise + run`: “Slope is a ratio, not a total. We compare rise to run using
division.”
## ### Solvable 5: Compute Slope
Type: numeric or fraction input
## Prompt:
“If rise is `2` and run is `3`, what is the slope?”
Accepted answers:
## - `2/3`
- `0.666...` if reasonable
Wrong feedback:
- `3/2`: “That is run divided by rise. Flip it: slope is rise divided by run.”

- `5`: “That adds rise and run. Slope is a ratio.”
- `1`: “Check the fraction: rise is 2 and run is 3.”
### Solvable 6: Drag to Match a Target Slope
Type: direct manipulation
## Prompt:
“Move point B so the line has slope `2/3`.”
## Interaction:
- Point A fixed at `(1, 1)`.
- Point B draggable.
- Live slope display updates.
- Learner taps Check.
Correct condition:
- `(rise / run) === 2/3`, using equivalent integer pairs such as rise 2 run 3, rise 4
run 6, etc.
- Avoid negative equivalent for this step unless explicitly allowed.
Wrong feedback:
- If slope is `3/2`: “Close: you used the same numbers, but rise and run are swapped.”
- If slope is negative: “This target slope is positive, so the line should rise as it
moves right.”
- If run is 0: “A vertical line has undefined slope. Try moving right as well as up.”
- Generic: “For every 3 steps right, the line should go 2 steps up.”
## ### Solvable 7: Same Slope, Different Triangle
Type: interactive discovery
## Prompt:
“Drag the triangle handles along the same line. Does the slope change?”
## Interaction:
- Same line.
- Two selectable pairs of points along line.
- Rise/run triangle can move along line.

- Slope remains constant.
Correct response:
Learner selects: “No, the slope stays the same.”
## Feedback:
“Exactly. On a straight line, any slope triangle gives the same ratio. Bigger
triangles are just scaled copies.”
## Purpose:
Introduce the 8.EE.B.6 similar-triangles idea without formal proof.
## ### Solvable 8: Misconception Check
Type: multiple choice, multi-try
## Prompt:
“A line has rise `-2` and run `4`. What is its slope?”
## Choices:
## - `-2/4`
## - `4/-2`
## - `2/4`
## - `6`
## Correct:
`-2/4`, simplified display `-1/2`
Wrong feedback:
- `4/-2`: “That gives the same value here, but it hides the meaning. Rise belongs on
top and run belongs on bottom.”
- `2/4`: “The sign matters. The line falls as it moves right, so the slope is
negative.”
- `6`: “Slope compares change using division, not addition.”
### Solvable 9: Explain in Words
Type: short choice
## Prompt:
“What does a slope of `2/3` mean?”

## Correct:
“For every 3 steps right, the line goes 2 steps up.”
Wrong options:
- “The line starts at 2.”
- “The line crosses the y-axis at 3.”
- “The point is located at (2, 3).”
## Feedback:
Clarify slope is a rate/ratio, not a point or intercept.
## ### Solvable 10: Lesson Finish
Type: reflection / completion
## Prompt:
“Complete the sentence: Slope is...”
## Correct:
“rise divided by run” or selected equivalent.
Completion feedback:
“You learned the core idea: slope is vertical change compared to horizontal change.
Next, you’ll use two points to find slope anywhere.”
## Award:
## - 50 XP
- Update mastery for `slope-rise-run`
- Extend streak if daily goal met
## 12. Common Misconceptions to Encode as Feedback
The app must detect and respond to these wherever possible:
- Learner uses run/rise instead of rise/run.
- Learner confuses slope `m` with y-intercept `b`.
- Learner treats slope as a coordinate point.
- Learner starts every graph at origin.
- Learner drops the negative sign for negative slope.
- Learner cannot see invisible slope `1` or `-1`.

- Learner mixes up horizontal zero slope and vertical undefined slope.
- Learner adds rise and run instead of dividing.
- Learner uses inconsistent point order and flips sign.
- Learner memorizes `y = mx + b` without interpreting it.
Phase 1 needs at least the misconception feedback relevant to Lesson 2.
## 13. Progress and Mastery
Track mastery per concept, not just lesson completion.
Concept IDs:
## - `constant-rate`
## - `rise`
## - `run`
## - `slope-ratio`
## - `positive-slope`
## - `negative-slope`
## - `constant-slope`
Mastery score:
- 0 = not started
- 1 = introduced
- 2 = practicing
- 3 = mastered
Update rules:
- Correct on first try: +2 evidence
- Correct after hint: +1 evidence
- Wrong answer matching misconception: record misconception tag
- 2+ repeated wrong attempts: mark concept for review
- Lesson complete with 80% success: mark `slope-ratio` as mastered
Dashboard should show:
- Current lesson progress

- Mastered concepts
- Concepts to review
- Recommended next step
Recommendation logic for MVP:
- If Lesson 2 not complete: recommend continuing Lesson 2.
- If Lesson 2 complete and mastery >= 3: recommend Lesson 3.
- If Lesson 2 complete but repeated misconceptions: recommend Review: Rise vs Run.
## ## 14. Firebase Data Model
## Collections:
## ### `users/{uid}`
## Fields:
## - `uid`
- `displayName`
## - `email`
- `createdAt`
- `lastActiveAt`
- `streakCount`
- `streakCharges`
- `lastStreakDate`
- `totalXp`
- `weeklyXp`
- `onboardingComplete`
### `users/{uid}/lessonProgress/{lessonId}`
## Fields:
- `lessonId`
- `status`: `not_started | in_progress | completed`
- `currentStepIndex`
- `completedStepIds`

## - `attempts`
- `correctCount`
- `wrongCount`
- `xpEarned`
- `startedAt`
- `updatedAt`
- `completedAt`
### `users/{uid}/mastery/{conceptId}`
## Fields:
- `conceptId`
## - `level`
- `evidenceCount`
## - `misconceptions`
- `lastPracticedAt`
- `needsReview`
### `users/{uid}/attempts/{attemptId}`
## Fields:
- `lessonId`
- `stepId`
## - `answer`
- `isCorrect`
- `attemptNumber`
- `misconceptionTag`
- `createdAt`
## 15. Streak and XP Rules
Daily goal:
- Complete one lesson OR complete 3 solvables.
## Streak:

- If user meets daily goal today and last streak date was yesterday: increment streak.
- If user meets daily goal today and last streak date is today: no duplicate
increment.
- If user missed one day and has streak charge: consume one charge and preserve
streak.
- If user missed one day and has no charge: reset streak to 1 when they practice
again.
- Max streak charges: 2.
- Completing a lesson grants one streak charge if below max.
## XP:
- Each solvable correct: 5 XP.
- Lesson completion bonus: 25 XP.
- Lesson 2 total target: around 75 XP.
- Replaying a completed lesson should not double-count completion XP.
## 16. UI / Visual Design
Style should feel inspired by Brilliant but not copy its exact branding.
## Tone:
## - Playful
## - Clean
## - Encouraging
## - Low-pressure
## - Math-friendly
Visual direction:
- Soft off-white background.
- Dark navy or charcoal text.
- Bright accent colors for points and feedback.
- Green for correct.
- Amber for hint.
- Red only sparingly; avoid harsh failure states.

- Rounded cards.
- Large touch targets.
- Bottom sticky CTA on lesson screens.
Mobile requirements:
- Works at 375px width.
- No horizontal scrolling.
- Coordinate plane scales to screen.
- Dragging works with touch and mouse.
- CTA remains reachable by thumb.
- Feedback banner appears above CTA.
## 17. Lesson Player UI
Each lesson screen should include:
- Top progress bar.
- Lesson title.
- Step prompt.
- Interactive area.
- Optional answer input.
- Sticky bottom action area.
- Feedback banner.
- `Check` button.
- `Try again` state.
- `Show explanation` after 2 wrong attempts.
- `Continue` after correct answer.
Feedback banner variants:
- Correct: green, concise explanation.
- Wrong: amber, specific hint.
- Reveal: blue/neutral, step-by-step explanation.
## 18. Dashboard UI

Dashboard should include:
- Greeting: “Welcome back, Maya”
- Streak card
- XP card
- Current recommendation
- Course path preview
- Mastery summary
- Continue button
Example recommendation copy:
“Continue: Slope = Rise / Run
You were practicing how vertical change compares to horizontal change.”
After completion:
“Next up: Find Slope from Two Points
You’re ready because you mastered rise/run.”
## 19. Course Map UI
Show lessons as vertical or winding path cards.
Each card:
- Lesson number
## - Title
- Status badge
- Mastery indicator
## - CTA:
## - Continue
## - Start
## - Review
- Coming soon
## Statuses:
## - Completed

- In progress
## - Recommended
- Locked / Coming soon
## 20. README Requirements
Create README with:
- Product name: Brilliant
- Chosen subject stated at top:
## - “8th Grade Algebra: Linear Relationships”
## - Persona:
- Maya, anxious 8th grader learning on phone
- MVP description
- Phase 1 no-AI rule
- Setup guide
- Firebase setup instructions
- Environment variables
- Architecture overview
- Content model overview
- Deployed link placeholder
- Testing checklist
## ## 21. Environment Variables
## Use:
## ```env
## VITE_FIREBASE_API_KEY=
## VITE_FIREBASE_AUTH_DOMAIN=
## VITE_FIREBASE_PROJECT_ID=
## VITE_FIREBASE_STORAGE_BUCKET=
## VITE_FIREBASE_MESSAGING_SENDER_ID=
## VITE_FIREBASE_APP_ID=

App should show a clear setup error if Firebase env vars are missing.
## 22. Acceptance Criteria
The MVP is complete when:
● User can sign up or log in.
● User can enter a display name.
● Dashboard shows course path and current lesson.
● User can open Slope = Rise / Run.
● User can drag points on a coordinate plane.
● Rise, run, line, triangle, and slope update live.
● User can submit answers.
● Feedback appears instantly.
● Wrong answers get specific hand-written hints.
● User can retry.
● User can complete the lesson.
● XP updates.
● Streak updates.
● Mastery updates.
● Progress persists after refresh.
● User can leave mid-lesson and resume at same step.
● App works on mobile screen sizes.
● No AI exists anywhere in Phase 1.
## 23. Testing Checklist
Manual test:
- Create new account.
- Complete onboarding.
## 3. Start Lesson 2.
- Drag point on graph and confirm visual updates smoothly.
- Enter wrong answer for rise/run and confirm targeted hint.
- Enter run/rise mistake and confirm specific feedback.
- Complete lesson.
- Confirm XP and streak update.
- Refresh browser.
- Confirm completion persists.
- Log out and back in.
- Confirm progress persists.
- Open app at mobile width.
- Confirm no layout breaks.
- Search codebase and confirm there are no AI/model calls.
## Performance:

● Lesson loads under 2 seconds.
● Feedback appears under 100ms.
● SVG dragging feels smooth.
● No blocking network call required for answer validation.
- Implementation Notes for Claude
## Code
Build vertically, not horizontally.
First implement:
- App shell and routing.
- Firebase auth.
- Firestore user profile/progress.
- Static course data.
- Lesson player engine.
- SVG coordinate plane interaction.
- Lesson 2 solvables.
- Feedback and attempt tracking.
- Dashboard/course map.
## 10. README.
Do not implement Phase 2 AI. Do not add placeholder chatbot UI. Do not call OpenAI, Anthropic,
Gemini, or any model API.
The product should feel like a polished Phase 1 MVP: one great interactive lesson, not many shallow
ones.

