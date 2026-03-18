"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";

import {
  BookOpen,
  Zap,
  Award,
  TrendingUp,
  BarChart3,
  Brain,
  Target,
  CheckCircle2,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  learningProgressService,
  UserLearningDashboardResponse,
  DailyProgressDto,
} from "@/services/learningProgressService";
import JLPTPassPredictionCard from "@/components/profile/Jlptpasspredictioncard";

interface LevelData {
  level: string;
  totalExamsTaken: number;
  totalQuestionsDone: number;
  correctQuestions: number;
  accuracy: number;
  averageScore?: number;
  lastExamAt?: string;
}

function ProgressBar({
  value,
  color,
  isDark,
}: {
  value: number;
  color: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-100"
        }`}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

const StatMiniCard = React.memo(
  ({
    icon: Icon,
    label,
    value,
    color,
    isDark,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    color: string;
    isDark: boolean;
  }) => (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-gray-700/50" : "bg-gray-50"
        }`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20` }}
      >
        <span style={{ color, display: "flex" }}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <div>
        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          {label}
        </p>
        <p
          className={`text-base font-bold ${isDark ? "text-gray-100" : "text-gray-800"
            }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
);
StatMiniCard.displayName = "StatMiniCard";

const LevelAccordion = React.memo(
  ({ level, isDark }: { level: LevelData; isDark: boolean }) => {
    const [open, setOpen] = useState(false);
    const pct = Math.min(level.accuracy, 100);

    return (
      <div
        className={`rounded-xl border overflow-hidden ${isDark ? "border-gray-700" : "border-gray-100"
          }`}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between px-4 py-3 transition ${isDark
            ? "bg-gray-700/40 hover:bg-gray-700"
            : "bg-gray-50 hover:bg-gray-100"
            }`}
        >
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white text-xs font-bold rounded-full">
              {level.level}
            </span>
            <span
              className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-700"
                }`}
            >
              {level.totalExamsTaken} bài · {level.accuracy.toFixed(1)}% chính
              xác
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-20 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-gray-600" : "bg-gray-200"
                }`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""
                } ${isDark ? "text-gray-400" : "text-gray-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {open && (
          <div
            className={`px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 ${isDark ? "bg-gray-800" : "bg-white"
              }`}
          >
            {[
              {
                label: "Số bài thi",
                value: level.totalExamsTaken,
                color: "#06b6d4",
              },
              {
                label: "Câu hỏi",
                value: level.totalQuestionsDone,
                color: "#8b5cf6",
              },
              {
                label: "Câu đúng",
                value: level.correctQuestions,
                color: "#10b981",
              },
              {
                label: "Điểm TB",
                value: `${(level.averageScore ?? level.accuracy).toFixed(1)}%`,
                color: "#f59e0b",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`text-center p-2.5 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
              >
                <p
                  className={`text-xs mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                  {item.label}
                </p>
                <p className="text-lg font-bold" style={{ color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
            <div
              className={`col-span-2 md:col-span-4 mt-1 p-2.5 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-50"
                }`}
            >
              <div className="flex justify-between text-xs mb-1">
                <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                  Độ chính xác
                </span>
                <span className="font-bold text-cyan-500">
                  {level.accuracy.toFixed(1)}%
                </span>
              </div>
              <ProgressBar
                value={pct}
                color="linear-gradient(90deg,#06b6d4,#22d3ee)"
                isDark={isDark}
              />
              <p
                className={`text-xs mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"
                  }`}
              >
                {pct < 50
                  ? "💪 Tiếp tục luyện tập!"
                  : pct < 80
                    ? "👍 Bạn đang làm tốt!"
                    : "🎉 Xuất sắc!"}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
LevelAccordion.displayName = "LevelAccordion";

interface LearningStatsProps {
  isDark: boolean;
}

export default function LearningStats({ isDark }: LearningStatsProps) {
  const [dashboardData, setDashboardData] =
    useState<UserLearningDashboardResponse | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboard, daily] = await Promise.all([
        learningProgressService.view(),
        learningProgressService.getDailyProgress(7),
      ]);
      setDashboardData(dashboard);
      setDailyProgress(daily);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const progressData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];
      const display = date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      const day = dailyProgress.find((d) => d.date === dateStr);
      return {
        date: display,
        score: day?.accuracy ?? 0,
        exams: day?.totalExamsTaken ?? 0,
      };
    });
  }, [dailyProgress]);

  const hasProgressData = useMemo(
    () => progressData.some((d) => d.score > 0),
    [progressData]
  );

  const pieData = useMemo(() => {
    if (!dashboardData) return [];
    return [
      { name: "Đúng", value: dashboardData.correctQuestions, color: "#10b981" },
      {
        name: "Sai",
        value:
          dashboardData.totalQuestionsDone - dashboardData.correctQuestions,
        color: "#ef4444",
      },
    ];
  }, [dashboardData]);

  const levelComparison = useMemo(() => {
    if (!dashboardData) return [];
    return ["N5", "N4", "N3", "N2", "N1"].map((lvl) => {
      const d = dashboardData.levels.find((l) => l.level === lvl);
      return {
        level: lvl,
        exams: d?.totalExamsTaken ?? 0,
        accuracy: d?.accuracy ?? 0,
      };
    });
  }, [dashboardData]);

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: isDark ? "#1f2937" : "#fff",
      border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
      borderRadius: "8px",
      color: isDark ? "#f3f4f6" : "#1f2937",
    }),
    [isDark]
  );

  const card = `rounded-2xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`;
  const titleCls = `font-bold text-base ${isDark ? "text-gray-100" : "text-gray-800"
    }`;

  if (loading)
    return (
      <div className="flex flex-col gap-4">
        <div
          className={`${card} px-6 py-10 flex items-center justify-center gap-3`}
        >
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
          <span
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Đang tải dữ liệu học tập...
          </span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className={`${card} px-6 py-8 text-center`}>
        <p
          className={`text-sm mb-3 ${isDark ? "text-gray-400" : "text-gray-500"
            }`}
        >
          {error}
        </p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition"
        >
          Thử lại
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. Stats mini cards ── */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: BookOpen,
              label: "Số lượt thi",
              value: dashboardData.totalExamsTaken,
              color: "#06b6d4",
            },
            {
              icon: Target,
              label: "Câu đã làm",
              value: dashboardData.totalQuestionsDone,
              color: "#8b5cf6",
            },
            {
              icon: CheckCircle2,
              label: "Câu đúng",
              value: dashboardData.correctQuestions,
              color: "#10b981",
            },
            {
              icon: TrendingUp,
              label: "Độ chính xác",
              value: `${dashboardData.accuracy.toFixed(1)}%`,
              color: "#f59e0b",
            },
          ].map((s, i) => (
            <StatMiniCard
              key={i}
              icon={s.icon}
              label={s.label}
              value={s.value}
              color={s.color}
              isDark={isDark}
            />
          ))}
        </div>
      )}

      {/* ── 2. Chi tiết cấp độ (accordion) ── */}
      {dashboardData && dashboardData.levels.length > 0 && (
        <div className={card}>
          <div
            className="px-6 py-4 border-b flex items-center gap-2"
            style={{ borderColor: isDark ? "#374151" : "#f3f4f6" }}
          >
            <Award className="w-5 h-5 text-cyan-500" />
            <h3 className={titleCls}>Chi tiết theo cấp độ</h3>
          </div>
          <div className="px-6 py-4 flex flex-col gap-3">
            {dashboardData.levels.map((level) => (
              <LevelAccordion key={level.level} level={level} isDark={isDark} />
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Biểu đồ: tiến độ 7 ngày + tỷ lệ đúng/sai ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={card}>
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
              <h3
                className={`font-bold text-sm ${isDark ? "text-gray-100" : "text-gray-800"
                  }`}
              >
                Tiến độ 7 ngày qua
              </h3>
            </div>
            {hasProgressData ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={progressData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "#374151" : "#f0f0f0"}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: isDark ? "#9ca3af" : "#6b7280",
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fill: isDark ? "#9ca3af" : "#6b7280",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    formatter={(v: number | undefined) => [
                      v != null ? `${v.toFixed(1)}%` : "N/A",
                      "Độ chính xác",
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ fill: "#06b6d4", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-2">
                <Calendar
                  className={`w-10 h-10 ${isDark ? "text-gray-600" : "text-gray-300"
                    }`}
                />
                <p
                  className={`text-xs text-center ${isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                  Chưa có dữ liệu trong 7 ngày qua
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={card}>
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-cyan-500" />
              <h3
                className={`font-bold text-sm ${isDark ? "text-gray-100" : "text-gray-800"
                  }`}
              >
                Tỷ lệ trả lời
              </h3>
            </div>
            {dashboardData && dashboardData.totalQuestionsDone > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number | undefined) => [
                        v != null ? `${v} câu` : "N/A",
                      ]}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-3 mt-2">
                  <div
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? "bg-green-900/30" : "bg-green-50"
                      }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                      <span
                        className={`text-xs ${isDark ? "text-green-400" : "text-green-700"
                          }`}
                      >
                        Đúng
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${isDark ? "text-green-400" : "text-green-600"
                        }`}
                    >
                      {dashboardData.correctQuestions}
                    </span>
                  </div>
                  <div
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? "bg-red-900/30" : "bg-red-50"
                      }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <span
                        className={`text-xs ${isDark ? "text-red-400" : "text-red-700"
                          }`}
                      >
                        Sai
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${isDark ? "text-red-400" : "text-red-600"
                        }`}
                    >
                      {dashboardData.totalQuestionsDone -
                        dashboardData.correctQuestions}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-2">
                <Brain
                  className={`w-10 h-10 ${isDark ? "text-gray-600" : "text-gray-300"
                    }`}
                />
                <p
                  className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                  Chưa có dữ liệu
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Thống kê cấp độ (bar chart) ── */}
      <div className={card}>
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            <h3 className={titleCls}>Thống kê theo cấp độ</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={levelComparison}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#374151" : "#f0f0f0"}
              />
              <XAxis
                dataKey="level"
                tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="exams"
                fill="#06b6d4"
                radius={[6, 6, 0, 0]}
                name="Số bài thi"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4.5. Dự đoán thi đậu ── */}
      <JLPTPassPredictionCard isDark={isDark} />

    </div>
  );
}
