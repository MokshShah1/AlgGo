import { AppHeader } from "@/components/AppHeader";
import { PracticeHub } from "@/features/dashboard/PracticeHub";

export function PracticeHubPage() {
  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-4xl md:py-8">
        <header className="animate-fade-in-up flex flex-col gap-1">
          <h1 className="text-2xl font-bold md:text-3xl">Practice</h1>
          <p className="text-sm text-ink/60">
            Daily drills, smart review, and challenges to sharpen your skills.
          </p>
        </header>
        <PracticeHub />
      </main>
    </div>
  );
}
