import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLesson } from "@/content/course";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { ensureLessonProgress } from "@/services/lessonProgress";
import { isLessonUnlocked } from "@/features/course/progression";
import { LessonPlayer } from "@/features/lesson/LessonPlayer";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { LessonProgress } from "@/types/progress";

export function LessonPage() {
  const { lessonId = "" } = useParams();
  const { user, profile } = useAuth();
  const { progress: progressList, loading: dataLoading } = useLearnerData();
  const lesson = getLesson(lessonId);

  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const playable = lesson?.availability === "playable";
  const unlocked =
    !!lesson && isLessonUnlocked(lesson.id, progressList, profile);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user || !lesson || !playable || dataLoading || !unlocked) {
        if (!dataLoading) setLoading(false);
        return;
      }
      const p = await ensureLessonProgress(user.uid, lesson.id);
      if (active) {
        setProgress(p);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user, lesson, playable, dataLoading, unlocked]);

  if (!lesson) {
    return (
      <CenteredCard
        title="Lesson not found"
        body="We couldn't find that lesson."
      />
    );
  }

  if (!playable) {
    return (
      <CenteredCard
        title={lesson.title}
        body="This lesson is coming soon."
      />
    );
  }

  if (dataLoading) {
    return <LoadingScreen label="Loading lesson..." />;
  }

  if (!unlocked) {
    return (
      <CenteredCard
        title="Lesson locked"
        body="Finish and pass the earlier lessons first - that way each new idea builds on the last. You can always revisit lessons you've unlocked."
      />
    );
  }

  if (loading || !progress) {
    return <LoadingScreen label="Loading lesson..." />;
  }

  const alreadyCompleted = progress.status === "completed";
  const total = lesson.solvables.length;
  const initialStepIndex = alreadyCompleted
    ? 0
    : Math.min(progress.currentStepIndex ?? 0, total - 1);

  return (
    <LessonPlayer
      key={lesson.id}
      lesson={lesson}
      initialStepIndex={initialStepIndex}
      initialCompletedStepIds={progress.completedStepIds ?? []}
      initialCounts={{
        correctCount: progress.correctCount ?? 0,
        wrongCount: progress.wrongCount ?? 0,
        xpEarned: progress.xpEarned ?? 0,
      }}
      alreadyCompleted={alreadyCompleted}
    />
  );
}

function CenteredCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-5 text-ink">
      <div className="card flex max-w-sm flex-col gap-4 p-6 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-ink/70">{body}</p>
        <div className="flex justify-center gap-3">
          <Link
            to="/course"
            className="rounded-card border border-white/15 px-5 py-2.5 text-sm font-semibold"
          >
            Course map
          </Link>
          <Link
            to="/dashboard"
            className="rounded-card bg-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
