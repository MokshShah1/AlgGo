import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * A lightweight finger/mouse drawing canvas for working out problems beside a
 * question. Pure canvas + pointer events; nothing is persisted.
 */
export function Scratchpad({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState("#6D7BFF");

  // Size the canvas backing store to its rendered size (for crisp lines).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Preserve drawing across resize by snapshotting.
      const snapshot = canvas.toDataURL();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = snapshot;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function pos(e: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = color === "#0e1320" ? 16 : 3;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function end() {
    drawing.current = false;
    last.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="animate-scale-in flex w-full max-w-lg flex-col overflow-hidden rounded-card border border-white/10 bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h3 className="text-sm font-bold text-ink">Scratchpad</h3>
          <div className="flex items-center gap-2">
            {["#6D7BFF", "#2BC172", "#F0A33C"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Pen color ${c}`}
                className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-surface ${
                  color === c ? "ring-2 ring-ink" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              type="button"
              onClick={() => setColor("#0e1320")}
              aria-label="Eraser"
              title="Eraser"
              className={`flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-ink/60 ${
                color === "#0e1320" ? "ring-2 ring-ink" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 16l6 6h8M20 8L8 20" />
                <path d="M14 4l6 6-8 8-6-6z" />
              </svg>
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="h-72 w-full touch-none bg-surface-2"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />

        <div className="flex gap-3 border-t border-white/5 px-4 py-3">
          <button type="button" onClick={clear} className="btn-ghost flex-1 py-2.5 text-sm">
            Clear
          </button>
          <button type="button" onClick={onClose} className="btn-primary flex-1 py-2.5 text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
