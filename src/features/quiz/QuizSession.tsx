import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ArrowRight, PencilLine, GraduationCap, Sparkles } from "lucide-react";
import type { ChoiceOption, Point } from "@/types/lesson";
import { useAuth } from "@/features/auth/AuthContext";
import { awardXp, recordSolvableActivity } from "@/services/users";
import { logAttempt } from "@/services/attempts";
import { validateSolvable, type SolvableAnswer } from "@/features/lesson/validate";
import { getHints } from "@/features/lesson/hints";
import { getLesson } from "@/content/course";
import { AiTutorPanel } from "@/features/ai/AiTutorPanel";
import { ReasoningBox } from "@/features/ai/ReasoningBox";
import { aiAvailable, aiHint, aiExplain, type ProblemContext } from "@/lib/ai";
import { AI_NAME } from "@/lib/aiPersona";
import { CONCEPT_LABELS, type ConceptId } from "@/types/concepts";
import { VideoLesson } from "@/features/lesson/components/VideoLesson";
import { XP_PER_SOLVABLE } from "@/features/scoring/constants";
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
import { Confetti } from "@/components/Confetti";
import { Scratchpad } from "@/components/Scratchpad";
import { playCorrect, playWrong, playComplete } from "@/lib/sfx";
import { pickClosest, shuffle, type PoolItem } from "@/features/quiz/pool";

export interface QuizResult {
  score: number;
  total: number;
  xp: number;
  maxCombo: number;
}

interface QuizSessionProps {
  title: string;
  badge?: string;
  /** Fixed, ordered question list (daily / mistakes / practice / diagnostic). */
  questions?: PoolItem[];
  /** Or draw dynamically from a pool. */
  pool?: PoolItem[];
  /** Number of questions for pool mode (ignored when timed). */
  count?: number;
  /** Ramp/ease difficulty based on live accuracy (pool mode). */
  adaptive?: boolean;
  /** Timed speed-round length in seconds. */
  timedSeconds?: number;
  /** Combo multiplier on consecutive correct answers (speed round). */
  combo?: boolean;
  /** Extra XP granted on finishing (daily bonus etc.). */
  bonusXp?: number;
  /** Whether attempts are persisted + XP awarded. Default true. */
  persist?: boolean;
  exitTo?: string;
  exitLabel?: string;
  onRestart?: () => void;
  onFinish?: (result: QuizResult) => void;
  /**
   * Fired once per question, the first time it's checked, with the concepts it
   * exercises and whether that first attempt was correct. Used to drive the
   * spaced-repetition schedule in review mode.
   */
  onAnswer?: (info: { concepts: ConceptId[]; correct: boolean }) => void;
}

interface Points {
  pointA: Point;
  pointB: Point;
}

const RECENT_WINDOW = 4;

export function QuizSession({
  title,
  badge,
  questions,
  pool,
  count = 6,
  adaptive = false,
  timedSeconds,
  combo = false,
  bonusXp = 0,
  persist = true,
  exitTo = "/practice",
  exitLabel = "Exit",
  onRestart,
  onFinish,
  onAnswer,
}: QuizSessionProps) {
  const { user } = useAuth();
  const uid = persist ? user?.uid ?? "" : "";

  const isList = Array.isArray(questions);
  const totalTarget = isList ? questions!.length : count;

  const [item, setItem] = useState<PoolItem | null>(null);
  const [served, setServed] = useState(0);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timedSeconds ?? 0);
  const [done, setDone] = useState(false);

  // Per-question state.
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [feedback, setFeedback] = useState<{
    variant: FeedbackVariant;
    message: string;
    detail?: string;
  } | null>(null);
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
  const [hintLevel, setHintLevel] = useState(0);
  const [showScratch, setShowScratch] = useState(false);
  const [burst, setBurst] = useState(0);
  const [burstOn, setBurstOn] = useState(false);
  // Auto-remediation: count wrong tries on the current solvable so help can
  // escalate on its own (reveal a hint, then offer the "teach me" video).
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showTeach, setShowTeach] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [explainBusy, setExplainBusy] = useState(false);
  useEffect(() => {
    aiAvailable().then(setAiOn).catch(() => setAiOn(false));
  }, []);
  const lastMisconceptionRef = useRef<string | null>(null);

  async function handleExplainMistake() {
    if (explainBusy) return;
    setExplainBusy(true);
    setExplainText("Thinking…");
    try {
      setExplainText(await aiExplain(buildProblemContext()));
    } catch {
      setExplainText(`Couldn't reach ${AI_NAME}. Make sure the AI server is running (npm run ai).`);
    } finally {
      setExplainBusy(false);
    }
  }

  const creditedRef = useRef(false);
  // Step ids whose first-attempt outcome has already been reported via onAnswer
  // (spaced repetition grades on the first try only).
  const gradedRef = useRef<Set<string>>(new Set());
  const servedRef = useRef(0);
  const listIndexRef = useRef(0);
  const usedRef = useRef<Set<string>>(new Set());
  const correctnessRef = useRef<boolean[]>([]);
  const finishedRef = useRef(false);
  const finishReportedRef = useRef(false);

  const solvable = item?.solvable ?? null;
  const hints = solvable ? getHints(solvable) : [];
  // The full lesson backing the current pool item, used for the "teach me"
  // mini-lesson. If it can't be resolved we fall back to revealing hints.
  const teachLesson = item ? getLesson(item.lessonId) ?? null : null;

  const pickNext = useCallback((): PoolItem | null => {
    if (isList) {
      const list = questions!;
      if (listIndexRef.current >= list.length) return null;
      const it = list[listIndexRef.current];
      listIndexRef.current += 1;
      return it;
    }
    const src = pool ?? [];
    if (src.length === 0) return null;
    // Finite, non-timed pool mode: stop after `count`.
    if (!timedSeconds && servedRef.current >= count) return null;

    const recent = correctnessRef.current.slice(-RECENT_WINDOW);
    const ratio = recent.length
      ? recent.filter(Boolean).length / recent.length
      : 0.5;

    let next: PoolItem | undefined;
    if (adaptive) {
      const target = 1 + Math.round(ratio * 2); // 1..3
      next = pickClosest(src, target, usedRef.current);
    } else {
      const remaining = src.filter((p) => !usedRef.current.has(p.solvable.id));
      next = remaining[Math.floor(Math.random() * remaining.length)];
    }

    // Pool exhausted: in timed mode, recycle so the round never stalls.
    if (!next && timedSeconds) {
      usedRef.current.clear();
      next = src[Math.floor(Math.random() * src.length)];
    }
    if (next) usedRef.current.add(next.solvable.id);
    return next ?? null;
  }, [isList, questions, pool, count, adaptive, timedSeconds]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (bonusXp > 0) {
      setXp((x) => x + bonusXp);
      if (uid) awardXp(uid, bonusXp).catch(() => {});
    }
    setDone(true);
    playComplete();
  }, [bonusXp, uid]);

  const serve = useCallback(
    (it: PoolItem | null) => {
      if (!it) {
        finish();
        return;
      }
      setItem(it);
      servedRef.current += 1;
      setServed(servedRef.current);
    },
    [finish]
  );

  // Kick off the first question once.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    serve(pickNext());
  }, [serve, pickNext]);

  // Reset per-question UI when the item changes.
  useEffect(() => {
    if (!solvable) return;
    setStatus("idle");
    setFeedback(null);
    setNumericValue("");
    setChoiceSelected(null);
    setMultiSelected([]);
    setInteractions(0);
    setHintLevel(0);
    setWrongAttempts(0);
    setShowTeach(false);
    setShowTutor(false);
    setExplainText(null);
    lastMisconceptionRef.current = null;
    creditedRef.current = false;
    if (solvable.kind === "observe" || solvable.kind === "graph-target") {
      setPoints({ pointA: solvable.graph.pointA, pointB: solvable.graph.pointB });
    }
    if (solvable.kind === "order") {
      setOrderItems(shuffle(solvable.items));
    }
    if (solvable.kind === "slider") {
      setSliderValue(solvable.min);
    }
    if (solvable.kind === "categorize") {
      setPlacement({});
    }
    if (solvable.kind === "number-line") {
      setNumberLineValue(solvable.min);
    }
    if (solvable.kind === "table-fill") {
      setTableValues(solvable.rows.map(() => ""));
    }
  }, [solvable]);

  // Confetti burst auto-dismiss.
  useEffect(() => {
    if (burst === 0) return;
    setBurstOn(true);
    const t = window.setTimeout(() => setBurstOn(false), 1800);
    return () => window.clearTimeout(t);
  }, [burst]);

  // Report the final result exactly once.
  useEffect(() => {
    if (!done || finishReportedRef.current) return;
    finishReportedRef.current = true;
    onFinish?.({ score, total: served, xp, maxCombo });
  }, [done, onFinish, score, served, xp, maxCombo]);

  // Speed-round countdown.
  useEffect(() => {
    if (!timedSeconds || done) return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [timedSeconds, timeLeft, done, finish]);

  function buildAnswer(): SolvableAnswer {
    switch (solvable!.kind) {
      case "observe":
        return { kind: "observe", interactions };
      case "numeric":
        return { kind: "numeric", text: numericValue };
      case "choice":
        return { kind: "choice", optionId: choiceSelected };
      case "graph-target":
        return { kind: "graph-target", pointA: points.pointA, pointB: points.pointB };
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
    if (!solvable || status === "correct") return false;
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

  function handleCheck() {
    if (!solvable || !canCheck()) return;
    const result = validateSolvable(solvable, buildAnswer());

    if (uid && item) {
      logAttempt(uid, {
        lessonId: item.lessonId,
        stepId: solvable.id,
        answer: result.answerText,
        isCorrect: result.isCorrect,
        attemptNumber: 1,
        misconceptionTag: result.misconceptionTag,
      }).catch(() => {});
    }

    // Grade the first attempt for spaced repetition (once per question).
    if (onAnswer && !gradedRef.current.has(solvable.id)) {
      gradedRef.current.add(solvable.id);
      onAnswer({ concepts: solvable.concepts, correct: result.isCorrect });
    }

    if (result.isCorrect) {
      setStatus("correct");
      setFeedback({ variant: "correct", message: result.feedback });
      setBurst((b) => b + 1);
      playCorrect();
      if (!creditedRef.current) {
        creditedRef.current = true;
        const nextCombo = comboCount + 1;
        const multiplier = combo ? Math.min(4, 1 + Math.floor(nextCombo / 3)) : 1;
        const gain = XP_PER_SOLVABLE * multiplier;
        setComboCount(nextCombo);
        setMaxCombo((m) => Math.max(m, nextCombo));
        setScore((s) => s + 1);
        setXp((x) => x + gain);
        if (uid) awardXp(uid, gain).catch(() => {});
        if (uid) recordSolvableActivity(uid).catch(() => {});
      }
    } else {
      const attempts = wrongAttempts + 1;
      setWrongAttempts(attempts);
      setComboCount(0);
      setStatus("wrong");
      playWrong();

      const detail = result.misconceptionTag
        ? humanizeMisconception(result.misconceptionTag)
        : undefined;
      if (result.misconceptionTag) lastMisconceptionRef.current = result.misconceptionTag;

      // Escalate help automatically: on the 2nd wrong try reveal the next hint
      // (reusing the hint ladder); on the 3rd+ try we additionally surface the
      // "teach me" video affordance in the footer.
      if (attempts >= 2 && hintLevel < hints.length) {
        const level = Math.min(hintLevel + 1, hints.length);
        setHintLevel(level);
        const text = hints[level - 1];
        setFeedback({
          variant: "reveal",
          message: text ?? result.feedback,
          detail,
        });
      } else {
        setFeedback({ variant: "wrong", message: result.feedback, detail });
      }
    }
  }

  function clearOnEdit<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      if (status === "wrong") {
        setStatus("idle");
        setFeedback(null);
      }
    };
  }

  function buildProblemContext(): ProblemContext {
    const ctx: ProblemContext = {};
    if (!solvable) return ctx;
    ctx.lessonTitle = teachLesson?.title;
    ctx.prompt = solvable.prompt;
    ctx.concepts = solvable.concepts.map((c) => CONCEPT_LABELS[c] ?? c);
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
    if (lastMisconceptionRef.current) {
      ctx.misconception = humanizeMisconception(lastMisconceptionRef.current);
    }
    return ctx;
  }

  async function showNextHint() {
    const level = Math.min(hintLevel + 1, hints.length);
    setHintLevel(level);
    const isFinal = level >= hints.length;

    if (aiOn && solvable) {
      setFeedback({ variant: "reveal", message: "Thinking…" });
      try {
        const text = await aiHint({ ...buildProblemContext(), level, isFinal });
        setFeedback({ variant: "reveal", message: text });
        return;
      } catch {
        /* fall through to static ladder */
      }
    }

    const text = hints[level - 1];
    if (text) setFeedback({ variant: "reveal", message: text });
  }

  function advance() {
    correctnessRef.current.push(status === "correct");
    serve(pickNext());
  }

  // Enter to check / continue.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || showScratch || showTeach) return;
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (e.key === "Enter") {
        if (typing) return;
        e.preventDefault();
        if (status === "correct") advance();
        else handleCheck();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status,
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
    done,
    showScratch,
    showTeach,
    hintLevel,
    wrongAttempts,
  ]);

  if (!solvable && !done) {
    // Pre-first-question frame; the start effect serves immediately after mount.
    return <div className="min-h-dvh bg-canvas" />;
  }

  if (done) {
    const pct = served > 0 ? Math.round((score / Math.max(1, served)) * 100) : 0;
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-canvas via-canvas to-accent/5 px-5 py-12 text-ink">
        <Confetti />
        <div className="relative flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="animate-scale-in flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet text-3xl font-extrabold text-white shadow-pop">
            {pct}%
          </div>
          <div>
            <h1 className="animate-fade-in-up text-3xl font-bold">{title} complete!</h1>
            <p className="animate-fade-in-up stagger-1 mt-1 text-ink/70">
              You got {score} of {served} correct.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="card animate-count-pop p-4">
              <div className="text-2xl font-extrabold text-accent">+{xp}</div>
              <div className="text-xs text-ink/60">XP earned</div>
            </div>
            <div className="card animate-count-pop stagger-1 p-4">
              <div className="text-2xl font-extrabold">
                {combo ? `x${maxCombo}` : `${score}/${served}`}
              </div>
              <div className="text-xs text-ink/60">
                {combo ? "Best combo" : "Correct"}
              </div>
            </div>
          </div>
          <div className="flex w-full animate-fade-in-up stagger-2 flex-col gap-3">
            {onRestart && (
              <button type="button" onClick={onRestart} className="btn-primary w-full">
                Play again
              </button>
            )}
            <Link to={exitTo} className="btn-ghost w-full">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressValue = timedSeconds
    ? (timeLeft / timedSeconds) * 100
    : (Math.max(0, served - 1) / Math.max(1, totalTarget)) * 100;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink lg:items-center lg:justify-center lg:p-6">
      {burstOn && <Confetti key={burst} pieces={40} />}
      {showTeach && teachLesson && solvable && (
        <VideoLesson
          lesson={teachLesson}
          solvable={solvable}
          onClose={() => setShowTeach(false)}
        />
      )}
      {showScratch && (
        <Scratchpad
          onClose={() => setShowScratch(false)}
          aiEnabled={aiOn}
          problem={solvable ? buildProblemContext() : undefined}
        />
      )}
      <AnimatePresence>
        {showTutor && solvable && (
          <AiTutorPanel
            problem={buildProblemContext()}
            onClose={() => setShowTutor(false)}
          />
        )}
      </AnimatePresence>
      <div className="flex w-full flex-1 flex-col overflow-hidden lg:h-[calc(100dvh-3rem)] lg:max-w-3xl lg:flex-none lg:rounded-card lg:border lg:border-ink/5 lg:bg-surface lg:shadow-card">
        <header className="border-b border-ink/5 bg-surface/80 px-4 pb-3 pt-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <Link
                to={exitTo}
                className="flex items-center gap-1 font-semibold text-ink/50 transition-colors hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {exitLabel}
              </Link>
              <span className="rounded-pill bg-accent/10 px-2.5 py-1 font-bold text-accent">
                {badge ?? title}
              </span>
              {timedSeconds ? (
                <span
                  className={`rounded-pill px-2.5 py-1 font-bold tabular-nums ${
                    timeLeft <= 10 ? "bg-danger/15 text-danger" : "bg-ink/5 text-ink/70"
                  }`}
                >
                  {timeLeft}s
                </span>
              ) : (
                <span className="rounded-pill bg-ink/5 px-2.5 py-1 font-semibold text-ink/60">
                  {Math.min(served, totalTarget)} / {totalTarget}
                </span>
              )}
            </div>
            <ProgressBar value={progressValue} />
            {combo && comboCount >= 2 && (
              <div className="animate-count-pop self-center rounded-pill bg-hint/15 px-3 py-0.5 text-xs font-bold text-hint">
                {comboCount} combo · x{Math.min(4, 1 + Math.floor(comboCount / 3))}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-5 sm:px-6">
          <AnimatePresence mode="wait">
          <motion.div
            key={served}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto flex max-w-2xl flex-col gap-5"
          >
            <p className="text-xl font-semibold leading-snug text-ink">
              {solvable!.prompt}
            </p>

            {solvable!.kind === "observe" && (
              <ObserveView
                solvable={solvable!}
                points={points}
                onChange={setPoints}
                onInteract={() => setInteractions((n) => n + 1)}
              />
            )}
            {solvable!.kind === "graph-target" && (
              <GraphTargetView
                solvable={solvable!}
                points={points}
                onChange={setPoints}
                onInteract={() => setInteractions((n) => n + 1)}
              />
            )}
            {solvable!.kind === "numeric" && (
              <NumericView
                solvable={solvable!}
                value={numericValue}
                status={status}
                onChange={clearOnEdit(setNumericValue)}
                onSubmit={handleCheck}
                disabled={status === "correct"}
              />
            )}
            {solvable!.kind === "choice" && (
              <ChoiceView
                solvable={solvable!}
                selected={choiceSelected}
                status={status}
                onSelect={clearOnEdit(setChoiceSelected)}
                disabled={status === "correct"}
              />
            )}
            {solvable!.kind === "multi-select" && (
              <MultiSelectView
                solvable={solvable!}
                selected={multiSelected}
                status={status}
                onToggle={toggleMulti}
                disabled={status === "correct"}
              />
            )}
            {solvable!.kind === "order" && (
              <OrderView
                order={orderItems}
                status={status}
                onChange={clearOnEdit(setOrderItems)}
                disabled={status === "correct"}
              />
            )}
            {solvable!.kind === "slider" && (
              <SliderView
                solvable={solvable!}
                value={sliderValue}
                status={status}
                onChange={clearOnEdit(setSliderValue)}
                disabled={status === "correct"}
              />
            )}
            {solvable!.kind === "categorize" && (
              <CategorizeView
                solvable={solvable!}
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
            {solvable!.kind === "number-line" && (
              <NumberLineView
                solvable={solvable!}
                value={numberLineValue}
                status={status}
                onChange={clearOnEdit(setNumberLineValue)}
                disabled={status === "correct"}
              />
            )}
            {solvable!.kind === "table-fill" && (
              <TableFillView
                solvable={solvable!}
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
            {aiOn && solvable && (
              <ReasoningBox
                key={solvable.id}
                problem={buildProblemContext()}
                wasCorrect={status === "correct"}
              />
            )}
          </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-ink/10 bg-surface/80 px-4 pb-4 pt-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {feedback && (
              <FeedbackBanner
                key={`${served}-${feedback.variant}-${feedback.message}`}
                variant={feedback.variant}
                message={feedback.message}
                detail={feedback.detail}
              />
            )}

            {status === "wrong" && teachLesson && (
              <button
                type="button"
                onClick={() => setShowTeach(true)}
                className="btn animate-fade-in-up w-full border border-violet/40 bg-violet/10 py-3 text-sm text-violet hover:bg-violet/20"
              >
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
                Watch: teach me this
              </button>
            )}

            {aiOn && status === "wrong" && solvable && (
              <button
                type="button"
                onClick={handleExplainMistake}
                disabled={explainBusy}
                className="btn w-full border border-accent/40 bg-accent/5 py-3 text-sm text-accent hover:bg-accent/10 disabled:opacity-60"
              >
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                {AI_NAME}: explain my mistake
              </button>
            )}

            {explainText && (
              <div className="animate-fade-in-up flex gap-2 rounded-card border border-accent/20 bg-accent/5 px-4 py-3 text-sm leading-snug text-ink/90">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span className="whitespace-pre-line">{explainText}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowScratch(true)}
                  className="flex items-center gap-1 font-semibold text-ink/45 transition-colors hover:text-ink"
                >
                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                  Scratchpad
                </button>
                {aiOn && solvable && (
                  <button
                    type="button"
                    onClick={() => setShowTutor(true)}
                    className="flex items-center gap-1 font-semibold text-accent/80 transition-colors hover:text-accent"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Ask {AI_NAME}
                  </button>
                )}
              </div>
              {status === "wrong" && hintLevel < hints.length && (
                <button
                  type="button"
                  onClick={showNextHint}
                  className="font-semibold text-accent hover:underline"
                >
                  {hintLevel === 0 ? "Need a hint?" : "Another hint"}
                </button>
              )}
            </div>

            {status === "correct" ? (
              <button type="button" onClick={advance} className="btn-correct w-full">
                Next
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button type="button" onClick={advance} className="btn-ghost flex-1">
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={!canCheck()}
                  className="btn-primary flex-[2]"
                >
                  Check
                </button>
              </div>
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
