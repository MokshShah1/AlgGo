import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";

interface RequireAuthProps {
  children: ReactNode;
  /** When true (default), the learner must have finished onboarding. */
  requireOnboarded?: boolean;
}

/**
 * Gates routes behind authentication and (optionally) completed onboarding.
 * - Not signed in -> /login
 * - Signed in but not onboarded -> /onboarding
 */
export function RequireAuth({
  children,
  requireOnboarded = true,
}: RequireAuthProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireOnboarded && profile && !profile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
