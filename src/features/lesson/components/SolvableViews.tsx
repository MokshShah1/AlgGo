import {
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motion, Reorder } from "motion/react";
import {
  Check,
  GripVertical,
  Layers,
  MapPin,
  Table2,
} from "lucide-react";
import type {
  CategorizeSolvable,
  ChoiceOption,
  ChoiceSolvable,
  GraphTargetSolvable,
  MultiSelectSolvable,
  NumberLineSolvable,
  NumericSolvable,
  ObserveSolvable,
  SliderSolvable,
  TableFillSolvable,
  Point,
} from "@/types/lesson";
import { CoordinatePlane } from "@/components/graph/CoordinatePlane";

export type AnswerStatus = "idle" | "correct" | "wrong";

interface Points {
  pointA: Point;
  pointB: Point;
}

function GraphFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border border-white/5 bg-gradient-to-b from-surface to-surface-2/60 p-3 shadow-soft">
      {children}
    </div>
  );
}

export function ObserveView({
  solvable,
  points,
  onChange,
  onInteract,
}: {
  solvable: ObserveSolvable;
  points: Points;
  onChange: (p: Points) => void;
  onInteract: () => void;
}) {
  return (
    <div className="animate-fade-in-up">
      <GraphFrame>
        <CoordinatePlane
          config={solvable.graph}
          pointA={points.pointA}
          pointB={points.pointB}
          onChange={onChange}
          onInteract={onInteract}
        />
        <p className="mt-1 text-center text-xs font-medium text-accent">
          Drag a point to explore
        </p>
      </GraphFrame>
    </div>
  );
}

export function GraphTargetView({
  solvable,
  points,
  onChange,
  onInteract,
}: {
  solvable: GraphTargetSolvable;
  points: Points;
  onChange: (p: Points) => void;
  onInteract: () => void;
}) {
  return (
    <div className="animate-fade-in-up">
      <GraphFrame>
        <CoordinatePlane
          config={solvable.graph}
          pointA={points.pointA}
          pointB={points.pointB}
          onChange={onChange}
          onInteract={onInteract}
        />
        <p className="mt-1 text-center text-xs font-medium text-accent">
          Drag point B - point A stays fixed
        </p>
      </GraphFrame>
    </div>
  );
}

export function NumericView({
  solvable,
  value,
  status,
  onChange,
  onSubmit,
  disabled,
}: {
  solvable: NumericSolvable;
  value: string;
  status: AnswerStatus;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const stateClass =
    status === "correct"
      ? "border-correct ring-4 ring-correct/20 animate-pop"
      : status === "wrong"
        ? "border-danger ring-4 ring-danger/15 animate-shake"
        : "border-white/10 focus:border-accent focus:ring-4 focus:ring-accent/20";

  return (
    <div className="flex animate-fade-in-up flex-col gap-3">
      {solvable.graph && (
        <GraphFrame>
          <CoordinatePlane config={solvable.graph} />
        </GraphFrame>
      )}
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder={solvable.placeholder ?? "Your answer"}
        className={`w-full rounded-card border-2 bg-surface-2 px-4 py-4 text-center text-2xl font-bold text-ink outline-none transition-all duration-200 placeholder:text-ink/30 disabled:opacity-70 ${stateClass}`}
      />
    </div>
  );
}

export function ChoiceView({
  solvable,
  selected,
  status,
  onSelect,
  disabled,
}: {
  solvable: ChoiceSolvable;
  selected: string | null;
  status: AnswerStatus;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const isTiles = solvable.variant === "tiles";

  return (
    <div className="flex animate-fade-in-up flex-col gap-3">
      {solvable.graph && (
        <GraphFrame>
          <CoordinatePlane config={solvable.graph} />
        </GraphFrame>
      )}
      <div
        className={
          isTiles ? "grid grid-cols-1 gap-3 sm:grid-cols-3" : "flex flex-col gap-3"
        }
      >
        {solvable.options.map((option, i) => {
          const isSelected = selected === option.id;
          const isCorrectOption = option.id === solvable.correctOptionId;

          // Visual state after a check.
          let tone =
            "border-white/10 bg-surface-2 text-ink/85 hover:border-accent/50 hover:-translate-y-0.5 hover:shadow-soft";
          if (status === "correct" && isSelected) {
            tone = "border-correct bg-correct/15 text-ink font-semibold animate-pop";
          } else if (status === "wrong" && isSelected) {
            tone = "border-danger bg-danger/15 text-ink animate-shake";
          } else if (status === "wrong" && isCorrectOption) {
            tone = "border-correct bg-correct/10 text-ink ring-2 ring-correct/40";
          } else if (status === "idle" && isSelected) {
            tone = "border-accent bg-accent/15 text-ink font-semibold shadow-soft";
          }

          return (
            <motion.button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.id)}
              aria-pressed={isSelected}
              whileTap={{ scale: 0.96 }}
              style={{ animationDelay: `${i * 45}ms` }}
              className={`animate-fade-in-up rounded-card border-2 px-4 py-4 text-left text-base transition-all duration-200 disabled:cursor-default ${tone} ${
                isTiles ? "text-center text-lg font-semibold" : ""
              }`}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function MultiSelectView({
  solvable,
  selected,
  status,
  onToggle,
  disabled,
}: {
  solvable: MultiSelectSolvable;
  selected: string[];
  status: AnswerStatus;
  onToggle: (id: string) => void;
  disabled: boolean;
}) {
  const correctSet = new Set(solvable.correctOptionIds);
  return (
    <div className="flex animate-fade-in-up flex-col gap-3">
      {solvable.graph && (
        <GraphFrame>
          <CoordinatePlane config={solvable.graph} />
        </GraphFrame>
      )}
      <p className="text-xs font-semibold text-accent">Select all that apply</p>
      <div className="flex flex-col gap-3">
        {solvable.options.map((option, i) => {
          const isSelected = selected.includes(option.id);
          const isCorrectOption = correctSet.has(option.id);

          let tone =
            "border-white/10 bg-surface-2 text-ink/85 hover:border-accent/50";
          if (status !== "idle" && isSelected && isCorrectOption) {
            tone = "border-correct bg-correct/15 text-ink";
          } else if (status !== "idle" && isSelected && !isCorrectOption) {
            tone = "border-danger bg-danger/15 text-ink";
          } else if (status === "wrong" && !isSelected && isCorrectOption) {
            tone = "border-correct/60 bg-correct/5 text-ink";
          } else if (isSelected) {
            tone = "border-accent bg-accent/15 text-ink font-semibold";
          }

          return (
            <motion.button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(option.id)}
              aria-pressed={isSelected}
              whileTap={{ scale: 0.97 }}
              style={{ animationDelay: `${i * 45}ms` }}
              className={`flex animate-fade-in-up items-center gap-3 rounded-card border-2 px-4 py-3.5 text-left text-base transition-all duration-200 disabled:cursor-default ${tone}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-ink/25"
                }`}
              >
                {isSelected && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
              </span>
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function OrderView({
  order,
  status,
  onChange,
  disabled,
}: {
  order: ChoiceOption[];
  status: AnswerStatus;
  onChange: (order: ChoiceOption[]) => void;
  disabled: boolean;
}) {
  const ring =
    status === "correct"
      ? "border-correct/50"
      : status === "wrong"
        ? "border-danger/50"
        : "border-white/10";

  return (
    <div className="flex animate-fade-in-up flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
        <GripVertical className="h-4 w-4" aria-hidden="true" />
        Drag the cards to put them in order (top = first)
      </p>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={onChange}
        className={`flex flex-col gap-2 rounded-card border-2 p-2 ${ring}`}
      >
        {order.map((item, i) => (
          <Reorder.Item
            key={item.id}
            value={item}
            dragListener={!disabled}
            whileDrag={{
              scale: 1.03,
              boxShadow: "0 10px 28px rgb(0 0 0 / 0.35)",
              cursor: "grabbing",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className={`flex select-none items-center gap-3 rounded-card border border-white/10 bg-surface-2 px-3 py-3 touch-none ${
              disabled ? "" : "cursor-grab active:cursor-grabbing"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-ink">
              {item.label}
            </span>
            <GripVertical
              className="h-5 w-5 shrink-0 text-ink/30"
              aria-hidden="true"
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

export function SliderView({
  solvable,
  value,
  status,
  onChange,
  disabled,
}: {
  solvable: SliderSolvable;
  value: number;
  status: AnswerStatus;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const valueColor =
    status === "correct"
      ? "text-correct"
      : status === "wrong"
        ? "text-danger"
        : "text-accent";
  return (
    <div className="flex animate-fade-in-up flex-col gap-4">
      {solvable.graph && (
        <GraphFrame>
          <CoordinatePlane config={solvable.graph} />
        </GraphFrame>
      )}
      <div className="text-center">
        <span className={`text-5xl font-extrabold tabular-nums ${valueColor}`}>
          {value}
          {solvable.unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={solvable.min}
        max={solvable.max}
        step={solvable.step ?? 1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input w-full"
        aria-label={solvable.prompt}
      />
      <div className="flex justify-between text-xs font-medium text-ink/40">
        <span>
          {solvable.min}
          {solvable.unit ?? ""}
        </span>
        <span>
          {solvable.max}
          {solvable.unit ?? ""}
        </span>
      </div>
    </div>
  );
}

function rectContains(
  el: HTMLElement | null,
  point: { x: number; y: number }
): boolean {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return (
    point.x >= r.left &&
    point.x <= r.right &&
    point.y >= r.top &&
    point.y <= r.bottom
  );
}

export function CategorizeView({
  solvable,
  placement,
  status,
  onPlace,
  disabled,
}: {
  solvable: CategorizeSolvable;
  placement: Record<string, string>;
  status: AnswerStatus;
  /** Move an item into a category, or back to the tray when categoryId is null. */
  onPlace: (itemId: string, categoryId: string | null) => void;
  disabled: boolean;
}) {
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const trayRef = useRef<HTMLDivElement | null>(null);
  const unassigned = solvable.items.filter((item) => !placement[item.id]);

  // Tapping (rather than dragging) cycles an item to the next bucket so the
  // interaction still works for keyboard / no-drag users.
  function nextBucket(itemId: string): string | null {
    const current = placement[itemId];
    const idx = current
      ? solvable.categories.findIndex((c) => c.id === current)
      : -1;
    const next = idx + 1;
    return next >= solvable.categories.length
      ? null
      : solvable.categories[next].id;
  }

  function handleDrop(itemId: string, point: { x: number; y: number }) {
    for (const category of solvable.categories) {
      if (rectContains(zoneRefs.current[category.id], point)) {
        onPlace(itemId, category.id);
        return;
      }
    }
    if (rectContains(trayRef.current, point)) {
      onPlace(itemId, null);
    }
    // Dropped outside any zone: leave it where it was (chip snaps back).
  }

  function chipTone(itemId: string, categoryId: string) {
    if (status === "idle") {
      return "border-accent/60 bg-accent/15 text-ink";
    }
    const correct = placement[itemId] === categoryId;
    return correct
      ? "border-correct bg-correct/15 text-ink"
      : "border-danger bg-danger/15 text-ink";
  }

  function Chip({
    item,
    className,
  }: {
    item: { id: string; label: string };
    className: string;
  }) {
    return (
      <motion.button
        type="button"
        disabled={disabled}
        drag={!disabled}
        dragSnapToOrigin
        dragMomentum={false}
        whileDrag={{ scale: 1.08, zIndex: 50, cursor: "grabbing" }}
        onDragEnd={(_, info) => {
          if (!disabled) handleDrop(item.id, info.point);
        }}
        onClick={() => {
          if (!disabled) onPlace(item.id, nextBucket(item.id));
        }}
        className={`touch-none select-none rounded-pill border-2 px-3 py-2 text-sm font-medium transition-colors disabled:cursor-default ${
          disabled ? "" : "cursor-grab active:cursor-grabbing"
        } ${className}`}
      >
        {item.label}
      </motion.button>
    );
  }

  return (
    <div className="flex animate-fade-in-up flex-col gap-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
        <Layers className="h-4 w-4" aria-hidden="true" />
        Drag each item into a group (or tap to cycle it)
      </p>

      <div
        ref={trayRef}
        className={`rounded-card border-2 border-dashed p-3 transition-colors ${
          unassigned.length > 0
            ? "border-white/15 bg-surface-2/40"
            : "border-white/10 bg-surface-2/20"
        }`}
      >
        <p className="mb-2 text-xs font-medium text-ink/50">
          To sort ({unassigned.length})
        </p>
        <div className="flex min-h-[2.5rem] flex-wrap gap-2">
          {unassigned.length === 0 ? (
            <span className="self-center text-xs text-ink/30">
              All sorted - drag one back here to undo.
            </span>
          ) : (
            unassigned.map((item) => (
              <Chip
                key={item.id}
                item={item}
                className="border-white/15 bg-surface-2 text-ink/85"
              />
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {solvable.categories.map((category) => {
          const itemsHere = solvable.items.filter(
            (item) => placement[item.id] === category.id
          );
          return (
            <div
              key={category.id}
              ref={(el) => {
                zoneRefs.current[category.id] = el;
              }}
              className="flex flex-col gap-2 rounded-card border-2 border-white/10 bg-surface-2/60 p-3 transition-colors"
            >
              <p className="text-sm font-bold text-ink">{category.label}</p>
              <div className="flex min-h-[2.5rem] flex-wrap gap-2">
                {itemsHere.length === 0 ? (
                  <span className="self-center text-xs text-ink/30">
                    Drop items here
                  </span>
                ) : (
                  itemsHere.map((item) => (
                    <Chip
                      key={item.id}
                      item={item}
                      className={chipTone(item.id, category.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NumberLineView({
  solvable,
  value,
  status,
  onChange,
  disabled,
}: {
  solvable: NumberLineSolvable;
  value: number;
  status: AnswerStatus;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { min, max } = solvable;
  const step = solvable.step ?? 1;
  const range = max - min || 1;
  const pct = ((value - min) / range) * 100;

  const stepsCount = Math.max(1, Math.round(range / step));
  const ticks = Array.from(
    { length: stepsCount + 1 },
    (_, i) => min + i * step
  );
  const labelEvery = Math.ceil((stepsCount + 1) / 9);

  const valueColor =
    status === "correct"
      ? "text-correct"
      : status === "wrong"
        ? "text-danger"
        : "text-accent";
  const markerColor =
    status === "correct"
      ? "bg-correct"
      : status === "wrong"
        ? "bg-danger"
        : "bg-accent";

  function valueFromClientX(clientX: number): number {
    const el = trackRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + ratio * range;
    const snapped = Math.round((raw - min) / step) * step + min;
    return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
  }

  function handleDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(valueFromClientX(e.clientX));
  }
  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || e.buttons === 0) return;
    onChange(valueFromClientX(e.clientX));
  }
  function handleKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(min, value - step));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(max, value + step));
    }
  }

  return (
    <div className="flex animate-fade-in-up flex-col gap-5">
      <div className="text-center">
        <span className={`text-5xl font-extrabold tabular-nums ${valueColor}`}>
          {value}
          {solvable.unit ?? ""}
        </span>
      </div>

      <div className="px-4 pb-2 pt-6">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={solvable.prompt}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onKeyDown={handleKey}
          className="number-line-track relative h-2 cursor-pointer rounded-full bg-surface-2 outline-none focus-visible:ring-4 focus-visible:ring-accent/30"
        >
          {ticks.map((tick, i) => {
            const tPct = ((tick - min) / range) * 100;
            const showLabel = i % labelEvery === 0 || i === ticks.length - 1;
            return (
              <div
                key={tick}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${tPct}%` }}
              >
                <div className="mx-auto h-2.5 w-0.5 rounded bg-ink/25" />
                {showLabel && (
                  <span className="absolute left-1/2 top-3 -translate-x-1/2 text-[0.65rem] font-medium tabular-nums text-ink/50">
                    {tick}
                  </span>
                )}
              </div>
            );
          })}

          <div
            className={`absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface shadow-pop transition-colors ${markerColor}`}
            style={{ left: `${pct}%` }}
          >
            <MapPin
              className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableFillView({
  solvable,
  values,
  status,
  onChange,
  disabled,
}: {
  solvable: TableFillSolvable;
  values: string[];
  status: AnswerStatus;
  onChange: (index: number, value: string) => void;
  disabled: boolean;
}) {
  const inputTone =
    status === "correct"
      ? "border-correct ring-2 ring-correct/20"
      : status === "wrong"
        ? "border-danger ring-2 ring-danger/15"
        : "border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <div className="flex animate-fade-in-up flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
        <Table2 className="h-4 w-4" aria-hidden="true" />
        Fill in the missing values
      </p>
      <div className="overflow-hidden rounded-card border-2 border-white/10">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="bg-surface-2/80 text-sm font-bold text-ink">
              <th className="border-b border-white/10 px-3 py-2.5">
                {solvable.columns.x}
              </th>
              <th className="border-b border-white/10 px-3 py-2.5">
                {solvable.columns.y}
              </th>
            </tr>
          </thead>
          <tbody>
            {solvable.rows.map((row, i) => (
              <tr key={row.label} className="odd:bg-surface-2/30">
                <td className="border-t border-white/5 px-3 py-2 text-lg font-semibold tabular-nums text-ink/80">
                  {row.label}
                </td>
                <td className="border-t border-white/5 px-2 py-2">
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    value={values[i] ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange(i, e.target.value)}
                    placeholder="?"
                    aria-label={`${solvable.columns.y} when ${solvable.columns.x} = ${row.label}`}
                    className={`w-full rounded-lg border-2 bg-surface px-3 py-2 text-center text-lg font-bold text-ink outline-none transition-all duration-200 placeholder:text-ink/25 disabled:opacity-70 ${inputTone}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
