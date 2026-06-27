import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ScrollText, Sparkles } from "lucide-react";
import { aiAvailable, aiRecap } from "@/lib/ai";
import { AI_NAME } from "@/lib/aiPersona";

interface RecapCardProps {
  lessonTitle: string;
  score?: number;
  mastered: string[];
  toReview: string[];
}

/**
 * A personalized end-of-lesson recap written by the AI: what the learner nailed
 * and what to review. Renders nothing if the AI proxy isn't available.
 */
export function RecapCard({ lessonTitle, score, mastered, toReview }: RecapCardProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!(await aiAvailable())) {
        if (active) setHidden(true);
        return;
      }
      try {
        const reply = await aiRecap({ lessonTitle, score, mastered, toReview });
        if (active) setText(reply);
      } catch {
        if (active) setHidden(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hidden) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden p-5 text-left"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet/10 blur-2xl" />
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-accent text-white shadow-soft">
          <ScrollText className="h-4 w-4" />
        </span>
        <span className="text-xs font-bold tracking-wide text-ink">
          {AI_NAME}
          <span className="ml-1.5 font-semibold uppercase text-ink/45">recap</span>
        </span>
        <Sparkles className="h-3.5 w-3.5 text-violet" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="h-3.5 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-white/10" />
          <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-ink/85">{text}</p>
      )}
    </motion.div>
  );
}
