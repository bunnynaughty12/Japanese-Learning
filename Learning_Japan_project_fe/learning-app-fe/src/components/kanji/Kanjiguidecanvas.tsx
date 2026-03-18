"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Eye, EyeOff, Pause, Play, RotateCcw } from "lucide-react";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const CANVAS_SIZE = 400;
const SVG_VIEWBOX = 109; // KanjiVG standard; adjust if BE uses different scale
const STROKE_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

// ms each stroke takes to draw (adjust for speed feel)
const STROKE_DURATION_MS = 900;
// pause between strokes
const STROKE_PAUSE_MS = 400;
// pause before restarting loop
const LOOP_PAUSE_MS = 1600;

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface GuideCanvasProps {
  svgStrokes: string[];
  isDarkMode: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

/** Get total arc-length of an SVG path string using an offscreen SVG element */
function getPathLength(d: string): number {
  if (typeof document === "undefined") return 300;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.style.cssText = "position:absolute;visibility:hidden;width:0;height:0";
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const len = path.getTotalLength();
  document.body.removeChild(svg);
  return len || 100;
}

/** Sample N+1 evenly-spaced points along an SVG path */
function samplePath(d: string, n = 80): { x: number; y: number }[] {
  if (typeof document === "undefined") return [];
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.style.cssText = "position:absolute;visibility:hidden;width:0;height:0";
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const len = path.getTotalLength();
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const pt = path.getPointAtLength((i / n) * len);
    pts.push({ x: pt.x, y: pt.y });
  }
  document.body.removeChild(svg);
  return pts;
}

/** Map a point from the SVG coordinate space to canvas pixels */
function toCanvas(
  p: { x: number; y: number },
  sourceSize: number,
  canvasSize: number
) {
  return {
    x: (p.x / sourceSize) * canvasSize,
    y: (p.y / sourceSize) * canvasSize,
  };
}

/** Pressure multiplier — tapers at start/end like a real brush */
function pressure(i: number, total: number): number {
  const t = i / Math.max(total - 1, 1);
  return Math.sin(t * Math.PI) * 0.55 + 0.45;
}

/* ─── Draw helpers ───────────────────────────────────────────────────────────── */

function drawGrid(ctx: CanvasRenderingContext2D, dark: boolean, size: number) {
  ctx.save();
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawCompleteStroke(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  color: string,
  canvasSize: number,
  sourceSize: number
) {
  if (pts.length < 2) return;
  const mapped = pts.map((p) => toCanvas(p, sourceSize, canvasSize));
  for (let i = 1; i < mapped.length; i++) {
    const p = pressure(i, mapped.length);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, 13 * p);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.moveTo(mapped[i - 1].x, mapped[i - 1].y);
    ctx.lineTo(mapped[i].x, mapped[i].y);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPartialStroke(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  progress: number, // 0..1
  color: string,
  canvasSize: number,
  sourceSize: number
) {
  const upTo = Math.max(2, Math.floor(pts.length * progress));
  const slice = pts.slice(0, upTo);
  if (slice.length < 2) return;
  const mapped = slice.map((p) => toCanvas(p, sourceSize, canvasSize));

  for (let i = 1; i < mapped.length; i++) {
    const p = pressure(i, pts.length);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, 13 * p);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(mapped[i - 1].x, mapped[i - 1].y);
    ctx.lineTo(mapped[i].x, mapped[i].y);
    ctx.stroke();
    ctx.restore();
  }

  // Glowing brush tip
  const tip = toCanvas(slice[slice.length - 1], sourceSize, canvasSize);
  ctx.save();
  const grad = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 10);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.4, color + "cc");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStrokeNumber(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  idx: number,
  color: string,
  canvasSize: number,
  sourceSize: number
) {
  const mid = pts[Math.floor(pts.length / 2)];
  if (!mid) return;
  const { x, y } = toCanvas(mid, sourceSize, canvasSize);
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(x + 16, y - 16, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(idx + 1), x + 16, y - 16);
  ctx.restore();
}

/* ─── Component ──────────────────────────────────────────────────────────────── */

export default function KanjiGuideCanvas({
  svgStrokes,
  isDarkMode,
}: GuideCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(true);

  const [isPlaying, setIsPlaying] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  // Pre-sample all strokes once
  const sampledRef = useRef<{ x: number; y: number }[][]>([]);
  useEffect(() => {
    sampledRef.current = svgStrokes.map((d) => samplePath(d, 80));
  }, [svgStrokes]);

  /* ── Render helpers ── */
  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const renderBase = useCallback(
    (ctx: CanvasRenderingContext2D, completedUpTo: number) => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      drawGrid(ctx, isDarkMode, CANVAS_SIZE);
      for (let i = 0; i < completedUpTo; i++) {
        const pts = sampledRef.current[i];
        if (!pts || pts.length < 2) continue;
        const color = STROKE_COLORS[i % STROKE_COLORS.length];
        drawCompleteStroke(ctx, pts, color, CANVAS_SIZE, SVG_VIEWBOX);
        drawStrokeNumber(ctx, pts, i, color, CANVAS_SIZE, SVG_VIEWBOX);
      }
    },
    [isDarkMode]
  );

  const renderAll = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    renderBase(ctx, svgStrokes.length);
  }, [renderBase, svgStrokes.length]);

  /* ── Animation loop ── */
  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
  }, []);

  const animateStroke = useCallback(
    (strokeIdx: number) => {
      if (!playingRef.current) return;

      // All strokes done — pause, clear, restart
      if (strokeIdx >= svgStrokes.length) {
        timerRef.current = setTimeout(() => {
          if (!playingRef.current) return;
          const ctx = getCtx();
          if (ctx) renderBase(ctx, 0);
          timerRef.current = setTimeout(() => {
            if (playingRef.current) animateStroke(0);
          }, 500);
        }, LOOP_PAUSE_MS);
        return;
      }

      const ctx = getCtx();
      if (!ctx) return;

      const pts = sampledRef.current[strokeIdx];
      if (!pts || pts.length < 2) {
        animateStroke(strokeIdx + 1);
        return;
      }

      const color = STROKE_COLORS[strokeIdx % STROKE_COLORS.length];
      const startTime = performance.now();

      const step = (now: number) => {
        if (!playingRef.current) return;
        const elapsed = now - startTime;
        // Ease-in-out progress
        const linear = Math.min(elapsed / STROKE_DURATION_MS, 1);
        const progress =
          linear < 0.5
            ? 2 * linear * linear
            : 1 - Math.pow(-2 * linear + 2, 2) / 2;

        renderBase(ctx, strokeIdx);
        drawPartialStroke(ctx, pts, progress, color, CANVAS_SIZE, SVG_VIEWBOX);

        if (linear < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          // Stroke complete — draw finished version, wait, then next stroke
          renderBase(ctx, strokeIdx + 1);
          timerRef.current = setTimeout(() => {
            if (playingRef.current) animateStroke(strokeIdx + 1);
          }, STROKE_PAUSE_MS);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [svgStrokes.length, renderBase]
  );

  const startAnim = useCallback(() => {
    stop();
    playingRef.current = true;
    setIsPlaying(true);
    const ctx = getCtx();
    if (ctx) renderBase(ctx, 0);
    animateStroke(0);
  }, [stop, animateStroke, renderBase]);

  const pauseAnim = useCallback(() => {
    stop();
    playingRef.current = false;
    setIsPlaying(false);
    renderAll();
  }, [stop, renderAll]);

  /* ── Lifecycle ── */
  useEffect(() => {
    if (svgStrokes.length > 0) startAnim();
    return () => {
      playingRef.current = false;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgStrokes]);

  // Re-render on theme change when paused
  useEffect(() => {
    if (!isPlaying) renderAll();
  }, [isDarkMode]); // eslint-disable-line

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Canvas */}
      <div
        style={{
          position: "relative",
          width: CANVAS_SIZE,
          maxWidth: "100%",
          aspectRatio: "1/1",
          borderRadius: 16,
          overflow: "hidden",
          border: `2px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
          background: isDarkMode ? "#1f2937" : "#f9fafb",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: showGuide ? 1 : 0,
            transition: "opacity 0.3s",
          }}
        />

        {/* Overlay when guide is hidden */}
        {!showGuide && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                color: isDarkMode ? "#6b7280" : "#9ca3af",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Hướng dẫn đang ẩn
            </p>
          </div>
        )}
      </div>

      {/* Stroke legend */}
      {showGuide && svgStrokes.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {svgStrokes.map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span
                style={{
                  background: STROKE_COLORS[i % STROKE_COLORS.length],
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Nét {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={isPlaying ? pauseAnim : startAnim}
          disabled={svgStrokes.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isPlaying ? "Tạm dừng" : "Phát lại"}
        </button>

        <button
          onClick={() => setShowGuide((v) => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            isDarkMode
              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {showGuide ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {showGuide ? "Ẩn hướng dẫn" : "Hiện hướng dẫn"}
        </button>
      </div>
    </div>
  );
}
