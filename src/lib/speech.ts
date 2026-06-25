/**
 * Thin wrapper around the browser's built-in Speech Synthesis engine.
 * This keeps the "spoken voice" feature fully on-device: no network calls,
 * no API keys, no third-party services.
 */

export const speechSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

export function getVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported) return [];
  return window.speechSynthesis.getVoices();
}

// Voices that tend to sound the most natural / human, in order of preference.
// The "(Natural)" Microsoft voices (available in Edge) sound genuinely human.
const PREFERRED_NAMES = [
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Ava Online (Natural) - English (United States)",
  "Microsoft Emma Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Guy Online (Natural) - English (United States)",
  "Google US English",
  "Samantha",
  "Alex",
  "Microsoft Zira - English (United States)",
  "Microsoft David - English (United States)",
];

/** Choose the most natural-sounding English voice that's available. */
export function pickVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;

  for (const name of PREFERRED_NAMES) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }

  // Any "Natural"/"Online"/"Neural" English voice beats a robotic local one.
  const natural = voices.find(
    (v) => /^en/i.test(v.lang) && /natural|online|neural/i.test(v.name)
  );
  if (natural) return natural;

  // Prefer non-Microsoft-SAPI (David/Zira/Mark are the robotic ones).
  const enUSNice = voices.find(
    (v) =>
      /en[-_]US/i.test(v.lang) &&
      !/david|zira|mark/i.test(v.name)
  );
  if (enUSNice) return enUSNice;

  const enUS = voices.find((v) => /en[-_]US/i.test(v.lang));
  if (enUS) return enUS;

  const en = voices.find((v) => /^en/i.test(v.lang));
  return en ?? voices[0];
}
