import type { FirebaseEnvVar } from "@/config/env";

interface SetupErrorScreenProps {
  missing: FirebaseEnvVar[];
}

/**
 * Shown when Firebase env vars are missing so the app never silently crashes.
 * Gives the developer concrete next steps instead of a blank screen.
 */
export function SetupErrorScreen({ missing }: SetupErrorScreenProps) {
  return (
    <div className="min-h-dvh bg-canvas px-5 py-10 text-ink">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Setup needed
          </span>
          <h1 className="text-2xl font-bold">Connect Firebase to get started</h1>
          <p className="text-ink/70">
            This app needs Firebase configuration to handle sign-in and save
            progress. Some required environment variables are missing, so the app
            is paused here instead of crashing.
          </p>
        </div>

        <ol className="card flex flex-col gap-3 p-5">
          <li>
            <span className="font-semibold">1.</span> Copy{" "}
            <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.example</code>{" "}
            to <code className="rounded bg-ink/5 px-1.5 py-0.5">.env</code> in the
            project root.
          </li>
          <li>
            <span className="font-semibold">2.</span> Fill in the values from your
            Firebase project: Console &rarr; Project settings &rarr; Your apps
            &rarr; SDK setup and configuration.
          </li>
          <li>
            <span className="font-semibold">3.</span> Restart the dev server (
            <code className="rounded bg-ink/5 px-1.5 py-0.5">npm run dev</code>).
          </li>
        </ol>

        <div className="rounded-card border border-hint/30 bg-hint/5 p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-hint">
            Missing variables
          </h2>
          <ul className="flex flex-col gap-1 font-mono text-sm">
            {missing.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
