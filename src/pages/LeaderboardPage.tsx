import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { aiAvailable, aiRival } from "@/lib/ai";
import { RIVAL_AVATAR, RIVAL_NAME, rivalStandings } from "@/lib/aiPersona";
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
  // Sammy's AI-written trash talk. The rival himself (XP + avatar) always shows;
  // this is just optional flavor fetched when the AI proxy is up.
  const [rivalMessage, setRivalMessage] = useState<string | null>(null);
  const rivalFetched = useRef(false);
  // Opt-out model: everyone is on the board unless they explicitly hid themselves.
  const optedIn = profile?.leaderboardOptIn !== false;

  // The signed-in learner's XP per scope (weekly resets each week).
  const myTotalXp = profile?.totalXp ?? 0;
  const myWeeklyXp = effectiveWeeklyXp(profile);
  const myXp = scope === "all" ? myTotalXp : myWeeklyXp;

  // The rival's standing for BOTH scopes (computed together so weekly can never
  // exceed all-time). His XP tracks near the learner's and drifts up over real
  // time, so going inactive lets him pull ahead.
  const standings = useMemo(
    () => rivalStandings(myTotalXp, myWeeklyXp),
    [myTotalXp, myWeeklyXp]
  );
  const standing = scope === "all" ? standings.all : standings.week;

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
    let active = true;
    (async () => {
      try {
        // Don't mark fetched until AI is confirmed up — otherwise a single early
        // check while the proxy was offline would hide the rival for good.
        if (!(await aiAvailable())) return;
        const result = await aiRival({
          userName: profile.displayName,
          userXp: myXp,
          rank: myRank ?? undefined,
          streak: profile.streakCount,
          rivalXp: standing.xp,
          ahead: standing.ahead,
          gap: standing.diff,
        });
        if (active) {
          setRivalMessage(result.message);
          rivalFetched.current = true;
        }
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

  type DisplayRow = LeaderboardEntry & { isRival?: boolean };

  const xpOf = (e: DisplayRow) => (scope === "all" ? e.totalXp ?? 0 : e.weeklyXp);

  const rivalRow: DisplayRow = {
    uid: "__rival__",
    displayName: RIVAL_NAME,
    weeklyXp: standings.week.xp,
    totalXp: standings.all.xp,
    avatarColor: "violet",
    isRival: true,
  };

  // Drop Sammy into the ranked list at the position his XP earns.
  const displayEntries: DisplayRow[] = [...entries, rivalRow].sort(
    (a, b) => xpOf(b) - xpOf(a)
  );

  const totalPages = Math.max(1, Math.ceil(displayEntries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEntries = displayEntries.slice(pageStart, pageStart + PAGE_SIZE);

  // Visual rank for the bottom "Your rank" card: bump by one when Sammy is ahead.
  const myDisplayRank = myRank != null ? myRank + (standing.ahead ? 1 : 0) : null;

  // What Sammy says: his AI trash talk when available, else a standing-based line.
  const rivalLine =
    rivalMessage ??
    (standing.diff === 0
      ? `Dead even with you. This is anyone's game.`
      : standing.ahead
        ? `I'm ${standing.diff} XP ahead of you now. Better get grinding.`
        : `You're ${standing.diff} XP ahead of me... for now.`);

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

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center gap-3 border border-violet/40 bg-violet/10 p-4"
        >
          <img
            src={RIVAL_AVATAR}
            alt={`${RIVAL_NAME} the AI rival`}
            className="h-12 w-12 shrink-0 rounded-full object-cover shadow-soft ring-2 ring-violet/50"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold">{RIVAL_NAME}</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-violet/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                AI rival
              </span>
              <span
                className={`ml-auto shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold ${
                  standing.ahead
                    ? "bg-danger/15 text-danger"
                    : "bg-correct/15 text-correct"
                }`}
              >
                {standing.diff === 0
                  ? "tied"
                  : standing.ahead
                    ? `+${standing.diff} ahead`
                    : `${standing.diff} behind`}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-violet">{standing.xp} XP</p>
            <p className="mt-0.5 text-xs text-ink/70">{rivalLine}</p>
          </div>
        </motion.div>

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
        ) : displayEntries.length === 0 ? (
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
                const isRival = e.isRival === true;
                return (
                  <motion.li
                    key={e.uid}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    className={`flex items-center gap-3 rounded-card border p-3 ${
                      isMe
                        ? "border-accent/50 bg-accent/10"
                        : isRival
                          ? "border-violet/40 bg-violet/10"
                          : "border-white/5 bg-surface"
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
                    {isRival ? (
                      <img
                        src={RIVAL_AVATAR}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-violet/50"
                      />
                    ) : (
                      <span
                        style={{ backgroundImage: gradientCss(e.avatarColor) }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      >
                        {e.avatarEmoji || (e.displayName || "L").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-semibold">
                      {e.displayName || "Anonymous learner"}
                      {isMe && <span className="text-xs text-accent">(you)</span>}
                      {isRival && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-violet/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet">
                          <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                          AI
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        isRival ? "text-violet" : "text-accent"
                      }`}
                    >
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
                {myDisplayRank ?? "—"}
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
