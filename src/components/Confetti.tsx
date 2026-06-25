import { useMemo } from "react";

const COLORS = ["#5B6CFF", "#8B7CFF", "#15A05A", "#E08A1E", "#36B7E8"];

interface ConfettiProps {
  pieces?: number;
}

/** Lightweight CSS confetti burst - no dependencies. */
export function Confetti({ pieces = 80 }: ConfettiProps) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 2.4 + Math.random() * 1.8;
        const size = 6 + Math.random() * 8;
        const color = COLORS[i % COLORS.length];
        const rounded = Math.random() > 0.5;
        return { id: i, left, delay, duration, size, color, rounded };
      }),
    [pieces]
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size * 1.4}px`,
            backgroundColor: b.color,
            borderRadius: b.rounded ? "999px" : "2px",
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
