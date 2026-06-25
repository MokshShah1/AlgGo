import {
  addDoc,
  collection,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Attempt, NewAttempt } from "@/types/attempt";

/** CRUD for `users/{uid}/attempts/{attemptId}`. */

function attemptsCollection(uid: string) {
  return collection(getDb(), "users", uid, "attempts");
}

/** Logs a single answer attempt. Returns the new document id. */
export async function logAttempt(
  uid: string,
  attempt: NewAttempt
): Promise<string> {
  const ref = await addDoc(attemptsCollection(uid), {
    ...attempt,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Recent attempts, optionally scoped to a single lesson.
 *
 * When filtering by lesson we avoid combining `where` + `orderBy` on different
 * fields (which would require a composite index) by sorting client-side. The
 * per-user attempt volume in this app is small.
 */
export async function fetchRecentAttempts(
  uid: string,
  options: { lessonId?: string; max?: number } = {}
): Promise<Attempt[]> {
  const { lessonId, max = 50 } = options;
  const base = attemptsCollection(uid);

  if (lessonId) {
    const snap = await getDocs(
      query(base, where("lessonId", "==", lessonId))
    );
    const rows = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Attempt, "id">),
    }));
    return rows
      .sort(
        (a, b) =>
          (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
      )
      .slice(0, max);
  }

  const snap = await getDocs(
    query(base, orderBy("createdAt", "desc"), fbLimit(max))
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Attempt, "id">),
  }));
}
