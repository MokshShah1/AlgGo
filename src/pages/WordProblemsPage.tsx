import { useMemo, useState } from "react";
import { QuizSession } from "@/features/quiz/QuizSession";
import { generateWordProblems } from "@/features/practice/wordProblems";

const COUNT = 6;

export function WordProblemsPage() {
  const [round, setRound] = useState(0);
  const questions = useMemo(
    () => generateWordProblems(COUNT),
    // New random set each round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round]
  );

  return (
    <QuizSession
      key={round}
      title="Word Problems"
      badge="Real-world"
      questions={questions}
      exitTo="/practice"
      onRestart={() => setRound((r) => r + 1)}
    />
  );
}
