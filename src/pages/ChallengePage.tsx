import { useMemo, useState } from "react";
import { QuizSession } from "@/features/quiz/QuizSession";
import { buildPool } from "@/features/quiz/pool";

const QUESTION_COUNT = 6;

export function ChallengePage() {
  const pool = useMemo(buildPool, []);
  const [round, setRound] = useState(0);

  return (
    <QuizSession
      key={round}
      title="Challenge"
      badge="Challenge"
      pool={pool}
      count={QUESTION_COUNT}
      adaptive
      onRestart={() => setRound((r) => r + 1)}
    />
  );
}
