/**
 * Achievements + XP leveling, derived purely from the learner's existing data
 * (XP, streak, completed lessons, mastered concepts). No backend changes.
 */

export interface LevelInfo {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForLevel: number;
  /** 0-100 progress toward the next level. */
  percent: number;
  totalXp: number;
}

const XP_PER_LEVEL = 100;

const LEVEL_TITLES = [
  "Beginner", // 1
  "Explorer", // 2
  "Apprentice", // 3
  "Slope Scout", // 4
  "Line Rider", // 5
  "Graph Guru", // 6
  "Slope Master", // 7+
];

export function getLevelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  return {
    level,
    title,
    xpIntoLevel,
    xpForLevel: XP_PER_LEVEL,
    percent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
    totalXp: xp,
  };
}

export interface AchievementContext {
  totalXp: number;
  streakCount: number;
  lessonsCompleted: number;
  totalLessons: number;
  conceptsMastered: number;
  totalConcepts: number;
}

export type BadgeIcon =
  | "spark"
  | "fire"
  | "trophy"
  | "star"
  | "crown"
  | "target"
  | "bolt"
  | "medal";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: BadgeIcon;
  unlocked: boolean;
  /** Optional progress toward unlocking (for the locked state). */
  progress?: { current: number; target: number };
}

export function computeAchievements(ctx: AchievementContext): Achievement[] {
  const defs: Array<Omit<Achievement, "unlocked"> & { target: number; current: number }> = [
    {
      id: "first-lesson",
      title: "First Steps",
      description: "Finish your first lesson",
      icon: "spark",
      current: ctx.lessonsCompleted,
      target: 1,
    },
    {
      id: "three-lessons",
      title: "On a Roll",
      description: "Complete 3 lessons",
      icon: "bolt",
      current: ctx.lessonsCompleted,
      target: 3,
    },
    {
      id: "all-lessons",
      title: "Chapter Champion",
      description: "Complete every lesson in the chapter",
      icon: "trophy",
      current: ctx.lessonsCompleted,
      target: ctx.totalLessons,
    },
    {
      id: "xp-100",
      title: "Century",
      description: "Earn 100 XP",
      icon: "star",
      current: ctx.totalXp,
      target: 100,
    },
    {
      id: "xp-500",
      title: "XP Machine",
      description: "Earn 500 XP",
      icon: "medal",
      current: ctx.totalXp,
      target: 500,
    },
    {
      id: "streak-3",
      title: "Warming Up",
      description: "Reach a 3-day streak",
      icon: "fire",
      current: ctx.streakCount,
      target: 3,
    },
    {
      id: "streak-7",
      title: "Unstoppable",
      description: "Reach a 7-day streak",
      icon: "fire",
      current: ctx.streakCount,
      target: 7,
    },
    {
      id: "first-mastery",
      title: "Concept Cracked",
      description: "Master your first concept",
      icon: "target",
      current: ctx.conceptsMastered,
      target: 1,
    },
    {
      id: "all-mastery",
      title: "Grand Master",
      description: "Master every concept",
      icon: "crown",
      current: ctx.conceptsMastered,
      target: Math.max(1, ctx.totalConcepts),
    },
  ];

  return defs.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    icon: d.icon,
    unlocked: d.current >= d.target,
    progress: { current: Math.min(d.current, d.target), target: d.target },
  }));
}

/**
 * Achievement IDs that are now unlocked but are NOT yet in the persisted set.
 * Used to fire a one-time "unlocked!" celebration and persist the unlock.
 */
export function newlyUnlockedAchievements(
  computed: Achievement[],
  persisted: string[] | undefined
): Achievement[] {
  const known = new Set(persisted ?? []);
  return computed.filter((a) => a.unlocked && !known.has(a.id));
}
