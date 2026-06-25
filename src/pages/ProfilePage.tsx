import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Check,
  Flame,
  Trophy,
  Star,
  Crown,
  Target,
  Zap,
  Medal,
  Sparkles,
  Palette,
  Lock,
  Settings as SettingsIcon,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CONCEPT_IDS, CONCEPT_LABELS } from "@/types/concepts";
import { MASTERY_LABELS } from "@/types/mastery";
import { course } from "@/content/course";
import { gradientCss, nextLockedAvatar } from "@/features/profile/avatar";
import {
  computeAchievements,
  getLevelInfo,
  type Achievement,
  type BadgeIcon,
} from "@/features/profile/achievements";

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { progress, mastery, loading } = useLearnerData();

  // Refresh on mount so XP / level reflect points earned in practice modes.
  useEffect(() => {
    refreshProfile().catch(() => {});
  }, [refreshProfile]);

  if (loading) return <LoadingScreen label="Loading profile..." />;

  const completedLessons = progress.filter((p) => p.status === "completed");
  const masteredCount = mastery.filter((m) => m.level >= 3).length;
  const totalXp = profile?.totalXp ?? 0;
  const level = getLevelInfo(totalXp);

  const avatarColor = profile?.avatarColor ?? "indigo";
  const avatarEmoji = profile?.avatarEmoji ?? "";

  const persistedAchievements = new Set(profile?.achievements ?? []);
  const achievements = computeAchievements({
    totalXp,
    streakCount: profile?.streakCount ?? 0,
    lessonsCompleted: completedLessons.length,
    totalLessons: course.lessons.length,
    conceptsMastered: masteredCount,
    totalConcepts: CONCEPT_IDS.length,
  }).map((a) =>
    // A badge once earned stays unlocked, even if the underlying stat dips
    // (e.g. weekly XP resets) — merge in the persisted unlock set.
    a.unlocked || persistedAchievements.has(a.id)
      ? { ...a, unlocked: true }
      : a
  );
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const initial = (profile?.displayName || "L").charAt(0).toUpperCase();

  const nextAvatar = nextLockedAvatar(totalXp);
  const xpToNextAvatar = nextAvatar ? Math.max(0, nextAvatar.unlockXp - totalXp) : 0;
  const avatarProgress = nextAvatar
    ? Math.min(100, Math.round((totalXp / nextAvatar.unlockXp) * 100))
    : 100;

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-3xl md:py-8">
        {/* Identity + level */}
        <div className="animate-fade-in-up card flex items-center gap-4 p-5">
          <LevelRing
            percent={level.percent}
            initial={initial}
            gradientCss={gradientCss(avatarColor)}
            emoji={avatarEmoji}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate text-2xl font-bold">
              {profile?.displayName || "Learner"}
            </h1>
            <p className="truncate text-sm text-ink/60">{profile?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-pill bg-gradient-to-br from-accent to-violet px-2.5 py-0.5 text-xs font-bold text-white shadow-soft">
                Lv {level.level}
              </span>
              <span className="text-sm font-semibold text-accent">
                {level.title}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              {level.xpForLevel - level.xpIntoLevel} XP to level {level.level + 1}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Streak" value={`${profile?.streakCount ?? 0}`} delay="stagger-1" />
          <MiniStat label="Total XP" value={`${totalXp}`} delay="stagger-2" />
          <MiniStat label="Lessons" value={`${completedLessons.length}`} delay="stagger-3" />
          <MiniStat label="Mastered" value={`${masteredCount}`} delay="stagger-4" />
        </div>

        {/* Quick links to dedicated pages */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NavCard
            to="/profile/avatar"
            icon={<Palette className="h-5 w-5" aria-hidden="true" />}
            title="Customize avatar"
            description="Pick your color & emoji"
            accent="from-accent to-violet"
            delay="stagger-1"
          />
          <NavCard
            to="/settings"
            icon={<SettingsIcon className="h-5 w-5" aria-hidden="true" />}
            title="Settings"
            description="Theme, contrast & font"
            accent="from-sky to-accent"
            delay="stagger-2"
          />
        </div>

        {/* Next avatar unlock */}
        {nextAvatar && (
          <Link
            to="/profile/avatar"
            className="animate-fade-in-up stagger-2 card flex items-center gap-4 p-4 transition-colors hover:border-ink/15"
          >
            <span
              style={{ backgroundImage: gradientCss(nextAvatar.gradientId) }}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl opacity-50 grayscale shadow-pop"
            >
              <span className="text-2xl">{nextAvatar.emoji}</span>
              <span className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-4 w-4 text-white drop-shadow" aria-hidden="true" />
              </span>
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">Next avatar: {nextAvatar.label}</span>
                <span className="text-xs font-semibold text-accent">
                  {xpToNextAvatar} XP to go
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/10">
                <div
                  className="h-full rounded-pill bg-gradient-to-r from-accent to-violet transition-[width] duration-500"
                  style={{ width: `${avatarProgress}%` }}
                />
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink/30" aria-hidden="true" />
          </Link>
        )}

        {/* Achievements */}
        <section className="animate-fade-in-up stagger-2 card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
              Achievements
            </h2>
            <span className="text-sm font-bold text-accent">
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-white/10">
            <div
              className="progress-fill h-full rounded-pill transition-[width] duration-500"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {achievements.map((a, i) => (
              <BadgeCard key={a.id} achievement={a} index={i} />
            ))}
          </div>
        </section>

        {/* Mastery levels */}
        <section className="animate-fade-in-up stagger-3 card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
            Mastery levels
          </h2>
          {mastery.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">
              No mastery yet - complete a lesson to begin.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {mastery.map((m) => (
                <li
                  key={m.conceptId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink/80">{CONCEPT_LABELS[m.conceptId]}</span>
                  <span
                    className={`font-semibold ${
                      m.level >= 3
                        ? "text-correct"
                        : m.needsReview
                          ? "text-hint"
                          : "text-ink/70"
                    }`}
                  >
                    {MASTERY_LABELS[m.level]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

/** Avatar with a circular XP-progress ring around it. */
function LevelRing({
  percent,
  initial,
  gradientCss,
  emoji,
}: {
  percent: number;
  initial: string;
  gradientCss: string;
  emoji?: string;
}) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5B6CFF" />
            <stop offset="100%" stopColor="#8B7CFF" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div
        style={{ backgroundImage: gradientCss }}
        className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-pop"
      >
        {emoji ? <span className="text-2xl">{emoji}</span> : initial}
      </div>
    </div>
  );
}

function NavCard({
  to,
  icon,
  title,
  description,
  accent,
  delay,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  accent: string;
  delay?: string;
}) {
  return (
    <motion.div
      className={`animate-fade-in-up ${delay ?? ""}`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={to}
        className="card flex items-center gap-3 p-4 transition-colors hover:border-ink/15"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-soft`}
        >
          {icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-bold">{title}</span>
          <span className="text-xs text-ink/55">{description}</span>
        </span>
        <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-ink/30" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}

function MiniStat({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay?: string;
}) {
  return (
    <div className={`card animate-fade-in-up ${delay ?? ""} p-3 text-center`}>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-ink/60">{label}</div>
    </div>
  );
}

function BadgeCard({
  achievement,
  index,
}: {
  achievement: Achievement;
  index: number;
}) {
  const { unlocked, title, description, icon, progress } = achievement;
  return (
    <div
      className={`animate-fade-in-up relative flex flex-col items-center gap-2 rounded-card border p-3 text-center transition-transform ${
        unlocked
          ? "border-transparent bg-gradient-to-br from-accent/15 to-violet/15 shadow-soft hover:-translate-y-0.5"
          : "border-white/5 bg-surface-2/60"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full ${
          unlocked
            ? "bg-gradient-to-br from-accent to-violet text-white shadow-pop"
            : "bg-white/5 text-ink/30"
        }`}
      >
        <BadgeGlyph icon={icon} />
      </div>
      <div className="flex flex-col">
        <span
          className={`text-xs font-bold leading-tight ${
            unlocked ? "text-ink" : "text-ink/50"
          }`}
        >
          {title}
        </span>
        <span className="mt-0.5 text-[10px] leading-tight text-ink/45">
          {description}
        </span>
      </div>
      {!unlocked && progress && progress.target > 1 && (
        <span className="text-[10px] font-semibold text-ink/40">
          {progress.current}/{progress.target}
        </span>
      )}
      {unlocked && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-correct text-white shadow-soft">
          <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

const BADGE_GLYPHS: Record<BadgeIcon, typeof Flame> = {
  fire: Flame,
  trophy: Trophy,
  star: Star,
  crown: Crown,
  target: Target,
  bolt: Zap,
  medal: Medal,
  spark: Sparkles,
};

function BadgeGlyph({ icon }: { icon: BadgeIcon }) {
  const Icon = BADGE_GLYPHS[icon] ?? Sparkles;
  return <Icon className="h-5 w-5" aria-hidden="true" />;
}
