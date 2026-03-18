"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, CheckCircle, Eraser, Eye } from "lucide-react";

interface KanjiCanvasProps {
  isDarkMode: boolean;
  svgStrokes: string[]; // SVG path strings from API e.g. "M54 15 C55 30..."
  onCheck: (userPaths: string[]) => void;
}

// Get true path length via browser SVG API
function getSvgPathLength(d: string): number {
  if (typeof window === "undefined") return 200;
  try {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    return Math.max(path.getTotalLength(), 1);
  } catch {
    return 200;
  }
}

// Parse "M x y ..." to get start point for pulsing dot & stroke number
function getStartPoint(d: string): { x: number; y: number } | null {
  const m = d.match(/M\s*([\d.]+)\s+([\d.]+)/);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
}

const SPEED_OPTIONS = [
  { label: "0.5×", value: 2 },
  { label: "1×", value: 1 },
  { label: "1.5×", value: 0.67 },
  { label: "2×", value: 0.5 },
];
const BASE_MS_PER_PX = 4;
const PAUSE_BETWEEN_MS = 350;
const VIEWPORT = 109;

export default function KanjiCanvas({
  isDarkMode,
  svgStrokes,
  onCheck,
}: KanjiCanvasProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animStep, setAnimStep] = useState(-1);
  const [completedUp, setCompletedUp] = useState(-1);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [userPaths, setUserPaths] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const strokeRefs = useRef<(SVGPathElement | null)[]>([]);

  const svgStrokesRef = useRef(svgStrokes);
  const speedIdxRef = useRef(speedIdx);
  useEffect(() => {
    svgStrokesRef.current = svgStrokes;
  }, [svgStrokes]);
  useEffect(() => {
    speedIdxRef.current = speedIdx;
  }, [speedIdx]);

  const hasStrokes = svgStrokes && svgStrokes.length > 0;

  // Actions stored in a ref — never assigned during render
  const actionsRef = useRef({
    stop: () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      setIsAnimating(false);
    },
    animateStroke: (_idx: number): void => {
      /* wired in useEffect below */
    },
  });

  useEffect(() => {
    actionsRef.current.animateStroke = (idx: number) => {
      const paths = svgStrokesRef.current;
      if (!paths || idx >= paths.length) {
        setIsAnimating(false);
        setAnimStep(-1);
        setCompletedUp((paths?.length ?? 0) - 1);
        return;
      }

      setAnimStep(idx);
      const el = strokeRefs.current[idx];
      if (!el) return;

      const length = getSvgPathLength(paths[idx]);
      const durationMs =
        length * BASE_MS_PER_PX * SPEED_OPTIONS[speedIdxRef.current].value;

      el.style.transition = "none";
      el.style.strokeDasharray = `${length}`;
      el.style.strokeDashoffset = `${length}`;
      el.style.opacity = "1";

      void el.getBoundingClientRect(); // force reflow
      el.style.transition = `stroke-dashoffset ${durationMs}ms linear`;
      el.style.strokeDashoffset = "0";

      animTimeoutRef.current = setTimeout(() => {
        setCompletedUp(idx);
        animTimeoutRef.current = setTimeout(() => {
          actionsRef.current.animateStroke(idx + 1);
        }, PAUSE_BETWEEN_MS);
      }, durationMs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty — reads only from refs

  useEffect(
    () => () => {
      actionsRef.current.stop();
    },
    []
  );

  useEffect(() => {
    actionsRef.current.stop();
    setCompletedUp(-1);
    setAnimStep(-1);
    strokeRefs.current.forEach((el) => {
      if (el) {
        el.style.transition = "none";
        el.style.opacity = "0";
      }
    });
  }, [svgStrokes]);

  const stopAnimation = useCallback(() => actionsRef.current.stop(), []);

  const startAnimation = useCallback(() => {
    actionsRef.current.stop();
    setCompletedUp(-1);
    setAnimStep(-1);
    strokeRefs.current.forEach((el) => {
      if (el) {
        el.style.transition = "none";
        el.style.strokeDashoffset = el.style.strokeDasharray;
        el.style.opacity = "0";
      }
    });
    setIsAnimating(true);
    animTimeoutRef.current = setTimeout(
      () => actionsRef.current.animateStroke(0),
      100
    );
  }, []);

  const resetGuide = useCallback(() => {
    actionsRef.current.stop();
    setCompletedUp(-1);
    setAnimStep(-1);
    strokeRefs.current.forEach((el) => {
      if (el) {
        el.style.strokeDashoffset = el.style.strokeDasharray;
        el.style.opacity = "0";
      }
    });
  }, []);

  // ── Drawing ────────────────────────────────────────────────────────────────
  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    const pt = getPos(e, canvas);
    currentPointsRef.current = [pt];
    lastPointRef.current = pt;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      const pt = getPos(e, canvas);
      const ctx = canvas.getContext("2d");
      if (!ctx || !lastPointRef.current) return;
      ctx.strokeStyle = isDarkMode ? "#67e8f9" : "#0891b2";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = isDarkMode
        ? "rgba(103,232,249,0.4)"
        : "rgba(8,145,178,0.3)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      currentPointsRef.current.push(pt);
      lastPointRef.current = pt;
    },
    [isDrawing, isDarkMode]
  );

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pts = currentPointsRef.current;
    if (pts.length > 1) {
      const d = pts.reduce(
        (acc, pt, i) =>
          i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
        ""
      );
      setUserPaths((prev) => [...prev, d]);
    }
    currentPointsRef.current = [];
    lastPointRef.current = null;
  }, [isDrawing]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setUserPaths([]);
  }, []);

  const handleCheck = useCallback(
    () => onCheck(userPaths),
    [onCheck, userPaths]
  );

  // ── Colors ─────────────────────────────────────────────────────────────────
  const bg = isDarkMode ? "#1f2937" : "#ffffff";
  const gridCol = isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const guideFaint = isDarkMode
    ? "rgba(103,232,249,0.08)"
    : "rgba(8,145,178,0.07)";
  const guideComplete = isDarkMode
    ? "rgba(103,232,249,0.35)"
    : "rgba(8,145,178,0.30)";
  const guideActive = isDarkMode ? "#22d3ee" : "#0891b2";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div
          className={`flex items-center gap-1 rounded-xl p-1 ${
            isDarkMode ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          {SPEED_OPTIONS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSpeedIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                speedIdx === i
                  ? "bg-cyan-500 text-white shadow"
                  : isDarkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={isAnimating ? stopAnimation : startAnimation}
          disabled={!hasStrokes}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md disabled:opacity-40 ${
            isAnimating
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white"
          }`}
        >
          {isAnimating ? (
            <>
              <span className="w-3 h-3 rounded-sm bg-white inline-block" /> Dừng
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> Xem hướng dẫn
            </>
          )}
        </button>

        <button
          onClick={resetGuide}
          disabled={!hasStrokes}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all disabled:opacity-40 ${
            isDarkMode
              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* Stroke progress dots */}
      {hasStrokes && (
        <div className="flex items-center gap-2">
          {svgStrokes.map((_, i) => (
            <div
              key={i}
              className={`transition-all rounded-full ${
                i <= completedUp
                  ? "w-3 h-3 bg-cyan-500"
                  : i === animStep
                  ? "w-3 h-3 bg-cyan-400 ring-2 ring-cyan-300 animate-pulse"
                  : isDarkMode
                  ? "w-2 h-2 bg-gray-600"
                  : "w-2 h-2 bg-gray-200"
              }`}
            />
          ))}
          <span
            className={`text-xs ml-1 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {Math.max(completedUp + 1, 0)}/{svgStrokes.length} nét
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
        {/* Guide panel */}
        <div className="flex flex-col items-center gap-3">
          <p
            className={`text-xs font-semibold tracking-widest uppercase ${
              isDarkMode ? "text-gray-400" : "text-gray-400"
            }`}
          >
            Hướng dẫn
          </p>
          <div
            className={`relative rounded-2xl shadow-inner overflow-hidden border ${
              isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
            style={{ width: 280, height: 280, background: bg }}
          >
            <svg className="absolute inset-0" width={280} height={280}>
              <defs>
                <pattern
                  id="kanji-grid"
                  width={28}
                  height={28}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 28 0 L 0 0 0 28"
                    fill="none"
                    stroke={gridCol}
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width={280} height={280} fill="url(#kanji-grid)" />
              <line
                x1={140}
                y1={0}
                x2={140}
                y2={280}
                stroke={gridCol}
                strokeWidth="2"
              />
              <line
                x1={0}
                y1={140}
                x2={280}
                y2={140}
                stroke={gridCol}
                strokeWidth="2"
              />
            </svg>

            {hasStrokes && (
              <svg
                className="absolute inset-0"
                viewBox={`0 0 ${VIEWPORT} ${VIEWPORT}`}
                width={280}
                height={280}
              >
                {svgStrokes.map((d, i) => {
                  const isComplete = i <= completedUp;
                  const isActive = i === animStep;
                  const startPt = getStartPoint(d);
                  return (
                    <g key={i}>
                      {/* Ghost trace */}
                      <path
                        d={d}
                        fill="none"
                        stroke={guideFaint}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Animated stroke */}
                      <path
                        ref={(el) => {
                          strokeRefs.current[i] = el;
                        }}
                        d={d}
                        fill="none"
                        stroke={
                          isComplete && !isActive ? guideComplete : guideActive
                        }
                        strokeWidth={isActive ? 4.5 : 3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          strokeDasharray: 200,
                          strokeDashoffset: 200,
                          opacity: 0,
                          filter: isActive
                            ? `drop-shadow(0 0 3px ${guideActive})`
                            : "none",
                        }}
                      />
                      {/* Stroke order number at start point */}
                      {startPt && (
                        <text
                          x={startPt.x}
                          y={startPt.y - 3}
                          fontSize="5"
                          textAnchor="middle"
                          fontFamily="monospace"
                          fill={
                            isDarkMode
                              ? "rgba(103,232,249,0.5)"
                              : "rgba(8,145,178,0.5)"
                          }
                        >
                          {i + 1}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Pulsing dot at start of active stroke */}
                {animStep >= 0 &&
                  (() => {
                    const pt = getStartPoint(svgStrokes[animStep] ?? "");
                    return pt ? (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={3}
                        fill={guideActive}
                        opacity={0.9}
                      >
                        <animate
                          attributeName="r"
                          values="2;4;2"
                          dur="0.8s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.9;0.4;0.9"
                          dur="0.8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    ) : null;
                  })()}
              </svg>
            )}

            {!hasStrokes && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-500" : "text-gray-300"
                  }`}
                >
                  Không có dữ liệu nét
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User drawing panel */}
        <div className="flex flex-col items-center gap-3">
          <p
            className={`text-xs font-semibold tracking-widest uppercase ${
              isDarkMode ? "text-gray-400" : "text-gray-400"
            }`}
          >
            Luyện viết
          </p>
          <div
            className={`relative rounded-2xl overflow-hidden border ${
              isDarkMode ? "border-gray-700" : "border-gray-100"
            } shadow-inner`}
            style={{ width: 280, height: 280, background: bg }}
          >
            <svg
              className="absolute inset-0 pointer-events-none"
              width={280}
              height={280}
            >
              <rect width={280} height={280} fill="url(#kanji-grid)" />
              <line
                x1={140}
                y1={0}
                x2={140}
                y2={280}
                stroke={gridCol}
                strokeWidth="2"
              />
              <line
                x1={0}
                y1={140}
                x2={280}
                y2={140}
                stroke={gridCol}
                strokeWidth="2"
              />
            </svg>
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="absolute inset-0 cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {userPaths.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-600" : "text-gray-200"
                  }`}
                >
                  Vẽ tại đây
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearCanvas}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                isDarkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Eraser className="w-4 h-4" /> Xóa
            </button>
            <button
              onClick={handleCheck}
              disabled={userPaths.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md transition-all disabled:opacity-40"
            >
              <CheckCircle className="w-4 h-4" /> Kiểm tra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
