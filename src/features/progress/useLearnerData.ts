import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchAllLessonProgress } from "@/services/lessonProgress";
import { fetchAllMastery } from "@/services/mastery";
import type { LessonProgress } from "@/types/progress";
import type { MasteryRecord } from "@/types/mastery";

/** Loads the signed-in learner's lesson progress and mastery records. */
export function useLearnerData() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [mastery, setMastery] = useState<MasteryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const [p, m] = await Promise.all([
        fetchAllLessonProgress(user.uid),
        fetchAllMastery(user.uid),
      ]);
      if (active) {
        setProgress(p);
        setMastery(m);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  return { progress, mastery, loading };
}
