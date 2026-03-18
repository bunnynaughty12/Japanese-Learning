"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eraser, RotateCcw } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface Point {
  x: number;
  y: number;
}

interface Props {
  onCheck: (strokes: Point[][]) => void;
  isDarkMode?: boolean;
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export default function KanjiDrawCanvas({
  onCheck,
  isDarkMode = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = isDarkMode ? "#1f2937" : "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isDarkMode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    const point = getPos(e);
    setCurrentStroke([point]);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const point = getPos(e);
    setCurrentStroke((prev) => [...prev, point]);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isDarkMode ? "#60a5fa" : "#000000";
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawing) return;
    setDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
    canvasRef.current!.getContext("2d")!.beginPath();
  };

  const redrawAll = (strokesToDraw: Point[][]) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = isDarkMode ? "#1f2937" : "#ffffff";
    ctx.fillRect(0, 0, 400, 400);
    strokesToDraw.forEach((stroke) => {
      if (stroke.length < 1) return;
      ctx.beginPath();
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = isDarkMode ? "#60a5fa" : "#000000";
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = isDarkMode ? "#1f2937" : "#ffffff";
    ctx.fillRect(0, 0, 400, 400);
    setStrokes([]);
    setCurrentStroke([]);
  };

  const undoStroke = () => {
    if (strokes.length === 0) return;
    const next = strokes.slice(0, -1);
    setStrokes(next);
    redrawAll(next);
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className={`rounded-xl shadow-lg border-4 cursor-crosshair touch-none ${
          isDarkMode
            ? "border-gray-600 bg-gray-800"
            : "border-cyan-200 bg-white"
        }`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="flex gap-3 mt-6">
        <button
          className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2 ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
          }`}
          onClick={() => onCheck(strokes)}
        >
          ✓ Check
        </button>

        <button
          className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2 ${
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
          onClick={undoStroke}
          disabled={strokes.length === 0}
        >
          <RotateCcw className="w-4 h-4" />
          Undo
        </button>

        <button
          className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2 ${
            isDarkMode
              ? "bg-red-900/50 hover:bg-red-800/50 text-red-200"
              : "bg-red-100 hover:bg-red-200 text-red-600"
          }`}
          onClick={clearCanvas}
        >
          <Eraser className="w-4 h-4" />
          Clear
        </button>
      </div>

      <div
        className={`mt-4 text-sm ${
          isDarkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Strokes: {strokes.length}
      </div>
    </div>
  );
}
