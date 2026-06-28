import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Dumbbell,
  Trophy,
  User,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/settings/ThemeContext";
import { isSoundEnabled, setSoundEnabled, playTap } from "@/lib/sfx";
import { BrandMark } from "@/components/BrandMark";
import { gradientCss } from "@/features/profile/avatar";

type NavIcon = "home" | "course" | "practice" | "ranks" | "profile";

interface NavItem {
  to: string;
  label: string;
  icon: NavIcon;
  /** The center, raised "primary action" tab on mobile. */
  primary?: boolean;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/course", label: "Course", icon: "course" },
  { to: "/practice", label: "Practice", icon: "practice", primary: true },
  { to: "/leaderboard", label: "Ranks", icon: "ranks" },
  { to: "/profile", label: "Profile", icon: "profile" },
];

export function AppHeader() {
  const { signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close the avatar menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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

  const initial = (profile?.displayName || "?").charAt(0).toUpperCase();
  const avatarColor = profile?.avatarColor ?? "indigo";
  const avatarEmoji = profile?.avatarEmoji ?? "";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-extrabold">
            <BrandMark className="h-7 w-7 shadow-soft rounded-lg" />
            <span className="gradient-text text-base">AlgGo</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Primary links: top bar on desktop only */}
            <nav className="hidden items-center gap-1 text-sm sm:flex">
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
            </nav>

            {/* Avatar menu: theme, sound, settings, sign out */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex items-center gap-1 rounded-pill p-0.5 pr-1.5 text-ink/60 transition-colors hover:bg-ink/5"
              >
                <span
                  style={{ backgroundImage: gradientCss(avatarColor) }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-soft"
                >
                  {avatarEmoji || initial}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="animate-scale-in absolute right-0 top-full z-40 mt-2 w-56 origin-top-right overflow-hidden rounded-card border border-ink/10 bg-surface p-1.5 shadow-card"
                >
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/80 transition-colors hover:bg-ink/5 sm:hidden"
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    Profile
                  </Link>
                  <MenuButton
                    onClick={() => {
                      toggleTheme();
                    }}
                    icon={
                      theme === "dark" ? (
                        <Sun className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Moon className="h-4 w-4" aria-hidden="true" />
                      )
                    }
                    label={theme === "dark" ? "Light mode" : "Dark mode"}
                  />
                  <MenuButton
                    onClick={handleToggleSound}
                    icon={
                      soundOn ? (
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <VolumeX className="h-4 w-4" aria-hidden="true" />
                      )
                    }
                    label={soundOn ? "Sound on" : "Sound off"}
                  />
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/80 transition-colors hover:bg-ink/5"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    Settings
                  </Link>
                  <div className="my-1 h-px bg-ink/10" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar with a raised center "Practice" action */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-canvas/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-end justify-between px-2 pb-1.5 pt-1">
          {NAV.map((item) =>
            item.primary ? (
              <div key={item.to} className="flex flex-1 justify-center">
                <NavLink
                  to={item.to}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    `-mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet text-white shadow-pop transition-transform active:scale-95 ${
                      isActive ? "ring-4 ring-accent/25" : ""
                    }`
                  }
                >
                  <NavGlyph icon={item.icon} />
                  <span className="text-[9px] font-semibold leading-tight">{item.label}</span>
                </NavLink>
              </div>
            ) : (
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
            )
          )}
        </div>
      </nav>
    </>
  );
}

function MenuButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/80 transition-colors hover:bg-ink/5"
    >
      {icon}
      {label}
    </button>
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
    default:
      return <User className={cls} aria-hidden="true" />;
  }
}
