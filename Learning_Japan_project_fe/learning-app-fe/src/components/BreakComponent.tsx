// components/exam/BreakComponent.tsx
"use client";

import React, { useState, useEffect } from "react";

interface BreakComponentProps {
  participantId: string;
  nextSection: number;
  examId: string;
  onBreakEnd: () => void;
}

export default function BreakComponent({
  participantId,
  nextSection,
  examId,
  onBreakEnd,
}: BreakComponentProps) {
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 phút nghỉ

  // Countdown timer → hết giờ tự chuyển section
  useEffect(() => {
    const breakStartTimeRaw = localStorage.getItem("breakStartTime");
    const breakStartTime = breakStartTimeRaw
      ? Number(breakStartTimeRaw)
      : Date.now();

    if (!breakStartTimeRaw) {
      localStorage.setItem("breakStartTime", breakStartTime.toString());
    }

    setTimeout(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - breakStartTime) / 1000);
      const remaining = 5 * 60 - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 0);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem("breakStartTime");
          onBreakEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onBreakEnd]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartTest = () => {
    // Xóa breakStartTime khi user click bắt đầu sớm
    localStorage.removeItem("breakStartTime");
    onBreakEnd();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-cyan-100 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="w-24"></div> {/* Spacer for layout balance */}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">
          Thời gian nghỉ
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-40"></div>
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-md relative z-10">
              B
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-200 to-cyan-300 rounded-full blur-xl opacity-50"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-7xl">☕</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent mb-3">
              Nghỉ giải lao
            </h1>
            <p className="text-lg text-gray-600">
              Chuẩn bị cho phần thi tiếp theo (Phần {nextSection})
            </p>
          </div>

          {/* Timer */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl px-12 py-8 mb-6 border-2 border-cyan-100">
              <span className="font-mono text-8xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
                {formatTime(timeLeft)}
              </span>
            </div>
            <p className="text-xl text-gray-700">
              Bạn có thể bắt đầu ngay hoặc đợi hết thời gian nghỉ
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartTest}
            className="px-16 py-5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white text-xl font-bold rounded-full hover:shadow-2xl transition transform hover:scale-105 shadow-lg"
          >
            Bắt đầu phần tiếp theo
          </button>

          {/* Decorative Icons */}
          <div className="mt-12 opacity-50">
            <div className="text-6xl">🎧 📘 ✏️</div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md max-w-md mx-auto border border-cyan-100">
            <div className="flex items-start gap-3 text-left">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-semibold text-cyan-600 mb-1">Lưu ý:</h3>
                <p className="text-sm text-gray-600">
                  Câu trả lời của Phần {nextSection - 1} đã được lưu tự động.
                  Bạn sẽ không thể quay lại chỉnh sửa sau khi bắt đầu Phần{" "}
                  {nextSection}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
