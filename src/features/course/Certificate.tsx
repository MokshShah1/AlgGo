import { useRef } from "react";

/**
 * A shareable "chapter complete" certificate. Shows a styled card on screen and
 * can export a PNG (download or native share) drawn on an offscreen canvas.
 */
export function Certificate({
  name,
  courseTitle,
}: {
  name: string;
  courseTitle: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function draw(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const W = (canvas.width = 1200);
    const H = (canvas.height = 850);

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0E1320");
    bg.addColorStop(1, "#1B2138");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = "#6D7BFF";
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.strokeStyle = "rgba(156,140,255,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    ctx.textAlign = "center";

    ctx.fillStyle = "#9C8CFF";
    ctx.font = "bold 30px Inter, Arial, sans-serif";
    ctx.fillText("CERTIFICATE OF COMPLETION", W / 2, 200);

    ctx.fillStyle = "#EAEEF7";
    ctx.font = "24px Inter, Arial, sans-serif";
    ctx.fillText("This certifies that", W / 2, 300);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 64px Inter, Arial, sans-serif";
    ctx.fillText(name || "Learner", W / 2, 390);

    ctx.fillStyle = "#EAEEF7";
    ctx.font = "24px Inter, Arial, sans-serif";
    ctx.fillText("has successfully completed the chapter", W / 2, 470);

    ctx.fillStyle = "#6D7BFF";
    ctx.font = "bold 38px Inter, Arial, sans-serif";
    wrapText(ctx, courseTitle, W / 2, 540, W - 240, 46);

    ctx.fillStyle = "rgba(234,238,247,0.7)";
    ctx.font = "22px Inter, Arial, sans-serif";
    ctx.fillText(dateStr, W / 2, 700);

    ctx.fillStyle = "#9C8CFF";
    ctx.font = "bold 26px Inter, Arial, sans-serif";
    ctx.fillText("AlgGo - Learn by doing", W / 2, 750);

    return canvas;
  }

  function handleDownload() {
    const canvas = draw();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "alggo-certificate.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function handleShare() {
    const canvas = draw();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "alggo-certificate.png", {
        type: "image/png",
      });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "I finished the chapter!",
            text: `I completed ${courseTitle} on AlgGo!`,
          });
          return;
        } catch {
          /* user cancelled - fall through to download */
        }
      }
      handleDownload();
    }, "image/png");
  }

  return (
    <div className="animate-fade-in-up stagger-2 flex flex-col gap-3">
      {/* On-screen certificate preview */}
      <div className="relative overflow-hidden rounded-card border-2 border-accent/60 bg-gradient-to-br from-canvas to-surface-2 p-6 text-center shadow-pop">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet/20 blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet">
          Certificate of Completion
        </p>
        <p className="mt-3 text-xs text-ink/60">This certifies that</p>
        <p className="mt-1 text-2xl font-extrabold text-ink">{name || "Learner"}</p>
        <p className="mt-2 text-xs text-ink/60">completed the chapter</p>
        <p className="mt-1 text-sm font-bold gradient-text">{courseTitle}</p>
        <p className="mt-3 text-[11px] text-ink/40">{dateStr}</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={handleShare} className="btn-primary flex-1">
          Share
        </button>
        <button type="button" onClick={handleDownload} className="btn-ghost flex-1">
          Download
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}
