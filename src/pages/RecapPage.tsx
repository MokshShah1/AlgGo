import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { fetchRecentAttempts } from "@/services/attempts";
import { dayKey } from "@/features/progress/activity";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Attempt } from "@/types/attempt";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function RecapPage() {
  const { profile, user } = useAuth();
  const { mastery, loading } = useLearnerData();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setLoaded(true);
      return;
    }
    fetchRecentAttempts(user.uid, { max: 300 })
      .then((rows) => active && setAttempts(rows))
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [user]);

  const recap = useMemo(() => {
    const now = new Date();
    const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const week = attempts.filter((a) => (a.createdAt?.toMillis() ?? 0) >= cutoff);
    const correct = week.filter((a) => a.isCorrect).length;
    const days = new Set(
      week.map((a) => {
        const d = a.createdAt?.toDate?.();
        return d ? dayKey(d) : "";
      })
    );
    days.delete("");

    // Per-weekday counts for a small bar chart.
    const byWeekday = new Array(7).fill(0) as number[];
    for (const a of week) {
      const d = a.createdAt?.toDate?.();
      if (d) byWeekday[d.getDay()] += 1;
    }

    return {
      answered: week.length,
      correct,
      accuracy: week.length ? Math.round((correct / week.length) * 100) : 0,
      activeDays: days.size,
      byWeekday,
      max: Math.max(1, ...byWeekday),
    };
  }, [attempts]);

  if (loading || !loaded) return <LoadingScreen label="Building your week in slope..." />;

  const mastered = mastery.filter((m) => m.level >= 3).length;

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-3xl md:py-8">
        <div className="animate-fade-in-up flex flex-col gap-1 text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Last 7 days
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">Your week in slope</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <RecapStat value={`${profile?.weeklyXp ?? 0}`} label="XP this week" delay="stagger-1" highlight />
          <RecapStat value={`${recap.activeDays}`} label="Active days" delay="stagger-2" />
          <RecapStat value={`${recap.answered}`} label="Questions" delay="stagger-3" />
          <RecapStat value={`${recap.accuracy}%`} label="Accuracy" delay="stagger-4" />
        </div>

        <section className="animate-fade-in-up card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
            Daily activity
          </h2>
          <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 120 }}>
            {recap.byWeekday.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-accent to-violet transition-[height] duration-700"
                    style={{ height: `${(count / recap.max) * 100}%`, minHeight: count ? 4 : 0 }}
                    title={`${count} answers`}
                  />
                </div>
                <span className="text-[10px] text-ink/50">{DAY_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="animate-fade-in-up card flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold">Current streak</p>
            <p className="text-xs text-ink/60">Concepts mastered: {mastered}</p>
          </div>
          <div className="flex items-center gap-1 text-3xl font-extrabold text-hint">
            {profile?.streakCount ?? 0}
            <span className="text-2xl">{String.fromCodePoint(0x1f525)}</span>
          </div>
        </section>

        <Link to="/dashboard" className="btn-ghost w-full">
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}

function RecapStat({
  value,
  label,
  delay,
  highlight,
}: {
  value: string;
  label: string;
  delay?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card animate-count-pop ${delay ?? ""} p-4 text-center ${
        highlight ? "bg-gradient-to-br from-accent/15 to-violet/15" : ""
      }`}
    >
      <div className="text-3xl font-extrabold text-ink">{value}</div>
      <div className="text-xs text-ink/60">{label}</div>
    </div>
  );
}
