import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

export interface ToastOptions {
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
  /** Internal: the live toast stack (consumed by <Toaster />). */
  toasts: ToastItem[];
  /** Internal: dismiss a toast by id. */
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** How long a toast stays on screen before auto-dismissing. */
const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (opts: ToastOptions) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { ...opts, id }]);
      // Auto-dismiss; AnimatePresence handles the exit animation.
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, toasts, dismiss }),
    [showToast, toasts, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

/** Renders the toast stack. Place inside a <ToastProvider>. */
export function Toaster() {
  const ctx = useContext(ToastContext);
  const reduceMotion = useReducedMotion();
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout={!reduceMotion}
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }
            }
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-ink/10 bg-surface px-4 py-3 text-ink shadow-pop"
          >
            {toast.icon && (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet text-white shadow-soft">
                {toast.icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-ink/60">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-0.5 shrink-0 rounded-full p-1 text-ink/40 transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): { showToast: (opts: ToastOptions) => void } {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return { showToast: ctx.showToast };
}
