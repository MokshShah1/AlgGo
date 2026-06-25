import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { GraphConfig, Point } from "@/types/lesson";
import { formatSlope } from "@/lib/fraction";

const UNIT = 40; // svg user units per grid step
const PAD = 26; // padding around the grid in svg user units

interface CoordinatePlaneProps {
  config: GraphConfig;
  pointA?: Point;
  pointB?: Point;
  onChange?: (points: { pointA: Point; pointB: Point }) => void;
  onInteract?: () => void;
  className?: string;
}

type DragTarget = "A" | "B" | null;

export function CoordinatePlane({
  config,
  pointA,
  pointB,
  onChange,
  onInteract,
  className,
}: CoordinatePlaneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragTarget = useRef<DragTarget>(null);
  const movedThisGesture = useRef(false);
  const [active, setActive] = useState<DragTarget>(null);

  const a = pointA ?? config.pointA;
  const b = pointB ?? config.pointB;

  const gridW = config.xMax - config.xMin;
  const gridH = config.yMax - config.yMin;
  const viewW = gridW * UNIT + PAD * 2;
  const viewH = gridH * UNIT + PAD * 2;

  const sx = (x: number) => PAD + (x - config.xMin) * UNIT;
  const sy = (y: number) => PAD + (config.yMax - y) * UNIT;

  const rise = b.y - a.y;
  const run = b.x - a.x;
  const slopeText = formatSlope(rise, run);
  const verticalLine = run === 0;

  function clientToGrid(clientX: number, clientY: number): Point {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * viewW;
    const svgY = ((clientY - rect.top) / rect.height) * viewH;
    let gx = Math.round((svgX - PAD) / UNIT + config.xMin);
    let gy = Math.round(config.yMax - (svgY - PAD) / UNIT);
    gx = Math.min(config.xMax, Math.max(config.xMin, gx));
    gy = Math.min(config.yMax, Math.max(config.yMin, gy));
    return { x: gx, y: gy };
  }

  function canDrag(target: "A" | "B"): boolean {
    return config.draggable === "both" || config.draggable === target;
  }

  function handlePointerDown(
    target: "A" | "B",
    event: ReactPointerEvent<SVGGElement>
  ) {
    if (!canDrag(target)) return;
    event.preventDefault();
    dragTarget.current = target;
    setActive(target);
    movedThisGesture.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGGElement>) {
    if (!dragTarget.current || !onChange) return;
    event.preventDefault();
    const next = clientToGrid(event.clientX, event.clientY);
    const moving = dragTarget.current;
    const other = moving === "A" ? b : a;

    if (config.preventVertical && next.x === other.x) {
      next.x = next.x < config.xMax ? next.x + 1 : next.x - 1;
    }

    const current = moving === "A" ? a : b;
    if (next.x === current.x && next.y === current.y) return;

    if (!movedThisGesture.current) {
      movedThisGesture.current = true;
      onInteract?.();
    }

    if (moving === "A") onChange({ pointA: next, pointB: b });
    else onChange({ pointA: a, pointB: next });
  }

  function handlePointerUp(event: ReactPointerEvent<SVGGElement>) {
    if (!dragTarget.current) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    dragTarget.current = null;
    setActive(null);
  }

  const gridLines: number[] = [];
  for (let x = config.xMin; x <= config.xMax; x++) gridLines.push(x);
  const gridLinesY: number[] = [];
  for (let y = config.yMin; y <= config.yMax; y++) gridLinesY.push(y);

  const corner = { x: b.x, y: a.y };

  const lineY1 = verticalLine
    ? sy(config.yMin)
    : sy(a.y + (config.xMin - a.x) * (rise / run));
  const lineY2 = verticalLine
    ? sy(config.yMax)
    : sy(a.y + (config.xMax - a.x) * (rise / run));

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="h-auto w-full animate-fade-in touch-none select-none overflow-visible"
        role="img"
        aria-label={`Coordinate plane. Point A at ${a.x}, ${a.y}. Point B at ${b.x}, ${b.y}. Rise ${rise}, run ${run}, slope ${slopeText}.`}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6D7BFF" />
            <stop offset="100%" stopColor="#9C8CFF" />
          </linearGradient>
          <filter id="ptShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2.5"
              floodColor="#000000"
              floodOpacity="0.5"
            />
          </filter>
        </defs>

        {/* Grid */}
        <g stroke="#273042" strokeWidth={1}>
          {gridLines.map((x) => (
            <line key={`vx-${x}`} x1={sx(x)} y1={sy(config.yMin)} x2={sx(x)} y2={sy(config.yMax)} />
          ))}
          {gridLinesY.map((y) => (
            <line key={`hy-${y}`} x1={sx(config.xMin)} y1={sy(y)} x2={sx(config.xMax)} y2={sy(y)} />
          ))}
        </g>

        {/* Axes */}
        <g stroke="#465070" strokeWidth={2} strokeLinecap="round">
          {config.yMin <= 0 && config.yMax >= 0 && (
            <line x1={sx(config.xMin)} y1={sy(0)} x2={sx(config.xMax)} y2={sy(0)} />
          )}
          {config.xMin <= 0 && config.xMax >= 0 && (
            <line x1={sx(0)} y1={sy(config.yMin)} x2={sx(0)} y2={sy(config.yMax)} />
          )}
        </g>

        {/* Slope triangle */}
        {config.showTriangle && !verticalLine && (
          <g>
            <polygon
              points={`${sx(a.x)},${sy(a.y)} ${sx(corner.x)},${sy(corner.y)} ${sx(b.x)},${sy(b.y)}`}
              fill="#9C8CFF"
              fillOpacity={0.18}
            />
            <line
              x1={sx(a.x)}
              y1={sy(a.y)}
              x2={sx(corner.x)}
              y2={sy(corner.y)}
              stroke={config.highlight === "run" ? "#8FA0FF" : "#7E73C9"}
              strokeWidth={config.highlight === "run" ? 5 : 3}
              strokeLinecap="round"
            />
            <line
              x1={sx(corner.x)}
              y1={sy(corner.y)}
              x2={sx(b.x)}
              y2={sy(b.y)}
              stroke={config.highlight === "rise" ? "#8FA0FF" : "#7E73C9"}
              strokeWidth={config.highlight === "rise" ? 5 : 3}
              strokeLinecap="round"
            />
            <text
              x={(sx(a.x) + sx(corner.x)) / 2}
              y={sy(a.y) + (rise >= 0 ? 17 : -9)}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill="#C4BBFF"
              stroke="#171D2B"
              strokeWidth={3}
              style={{ paintOrder: "stroke" }}
            >
              run {run}
            </text>
            <text
              x={sx(corner.x) + (run >= 0 ? 9 : -9)}
              y={(sy(corner.y) + sy(b.y)) / 2 + 4}
              textAnchor={run >= 0 ? "start" : "end"}
              fontSize={13}
              fontWeight={700}
              fill="#C4BBFF"
              stroke="#171D2B"
              strokeWidth={3}
              style={{ paintOrder: "stroke" }}
            >
              rise {rise}
            </text>
          </g>
        )}

        {/* Line through A and B */}
        {config.showLine && (
          <line
            x1={verticalLine ? sx(a.x) : sx(config.xMin)}
            y1={lineY1}
            x2={verticalLine ? sx(a.x) : sx(config.xMax)}
            y2={lineY2}
            stroke="url(#lineGrad)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Points */}
        <PointHandle
          label="A"
          cx={sx(a.x)}
          cy={sy(a.y)}
          color="#2BC172"
          draggable={canDrag("A")}
          active={active === "A"}
          onPointerDown={(e) => handlePointerDown("A", e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <PointHandle
          label="B"
          cx={sx(b.x)}
          cy={sy(b.y)}
          color="#6D7BFF"
          draggable={canDrag("B")}
          active={active === "B"}
          onPointerDown={(e) => handlePointerDown("B", e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </svg>

      {config.showSlopeLabel && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="rounded-pill bg-violet/10 px-3 py-1 font-medium text-ink/70">
            rise <span className="font-bold text-ink">{rise}</span>
          </span>
          <span className="rounded-pill bg-violet/10 px-3 py-1 font-medium text-ink/70">
            run <span className="font-bold text-ink">{run}</span>
          </span>
          <span className="rounded-pill bg-accent/10 px-3 py-1 font-medium text-accent">
            slope <span className="font-bold">{slopeText}</span>
          </span>
        </div>
      )}
    </div>
  );
}

interface PointHandleProps {
  label: string;
  cx: number;
  cy: number;
  color: string;
  draggable: boolean;
  active: boolean;
  onPointerDown: (e: ReactPointerEvent<SVGGElement>) => void;
  onPointerMove: (e: ReactPointerEvent<SVGGElement>) => void;
  onPointerUp: (e: ReactPointerEvent<SVGGElement>) => void;
}

function PointHandle({
  label,
  cx,
  cy,
  color,
  draggable,
  active,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: PointHandleProps) {
  return (
    <g
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: draggable ? (active ? "grabbing" : "grab") : "default" }}
    >
      {/* Large invisible hit area for easy touch dragging */}
      <circle cx={cx} cy={cy} r={24} fill="transparent" />
      {draggable && (
        <circle
          cx={cx}
          cy={cy}
          r={11}
          fill={color}
          opacity={0.35}
          className="animate-pulse-ring"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={active ? 10 : 7.5}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2.5}
        filter="url(#ptShadow)"
        style={{ transition: "r 0.12s ease-out" }}
      />
      <text
        x={cx + 12}
        y={cy - 12}
        fontSize={13}
        fontWeight={800}
        fill={color}
        stroke="#171D2B"
        strokeWidth={3}
        style={{ paintOrder: "stroke" }}
      >
        {label}
      </text>
    </g>
  );
}
