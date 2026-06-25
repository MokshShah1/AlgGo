import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "@/features/settings/ThemeContext";
import { AppHeader } from "@/components/AppHeader";
import { isSoundEnabled, setSoundEnabled, playTap } from "@/lib/sfx";

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    theme,
    toggleTheme,
    dyslexiaFont,
    setDyslexiaFont,
    highContrast,
    setHighContrast,
  } = useTheme();

  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  function toggleSound() {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playTap(); // brief confirmation when turning sound on
  }

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-2xl md:py-8">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to profile
        </button>

        <h1 className="text-2xl font-bold">Settings</h1>

        <section className="animate-fade-in-up card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
            Accessibility &amp; display
          </h2>
          <div className="mt-3 flex flex-col divide-y divide-white/5">
            <ToggleRow
              label="Light theme"
              description="Switch between dark and light."
              checked={theme === "light"}
              onChange={toggleTheme}
            />
            <ToggleRow
              label="High contrast"
              description="Boost text and background contrast."
              checked={highContrast}
              onChange={() => setHighContrast(!highContrast)}
            />
            <ToggleRow
              label="Dyslexia-friendly font"
              description="Use a more readable typeface with extra spacing."
              checked={dyslexiaFont}
              onChange={() => setDyslexiaFont(!dyslexiaFont)}
            />
            <ToggleRow
              label="Sound effects"
              description="Play sounds for correct answers and celebrations."
              checked={soundOn}
              onChange={toggleSound}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink/55">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ${
          checked ? "border-accent bg-accent" : "border-ink/20 bg-ink/10"
        }`}
      >
        <span
          className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow ring-1 ring-black/10 transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
