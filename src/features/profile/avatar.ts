/** Avatar personalization options (gradient color + optional emoji). */

export interface AvatarGradient {
  id: string;
  /** Tailwind gradient classes (kept for places that still use utilities). */
  className: string;
  /** Concrete CSS gradient so the color always renders, purge-proof. */
  css: string;
}

export const AVATAR_GRADIENTS: AvatarGradient[] = [
  { id: "indigo", className: "from-accent to-violet", css: "linear-gradient(135deg, #6D7BFF, #9C8CFF)" },
  { id: "sunset", className: "from-hint to-danger", css: "linear-gradient(135deg, #F0A33C, #F2554B)" },
  { id: "ocean", className: "from-sky to-accent", css: "linear-gradient(135deg, #46C6F5, #6D7BFF)" },
  { id: "forest", className: "from-correct to-sky", css: "linear-gradient(135deg, #2BC172, #46C6F5)" },
  { id: "berry", className: "from-violet to-danger", css: "linear-gradient(135deg, #9C8CFF, #F2554B)" },
  { id: "mint", className: "from-correct to-violet", css: "linear-gradient(135deg, #2BC172, #9C8CFF)" },
  { id: "gold", className: "from-hint to-violet", css: "linear-gradient(135deg, #F6C552, #9C8CFF)" },
  { id: "rose", className: "from-danger to-violet", css: "linear-gradient(135deg, #FF6B9D, #9C8CFF)" },
  // Higher-tier "cooler" gradients unlocked through XP. New ids only — existing
  // ids above are never renamed/removed so saved profiles keep rendering.
  { id: "ember", className: "from-danger to-hint", css: "linear-gradient(135deg, #FF6B3D, #F6C552)" },
  { id: "royal", className: "from-violet to-accent", css: "linear-gradient(135deg, #7B2FF7, #5B6CFF)" },
  { id: "aurora", className: "from-correct to-sky", css: "linear-gradient(135deg, #2BC172, #46C6F5, #9C8CFF)" },
  { id: "nebula", className: "from-violet to-danger", css: "linear-gradient(135deg, #5B6CFF, #B14BFF, #FF6B9D)" },
  { id: "cosmic", className: "from-accent to-violet", css: "linear-gradient(135deg, #0F2A6B, #5B6CFF, #B14BFF)" },
  { id: "stardust", className: "from-hint to-violet", css: "linear-gradient(135deg, #F6C552, #FF6B9D, #B14BFF, #5B6CFF)" },
];

export const AVATAR_EMOJIS = ["", "📈", "🎯", "🚀", "🧠", "🦊", "⭐", "🔥", "🌱"];

/** A curated avatar that unlocks once the learner reaches `unlockXp`. */
export interface Avatar {
  id: string;
  label: string;
  emoji: string;
  /** References an id in AVATAR_GRADIENTS. */
  gradientId: string;
  tier: number;
  unlockXp: number;
}

/**
 * Curated, ordered-by-XP avatar progression. Higher tiers pair fancier
 * gradients with cooler symbols to make leveling up feel rewarding.
 */
export const AVATARS: Avatar[] = [
  { id: "sprout", label: "Sprout", emoji: "🌱", gradientId: "forest", tier: 1, unlockXp: 0 },
  { id: "star", label: "Rising Star", emoji: "⭐", gradientId: "gold", tier: 2, unlockXp: 50 },
  { id: "fox", label: "Clever Fox", emoji: "🦊", gradientId: "sunset", tier: 3, unlockXp: 150 },
  { id: "tiger", label: "Fierce Tiger", emoji: "🐯", gradientId: "ember", tier: 4, unlockXp: 300 },
  { id: "rocket", label: "Trailblazer", emoji: "🚀", gradientId: "ocean", tier: 5, unlockXp: 500 },
  { id: "dragon", label: "Dragon", emoji: "🐉", gradientId: "berry", tier: 6, unlockXp: 800 },
  { id: "crown", label: "Sovereign", emoji: "👑", gradientId: "royal", tier: 7, unlockXp: 1200 },
  { id: "ufo", label: "Voyager", emoji: "🛸", gradientId: "aurora", tier: 8, unlockXp: 1800 },
  { id: "galaxy", label: "Galaxy", emoji: "🌌", gradientId: "nebula", tier: 9, unlockXp: 2500 },
  { id: "comet", label: "Cosmic Legend", emoji: "☄️", gradientId: "cosmic", tier: 10, unlockXp: 3500 },
  { id: "sparkle", label: "Stardust", emoji: "✨", gradientId: "stardust", tier: 11, unlockXp: 5000 },
];

function find(id: string | undefined): AvatarGradient {
  return AVATAR_GRADIENTS.find((g) => g.id === id) ?? AVATAR_GRADIENTS[0];
}

/** Tailwind class form (legacy callers). */
export function gradientFor(id: string | undefined): string {
  return find(id).className;
}

/** CSS gradient value for inline styles — guaranteed to render. */
export function gradientCss(id: string | undefined): string {
  return find(id).css;
}

/** True when the learner has earned enough XP to use this avatar. */
export function isAvatarUnlocked(avatar: Avatar, totalXp: number): boolean {
  return totalXp >= avatar.unlockXp;
}

/**
 * The cheapest still-locked avatar for the given XP, or `null` once everything
 * is unlocked. AVATARS is ordered by unlockXp so the first locked one is next.
 */
export function nextLockedAvatar(totalXp: number): Avatar | null {
  return AVATARS.find((a) => !isAvatarUnlocked(a, totalXp)) ?? null;
}

/** Find a curated avatar by its saved gradient + emoji combo. */
export function avatarFor(
  gradientId: string | undefined,
  emoji: string | undefined,
): Avatar | undefined {
  return AVATARS.find((a) => a.gradientId === gradientId && a.emoji === emoji);
}
