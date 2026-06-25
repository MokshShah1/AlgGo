import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { completeOnboarding } from "@/services/users";
import { COMFORT_OPTIONS, type ComfortLevel } from "@/types/user";
import { LoadingScreen } from "@/components/LoadingScreen";

export function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [comfort, setComfort] = useState<ComfortLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.displayName) {
      setName(profile.displayName);
    }
  }, [profile?.displayName]);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.onboardingComplete) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError("Please enter a name so we can greet you.");
      return;
    }
    if (!comfort) {
      setError("Pick the option that sounds most like you.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await completeOnboarding(user.uid, name, comfort);
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Could not save your answers. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-canvas px-5 py-12 text-ink">
      <div className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-violet/15 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative mx-auto flex max-w-sm flex-col gap-6"
      >
        <header className="animate-fade-in-up flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Let's get set up
          </span>
          <h1 className="text-2xl font-bold">First, what should we call you?</h1>
        </header>

        <label className="animate-fade-in-up stagger-1 flex flex-col gap-1 text-sm font-medium">
          Your name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
            placeholder="Maya"
          />
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">
            How do you feel about slope?
          </legend>
          {COMFORT_OPTIONS.map((option, i) => {
            const selected = comfort === option.value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => setComfort(option.value)}
                style={{ animationDelay: `${120 + i * 60}ms` }}
                className={`animate-fade-in-up rounded-card border-2 px-4 py-4 text-left text-base transition-all duration-200 active:scale-[0.98] ${
                  selected
                    ? "border-accent bg-accent/10 font-semibold text-ink shadow-soft"
                    : "border-white/10 bg-surface-2 text-ink/80 hover:border-accent/40 hover:-translate-y-0.5"
                }`}
                aria-pressed={selected}
              >
                {option.label}
              </button>
            );
          })}
        </fieldset>

        {error && (
          <p className="animate-shake rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Saving..." : "Start learning"}
        </button>
      </form>
    </div>
  );
}
