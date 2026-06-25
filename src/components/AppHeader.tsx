import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Dumbbell,
  Trophy,
  History,
  User,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/settings/ThemeContext";
import { isSoundEnabled, setSoundEnabled, playTap } from "@/lib/sfx";
import { BrandMark } from "@/components/BrandMark";

type NavIcon = "home" | "course" | "practice" | "ranks" | "review" | "profile";

const NAV: { to: string; label: string; icon: NavIcon }[] = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/course", label: "Course", icon: "course" },
  { to: "/practice", label: "Practice", icon: "practice" },
  { to: "/leaderboard", label: "Leaderboard", icon: "ranks" },
  { to: "/review", label: "Review", icon: "review" },
  { to: "/profile", label: "Profile", icon: "profile" },
];

export function AppHeader() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  function handleToggleSound() {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playTap();
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-extrabold">
            <BrandMark className="h-7 w-7 shadow-soft rounded-lg" />
            <span className="gradient-text text-sm">AlgGo</span>
          </Link>

          <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
            {/* Primary links: top bar on desktop, bottom bar on mobile */}
            <div className="hidden items-center gap-1 sm:flex">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-pill px-3 py-1.5 font-medium transition-colors ${
                      isActive
                        ? "bg-accent/10 font-semibold text-accent"
                        : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-pill p-1.5 text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleSound}
              className="rounded-pill p-1.5 text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
              aria-label={soundOn ? "Mute sounds" : "Unmute sounds"}
              title="Toggle sound"
            >
              {soundOn ? (
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-pill p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-canvas/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? "text-accent" : "text-ink/50"
                }`
              }
            >
              <NavGlyph icon={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}

function NavGlyph({ icon }: { icon: NavIcon }) {
  const cls = "h-5 w-5";
  switch (icon) {
    case "home":
      return <Home className={cls} aria-hidden="true" />;
    case "course":
      return <BookOpen className={cls} aria-hidden="true" />;
    case "practice":
      return <Dumbbell className={cls} aria-hidden="true" />;
    case "ranks":
      return <Trophy className={cls} aria-hidden="true" />;
    case "review":
      return <History className={cls} aria-hidden="true" />;
    default:
      return <User className={cls} aria-hidden="true" />;
  }
}
