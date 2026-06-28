import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Zap, GraduationCap, Award } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { recommend } from "@/features/scoring/recommend";
import { course } from "@/content/course";
import { getLessonDisplay } from "@/features/course/lessonDisplay";
import { unlockedThroughIndex } from "@/features/course/progression";
import { LessonPathCard } from "@/features/course/LessonPathCard";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { fetchRecentAttempts } from "@/services/attempts";
import { updateUserProfile } from "@/services/users";
import { upsertLeaderboardEntry } from "@/services/leaderboard";
import { buildActivity, solvedToday } from "@/features/progress/activity";
import { ActivityCalendar } from "@/features/progress/ActivityCalendar";
import { getStreakStatus, repairStreak } from "@/features/scoring/streakRepair";
import { ContinueHero } from "@/features/dashboard/ContinueHero";
import { CoachCard } from "@/features/dashboard/CoachCard";
import { ReviewsDueCard } from "@/features/dashboard/ReviewsDueCard";
import { RetentionCard } from "@/features/dashboard/RetentionCard";
import { MasteryMeters } from "@/features/dashboard/MasteryMeters";
import { StreakNudge } from "@/features/dashboard/StreakNudge";
import { countReviewsDue } from "@/features/dashboard/reviewsDue";
import { computeRetention } from "@/features/practice/retention";
import { computeAllStrengths } from "@/features/practice/masteryStrength";
import { fetchReviewSchedules } from "@/services/reviewSchedule";
import { effectiveWeeklyXp } from "@/lib/week";
import type { Attempt } from "@/types/attempt";
import type { ReviewSchedule } from "@/types/review";

export function DashboardPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { progress, mastery, loading } = useLearnerData();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [schedules, setSchedules] = useState<ReviewSchedule[]>([]);

  useEffect(() => {
    let active = true;
    if (!user) return;
    fetchRecentAttempts(user.uid, { max: 300 })
      .then((rows) => {
        if (active) setAttempts(rows);
      })
      .catch(() => {});
    fetchReviewSchedules(user.uid)
      .then((rows) => {
        if (active) setSchedules(rows);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  // Pull the latest profile whenever the dashboard mounts so XP / streak / level
  // reflect points earned in practice modes (awardXp writes to Firestore but the
  // in-memory profile is otherwise only refreshed on a few actions).
  useEffect(() => {
    refreshProfile().catch(() => {});
  }, [refreshProfile]);

  // Register on the public leaderboard by default so every learner shows up
  // (unless they've explicitly hidden themselves on the Leaderboard page).
  useEffect(() => {
    if (!user || !profile) return;
    if (profile.leaderboardOptIn === false) return;
    upsertLeaderboardEntry({
      uid: user.uid,
      displayName: profile.displayName,
      weeklyXp: effectiveWeeklyXp(profile),
      totalXp: profile.totalXp ?? 0,
      avatarColor: profile.avatarColor,
      avatarEmoji: profile.avatarEmoji,
    }).catch(() => {});
  }, [user, profile]);

  if (loading) return <LoadingScreen label="Loading your dashboard..." />;

  const recommendation = recommend(progress, mastery, profile);
  const frontier = unlockedThroughIndex(progress, profile);
  const masteredConcepts = mastery.filter((m) => m.level >= 3);
  const previewLessons = course.lessons.slice(0, 3);

  const activity = buildActivity(attempts);
  const doneToday = solvedToday(attempts);
  const dailyGoal = profile?.dailyGoal ?? 3;
  const reviewsDue = countReviewsDue(mastery, attempts, schedules);
  const retention = computeRetention(attempts);
  const strengths = computeAllStrengths(mastery, attempts, schedules);
  const lessonsDone = progress.filter((p) => p.status === "completed").length;
  const totalLessons = course.lessons.length;

  async function changeGoal(delta: number) {
    if (!user) return;
    const next = Math.min(20, Math.max(1, dailyGoal + delta));
    if (next === dailyGoal) return;
    try {
      await updateUserProfile(user.uid, { dailyGoal: next });
      await refreshProfile();
    } catch {
      /* non-fatal */
    }
  }

  const streak = getStreakStatus(profile);
  async function handleRepairStreak() {
    if (!user || !profile) return;
    try {
      const ok = await repairStreak(user.uid, profile);
      if (ok) await refreshProfile();
    } catch {
      /* non-fatal */
    }
  }

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-4xl md:py-8">
        <h1 className="animate-fade-in-up text-2xl font-bold md:text-3xl">
          Welcome back,{" "}
          <span className="gradient-text">{profile?.displayName || "learner"}</span>
        </h1>

        {/* Zone 1 — Continue where you left off (focal hero) */}
        <ContinueHero recommendation={recommendation} progress={progress} />

        {/* Zone 2 — Stat strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Day streak"
            value={`${profile?.streakCount ?? 0}`}
            sub={`${profile?.streakCharges ?? 0} freezes`}
            icon={<Flame className="h-4 w-4" aria-hidden="true" />}
            tone="secondary"
            delay="stagger-1"
          />
          <StatCard
            label="Total XP"
            value={`${profile?.totalXp ?? 0}`}
            sub="keep it up"
            icon={<Zap className="h-4 w-4" aria-hidden="true" />}
            tone="accent"
            delay="stagger-2"
          />
          <StatCard
            label="Lessons done"
            value={`${lessonsDone}`}
            sub={`of ${totalLessons}`}
            icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
            tone="correct"
            progress={totalLessons ? lessonsDone / totalLessons : 0}
            delay="stagger-3"
          />
          <StatCard
            label="Mastered"
            value={`${masteredConcepts.length}`}
            sub="concepts"
            icon={<Award className="h-4 w-4" aria-hidden="true" />}
            tone="violet"
            delay="stagger-4"
          />
        </div>

        {/* Zone 3 — Alerts: a single tidy area that only shows what's relevant */}
        <div className="flex flex-col gap-3 empty:hidden">
          {streak.canRepair && (
            <section className="animate-fade-in-up flex items-center justify-between gap-3 rounded-card border border-hint/40 bg-hint/10 p-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-hint">Your streak is in danger!</p>
                <p className="text-xs text-ink/70">
                  Use a streak freeze ({streak.charges} left) to save your{" "}
                  {profile?.streakCount}-day streak.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRepairStreak}
                className="btn-primary shrink-0 px-4 py-2 text-sm"
              >
                Use freeze
              </button>
            </section>
          )}

          {profile && !profile.placementDone && (
            <Link
              to="/diagnostic"
              className="animate-fade-in-up flex items-center justify-between gap-3 rounded-card border border-accent/30 bg-accent/10 p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-accent">Take a 2-minute placement quiz</p>
                <p className="text-xs text-ink/70">Find the best lesson to start with.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            </Link>
          )}

          <StreakNudge profile={profile} doneToday={doneToday} dailyGoal={dailyGoal} />
          <ReviewsDueCard count={reviewsDue} />
        </div>

        {/* Zone 4 — Today: goal + coach side by side, retention metric below */}
        <section className="flex flex-col gap-4">
          <SectionHeader title="Today" />
          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <DailyGoalCard done={doneToday} goal={dailyGoal} onChange={changeGoal} />
            <CoachCard mastery={mastery} streak={profile?.streakCount ?? 0} />
          </div>
          <RetentionCard stats={retention} />
        </section>

        {/* Zone 5 — Course path preview */}
        <section className="animate-fade-in-up stagger-3 flex flex-col gap-3">
          <SectionHeader title="Course path" action={{ to: "/course", label: "See all" }} />
          {previewLessons.map((lesson, i) => (
            <LessonPathCard
              key={lesson.id}
              lesson={lesson}
              display={getLessonDisplay(
                lesson,
                progress,
                recommendation.lessonId,
                i > frontier
              )}
            />
          ))}
        </section>

        {/* Zone 6 — Progress: mastery + activity, evenly balanced */}
        <section className="flex flex-col gap-3">
          <SectionHeader title="Your progress" />
          <div className="grid gap-5 md:grid-cols-2 md:items-start">
            <MasteryMeters strengths={strengths} />
            <ActivityCalendar activity={activity} />
          </div>
        </section>
      </main>
    </div>
  );
}

function DailyGoalCard({
  done,
  goal,
  onChange,
}: {
  done: number;
  goal: number;
  onChange: (delta: number) => void;
}) {
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const reached = done >= goal;
  return (
    <section className="animate-fade-in-up stagger-1 card flex items-center gap-5 p-5">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgb(var(--c-ink) / 0.1)" strokeWidth="7" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={reached ? "rgb(var(--c-correct))" : "rgb(var(--c-accent))"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 700ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold leading-none">{done}</span>
          <span className="text-[10px] text-ink/50">/ {goal}</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
          Today's goal
        </h2>
        <p className="text-sm text-ink/70">
          {reached
            ? "Goal reached - amazing work today!"
            : `${goal - done} more solvable${goal - done === 1 ? "" : "s"} to hit your goal.`}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-ink/50">Daily goal</span>
          <button
            type="button"
            onClick={() => onChange(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-ink/70 hover:text-ink"
            aria-label="Lower daily goal"
          >
            -
          </button>
          <span className="w-5 text-center text-sm font-bold">{goal}</span>
          <button
            type="button"
            onClick={() => onChange(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-ink/70 hover:text-ink"
            aria-label="Raise daily goal"
          >
            +
          </button>
        </div>
      </div>
    </section>
  );
}

type StatTone = "secondary" | "accent" | "correct" | "violet";

const STAT_TONES: Record<StatTone, { chip: string; bar: string }> = {
  secondary: { chip: "bg-secondary/15 text-secondary", bar: "bg-secondary" },
  accent: { chip: "bg-accent/15 text-accent", bar: "bg-accent" },
  correct: { chip: "bg-correct/15 text-correct", bar: "bg-correct" },
  violet: { chip: "bg-violet/15 text-violet", bar: "bg-violet" },
};

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
  progress,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
  tone?: StatTone;
  /** 0-1; renders a thin progress bar instead of the sub text when provided. */
  progress?: number;
  delay?: string;
}) {
  const t = STAT_TONES[tone ?? "accent"];
  const pct = progress === undefined ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div className={`card animate-fade-in-up ${delay ?? ""} p-4`}>
      <div className="flex items-start justify-between">
        <div className="text-3xl font-extrabold leading-none text-ink">{value}</div>
        {icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.chip}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-sm font-medium text-ink">{label}</div>
      {pct === null ? (
        <div className="text-xs text-ink/50">{sub}</div>
      ) : (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-ink/10">
            <div
              className={`h-full rounded-pill ${t.bar} transition-[width] duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-ink/45">{sub}</span>
        </div>
      )}
    </div>
  );
}
