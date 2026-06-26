import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ArrowRight, Play, PencilLine, Sparkles } from "lucide-react";
import type { ChoiceOption, Lesson, Point } from "@/types/lesson";
import type { ConceptId } from "@/types/concepts";
import { useAuth } from "@/features/auth/AuthContext";
import { logAttempt } from "@/services/attempts";
import { awardXp, recordSolvableActivity } from "@/services/users";
import { saveLessonProgress } from "@/services/lessonProgress";
import { validateSolvable, type SolvableAnswer } from "@/features/lesson/validate";
import {
  finalizeLesson,
  type ConceptEvidence,
} from "@/features/lesson/finalizeLesson";
import { XP_PER_SOLVABLE } from "@/features/scoring/constants";
import { PASS_THRESHOLD } from "@/features/course/progression";
import { ProgressBar } from "@/features/lesson/components/ProgressBar";
import {
  FeedbackBanner,
  type FeedbackVariant,
} from "@/features/lesson/components/FeedbackBanner";
import {
  CategorizeView,
  ChoiceView,
  GraphTargetView,
  MultiSelectView,
  NumberLineView,
  NumericView,
  ObserveView,
  OrderView,
  SliderView,
  TableFillView,
} from "@/features/lesson/components/SolvableViews";
import { shuffle } from "@/features/quiz/pool";
import { VideoLesson } from "@/features/lesson/components/VideoLesson";
import { DifficultyBadge } from "@/features/lesson/components/DifficultyBadge";
import { Confetti } from "@/components/Confetti";
import { Scratchpad } from "@/components/Scratchpad";
import { getHints } from "@/features/lesson/hints";
import { playCorrect, playWrong } from "@/lib/sfx";
import { AiTutorPanel } from "@/features/ai/AiTutorPanel";
import { ReasoningBox } from "@/features/ai/ReasoningBox";
import { aiAvailable, aiHint, aiExplain, type ProblemContext } from "@/lib/ai";
import { CONCEPT_LABELS } from "@/types/concepts";

interface Points {
  pointA: Point;
  pointB: Point;
}

interface LessonPlayerProps {
  lesson: Lesson;
  initialStepIndex: number;
  initialCompletedStepIds: string[];
  initialCounts: { correctCount: number; wrongCount: number; xpEarned: number };
  alreadyCompleted: boolean;
}

export function LessonPlayer({
  lesson,
  initialStepIndex,
  initialCompletedStepIds,
  initialCounts,
  alreadyCompleted,
}: LessonPlayerProps) {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const navigate = useNavigate();

  const total = lesson.solvables.length;
  const [stepIndex, setStepIndex] = useState(
    Math.min(initialStepIndex, total - 1)
  );
  const solvable = lesson.solvables[stepIndex];

  // Persisted-ish counters mirrored locally.
  const [completedStepIds, setCompletedStepIds] = useState<string[]>(
    initialCompletedStepIds
  );
  const [correctCount, setCorrectCount] = useState(initialCounts.correctCount);
  const [wrongCount, setWrongCount] = useState(initialCounts.wrongCount);
  const [xpEarned, setXpEarned] = useState(initialCounts.xpEarned);

  // Per-step UI state.
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [feedback, setFeedback] = useState<{
    variant: FeedbackVariant;
    message: string;
    detail?: string;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [showScratch, setShowScratch] = useState(false);
  // Wrong tries on the current step, surfaced as state so help can escalate
  // automatically (reveal a hint at 2, offer the "teach me" video at 3+).
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const [numericValue, setNumericValue] = useState("");
  const [choiceSelected, setChoiceSelected] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<ChoiceOption[]>([]);
  const [sliderValue, setSliderValue] = useState(0);
  const [placement, setPlacement] = useState<Record<string, string>>({});
  const [numberLineValue, setNumberLineValue] = useState(0);
  const [tableValues, setTableValues] = useState<string[]>([]);
  const [points, setPoints] = useState<Points>({
    pointA: { x: 0, y: 0 },
    pointB: { x: 0, y: 0 },
  });
  const [interactions, setInteractions] = useState(0);
  const [finishing, setFinishing] = useState(false);

  // Celebration + teaching state.
  const [burst, setBurst] = useState(0);
  const [burstOn, setBurstOn] = useState(false);
  const [showTeach, setShowTeach] = useState(false);

  // AI tutor (only shown when the proxy is reachable + configured).
  const [aiOn, setAiOn] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [explainBusy, setExplainBusy] = useState(false);
  useEffect(() => {
    aiAvailable().then(setAiOn).catch(() => setAiOn(false));
  }, []);

  async function handleExplainMistake() {
    if (explainBusy) return;
    setExplainBusy(true);
    setExplainText("Thinking…");
    try {
      setExplainText(await aiExplain(buildProblemContext()));
    } catch {
      setExplainText("Couldn't reach the tutor. Make sure the AI server is running (npm run ai).");
    } finally {
      setExplainBusy(false);
    }
  }

  // Per-step trackers that should not trigger re-renders.
  const wrongThisStep = useRef(0);
  const misconceptionsThisStep = useRef<string[]>([]);
  const attemptsThisStep = useRef(0);

  // Mastery evidence accumulated across the whole session.
  const evidenceRef = useRef<Partial<Record<ConceptId, ConceptEvidence>>>({});

  // Reset per-step state whenever the step changes.
  useEffect(() => {
    const s = lesson.solvables[stepIndex];
    setStatus("idle");
    setFeedback(null);
    setRevealed(false);
    setHintLevel(0);
    setShowScratch(false);
    setNumericValue("");
    setChoiceSelected(null);
    setMultiSelected([]);
    setInteractions(0);
    setShowTeach(false);
    setExplainText(null);
    setWrongAttempts(0);
    wrongThisStep.current = 0;
    misconceptionsThisStep.current = [];
    attemptsThisStep.current = 0;
    if (s.kind === "observe" || s.kind === "graph-target") {
      setPoints({ pointA: s.graph.pointA, pointB: s.graph.pointB });
    }
    if (s.kind === "order") {
      setOrderItems(shuffle(s.items));
    }
    if (s.kind === "slider") {
      setSliderValue(s.min);
    }
    if (s.kind === "categorize") {
      setPlacement({});
    }
    if (s.kind === "number-line") {
      setNumberLineValue(s.min);
    }
    if (s.kind === "table-fill") {
      setTableValues(s.rows.map(() => ""));
    }
  }, [stepIndex, lesson]);

  // Auto-dismiss the confetti burst shortly after a correct answer.
  useEffect(() => {
    if (burst === 0) return;
    setBurstOn(true);
    const t = window.setTimeout(() => setBurstOn(false), 2600);
    return () => window.clearTimeout(t);
  }, [burst]);

  // Desktop keyboard shortcuts: Enter to check/continue, 1-9 to pick a choice.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (showTeach) return;
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      if (e.key === "Enter") {
        if (typing) return; // the numeric input handles its own Enter
        e.preventDefault();
        if (status === "correct" || revealed) {
          if (!finishing) void handleContinue();
        } else {
          handleCheck();
        }
        return;
      }

      if (!typing && solvable.kind === "choice" && status !== "correct") {
        const n = Number(e.key);
        if (n >= 1 && n <= solvable.options.length) {
          e.preventDefault();
          const opt = solvable.options[n - 1];
          setChoiceSelected(opt.id);
          if (status === "wrong") {
            setStatus("idle");
            setFeedback(null);
          }
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status,
    revealed,
    finishing,
    showTeach,
    solvable,
    numericValue,
    choiceSelected,
    multiSelected,
    orderItems,
    sliderValue,
    placement,
    numberLineValue,
    tableValues,
    points,
    interactions,
    stepIndex,
    hintLevel,
    wrongAttempts,
  ]);

  function buildAnswer(): SolvableAnswer {
    switch (solvable.kind) {
      case "observe":
        return { kind: "observe", interactions };
      case "numeric":
        return { kind: "numeric", text: numericValue };
      case "choice":
        return { kind: "choice", optionId: choiceSelected };
      case "graph-target":
        return {
          kind: "graph-target",
          pointA: points.pointA,
          pointB: points.pointB,
        };
      case "multi-select":
        return { kind: "multi-select", optionIds: multiSelected };
      case "order":
        return { kind: "order", orderedIds: orderItems.map((o) => o.id) };
      case "slider":
        return { kind: "slider", value: sliderValue };
      case "categorize":
        return { kind: "categorize", placement };
      case "number-line":
        return { kind: "number-line", value: numberLineValue };
      case "table-fill":
        return { kind: "table-fill", values: tableValues };
    }
  }

  function canCheck(): boolean {
    if (status === "correct") return false;
    switch (solvable.kind) {
      case "numeric":
        return numericValue.trim() !== "";
      case "choice":
        return choiceSelected !== null;
      case "multi-select":
        return multiSelected.length > 0;
      case "categorize":
        return solvable.items.every((item) => placement[item.id] !== undefined);
      case "table-fill":
        return (
          tableValues.length === solvable.rows.length &&
          tableValues.every((v) => v.trim() !== "")
        );
      default:
        return true;
    }
  }

  function toggleMulti(id: string) {
    if (status === "wrong") {
      setStatus("idle");
      setFeedback(null);
    }
    setMultiSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function accumulateEvidence(delta: number, needsReview: boolean) {
    for (const concept of solvable.concepts) {
      const existing =
        evidenceRef.current[concept] ??
        ({ evidenceDelta: 0, misconceptions: [], needsReview: false } as ConceptEvidence);
      existing.evidenceDelta += delta;
      existing.misconceptions.push(...misconceptionsThisStep.current);
      existing.needsReview = existing.needsReview || needsReview;
      evidenceRef.current[concept] = existing;
    }
  }

  function handleCheck() {
    if (!canCheck()) return;
    const result = validateSolvable(solvable, buildAnswer());
    attemptsThisStep.current += 1;

    if (uid) {
      logAttempt(uid, {
        lessonId: lesson.id,
        stepId: solvable.id,
        answer: result.answerText,
        isCorrect: result.isCorrect,
        attemptNumber: attemptsThisStep.current,
        misconceptionTag: result.misconceptionTag,
      }).catch(() => {});
    }

    if (result.isCorrect) {
      setStatus("correct");
      setFeedback({ variant: "correct", message: result.feedback });
      // Keep the celebration meaningful: full-screen confetti is reserved for
      // mastery-level (hard) questions and the final step, so it rewards real
      // understanding instead of firing on every tap. Routine corrects still get
      // the animated checkmark + sound.
      const isHard =
        (solvable.difficulty ?? deriveDifficulty(stepIndex, total)) === 3;
      const isLastStep = stepIndex === total - 1;
      if (isHard || isLastStep) setBurst((b) => b + 1);
      playCorrect();

      const firstTime = !completedStepIds.includes(solvable.id);
      if (firstTime) {
        const firstTry = wrongThisStep.current === 0;
        accumulateEvidence(firstTry ? 2 : 1, wrongThisStep.current >= 2);

        const nextCompleted = [...completedStepIds, solvable.id];
        const nextCorrect = correctCount + 1;
        const nextXp = xpEarned + XP_PER_SOLVABLE;
        setCompletedStepIds(nextCompleted);
        setCorrectCount(nextCorrect);
        setXpEarned(nextXp);

        if (uid) {
          awardXp(uid, XP_PER_SOLVABLE).catch(() => {});
          recordSolvableActivity(uid).catch(() => {});
          saveLessonProgress(uid, lesson.id, {
            status: "in_progress",
            currentStepIndex: stepIndex,
            completedStepIds: nextCompleted,
            correctCount: nextCorrect,
            xpEarned: nextXp,
          }).catch(() => {});
        }
      }
    } else {
      wrongThisStep.current += 1;
      const attempts = wrongAttempts + 1;
      setWrongAttempts(attempts);
      if (result.misconceptionTag) {
        misconceptionsThisStep.current.push(result.misconceptionTag);
      }
      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);
      setStatus("wrong");
      playWrong();

      const detail = result.misconceptionTag
        ? humanizeMisconception(result.misconceptionTag)
        : undefined;

      // Escalate help automatically: on the 2nd wrong try reveal the next hint
      // from the existing ladder; the 3rd+ try also surfaces the "teach me"
      // video button below. If the hint ladder is exhausted, just keep the
      // feedback (the teach affordance covers the remaining help).
      const stepHints = getHints(solvable);
      if (attempts >= 2 && hintLevel < stepHints.length) {
        const level = Math.min(hintLevel + 1, stepHints.length);
        setHintLevel(level);
        const text = stepHints[level - 1];
        setFeedback({
          variant: "reveal",
          message: text ?? result.feedback,
          detail,
        });
        if (level >= stepHints.length) setRevealed(true);
      } else {
        setFeedback({ variant: "wrong", message: result.feedback, detail });
      }

      if (uid) {
        saveLessonProgress(uid, lesson.id, { wrongCount: nextWrong }).catch(
          () => {}
        );
      }
    }
  }

  // After a wrong attempt, editing the answer clears the hint so the learner
  // gets a fresh check (and the shake/colour state resets).
  function handleAnswerEdited<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      if (status === "wrong") {
        setStatus("idle");
        setFeedback(null);
      }
    };
  }

  /** Describe the current problem for the AI tutor / hint endpoints. */
  function buildProblemContext(): ProblemContext {
    const ctx: ProblemContext = {
      lessonTitle: lesson.title,
      prompt: solvable.prompt,
      concepts: solvable.concepts.map((c) => CONCEPT_LABELS[c] ?? c),
    };
    if (solvable.kind === "choice") {
      ctx.choices = solvable.options.map((o) => o.label);
      ctx.correctAnswer = solvable.options.find(
        (o) => o.id === solvable.correctOptionId
      )?.label;
      if (choiceSelected) {
        ctx.studentAnswer = solvable.options.find((o) => o.id === choiceSelected)?.label;
      }
    } else if (solvable.kind === "multi-select") {
      ctx.choices = solvable.options.map((o) => o.label);
      ctx.correctAnswer = solvable.options
        .filter((o) => solvable.correctOptionIds.includes(o.id))
        .map((o) => o.label)
        .join(", ");
      if (multiSelected.length) {
        ctx.studentAnswer = solvable.options
          .filter((o) => multiSelected.includes(o.id))
          .map((o) => o.label)
          .join(", ");
      }
    } else if (solvable.kind === "numeric") {
      ctx.correctAnswer = solvable.acceptedAnswers[0];
      if (numericValue) ctx.studentAnswer = numericValue;
    } else if (solvable.kind === "graph-target") {
      ctx.correctAnswer = `${solvable.targetSlope.rise}/${solvable.targetSlope.run}`;
    }
    const last = misconceptionsThisStep.current[misconceptionsThisStep.current.length - 1];
    if (last) ctx.misconception = humanizeMisconception(last);
    return ctx;
  }

  async function showNextHint() {
    const hints = getHints(solvable);
    const level = Math.min(hintLevel + 1, hints.length);
    setHintLevel(level);
    const isFinal = level >= hints.length;

    // Prefer a fresh AI hint tailored to the learner's attempt; fall back to the
    // authored ladder if the tutor is offline or errors.
    if (aiOn) {
      setFeedback({ variant: "reveal", message: "Thinking…" });
      try {
        const text = await aiHint({ ...buildProblemContext(), level, isFinal });
        setFeedback({ variant: "reveal", message: text });
        if (isFinal) setRevealed(true);
        return;
      } catch {
        /* fall through to the static ladder */
      }
    }

    const text = hints[level - 1];
    if (text) setFeedback({ variant: "reveal", message: text });
    // Once the final tier (full explanation) is shown, allow continuing.
    if (isFinal) setRevealed(true);
  }

  async function handleContinue() {
    // If the learner advances via the explanation without a correct answer,
    // record the step as resolved (no credit) so progress and resume work.
    if (status !== "correct" && !completedStepIds.includes(solvable.id)) {
      accumulateEvidence(0, true);
      setCompletedStepIds((prev) => [...prev, solvable.id]);
    }

    const isLast = stepIndex === total - 1;
    if (!isLast) {
      const next = stepIndex + 1;
      setStepIndex(next);
      if (uid) {
        saveLessonProgress(uid, lesson.id, {
          status: "in_progress",
          currentStepIndex: next,
        }).catch(() => {});
      }
      return;
    }

    // Finish the lesson.
    setFinishing(true);
    let bonusXp = 0;
    let streakCount = 0;
    const localScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    let score = localScore;
    let passed = localScore >= PASS_THRESHOLD * 100;
    if (uid) {
      try {
        const res = await finalizeLesson({
          uid,
          lessonId: lesson.id,
          alreadyCompleted,
          correctCount,
          totalSolvables: total,
          xpEarned,
          completedStepIds,
          conceptEvidence: evidenceRef.current,
        });
        bonusXp = res.bonusXp;
        streakCount = res.streakCount;
        score = res.score;
        passed = res.passed;
      } catch {
        // Persisting completion failed; still navigate so the learner isn't stuck.
      }
    }
    navigate(`/lesson/${lesson.id}/complete`, {
      replace: true,
      state: {
        lessonId: lesson.id,
        xpEarned,
        bonusXp,
        correctCount,
        total,
        streakCount,
        score,
        passed,
      },
    });
  }

  const progressValue =
    ((stepIndex + (status === "correct" ? 1 : 0)) / total) * 100;

  const difficulty = solvable.difficulty ?? deriveDifficulty(stepIndex, total);

  const hints = getHints(solvable);
  // Offer the narrated "teach me" video on any wrong answer.
  const showTeachButton = status === "wrong";
  const showHintButton =
    status === "wrong" && hintLevel < hints.length && !revealed;
  const canContinueAfterReveal = revealed && status !== "correct";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:items-center lg:justify-center lg:p-6">
      {burstOn && <Confetti key={burst} pieces={44} />}
      {showTeach && (
        <VideoLesson
          lesson={lesson}
          solvable={solvable}
          onClose={() => setShowTeach(false)}
        />
      )}
      {showScratch && (
        <Scratchpad
          onClose={() => setShowScratch(false)}
          aiEnabled={aiOn}
          problem={buildProblemContext()}
        />
      )}
      <AnimatePresence>
        {showTutor && (
          <AiTutorPanel
            problem={buildProblemContext()}
            onClose={() => setShowTutor(false)}
          />
        )}
      </AnimatePresence>
      {/* App panel: full-screen on mobile, a centered card on desktop */}
      <div className="flex h-dvh w-full flex-col overflow-hidden lg:h-[calc(100dvh-3rem)] lg:max-w-3xl lg:rounded-card lg:border lg:border-white/5 lg:bg-surface lg:shadow-card">
      {/* Header / progress */}
      <header className="z-10 border-b border-white/5 bg-surface/80 px-4 pb-3 pt-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 font-semibold text-ink/50 transition-colors hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Exit
            </button>
            <DifficultyBadge level={difficulty} />
            <span className="rounded-pill bg-ink/5 px-2.5 py-1 font-semibold text-ink/60">
              {stepIndex + 1} / {total}
            </span>
          </div>
          <ProgressBar value={progressValue} />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-5 sm:px-6">
        <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mx-auto flex max-w-2xl flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-accent">
              {lesson.title}
            </span>
            <p className="text-xl font-semibold leading-snug text-ink">
              {solvable.prompt}
            </p>
          </div>

          {solvable.kind === "observe" && (
            <ObserveView
              solvable={solvable}
              points={points}
              onChange={setPoints}
              onInteract={() => setInteractions((n) => n + 1)}
            />
          )}
          {solvable.kind === "graph-target" && (
            <GraphTargetView
              solvable={solvable}
              points={points}
              onChange={setPoints}
              onInteract={() => setInteractions((n) => n + 1)}
            />
          )}
          {solvable.kind === "numeric" && (
            <NumericView
              solvable={solvable}
              value={numericValue}
              status={status}
              onChange={handleAnswerEdited(setNumericValue)}
              onSubmit={handleCheck}
              disabled={status === "correct"}
            />
          )}
          {solvable.kind === "choice" && (
            <ChoiceView
              solvable={solvable}
              selected={choiceSelected}
              status={status}
              onSelect={handleAnswerEdited(setChoiceSelected)}
              disabled={status === "correct"}
            />
          )}
          {solvable.kind === "multi-select" && (
            <MultiSelectView
              solvable={solvable}
              selected={multiSelected}
              status={status}
              onToggle={toggleMulti}
              disabled={status === "correct"}
            />
          )}
          {solvable.kind === "order" && (
            <OrderView
              order={orderItems}
              status={status}
              onChange={handleAnswerEdited(setOrderItems)}
              disabled={status === "correct"}
            />
          )}
          {solvable.kind === "slider" && (
            <SliderView
              solvable={solvable}
              value={sliderValue}
              status={status}
              onChange={handleAnswerEdited(setSliderValue)}
              disabled={status === "correct"}
            />
          )}
          {solvable.kind === "categorize" && (
            <CategorizeView
              solvable={solvable}
              placement={placement}
              status={status}
              onPlace={(itemId, categoryId) => {
                if (status === "wrong") {
                  setStatus("idle");
                  setFeedback(null);
                }
                setPlacement((prev) => {
                  const copy = { ...prev };
                  if (categoryId === null) delete copy[itemId];
                  else copy[itemId] = categoryId;
                  return copy;
                });
              }}
              disabled={status === "correct"}
            />
          )}
          {solvable.kind === "number-line" && (
            <NumberLineView
              solvable={solvable}
              value={numberLineValue}
              status={status}
              onChange={handleAnswerEdited(setNumberLineValue)}
              disabled={status === "correct"}
            />
          )}
          {solvable.kind === "table-fill" && (
            <TableFillView
              solvable={solvable}
              values={tableValues}
              status={status}
              onChange={(index, v) => {
                if (status === "wrong") {
                  setStatus("idle");
                  setFeedback(null);
                }
                setTableValues((prev) =>
                  prev.map((x, i) => (i === index ? v : x))
                );
              }}
              disabled={status === "correct"}
            />
          )}
          {aiOn && (
            <ReasoningBox
              key={solvable.id}
              problem={buildProblemContext()}
              wasCorrect={status === "correct"}
            />
          )}
        </motion.div>
        </AnimatePresence>
      </main>

      {/* Action area (in flow, so it never covers the question) */}
      <footer className="border-t border-white/10 bg-surface/80 px-4 pb-4 pt-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {feedback && (
            <FeedbackBanner
              key={`${stepIndex}-${feedback.variant}-${feedback.message}`}
              variant={feedback.variant}
              message={feedback.message}
              detail={feedback.detail}
            />
          )}

          <div className="flex justify-end gap-4">
            {aiOn && (
              <button
                type="button"
                onClick={() => setShowTutor(true)}
                className="flex items-center gap-1 text-xs font-semibold text-accent/80 transition-colors hover:text-accent"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Ask AI tutor
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowScratch(true)}
              className="flex items-center gap-1 text-xs font-semibold text-ink/45 transition-colors hover:text-ink"
            >
              <PencilLine className="h-4 w-4" aria-hidden="true" />
              Scratchpad
            </button>
          </div>

          {showTeachButton && (
            <button
              type="button"
              onClick={() => setShowTeach(true)}
              className="btn animate-fade-in-up w-full border border-violet/40 bg-violet/10 py-3 text-sm text-violet hover:bg-violet/20"
            >
              <Play className="h-5 w-5" fill="currentColor" stroke="none" aria-hidden="true" />
              I don't get it - teach me
            </button>
          )}

          {aiOn && status === "wrong" && (
            <button
              type="button"
              onClick={handleExplainMistake}
              disabled={explainBusy}
              className="btn w-full border border-accent/40 bg-accent/5 py-3 text-sm text-accent hover:bg-accent/10 disabled:opacity-60"
            >
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              Explain my mistake
            </button>
          )}

          {explainText && (
            <div className="animate-fade-in-up flex gap-2 rounded-card border border-accent/20 bg-accent/5 px-4 py-3 text-sm leading-snug text-ink/90">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="whitespace-pre-line">{explainText}</span>
            </div>
          )}

          {showHintButton && (
            <button
              type="button"
              onClick={showNextHint}
              className="btn border border-accent/40 bg-accent/5 py-3 text-sm text-accent hover:bg-accent/10"
            >
              {hintLevel === 0
                ? "Need a hint?"
                : hintLevel >= hints.length - 1
                  ? "Show full explanation"
                  : "Give me another hint"}
            </button>
          )}

          {status === "correct" || canContinueAfterReveal ? (
            <button
              type="button"
              onClick={handleContinue}
              disabled={finishing}
              className="btn-correct w-full"
            >
              {finishing
                ? "Saving..."
                : stepIndex === total - 1
                  ? "Finish lesson"
                  : "Continue"}
              {!finishing && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheck}
              disabled={!canCheck()}
              className="btn-primary w-full"
            >
              Check
            </button>
          )}
        </div>
      </footer>
      </div>
    </div>
  );
}

/**
 * Turn a machine misconception tag (e.g. "dropped-sign") into a short,
 * human-readable nudge surfaced under the feedback banner.
 */
function humanizeMisconception(tag: string): string {
  const KNOWN: Record<string, string> = {
    "dropped-sign": "Watch the sign - check whether the value is negative.",
    "order-swap": "Check the order: it's rise over run, not run over rise.",
    "undefined-slope": "A vertical change with no horizontal run makes slope undefined.",
  };
  if (KNOWN[tag]) return KNOWN[tag];
  const words = tag.replace(/[-_]+/g, " ").trim();
  return `Common slip: ${words}.`;
}

/** Derive a difficulty ramp from a step's position when not authored. */
function deriveDifficulty(index: number, total: number): 1 | 2 | 3 {
  if (total <= 1) return 1;
  const r = index / (total - 1);
  return r < 0.34 ? 1 : r < 0.67 ? 2 : 3;
}
