import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { ConceptId } from "@/types/concepts";
import type { ReviewSchedule } from "@/types/review";

/** CRUD for `users/{uid}/reviewSchedule/{conceptId}` (spaced repetition state). */

function scheduleCollection(uid: string) {
  return collection(getDb(), "users", uid, "reviewSchedule");
}

function scheduleRef(uid: string, conceptId: ConceptId) {
  return doc(getDb(), "users", uid, "reviewSchedule", conceptId);
}

export async function fetchReviewSchedules(uid: string): Promise<ReviewSchedule[]> {
  const snap = await getDocs(scheduleCollection(uid));
  return snap.docs.map((d) => d.data() as ReviewSchedule);
}

export async function saveReviewSchedule(
  uid: string,
  schedule: ReviewSchedule
): Promise<void> {
  await setDoc(scheduleRef(uid, schedule.conceptId), schedule, { merge: true });
}
