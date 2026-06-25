/**
 * Seed a populated demo account (and a few "competitor" accounts) so the app
 * looks alive on camera: XP, level, streak, achievements, lesson progress,
 * mastery, and a leaderboard with real competition.
 *
 * Usage:
 *   npm run seed:demo                       # uses defaults below
 *   npm run seed:demo -- you@email.com Pass1234! "Your Name"
 *
 * It uses the normal Firebase Web SDK and signs in as each account, so it works
 * within your existing security rules (each user writes only its own docs).
 * The "competitor" accounts are real logins created so the leaderboard shows
 * more than just you — only their own leaderboard/profile docs are written.
 *
 * Reads Firebase config from .env (the same VITE_FIREBASE_* values the app uses).
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---- key helpers (kept in sync with src/lib/week.ts + scoring/streak.ts) ----
function currentWeekKey(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week =
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---- load .env ----
function loadEnv() {
  const text = readFileSync(join(ROOT, ".env"), "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Missing Firebase config in .env (VITE_FIREBASE_*).");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const WEEK = currentWeekKey();
const TODAY = localDateKey();

// ---- hero (the account you'll log into for the demo) ----
const [, , argEmail, argPass, ...argName] = process.argv;
const HERO = {
  email: argEmail || "demo@alggo.app",
  password: argPass || "AlgGoDemo123!",
  displayName: (argName.join(" ") || "Demo Student").trim(),
};

const LESSONS_IN_ORDER = [
  "constant-rate-change",
  "slope-rise-run",
  "slope-from-two-points",
  "positive-negative-slope",
  "y-intercept",
  "slope-intercept-form",
  "proportional-relationships",
  "match-representations",
  "real-world-lines",
];

async function ensureAccount(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, created: true };
  } catch (err) {
    if (err?.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { uid: cred.user.uid, created: false };
    }
    throw err;
  }
}

async function seedHero() {
  const { uid, created } = await ensureAccount(HERO.email, HERO.password);
  console.log(`Hero ${created ? "created" : "updated"}: ${HERO.email} (${uid})`);

  const totalXp = 540;
  const weeklyXp = 180;
  const achievements = [
    "first-lesson",
    "three-lessons",
    "xp-100",
    "xp-500",
    "streak-3",
    "streak-7",
    "first-mastery",
  ];

  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      displayName: HERO.displayName,
      email: HERO.email,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      onboardingComplete: true,
      comfortLevel: "confusing",
      placementDone: true,
      placementScore: 62,
      totalXp,
      weeklyXp,
      weekKey: WEEK,
      streakCount: 12,
      streakCharges: 2,
      lastStreakDate: TODAY,
      dailySolveDate: TODAY,
      dailySolveCount: 3,
      dailyGoal: 3,
      avatarColor: "ocean",
      avatarEmoji: "🚀",
      leaderboardOptIn: true,
      theme: "dark",
      soundEnabled: true,
      achievements,
    },
    { merge: true }
  );

  // Lessons 1-4 passed, lesson 5 in progress -> unlocks through lesson 5,
  // leaving 6-9 locked (great for the "can't skip ahead" beat).
  const passedScores = [96, 92, 88, 90];
  for (let i = 0; i < 4; i++) {
    const lessonId = LESSONS_IN_ORDER[i];
    await setDoc(doc(db, "users", uid, "lessonProgress", lessonId), {
      lessonId,
      status: "completed",
      passed: true,
      score: passedScores[i],
      currentStepIndex: 0,
      completedStepIds: [],
      attempts: 12 + i,
      correctCount: 11 + i,
      wrongCount: 1,
      xpEarned: 75 + i * 5,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    });
  }
  await setDoc(doc(db, "users", uid, "lessonProgress", LESSONS_IN_ORDER[4]), {
    lessonId: LESSONS_IN_ORDER[4],
    status: "in_progress",
    currentStepIndex: 3,
    completedStepIds: [],
    attempts: 4,
    correctCount: 3,
    wrongCount: 1,
    xpEarned: 15,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });

  // Mastery: 5 concepts mastered, 2 still practicing (5/7 on the summary).
  const masteryLevels = {
    "constant-rate": 3,
    rise: 3,
    run: 3,
    "slope-ratio": 3,
    "positive-slope": 3,
    "negative-slope": 2,
    "constant-slope": 2,
  };
  for (const [conceptId, level] of Object.entries(masteryLevels)) {
    await setDoc(doc(db, "users", uid, "mastery", conceptId), {
      conceptId,
      level,
      evidenceCount: level >= 3 ? 6 : 3,
      misconceptions: [],
      needsReview: false,
      lastPracticedAt: serverTimestamp(),
    });
  }

  await setDoc(doc(db, "leaderboard", uid), {
    uid,
    displayName: HERO.displayName,
    weeklyXp,
    totalXp,
    avatarColor: "ocean",
    avatarEmoji: "🚀",
    weekKey: WEEK,
    updatedAt: serverTimestamp(),
  });

  await signOut(auth);
}

const BOTS = [
  { name: "Ava R.", weeklyXp: 260, totalXp: 1320, color: "berry", emoji: "🦊" },
  { name: "Liam K.", weeklyXp: 215, totalXp: 980, color: "ocean", emoji: "🚀" },
  { name: "Maya S.", weeklyXp: 150, totalXp: 760, color: "gold", emoji: "⭐" },
  { name: "Noah P.", weeklyXp: 120, totalXp: 640, color: "forest", emoji: "🌱" },
  { name: "Zoe T.", weeklyXp: 90, totalXp: 410, color: "sunset", emoji: "🎯" },
  { name: "Eli M.", weeklyXp: 60, totalXp: 250, color: "mint", emoji: "🧠" },
];

async function seedBot(i, bot) {
  const email = `leader${i + 1}@alggo.demo`;
  const { uid, created } = await ensureAccount(email, "AlgGoBot123!");
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      displayName: bot.name,
      email,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      onboardingComplete: true,
      comfortLevel: "confusing",
      totalXp: bot.totalXp,
      weeklyXp: bot.weeklyXp,
      weekKey: WEEK,
      avatarColor: bot.color,
      avatarEmoji: bot.emoji,
      leaderboardOptIn: true,
    },
    { merge: true }
  );
  await setDoc(doc(db, "leaderboard", uid), {
    uid,
    displayName: bot.name,
    weeklyXp: bot.weeklyXp,
    totalXp: bot.totalXp,
    avatarColor: bot.color,
    avatarEmoji: bot.emoji,
    weekKey: WEEK,
    updatedAt: serverTimestamp(),
  });
  await signOut(auth);
  console.log(`  competitor: ${bot.name} (${created ? "new" : "updated"})`);
}

async function main() {
  console.log(`Seeding demo data for week ${WEEK}…`);
  await seedHero();
  console.log("Seeding leaderboard competitors…");
  for (let i = 0; i < BOTS.length; i++) {
    await seedBot(i, BOTS[i]);
  }
  console.log("\nDone. Log in with:");
  console.log(`  email:    ${HERO.email}`);
  console.log(`  password: ${HERO.password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("seed-demo failed:", err);
  process.exit(1);
});
