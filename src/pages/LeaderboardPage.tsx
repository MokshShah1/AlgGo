import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bot, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { aiAvailable, aiRival } from "@/lib/ai";
import { updateUserProfile } from "@/services/users";
import {
  fetchTopLeaderboard,
  rankWithin,
  removeLeaderboardEntry,
  upsertLeaderboardEntry,
  type LeaderboardEntry,
  type LeaderboardScope,
} from "@/services/leaderboard";
import { effectiveWeeklyXp } from "@/lib/week";
import { gradientCss } from "@/features/profile/avatar";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";

const PAGE_SIZE = 10;

export function LeaderboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<LeaderboardScope>("week");
  const [page, setPage] = useState(1);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Playful AI rival nudge — purely a client-side visual, never persisted.
  const [rival, setRival] = useState<{ rivalName: string; message: string } | null>(
    null
  );
  const rivalFetched = useRef(false);
  // Opt-out model: everyone is on the board unless they explicitly hid themselves.
  const optedIn = profile?.leaderboardOptIn !== false;

  // The signed-in learner's XP for the active scope (weekly resets each week).
  const myXp =
    scope === "all" ? profile?.totalXp ?? 0 : effectiveWeeklyXp(profile);

  // Reset to the first page whenever the scope tab changes.
  useEffect(() => {
    setPage(1);
  }, [scope]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user || !profile) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const participating = profile.leaderboardOptIn !== false;
      try {
        // Keep this learner's entry fresh unless they've hidden themselves.
        if (participating) {
          await upsertLeaderboardEntry({
            uid: user.uid,
            displayName: profile.displayName,
            weeklyXp: effectiveWeeklyXp(profile),
            totalXp: profile.totalXp ?? 0,
            avatarColor: profile.avatarColor,
            avatarEmoji: profile.avatarEmoji,
          });
        }
        const rows = await fetchTopLeaderboard(scope, 500);
        const myScopeXp =
          scope === "all" ? profile.totalXp ?? 0 : effectiveWeeklyXp(profile);
        const rank = participating ? rankWithin(rows, scope, myScopeXp) : null;
        if (active) {
          setEntries(rows);
          setMyRank(rank);
        }
      } catch (e) {
        // Surface the real reason (e.g. "Missing or insufficient permissions")
        // instead of silently showing an empty board.
        if (active) {
          setError(
            e instanceof Error ? e.message : "Failed to load the leaderboard."
          );
          setEntries([]);
          setMyRank(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user, profile, scope]);

  // Fetch the AI rival once, after we know who the learner is. Fails soft:
  // if the proxy is offline or the call throws, we simply render nothing extra.
  useEffect(() => {
    if (rivalFetched.current || !profile) return;
    rivalFetched.current = true;
    let active = true;
    (async () => {
      try {
        if (!(await aiAvailable())) return;
        const result = await aiRival({
          userName: profile.displayName,
          userXp: profile.totalXp,
          rank: myRank ?? undefined,
          streak: profile.streakCount,
        });
        if (active) setRival(result);
      } catch {
        /* fail soft — leave the leaderboard untouched */
      }
    })();
    return () => {
      active = false;
    };
  }, [profile, myRank]);

  async function toggleOptIn() {
    if (!user || !profile) return;
    setBusy(true);
    const next = !optedIn;
    try {
      await updateUserProfile(user.uid, { leaderboardOptIn: next });
      if (next) {
        await upsertLeaderboardEntry({
          uid: user.uid,
          displayName: profile.displayName,
          weeklyXp: effectiveWeeklyXp(profile),
          totalXp: profile.totalXp ?? 0,
          avatarColor: profile.avatarColor,
          avatarEmoji: profile.avatarEmoji,
        });
      } else {
        await removeLeaderboardEntry(user.uid);
      }
      await refreshProfile();
      const rows = await fetchTopLeaderboard(scope, 500);
      setEntries(rows);
      setPage(1);
      const myScopeXp =
        scope === "all" ? profile.totalXp ?? 0 : effectiveWeeklyXp(profile);
      const rank = next ? rankWithin(rows, scope, myScopeXp) : null;
      setMyRank(rank);
    } catch {
      /* non-fatal */
    } finally {
      setBusy(false);
    }
  }

  if (loading && entries.length === 0) {
    return <LoadingScreen label="Loading the leaderboard..." />;
  }

  const xpOf = (e: LeaderboardEntry) =>
    scope === "all" ? e.totalXp ?? 0 : e.weeklyXp;

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEntries = entries.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-2xl md:py-8">
        <div className="animate-fade-in-up flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Compete
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">XP Leaderboard</h1>
          <p className="text-sm text-ink/70">
            Friendly competition with every learner. Join in to appear here.
          </p>
        </div>

        {/* Scope tabs */}
        <div className="flex gap-1 rounded-pill bg-surface-2 p-1">
          {(
            [
              { id: "week", label: "This week" },
              { id: "all", label: "All time" },
            ] as { id: LeaderboardScope; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScope(tab.id)}
              className={`relative flex-1 rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${
                scope === tab.id ? "text-white" : "text-ink/60 hover:text-ink"
              }`}
            >
              {scope === tab.id && (
                <motion.span
                  layoutId="lb-tab"
                  className="absolute inset-0 rounded-pill bg-gradient-to-r from-accent to-violet shadow-soft"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="card flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold">
              {optedIn ? "You're on the board" : "You're hidden"}
            </p>
            <p className="text-xs text-ink/60">
              {optedIn
                ? "Your display name and XP are visible to other learners."
                : "Other learners can't see you. Tap Show to appear."}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleOptIn}
            disabled={busy}
            className={optedIn ? "btn-ghost px-4 py-2 text-sm" : "btn-primary px-4 py-2 text-sm"}
          >
            {optedIn ? "Hide me" : "Show me"}
          </button>
        </div>

        {rival && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card flex items-center gap-3 border border-violet/40 bg-violet/10 p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet text-base font-bold text-white shadow-soft">
              {rival.rivalName.trim().charAt(0).toUpperCase() || (
                <Bot className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold">{rival.rivalName}</p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-violet/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  AI
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink/70">{rival.message}</p>
            </div>
          </motion.div>
        )}

        {error ? (
          <div className="card border border-danger/40 bg-danger/10 p-5 text-sm">
            <p className="font-bold text-danger">Couldn&apos;t load the leaderboard</p>
            <p className="mt-1 text-ink/70">{error}</p>
            {/permission|insufficient/i.test(error) && (
              <p className="mt-2 text-xs text-ink/60">
                This usually means the Firestore security rules haven&apos;t been
                deployed. Run{" "}
                <code className="rounded bg-ink/10 px-1 py-0.5">
                  firebase deploy --only firestore:rules
                </code>{" "}
                and reload.
              </p>
            )}
          </div>
        ) : entries.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink/70">
            No one&apos;s on the board yet. Be the first to join!
          </div>
        ) : (
          <>
            <ol className="flex flex-col gap-2">
              {pageEntries.map((e, i) => {
                const globalIndex = pageStart + i;
                const rank = globalIndex + 1;
                const isMe = e.uid === user?.uid;
                return (
                  <motion.li
                    key={e.uid}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    className={`flex items-center gap-3 rounded-card border p-3 ${
                      isMe ? "border-accent/50 bg-accent/10" : "border-white/5 bg-surface"
                    }`}
                  >
                    <span
                      className={`flex w-7 items-center justify-center text-sm font-extrabold ${
                        globalIndex === 0
                          ? "text-hint"
                          : globalIndex < 3
                            ? "text-accent"
                            : "text-ink/50"
                      }`}
                    >
                      {globalIndex === 0 ? (
                        <Crown className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        rank
                      )}
                    </span>
                    <span
                      style={{ backgroundImage: gradientCss(e.avatarColor) }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    >
                      {e.avatarEmoji || (e.displayName || "L").charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {e.displayName || "Anonymous learner"}
                      {isMe && <span className="ml-1 text-xs text-accent">(you)</span>}
                    </span>
                    <span className="text-sm font-extrabold text-accent">
                      {xpOf(e)} XP
                    </span>
                  </motion.li>
                );
              })}
            </ol>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="btn-ghost px-4 py-2 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-ink/60">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="btn-ghost px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {optedIn && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                Your rank
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <motion.div
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-card border border-accent/50 bg-accent/10 p-3"
            >
              <span className="flex w-7 items-center justify-center text-sm font-extrabold text-accent">
                {myRank ?? "—"}
              </span>
              <span
                style={{ backgroundImage: gradientCss(profile?.avatarColor) }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              >
                {profile?.avatarEmoji ||
                  (profile?.displayName || "L").charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {profile?.displayName || "You"}
                <span className="ml-1 text-xs text-accent">(you)</span>
              </span>
              <span className="text-sm font-extrabold text-accent">{myXp} XP</span>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
