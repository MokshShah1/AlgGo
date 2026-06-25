import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";

export function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="relative flex min-h-dvh items-center overflow-hidden bg-canvas px-5 py-12 text-ink sm:px-6">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-violet/15 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-8 lg:max-w-5xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <span className="animate-fade-in-up w-fit rounded-pill bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            8th Grade Algebra
          </span>
          <h1 className="animate-fade-in-up stagger-1 text-4xl font-extrabold leading-tight">
            Learn <span className="gradient-text">slope</span> by doing, not by
            memorizing.
          </h1>
          <p className="animate-fade-in-up stagger-2 text-ink/70">
            Drag points, watch a line change, and discover how much it rises for
            each step to the right. One focused chapter:{" "}
            <span className="font-semibold text-ink">
              Linear Relationships - Slope &amp; Graphing Lines.
            </span>
          </p>
        </header>

        <ul className="animate-fade-in-up stagger-3 flex flex-col gap-3">
          {[
            "Short, interactive lessons that fit any screen.",
            "Try first, then get specific feedback when you miss.",
            "Earn XP, keep a streak, and track what you've mastered.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-ink/80">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-correct/15 text-correct">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>

        <Link to="/login" className="animate-fade-in-up stagger-4 btn-primary w-full py-4 lg:w-fit lg:px-10">
          Start learning
        </Link>
        </div>

        {/* Animated mini illustration */}
        <div className="animate-scale-in stagger-2 card relative overflow-hidden p-6">
          <div className="animate-float">
            <svg viewBox="0 0 200 120" className="h-auto w-full" aria-hidden="true">
              <defs>
                <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5B6CFF" />
                  <stop offset="100%" stopColor="#8B7CFF" />
                </linearGradient>
              </defs>
              <g stroke="#EAE7DF" strokeWidth="1">
                {[20, 50, 80, 110].map((y) => (
                  <line key={y} x1="10" y1={y} x2="190" y2={y} />
                ))}
                {[40, 80, 120, 160].map((x) => (
                  <line key={x} x1={x} y1="10" x2={x} y2="110" />
                ))}
              </g>
              <polygon points="40,90 160,90 160,30" fill="#8B7CFF" fillOpacity="0.12" />
              <line x1="160" y1="90" x2="160" y2="30" stroke="#B9AEFF" strokeWidth="3" strokeLinecap="round" />
              <line x1="40" y1="90" x2="160" y2="90" stroke="#B9AEFF" strokeWidth="3" strokeLinecap="round" />
              <line x1="40" y1="90" x2="160" y2="30" stroke="url(#heroLine)" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="40" cy="90" r="6" fill="#15A05A" stroke="#fff" strokeWidth="2.5" />
              <circle cx="160" cy="30" r="6" fill="#5B6CFF" stroke="#fff" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
