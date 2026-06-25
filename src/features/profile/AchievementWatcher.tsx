import { useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { useToast } from "@/components/Toast";
import {
  computeAchievements,
  newlyUnlockedAchievements,
} from "@/features/profile/achievements";
import { unlockAchievements } from "@/services/users";
import { playComplete } from "@/lib/sfx";
import { course } from "@/content/course";
import { CONCEPT_IDS } from "@/types/concepts";

/**
 * Headless watcher that detects achievements the learner has newly satisfied
 * (relative to what's persisted on their profile), fires a celebration toast +
 * sound, and persists the unlock so it stays unlocked across sessions/devices.
 */
export function AchievementWatcher() {
  const { user, profile, refreshProfile } = useAuth();
  const { progress, mastery, loading } = useLearnerData();
  const { showToast } = useToast();

  // IDs we've already celebrated/persisted this session, to avoid duplicate
  // toasts/writes while the profile refresh is in flight.
  const handledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !profile || loading) return;

    const lessonsCompleted = progress.filter(
      (p) => p.status === "completed"
    ).length;
    const conceptsMastered = mastery.filter((m) => m.level >= 3).length;

    const computed = computeAchievements({
      totalXp: profile.totalXp ?? 0,
      streakCount: profile.streakCount ?? 0,
      lessonsCompleted,
      totalLessons: course.lessons.length,
      conceptsMastered,
      totalConcepts: CONCEPT_IDS.length,
    });

    const fresh = newlyUnlockedAchievements(computed, profile.achievements).filter(
      (a) => !handledRef.current.has(a.id)
    );
    if (fresh.length === 0) return;

    for (const a of fresh) {
      handledRef.current.add(a.id);
      showToast({
        title: "Achievement unlocked!",
        description: a.title,
        icon: <Trophy className="h-4 w-4" aria-hidden="true" />,
      });
    }
    playComplete();

    const ids = fresh.map((a) => a.id);
    unlockAchievements(user.uid, ids)
      .then(() => refreshProfile())
      .catch(() => {
        /* non-fatal: it'll retry next time the data changes */
      });
  }, [user, profile, progress, mastery, loading, showToast, refreshProfile]);

  return null;
}
