import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Camera } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PracticeHub } from "@/features/dashboard/PracticeHub";
import { AI_NAME } from "@/lib/aiPersona";

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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
        >
          <Link
            to="/snap"
            className="card flex items-center gap-4 p-4"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet text-white shadow-soft">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-bold leading-tight">Snap a problem</span>
              <span className="text-xs text-ink/55">
                Photograph any math problem and solve it interactively with {AI_NAME}
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          </Link>
        </motion.div>

        <PracticeHub />
      </main>
    </div>
  );
}
