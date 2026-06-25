import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  CalendarDays,
  Timer,
  Swords,
  Brain,
  NotebookPen,
  Calculator,
  SlidersHorizontal,
  LineChart,
  type LucideIcon,
} from "lucide-react";

type Glyph =
  | "daily"
  | "speed"
  | "challenge"
  | "review"
  | "mistakes"
  | "word"
  | "sandbox"
  | "progress";

interface HubItem {
  to: string;
  title: string;
  description: string;
  glyph: Glyph;
  accent: string;
  /** Optional secondary link rendered inside the card (avoids nested anchors). */
  secondary?: { to: string; label: string };
}

const ITEMS: HubItem[] = [
  {
    to: "/daily",
    title: "Daily Challenge",
    description: "5 fixed questions for bonus XP, once a day",
    glyph: "daily",
    accent: "from-accent to-violet",
  },
  {
    to: "/speed",
    title: "Speed Round",
    description: "Beat the clock — a 60-second timed combo",
    glyph: "speed",
    accent: "from-hint to-danger",
  },
  {
    to: "/smart-review",
    title: "Smart Review",
    description: "Spaced practice on your weak spots",
    glyph: "review",
    accent: "from-violet to-sky",
  },
  {
    to: "/mistakes",
    title: "Mistake Notebook",
    description: "Redo the questions you've missed",
    glyph: "mistakes",
    accent: "from-danger to-hint",
  },
  {
    to: "/word-problems",
    title: "Word Problems",
    description: "Real-world slope scenarios",
    glyph: "word",
    accent: "from-correct to-sky",
  },
  {
    to: "/challenge",
    title: "Challenge",
    description: "Adaptive mixed review that ramps to your level",
    glyph: "challenge",
    accent: "from-sky to-accent",
  },
  {
    to: "/recap",
    title: "Progress",
    description: "Your weekly recap, mastery & streaks",
    glyph: "progress",
    accent: "from-sky to-violet",
    secondary: { to: "/skills", label: "Skill map" },
  },
  {
    to: "/sandbox",
    title: "Playground",
    description: "Free explore tool for y = mx + b",
    glyph: "sandbox",
    accent: "from-accent to-sky",
  },
];

export function PracticeHub() {
  return (
    <section className="animate-fade-in-up">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ITEMS.map((item, i) => (
          <HubCard key={item.to} item={item} delay={i * 0.03} />
        ))}
      </div>
    </section>
  );
}

function HubCard({ item, delay }: { item: HubItem; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="card flex h-full flex-col gap-2 p-4"
    >
      <Link to={item.to} className="flex flex-col gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-soft`}
        >
          <HubGlyph glyph={item.glyph} />
        </span>
        <span className="text-sm font-bold leading-tight">{item.title}</span>
        <span className="text-xs text-ink/55">{item.description}</span>
      </Link>
      {item.secondary && (
        <Link
          to={item.secondary.to}
          className="mt-auto inline-flex w-fit items-center gap-1 pt-1 text-xs font-semibold text-accent hover:underline"
        >
          {item.secondary.label} &rarr;
        </Link>
      )}
    </motion.div>
  );
}

const GLYPHS: Record<Glyph, LucideIcon> = {
  daily: CalendarDays,
  speed: Timer,
  challenge: Swords,
  review: Brain,
  mistakes: NotebookPen,
  word: Calculator,
  sandbox: SlidersHorizontal,
  progress: LineChart,
};

function HubGlyph({ glyph }: { glyph: Glyph }) {
  const Icon = GLYPHS[glyph];
  return <Icon className="h-5 w-5" aria-hidden="true" />;
}
