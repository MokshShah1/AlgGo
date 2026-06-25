import { dayKey } from "@/features/progress/activity";

const WEEKS = 12;
const DAYS = WEEKS * 7;

/** GitHub-style activity heatmap of the last ~12 weeks. */
export function ActivityCalendar({
  activity,
}: {
  activity: Map<string, number>;
}) {
  // Start on the Sunday that begins the window ending today.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (DAYS - 1));
  start.setDate(start.getDate() - start.getDay()); // back up to Sunday

  const columns: { key: string; count: number; future: boolean }[][] = [];
  const cursor = new Date(start);
  let totalActive = 0;
  let maxCount = 1;
  for (const v of activity.values()) maxCount = Math.max(maxCount, v);

  for (let w = 0; w < WEEKS + 1; w++) {
    const col: { key: string; count: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const key = dayKey(cursor);
      const count = activity.get(key) ?? 0;
      const future = cursor.getTime() > today.getTime();
      if (count > 0 && !future) totalActive++;
      col.push({ key, count, future });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(col);
  }

  function level(count: number): string {
    if (count <= 0) return "bg-ink/10";
    const ratio = count / maxCount;
    if (ratio > 0.66) return "bg-accent";
    if (ratio > 0.33) return "bg-accent/70";
    return "bg-accent/40";
  }

  return (
    <div className="card animate-fade-in-up stagger-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
          Activity
        </h2>
        <span className="text-xs text-ink/50">{totalActive} active days</span>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((cell) => (
              <span
                key={cell.key}
                title={`${cell.key}: ${cell.count} attempt${cell.count === 1 ? "" : "s"}`}
                className={`h-3 w-3 rounded-[3px] ${
                  cell.future ? "bg-transparent" : level(cell.count)
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-ink/40">
        <span>Less</span>
        <span className="h-2.5 w-2.5 rounded-[3px] bg-ink/10" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-accent/40" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-accent/70" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-accent" />
        <span>More</span>
      </div>
    </div>
  );
}
