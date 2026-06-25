import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { friendlyAuthError } from "@/features/auth/authErrors";
import { LoadingScreen } from "@/components/LoadingScreen";
import { BrandMark } from "@/components/BrandMark";

type Mode = "signin" | "signup";

export function LoginPage() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } =
    useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "field";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-canvas px-5 py-12 text-ink">
      <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-violet/15 blur-3xl" />

      <div className="relative mx-auto flex max-w-sm flex-col gap-6">
        <header className="animate-fade-in-up flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-11 w-11 shadow-soft rounded-xl" glow />
            <span className="gradient-text text-xl font-extrabold tracking-tight">
              AlgGo
            </span>
          </div>
          <h1 className="text-3xl font-bold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="animate-scale-in card flex flex-col gap-4 p-6"
        >
          {mode === "signup" && (
            <label className="flex flex-col gap-1 text-sm font-medium">
              Name
              <input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="Maya"
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Password
            <input
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 6 characters"
            />
          </label>

          {error && (
            <p className="animate-shake rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>

          <div className="flex items-center gap-3 text-xs text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            or
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="btn-ghost w-full"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-center text-sm text-ink/70">
          {mode === "signin"
            ? "New here? "
            : "Already have an account? "}
          <button
            type="button"
            className="font-semibold text-accent underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
