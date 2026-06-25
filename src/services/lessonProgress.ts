import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { LessonProgress, LessonProgressUpdate } from "@/types/progress";

/** CRUD for `users/{uid}/lessonProgress/{lessonId}`. */

function progressCollection(uid: string) {
  return collection(getDb(), "users", uid, "lessonProgress");
}

function progressRef(uid: string, lessonId: string) {
  return doc(getDb(), "users", uid, "lessonProgress", lessonId);
}

export async function fetchLessonProgress(
  uid: string,
  lessonId: string
): Promise<LessonProgress | null> {
  const snap = await getDoc(progressRef(uid, lessonId));
  return snap.exists() ? (snap.data() as LessonProgress) : null;
}

export async function fetchAllLessonProgress(
  uid: string
): Promise<LessonProgress[]> {
  const snap = await getDocs(progressCollection(uid));
  return snap.docs.map((d) => d.data() as LessonProgress);
}

/**
 * Creates the progress document for a lesson if it does not exist yet and marks
 * it in_progress. Returns the current progress either way.
 */
export async function ensureLessonProgress(
  uid: string,
  lessonId: string
): Promise<LessonProgress> {
  const ref = progressRef(uid, lessonId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as LessonProgress;
  }

  const fresh = {
    lessonId,
    status: "in_progress" as const,
    currentStepIndex: 0,
    completedStepIds: [] as string[],
    attempts: 0,
    correctCount: 0,
    wrongCount: 0,
    xpEarned: 0,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  };

  await setDoc(ref, fresh);
  const created = await getDoc(ref);
  return created.data() as LessonProgress;
}

/**
 * Merges a partial update into the lesson progress doc and refreshes
 * `updatedAt`. Used to persist step advancement and counters.
 */
export async function saveLessonProgress(
  uid: string,
  lessonId: string,
  update: LessonProgressUpdate
): Promise<void> {
  await setDoc(
    progressRef(uid, lessonId),
    { ...update, lessonId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Marks a lesson completed and stamps `completedAt` server-side. */
export async function markLessonCompleted(
  uid: string,
  lessonId: string,
  data: {
    xpEarned?: number;
    correctCount?: number;
    completedStepIds?: string[];
    score?: number;
    passed?: boolean;
  }
): Promise<void> {
  await setDoc(
    progressRef(uid, lessonId),
    {
      ...data,
      lessonId,
      status: "completed",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
