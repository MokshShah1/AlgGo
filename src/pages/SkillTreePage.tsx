import { useLearnerData } from "@/features/progress/useLearnerData";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CONCEPT_LABELS, type ConceptId } from "@/types/concepts";
import { MASTERY_LABELS, type MasteryLevel } from "@/types/mastery";

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

function nodeStyle(level: MasteryLevel): string {
  switch (level) {
    case 3:
      return "border-transparent bg-gradient-to-br from-accent to-violet text-white shadow-pop";
    case 2:
      return "border-accent/60 bg-accent/15 text-ink";
    case 1:
      return "border-hint/50 bg-hint/10 text-ink";
    default:
      return "border-white/10 bg-surface-2 text-ink/50";
  }
}

export function SkillTreePage() {
  const { mastery, loading } = useLearnerData();
  if (loading) return <LoadingScreen label="Loading your skill map..." />;

  const levelOf = (id: ConceptId): MasteryLevel =>
    (mastery.find((m) => m.conceptId === id)?.level ?? 0) as MasteryLevel;

  const pos = (id: ConceptId) => NODES.find((n) => n.id === id)!;

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
            Concepts light up as you master them. Earlier skills unlock the ones
            that build on them.
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
                const lit = levelOf(from) >= 2 && levelOf(to) >= 1;
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
              const level = levelOf(n.id);
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                  <div
                    className={`flex w-24 flex-col items-center gap-1 rounded-card border p-2 text-center transition-transform hover:scale-105 sm:w-32 ${nodeStyle(level)}`}
                  >
                    <span className="text-[10px] font-bold leading-tight sm:text-xs">
                      {CONCEPT_LABELS[n.id]}
                    </span>
                    <span className="text-[9px] font-semibold opacity-80">
                      {MASTERY_LABELS[level]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ink/60">
          <LegendDot className="bg-gradient-to-br from-accent to-violet" label="Mastered" />
          <LegendDot className="bg-accent/40" label="Practicing" />
          <LegendDot className="bg-hint/40" label="Introduced" />
          <LegendDot className="bg-surface-2 border border-white/10" label="Locked" />
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
