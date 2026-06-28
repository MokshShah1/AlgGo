import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { fetchRecentAttempts } from "@/services/attempts";
import { fetchReviewSchedules } from "@/services/reviewSchedule";
import {
  computeAllStrengths,
  type ConceptStrength,
  type StrengthLabel,
} from "@/features/practice/masteryStrength";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CONCEPT_LABELS, type ConceptId } from "@/types/concepts";
import type { Attempt } from "@/types/attempt";
import type { ReviewSchedule } from "@/types/review";

interface Node {
  id: ConceptId;
  x: number; // 0-100
  y: number; // 0-100
}

const NODES: Node[] = [
  { id: "constant-rate", x: 12, y: 50 },
  { id: "rise", x: 37, y: 26 },
  { id: "run", x: 37, y: 74 },
  { id: "slope-ratio", x: 60, y: 50 },
  { id: "positive-slope", x: 86, y: 20 },
  { id: "negative-slope", x: 86, y: 50 },
  { id: "constant-slope", x: 86, y: 80 },
];

const EDGES: [ConceptId, ConceptId][] = [
  ["constant-rate", "rise"],
  ["constant-rate", "run"],
  ["rise", "slope-ratio"],
  ["run", "slope-ratio"],
  ["slope-ratio", "positive-slope"],
  ["slope-ratio", "negative-slope"],
  ["slope-ratio", "constant-slope"],
];

function nodeStyle(label: StrengthLabel): string {
  switch (label) {
    case "Mastered":
      return "border-transparent bg-gradient-to-br from-accent to-violet text-white shadow-pop";
    case "Strong":
      return "border-accent/60 bg-accent/15 text-ink";
    case "Familiar":
      return "border-sky/50 bg-sky/10 text-ink";
    case "Learning":
      return "border-hint/50 bg-hint/10 text-ink";
    default:
      return "border-white/10 bg-surface-2 text-ink/50";
  }
}

export function SkillTreePage() {
  const { user } = useAuth();
  const { mastery, loading } = useLearnerData();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [schedules, setSchedules] = useState<ReviewSchedule[]>([]);
  const [extrasLoaded, setExtrasLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setExtrasLoaded(true);
      return;
    }
    Promise.all([
      fetchRecentAttempts(user.uid, { max: 300 }),
      fetchReviewSchedules(user.uid),
    ])
      .then(([a, s]) => {
        if (!active) return;
        setAttempts(a);
        setSchedules(s);
      })
      .catch(() => {})
      .finally(() => active && setExtrasLoaded(true));
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !extrasLoaded) {
    return <LoadingScreen label="Loading your skill map..." />;
  }

  const strengths = computeAllStrengths(mastery, attempts, schedules);
  const byId = new Map<ConceptId, ConceptStrength>(
    strengths.map((s) => [s.conceptId, s])
  );
  const get = (id: ConceptId) =>
    byId.get(id) ?? { strength: 0, label: "New" as StrengthLabel, representations: [] };
  const pos = (id: ConceptId) => NODES.find((n) => n.id === id)!;
  const masteredCount = strengths.filter((s) => s.label === "Mastered").length;

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-4xl md:py-8">
        <div className="animate-fade-in-up flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Skill map
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">Your concept tree</h1>
          <p className="text-sm text-ink/70">
            Each concept shows a live mastery score that blends accuracy, spaced
            reviews, and whether you can handle it across graphs, tables, and
            numbers. {masteredCount} of {strengths.length} mastered.
          </p>
        </div>

        <div className="card animate-fade-in-up relative w-full overflow-hidden p-4">
          <div className="relative w-full" style={{ aspectRatio: "16 / 11" }}>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {EDGES.map(([from, to]) => {
                const a = pos(from);
                const b = pos(to);
                const lit = get(from).strength >= 60 && get(to).strength > 0;
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={lit ? "rgb(var(--c-accent))" : "rgb(var(--c-ink) / 0.15)"}
                    strokeWidth={lit ? 0.8 : 0.5}
                  />
                );
              })}
            </svg>

            {NODES.map((n) => {
              const s = get(n.id);
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                  <div
                    className={`flex w-24 flex-col items-center gap-1 rounded-card border p-2 text-center transition-transform hover:scale-105 sm:w-32 ${nodeStyle(s.label)}`}
                  >
                    <span className="text-[10px] font-bold leading-tight sm:text-xs">
                      {CONCEPT_LABELS[n.id]}
                    </span>
                    <span className="text-[9px] font-semibold opacity-80">
                      {s.label} · {s.strength}
                    </span>
                    <div className="flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 w-1.5 rounded-full ${
                            i < s.representations.length
                              ? "bg-current opacity-90"
                              : "bg-current opacity-25"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ink/60">
          <LegendDot className="bg-gradient-to-br from-accent to-violet" label="Mastered" />
          <LegendDot className="bg-accent/40" label="Strong" />
          <LegendDot className="bg-sky/40" label="Familiar" />
          <LegendDot className="bg-hint/40" label="Learning" />
          <LegendDot className="bg-surface-2 border border-white/10" label="New" />
          <span className="flex items-center gap-1.5">
            <span className="flex gap-0.5">
              <span className="h-1 w-1.5 rounded-full bg-ink/70" />
              <span className="h-1 w-1.5 rounded-full bg-ink/70" />
              <span className="h-1 w-1.5 rounded-full bg-ink/20" />
              <span className="h-1 w-1.5 rounded-full bg-ink/20" />
            </span>
            representations shown
          </span>
        </div>
      </main>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-full ${className}`} />
      {label}
    </span>
  );
}
