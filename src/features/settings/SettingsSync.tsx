import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/settings/ThemeContext";
import { updateUserProfile } from "@/services/users";
import { isSoundEnabled, setSoundEnabled, subscribeSound } from "@/lib/sfx";

/**
 * Headless component that keeps the learner's display / sound preferences in
 * sync with their Firestore profile so signing in on a new device restores
 * them.
 *
 * - ONE-TIME per uid: when the profile first loads, any prefs defined on it are
 *   applied to local state (theme, dyslexia font, high contrast, sound).
 * - After that initial apply, local changes (the user toggling a setting) are
 *   debounced and persisted back to Firestore.
 *
 * A ref guards the apply -> write loop: the render caused by applying remote
 * values is skipped so it isn't immediately written back.
 */
export function SettingsSync() {
  const { user, profile } = useAuth();
  const {
    theme,
    setTheme,
    dyslexiaFont,
    setDyslexiaFont,
    highContrast,
    setHighContrast,
  } = useTheme();

  // sfx is not React-reactive, so mirror its value into state and subscribe to
  // changes (e.g. when the Settings page toggles sound).
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  useEffect(() => subscribeSound(setSoundOn), []);

  // Which uid we've already applied remote prefs for, and a flag to skip the
  // persist that the apply itself would otherwise trigger.
  const appliedUidRef = useRef<string | null>(null);
  const skipNextPersistRef = useRef(false);

  // One-time apply of remote prefs per uid.
  useEffect(() => {
    if (!user || !profile) return;
    if (appliedUidRef.current === user.uid) return;
    appliedUidRef.current = user.uid;

    // The state changes below must not be written straight back to Firestore.
    skipNextPersistRef.current = true;

    if (profile.theme === "light" || profile.theme === "dark") {
      setTheme(profile.theme);
    }
    if (typeof profile.dyslexiaFont === "boolean") {
      setDyslexiaFont(profile.dyslexiaFont);
    }
    if (typeof profile.highContrast === "boolean") {
      setHighContrast(profile.highContrast);
    }
    if (typeof profile.soundEnabled === "boolean") {
      setSoundEnabled(profile.soundEnabled); // notifies subscribers -> setSoundOn
    }
  }, [user, profile, setTheme, setDyslexiaFont, setHighContrast]);

  // Persist local changes (debounced) once the initial apply for this uid is done.
  useEffect(() => {
    if (!user) return;
    if (appliedUidRef.current !== user.uid) return; // not applied yet

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    const uid = user.uid;
    const handle = window.setTimeout(() => {
      updateUserProfile(uid, {
        theme,
        dyslexiaFont,
        highContrast,
        soundEnabled: soundOn,
      }).catch(() => {
        /* preference sync is best-effort */
      });
    }, 600);

    return () => window.clearTimeout(handle);
  }, [user, theme, dyslexiaFont, highContrast, soundOn]);

  return null;
}
