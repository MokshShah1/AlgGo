import { useMemo, useState } from "react";
import { QuizSession } from "@/features/quiz/QuizSession";
import { buildPool } from "@/features/quiz/pool";

const SPEED_SECONDS = 60;

export function SpeedRoundPage() {
  const pool = useMemo(buildPool, []);
  const [round, setRound] = useState(0);

  return (
    <QuizSession
      key={round}
      title="Speed Round"
      badge="Speed"
      pool={pool}
      adaptive
      timedSeconds={SPEED_SECONDS}
      combo
      onRestart={() => setRound((r) => r + 1)}
    />
  );
}
