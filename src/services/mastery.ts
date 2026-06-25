import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { ConceptId } from "@/types/concepts";
import type { MasteryRecord, MasteryUpdate } from "@/types/mastery";

/** CRUD for `users/{uid}/mastery/{conceptId}`. */

function masteryCollection(uid: string) {
  return collection(getDb(), "users", uid, "mastery");
}

function masteryRef(uid: string, conceptId: ConceptId) {
  return doc(getDb(), "users", uid, "mastery", conceptId);
}

export async function fetchMastery(
  uid: string,
  conceptId: ConceptId
): Promise<MasteryRecord | null> {
  const snap = await getDoc(masteryRef(uid, conceptId));
  return snap.exists() ? (snap.data() as MasteryRecord) : null;
}

export async function fetchAllMastery(uid: string): Promise<MasteryRecord[]> {
  const snap = await getDocs(masteryCollection(uid));
  return snap.docs.map((d) => d.data() as MasteryRecord);
}

/**
 * Creates or merges a mastery record and refreshes `lastPracticedAt`.
 * Mastery scoring rules (evidence, levels) are applied by the caller in the
 * scoring milestone; this is the persistence primitive.
 */
export async function saveMastery(
  uid: string,
  conceptId: ConceptId,
  update: MasteryUpdate
): Promise<void> {
  await setDoc(
    masteryRef(uid, conceptId),
    { ...update, conceptId, lastPracticedAt: serverTimestamp() },
    { merge: true }
  );
}
