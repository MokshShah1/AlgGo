import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Check, Lock, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/features/auth/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { updateUserProfile } from "@/services/users";
import {
  AVATARS,
  gradientCss,
  isAvatarUnlocked,
  nextLockedAvatar,
  type Avatar,
} from "@/features/profile/avatar";

export function CustomizeAvatarPage() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [savingId, setSavingId] = useState<string | null>(null);

  const totalXp = profile?.totalXp ?? 0;
  const avatarColor = profile?.avatarColor ?? "indigo";
  const avatarEmoji = profile?.avatarEmoji ?? "";
  const initial = (profile?.displayName || "L").charAt(0).toUpperCase();

  const nextLocked = nextLockedAvatar(totalXp);
  const xpToNext = nextLocked ? Math.max(0, nextLocked.unlockXp - totalXp) : 0;

  async function selectAvatar(avatar: Avatar) {
    if (!user || !isAvatarUnlocked(avatar, totalXp)) return;
    setSavingId(avatar.id);
    try {
      await updateUserProfile(user.uid, {
        avatarColor: avatar.gradientId,
        avatarEmoji: avatar.emoji,
      });
      await refreshProfile();
    } catch {
      /* non-fatal */
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-2xl md:py-8">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to profile
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Avatar gallery</h1>
          {savingId && <span className="text-xs text-ink/40">Saving...</span>}
        </div>

        {/* Live preview */}
        <div className="animate-fade-in-up card flex flex-col items-center gap-3 p-6">
          <motion.div
            key={`${avatarColor}-${avatarEmoji}`}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            style={{ backgroundImage: gradientCss(avatarColor) }}
            className="flex h-24 w-24 items-center justify-center rounded-full text-4xl font-extrabold text-white shadow-pop"
          >
            {avatarEmoji ? <span className="text-4xl">{avatarEmoji}</span> : initial}
          </motion.div>

          <div className="flex items-center gap-2 rounded-pill bg-surface-2 px-3 py-1">
            <Zap className="h-4 w-4 text-hint" aria-hidden="true" />
            <span className="text-sm font-bold">{totalXp} XP</span>
          </div>

          {nextLocked ? (
            <p className="text-center text-sm text-ink/55">
              Next unlock:{" "}
              <span className="font-semibold text-ink/80">
                {nextLocked.emoji} {nextLocked.label}
              </span>{" "}
              — {xpToNext} XP to go
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-center text-sm font-semibold text-accent">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Every avatar unlocked. Legend!
            </p>
          )}
        </div>

        {/* Avatar gallery */}
        <section className="animate-fade-in-up stagger-1 card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
            Unlockable avatars
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {AVATARS.map((avatar, i) => (
              <AvatarTile
                key={avatar.id}
                avatar={avatar}
                index={i}
                totalXp={totalXp}
                selected={
                  avatar.gradientId === avatarColor && avatar.emoji === avatarEmoji
                }
                onSelect={() => selectAvatar(avatar)}
              />
            ))}
          </div>
        </section>

        <Link to="/profile" className="btn-primary mt-1 w-full justify-center">
          Done
        </Link>
      </main>
    </div>
  );
}

function AvatarTile({
  avatar,
  index,
  totalXp,
  selected,
  onSelect,
}: {
  avatar: Avatar;
  index: number;
  totalXp: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const unlocked = isAvatarUnlocked(avatar, totalXp);
  const progress = Math.min(100, Math.round((totalXp / avatar.unlockXp) * 100));

  return (
    <motion.button
      type="button"
      disabled={!unlocked}
      onClick={onSelect}
      whileTap={unlocked ? { scale: 0.92 } : undefined}
      whileHover={unlocked ? { y: -3 } : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      aria-label={
        unlocked
          ? `Select avatar ${avatar.label}`
          : `${avatar.label} locked, reach ${avatar.unlockXp} XP`
      }
      className={`relative flex flex-col items-center gap-2 rounded-card border p-3 text-center transition-colors ${
        selected
          ? "border-accent bg-accent/10 shadow-soft"
          : unlocked
            ? "border-white/5 bg-surface-2/60 hover:border-ink/15"
            : "cursor-not-allowed border-white/5 bg-surface-2/40"
      }`}
    >
      <div className="relative">
        <div
          style={{ backgroundImage: gradientCss(avatar.gradientId) }}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-pop transition ${
            unlocked ? "" : "opacity-40 grayscale"
          }`}
        >
          <span className="text-2xl">{avatar.emoji}</span>
        </div>

        {!unlocked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-5 w-5 text-white drop-shadow" aria-hidden="true" />
          </span>
        )}

        {selected && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-correct text-white shadow-soft">
            <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">
          Tier {avatar.tier}
        </span>
        <span
          className={`text-xs font-bold leading-tight ${
            unlocked ? "text-ink" : "text-ink/50"
          }`}
        >
          {avatar.label}
        </span>
      </div>

      {unlocked ? (
        <span className="text-[10px] font-semibold text-correct">
          {avatar.unlockXp === 0 ? "Starter" : "Unlocked"}
        </span>
      ) : (
        <div className="flex w-full flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-ink/45">
            Reach {avatar.unlockXp} XP
          </span>
          <div className="h-1 w-full overflow-hidden rounded-pill bg-white/10">
            <div
              className="h-full rounded-pill bg-gradient-to-r from-accent to-violet transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </motion.button>
  );
}
