import { course } from "@/content/course";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { recommend } from "@/features/scoring/recommend";
import { getLessonDisplay } from "@/features/course/lessonDisplay";
import { unlockedThroughIndex } from "@/features/course/progression";
import { LessonPathCard } from "@/features/course/LessonPathCard";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";

export function CoursePage() {
  const { profile } = useAuth();
  const { progress, mastery, loading } = useLearnerData();

  if (loading) return <LoadingScreen label="Loading course..." />;

  const recommendation = recommend(progress, mastery, profile);
  const frontier = unlockedThroughIndex(progress, profile);

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-4xl md:py-8">
        <div className="animate-fade-in-up flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            {course.subtitle}
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">{course.title}</h1>
          <p className="text-sm text-ink/70">
            Work through the chapter one idea at a time.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {course.lessons.map((lesson, i) => (
            <div
              key={lesson.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              <LessonPathCard
                lesson={lesson}
                display={getLessonDisplay(
                  lesson,
                  progress,
                  recommendation.lessonId,
                  i > frontier
                )}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
