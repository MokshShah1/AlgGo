import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { getFirebaseConfig } from "@/config/env";
import { SetupErrorScreen } from "@/components/SetupErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthProvider } from "@/features/auth/AuthContext";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { ToastProvider, Toaster } from "@/components/Toast";
import { SettingsSync } from "@/features/settings/SettingsSync";
import { AchievementWatcher } from "@/features/profile/AchievementWatcher";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";

// Route-level code-splitting: every page below is loaded on demand so the
// initial bundle stays small. These are NAMED exports, so each dynamic import
// is mapped to a `default` for React.lazy.
const OnboardingPage = lazy(() =>
  import("@/pages/OnboardingPage").then((m) => ({ default: m.OnboardingPage }))
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const CoursePage = lazy(() =>
  import("@/pages/CoursePage").then((m) => ({ default: m.CoursePage }))
);
const LessonPage = lazy(() =>
  import("@/pages/LessonPage").then((m) => ({ default: m.LessonPage }))
);
const LessonCompletePage = lazy(() =>
  import("@/pages/LessonCompletePage").then((m) => ({
    default: m.LessonCompletePage,
  }))
);
const ReviewPage = lazy(() =>
  import("@/pages/ReviewPage").then((m) => ({ default: m.ReviewPage }))
);
const ChallengePage = lazy(() =>
  import("@/pages/ChallengePage").then((m) => ({ default: m.ChallengePage }))
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const CustomizeAvatarPage = lazy(() =>
  import("@/pages/CustomizeAvatarPage").then((m) => ({
    default: m.CustomizeAvatarPage,
  }))
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const DailyChallengePage = lazy(() =>
  import("@/pages/DailyChallengePage").then((m) => ({
    default: m.DailyChallengePage,
  }))
);
const SpeedRoundPage = lazy(() =>
  import("@/pages/SpeedRoundPage").then((m) => ({ default: m.SpeedRoundPage }))
);
const PracticePage = lazy(() =>
  import("@/pages/PracticePage").then((m) => ({ default: m.PracticePage }))
);
const PracticeHubPage = lazy(() =>
  import("@/pages/PracticeHubPage").then((m) => ({
    default: m.PracticeHubPage,
  }))
);
const MistakesPage = lazy(() =>
  import("@/pages/MistakesPage").then((m) => ({ default: m.MistakesPage }))
);
const WordProblemsPage = lazy(() =>
  import("@/pages/WordProblemsPage").then((m) => ({
    default: m.WordProblemsPage,
  }))
);
const DiagnosticPage = lazy(() =>
  import("@/pages/DiagnosticPage").then((m) => ({ default: m.DiagnosticPage }))
);
const SandboxPage = lazy(() =>
  import("@/pages/SandboxPage").then((m) => ({ default: m.SandboxPage }))
);
const SkillTreePage = lazy(() =>
  import("@/pages/SkillTreePage").then((m) => ({ default: m.SkillTreePage }))
);
const RecapPage = lazy(() =>
  import("@/pages/RecapPage").then((m) => ({ default: m.RecapPage }))
);
const LeaderboardPage = lazy(() =>
  import("@/pages/LeaderboardPage").then((m) => ({
    default: m.LeaderboardPage,
  }))
);

export default function App() {
  const firebase = getFirebaseConfig();

  // Fail gracefully with a helpful setup screen instead of crashing.
  if (!firebase.ok) {
    return <SetupErrorScreen missing={firebase.missing} />;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <MotionConfig reducedMotion="user">
          <SettingsSync />
          <AchievementWatcher />
          <AnimatedRoutes />
          <Toaster />
        </MotionConfig>
      </ToastProvider>
    </AuthProvider>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.992 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<LoadingScreen label="Loading..." />}>
        <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth requireOnboarded={false}>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/course"
          element={
            <RequireAuth>
              <CoursePage />
            </RequireAuth>
          }
        />
        <Route
          path="/lesson/:lessonId"
          element={
            <RequireAuth>
              <LessonPage />
            </RequireAuth>
          }
        />
        <Route
          path="/lesson/:lessonId/complete"
          element={
            <RequireAuth>
              <LessonCompletePage />
            </RequireAuth>
          }
        />
        <Route
          path="/review"
          element={
            <RequireAuth>
              <ReviewPage />
            </RequireAuth>
          }
        />
        <Route
          path="/challenge"
          element={
            <RequireAuth>
              <ChallengePage />
            </RequireAuth>
          }
        />
        <Route
          path="/daily"
          element={
            <RequireAuth>
              <DailyChallengePage />
            </RequireAuth>
          }
        />
        <Route
          path="/speed"
          element={
            <RequireAuth>
              <SpeedRoundPage />
            </RequireAuth>
          }
        />
        <Route
          path="/practice"
          element={
            <RequireAuth>
              <PracticeHubPage />
            </RequireAuth>
          }
        />
        <Route
          path="/smart-review"
          element={
            <RequireAuth>
              <PracticePage />
            </RequireAuth>
          }
        />
        <Route
          path="/mistakes"
          element={
            <RequireAuth>
              <MistakesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/word-problems"
          element={
            <RequireAuth>
              <WordProblemsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/diagnostic"
          element={
            <RequireAuth>
              <DiagnosticPage />
            </RequireAuth>
          }
        />
        <Route
          path="/sandbox"
          element={
            <RequireAuth>
              <SandboxPage />
            </RequireAuth>
          }
        />
        <Route
          path="/skills"
          element={
            <RequireAuth>
              <SkillTreePage />
            </RequireAuth>
          }
        />
        <Route
          path="/recap"
          element={
            <RequireAuth>
              <RecapPage />
            </RequireAuth>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <RequireAuth>
              <LeaderboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/avatar"
          element={
            <RequireAuth>
              <CustomizeAvatarPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
