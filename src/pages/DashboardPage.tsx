import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { recommend } from "@/features/scoring/recommend";
import { course } from "@/content/course";
import { getLessonDisplay } from "@/features/course/lessonDisplay";
import { unlockedThroughIndex } from "@/features/course/progression";
import { LessonPathCard } from "@/features/course/LessonPathCard";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CONCEPT_LABELS } from "@/types/concepts";
import { fetchRecentAttempts } from "@/services/attempts";
import { updateUserProfile } from "@/services/users";
import { upsertLeaderboardEntry } from "@/services/leaderboard";
import { buildActivity, solvedToday } from "@/features/progress/activity";
import { ActivityCalendar } from "@/features/progress/ActivityCalendar";
import { getStreakStatus, repairStreak } from "@/features/scoring/streakRepair";
import { ContinueHero } from "@/features/dashboard/ContinueHero";
import { ReviewsDueCard } from "@/features/dashboard/ReviewsDueCard";
import { StreakNudge } from "@/features/dashboard/StreakNudge";
import { countReviewsDue } from "@/features/dashboard/reviewsDue";
import { effectiveWeeklyXp } from "@/lib/week";
import type { Attempt } from "@/types/attempt";

export function DashboardPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { progress, mastery, loading } = useLearnerData();
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    let active = true;
    if (!user) return;
    fetchRecentAttempts(user.uid, { max: 300 })
      .then((rows) => {
        if (active) setAttempts(rows);
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
  const reviewConcepts = mastery.filter((m) => m.needsReview && m.level < 3);
  const previewLessons = course.lessons.slice(0, 3);

  const activity = buildActivity(attempts);
  const doneToday = solvedToday(attempts);
  const dailyGoal = profile?.dailyGoal ?? 3;
  const reviewsDue = countReviewsDue(mastery, attempts);

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

        {/* Continue where you left off (focal hero) */}
        <ContinueHero recommendation={recommendation} progress={progress} />

        {/* Key stats sit right under the focal hero */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Day streak"
            value={`${profile?.streakCount ?? 0}`}
            sub={`${profile?.streakCharges ?? 0} charges`}
            delay="stagger-1"
          />
          <StatCard
            label="Total XP"
            value={`${profile?.totalXp ?? 0}`}
            sub="keep it up"
            delay="stagger-2"
          />
          <StatCard
            label="Lessons done"
            value={`${progress.filter((p) => p.status === "completed").length}`}
            sub={`of ${course.lessons.length}`}
            delay="stagger-3"
          />
          <StatCard
            label="Mastered"
            value={`${masteredConcepts.length}`}
            sub="concepts"
            delay="stagger-4"
          />
        </div>

        {/* Streak repair (only when a streak broke and a charge is available) */}
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

        {/* Placement prompt (until completed) */}
        {profile && !profile.placementDone && (
          <Link
            to="/diagnostic"
            className="animate-fade-in-up flex items-center justify-between gap-3 rounded-card border border-accent/30 bg-accent/10 p-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-accent">Take a 2-minute placement quiz</p>
              <p className="text-xs text-ink/70">
                Find the best lesson to start with.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          </Link>
        )}

        {/* Attention banners — only render when relevant */}
        <StreakNudge profile={profile} doneToday={doneToday} dailyGoal={dailyGoal} />
        <ReviewsDueCard count={reviewsDue} />

        {/* Today's goal */}
        <DailyGoalCard done={doneToday} goal={dailyGoal} onChange={changeGoal} />

        {/* Course path preview (full width) */}
        <section className="animate-fade-in-up stagger-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
              Course path
            </h2>
            <Link to="/course" className="text-sm font-semibold text-accent hover:underline">
              See all
            </Link>
          </div>
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

        {/* Mastery + Activity, evenly balanced */}
        <div className="grid gap-5 md:grid-cols-2 md:items-start">
          <section className="animate-fade-in-up stagger-4 card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
              Mastery
            </h2>
            {masteredConcepts.length === 0 && reviewConcepts.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">
                Finish a lesson to start tracking mastered concepts.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {masteredConcepts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-correct">Mastered</p>
                    <p className="text-sm text-ink/80">
                      {masteredConcepts
                        .map((m) => CONCEPT_LABELS[m.conceptId])
                        .join(", ")}
                    </p>
                  </div>
                )}
                {reviewConcepts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-hint">To review</p>
                    <p className="text-sm text-ink/80">
                      {reviewConcepts
                        .map((m) => CONCEPT_LABELS[m.conceptId])
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
          <ActivityCalendar activity={activity} />
        </div>
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

function StatCard({
  label,
  value,
  sub,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  delay?: string;
}) {
  return (
    <div className={`card animate-fade-in-up ${delay ?? ""} p-4`}>
      <div className="text-3xl font-extrabold text-ink">{value}</div>
      <div className="text-sm font-medium text-ink">{label}</div>
      <div className="text-xs text-ink/50">{sub}</div>
    </div>
  );
}
