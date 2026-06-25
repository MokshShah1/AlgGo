interface DifficultyBadgeProps {
  level: number; // 1-3
}

const META: Record<number, { label: string; color: string; dot: string }> = {
  1: { label: "Warm-up", color: "text-sky", dot: "bg-sky" },
  2: { label: "Building", color: "text-hint", dot: "bg-hint" },
  3: { label: "Challenge", color: "text-violet", dot: "bg-violet" },
};

export function DifficultyBadge({ level }: DifficultyBadgeProps) {
  const meta = META[level] ?? META[1];
  return (
    <span
      key={level}
      className={`flex animate-fade-in items-center gap-1.5 rounded-pill bg-white/5 px-2.5 py-1 text-xs font-semibold ${meta.color}`}
      aria-label={`Difficulty: ${meta.label}`}
    >
      <span className="flex items-center gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i <= level ? meta.dot : "bg-white/15"
            }`}
          />
        ))}
      </span>
      {meta.label}
    </span>
  );
}
