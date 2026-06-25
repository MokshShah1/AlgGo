import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";

const X_MIN = -6;
const X_MAX = 6;
const Y_MIN = -6;
const Y_MAX = 6;
const UNIT = 30;
const PAD = 20;

const VIEW_W = (X_MAX - X_MIN) * UNIT + PAD * 2;
const VIEW_H = (Y_MAX - Y_MIN) * UNIT + PAD * 2;

const sx = (x: number) => PAD + (x - X_MIN) * UNIT;
const sy = (y: number) => PAD + (Y_MAX - y) * UNIT;

function fmt(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

export function SandboxPage() {
  const [m, setM] = useState(1);
  const [b, setB] = useState(0);

  // Clip the line to the visible grid.
  const yAtXMin = m * X_MIN + b;
  const yAtXMax = m * X_MAX + b;

  const gridX: number[] = [];
  for (let x = X_MIN; x <= X_MAX; x++) gridX.push(x);
  const gridY: number[] = [];
  for (let y = Y_MIN; y <= Y_MAX; y++) gridY.push(y);

  const sign = m >= 0 ? "+" : "-";
  const slopeWord = m > 0 ? "uphill" : m < 0 ? "downhill" : "flat";

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-3xl md:py-8">
        <div className="animate-fade-in-up flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Free explore
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">y = mx + b playground</h1>
          <p className="text-sm text-ink/70">
            Drag the sliders and watch the line and equation change in real time.
          </p>
        </div>

        <div className="card animate-fade-in-up flex flex-col items-center gap-4 p-5">
          <div className="rounded-pill bg-accent/10 px-4 py-1.5 text-lg font-bold text-accent tabular-nums">
            y = {fmt(m)}x {sign} {fmt(Math.abs(b))}
          </div>

          <div className="w-full rounded-card border border-white/5 bg-gradient-to-b from-surface to-surface-2/60 p-3 shadow-soft">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="h-auto w-full"
              role="img"
              aria-label={`Line y equals ${fmt(m)} x ${sign} ${fmt(Math.abs(b))}. Slope ${fmt(m)} (${slopeWord}), y-intercept ${fmt(b)}.`}
            >
              <defs>
                <linearGradient id="sbLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6D7BFF" />
                  <stop offset="100%" stopColor="#9C8CFF" />
                </linearGradient>
              </defs>

              <g stroke="#273042" strokeWidth={1}>
                {gridX.map((x) => (
                  <line key={`x${x}`} x1={sx(x)} y1={sy(Y_MIN)} x2={sx(x)} y2={sy(Y_MAX)} />
                ))}
                {gridY.map((y) => (
                  <line key={`y${y}`} x1={sx(X_MIN)} y1={sy(y)} x2={sx(X_MAX)} y2={sy(y)} />
                ))}
              </g>

              <g stroke="#465070" strokeWidth={2} strokeLinecap="round">
                <line x1={sx(X_MIN)} y1={sy(0)} x2={sx(X_MAX)} y2={sy(0)} />
                <line x1={sx(0)} y1={sy(Y_MIN)} x2={sx(0)} y2={sy(Y_MAX)} />
              </g>

              {/* Slope triangle from the y-intercept, one unit of run. */}
              {m !== 0 && (
                <g>
                  <line x1={sx(0)} y1={sy(b)} x2={sx(1)} y2={sy(b)} stroke="#7E73C9" strokeWidth={2.5} strokeLinecap="round" />
                  <line x1={sx(1)} y1={sy(b)} x2={sx(1)} y2={sy(b + m)} stroke="#7E73C9" strokeWidth={2.5} strokeLinecap="round" />
                </g>
              )}

              <line
                x1={sx(X_MIN)}
                y1={sy(yAtXMin)}
                x2={sx(X_MAX)}
                y2={sy(yAtXMax)}
                stroke="url(#sbLine)"
                strokeWidth={3.5}
                strokeLinecap="round"
              />

              {/* y-intercept marker */}
              <circle cx={sx(0)} cy={sy(b)} r={5} fill="#2BC172" stroke="#fff" strokeWidth={2} />
            </svg>
          </div>

          <div className="grid w-full gap-4">
            <SliderRow
              label="Slope (m)"
              value={m}
              min={-3}
              max={3}
              step={0.5}
              onChange={setM}
              hint={slopeWord}
            />
            <SliderRow
              label="Y-intercept (b)"
              value={b}
              min={-5}
              max={5}
              step={1}
              onChange={setB}
              hint={`crosses y-axis at ${fmt(b)}`}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink/80">{label}</span>
        <span className="rounded-pill bg-surface-2 px-2.5 py-0.5 text-sm font-bold tabular-nums text-ink">
          {fmt(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
        aria-label={label}
      />
      <span className="text-xs text-ink/50">{hint}</span>
    </div>
  );
}
