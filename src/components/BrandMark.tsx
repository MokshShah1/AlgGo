import { useId } from "react";

/**
 * AlgGo brand mark: a glowing rising line-graph that reads as an "A",
 * capped with data nodes. Rendered as inline SVG so it stays crisp at any
 * size and matches the app icon (public/icon.svg).
 */
export function BrandMark({
  className = "h-7 w-7",
  glow = false,
}: {
  className?: string;
  glow?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const bg = `bm-bg-${uid}`;
  const line = `bm-line-${uid}`;
  const blur = `bm-glow-${uid}`;

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6D7BFF" />
          <stop offset="0.5" stopColor="#9C8CFF" />
          <stop offset="1" stopColor="#46C6F5" />
        </linearGradient>
        <linearGradient id={line} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#C7CCFF" />
          <stop offset="1" stopColor="#9BE8FF" />
        </linearGradient>
        {glow && (
          <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <rect width="48" height="48" rx="13" fill={`url(#${bg})`} />
      <rect x="3.5" y="3.5" width="41" height="41" rx="10" fill="#0B1020" />

      <g filter={glow ? `url(#${blur})` : undefined}>
        <path
          d="M11 37 L22 13 L28 28 L37 13"
          fill="none"
          stroke={`url(#${line})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M18.4 28 L28 28"
        stroke="#FBFAF7"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="11" cy="37" r="2.7" fill="#FBFAF7" />
      <circle cx="37" cy="13" r="2.7" fill="#9BE8FF" />
    </svg>
  );
}
