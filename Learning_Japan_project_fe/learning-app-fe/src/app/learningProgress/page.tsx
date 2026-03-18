"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import BackButton from "@/components/backButton";
import {
  Target,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Award,
  Brain,
  BarChart3,
  Clock,
  Zap,
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

// ✅ Type definitions
interface StatType {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bgLight: string;
  textColor: string;
  rawAccuracy?: number;
}

interface LevelData {
  level: string;
  totalExamsTaken: number;
  totalQuestionsDone: number;
  correctQuestions: number;
  accuracy: number;
  averageScore?: number;
  lastExamAt?: string;
}

// ✅ OPTIMIZED: Memoized StatCard component
const StatCard = React.memo(({ stat }: { stat: StatType }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`${stat.color} p-3 rounded-lg`}>
        <stat.icon className="w-6 h-6 text-white" />
      </div>
      <div className={`${stat.bgLight} px-3 py-1 rounded-full`}>
        <span className={`text-xs font-semibold ${stat.textColor}`}>
          {stat.label === "Độ chính xác" &&
          stat.rawAccuracy !== undefined &&
          stat.rawAccuracy < 50
            ? "Cần cải thiện"
            : "Tốt"}
        </span>
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
  </div>
));
StatCard.displayName = "StatCard";

// ✅ OPTIMIZED: Memoized LevelDetail component
const LevelDetail = React.memo(
  ({
    level,
    formatDate,
  }: {
    level: LevelData;
    formatDate: (date?: string) => string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Award className="w-6 h-6 text-indigo-500" />
          Chi tiết cấp độ {level.level}
        </h2>
        <span className="text-sm text-gray-500">
          Lần thi cuối: {formatDate(level.lastExamAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 mb-1">Số bài thi</p>
          <p className="text-2xl font-bold text-blue-700">
            {level.totalExamsTaken}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
          <p className="text-sm text-purple-600 mb-1">Câu hỏi</p>
          <p className="text-2xl font-bold text-purple-700">
            {level.totalQuestionsDone}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 mb-1">Đúng</p>
          <p className="text-2xl font-bold text-green-700">
            {level.correctQuestions}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
          <p className="text-sm text-orange-600 mb-1">Điểm TB</p>
          <p className="text-2xl font-bold text-orange-700">
            {level.averageScore
              ? level.averageScore.toFixed(1)
              : level.accuracy.toFixed(1)}
            %
          </p>
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Độ chính xác
          </span>
          <span className="text-sm font-bold text-indigo-600">
            {level.accuracy.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(level.accuracy, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {level.accuracy < 50
            ? "💪 Tiếp tục luyện tập để cải thiện kết quả!"
            : level.accuracy < 80
            ? "👍 Bạn đang làm tốt lắm!"
            : "🎉 Xuất sắc! Hãy thử cấp độ cao hơn!"}
        </p>
      </div>
    </div>
  )
);
LevelDetail.displayName = "LevelDetail";

// ✅ OPTIMIZED: Memoized AdviceCard component
const AdviceCard = React.memo(
  ({
    emoji,
    title,
    description,
  }: {
    emoji: string;
    title: string;
    description: string;
  }) => (
    <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-medium text-gray-800 text-sm">{title}</p>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  )
);
AdviceCard.displayName = "AdviceCard";

export default function UserLearningDashboard() {
  const [dashboardData, setDashboardData] =
    useState<UserLearningDashboardResponse | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi song song 2 API
      const [dashboardResult, dailyResult] = await Promise.all([
        learningProgressService.view(),
        learningProgressService.getDailyProgress(7),
      ]);

      setDashboardData(dashboardResult);
      setDailyProgress(dailyResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // ✅ OPTIMIZED: useCallback cho formatDate
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "Chưa có dữ liệu";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // ✅ OPTIMIZED: useCallback cho tooltip formatters
  const lineTooltipFormatter = useCallback(
    (value: number | string | undefined, name?: string) => {
      if (!value) return ["", ""];
      if (name === "score")
        return [`${Number(value).toFixed(1)}%`, "Độ chính xác"];
      return [value, name || ""];
    },
    []
  );

  const pieTooltipFormatter = useCallback(
    (value: number | string | undefined, name?: string) => {
      if (value === undefined) return ["", ""];
      return [`${value} câu`, name || ""];
    },
    []
  );

  const barTooltipContentStyle = useMemo(
    () => ({
      backgroundColor: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
    }),
    []
  );

  // ✅ OPTIMIZED: useMemo cho dữ liệu
  const progressData = useMemo(() => {
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const displayDate = date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });

      const dayData = dailyProgress.find((d) => d.date === dateStr);

      last7Days.push({
        date: displayDate,
        score: dayData ? dayData.accuracy : 0,
        exams: dayData ? dayData.totalExamsTaken : 0,
      });
    }

    return last7Days;
  }, [dailyProgress]);

  const pieData = useMemo(() => {
    if (!dashboardData) return [];

    return [
      { name: "Đúng", value: dashboardData.correctQuestions, color: "#10B981" },
      {
        name: "Sai",
        value:
          dashboardData.totalQuestionsDone - dashboardData.correctQuestions,
        color: "#EF4444",
      },
    ];
  }, [dashboardData]);

  const levelComparison = useMemo(() => {
    if (!dashboardData) return [];

    const allLevels = ["N5", "N4", "N3", "N2", "N1"];
    return allLevels.map((level) => {
      const levelData = dashboardData.levels.find((l) => l.level === level);
      return {
        level,
        exams: levelData?.totalExamsTaken || 0,
        accuracy: levelData?.accuracy || 0,
      };
    });
  }, [dashboardData]);

  const stats = useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        icon: BookOpen,
        label: "Tổng số bài thi",
        value: dashboardData.totalExamsTaken,
        color: "bg-blue-500",
        bgLight: "bg-blue-50",
        textColor: "text-blue-600",
      },
      {
        icon: Target,
        label: "Câu hỏi đã làm",
        value: dashboardData.totalQuestionsDone,
        color: "bg-purple-500",
        bgLight: "bg-purple-50",
        textColor: "text-purple-600",
      },
      {
        icon: CheckCircle2,
        label: "Câu trả lời đúng",
        value: dashboardData.correctQuestions,
        color: "bg-green-500",
        bgLight: "bg-green-50",
        textColor: "text-green-600",
      },
      {
        icon: TrendingUp,
        label: "Độ chính xác",
        value: `${dashboardData.accuracy.toFixed(1)}%`,
        color: "bg-orange-500",
        bgLight: "bg-orange-50",
        textColor: "text-orange-600",
        rawAccuracy: dashboardData.accuracy,
      },
    ];
  }, [dashboardData]);

  const hasProgressData = useMemo(
    () => progressData.some((d) => d.score > 0),
    [progressData]
  );

  // ✅ OPTIMIZED: Memoize advice cards data
  const adviceCards = useMemo(
    () => [
      {
        emoji: "📚",
        title: "Luyện tập đều đặn",
        description: "Hãy làm ít nhất 1 bài thi mỗi ngày",
      },
      {
        emoji: "✍️",
        title: "Ôn tập từ vựng",
        description: "Xem lại các câu đã sai để cải thiện",
      },
      {
        emoji: "🎯",
        title: "Đặt mục tiêu rõ ràng",
        description: "Tập trung vào một cấp độ tại một thời điểm",
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Có lỗi xảy ra
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Back Button */}
              <BackButton to="/video" label="home" />

              <div className="h-8 w-px bg-gray-200"></div>

              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Dashboard Học Tập
                </h1>
                <p className="text-gray-600 mt-2">
                  Theo dõi tiến độ học tiếng Nhật của bạn
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {dashboardData.lastLevel && (
                <div className="text-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                  <p className="text-sm font-medium opacity-90">
                    Cấp độ hiện tại
                  </p>
                  <p className="text-2xl font-bold">
                    {dashboardData.lastLevel}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chi tiết các cấp độ */}
            {dashboardData.levels.length > 0 ? (
              dashboardData.levels.map((level) => (
                <LevelDetail
                  key={level.level}
                  level={level}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Chưa có dữ liệu học tập
                </h3>
                <p className="text-gray-600">
                  Hãy bắt đầu làm bài thi đầu tiên của bạn!
                </p>
              </div>
            )}

            {/* Biểu đồ tiến độ theo thời gian */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-500" />
                Tiến độ 7 ngày qua
              </h2>
              {hasProgressData ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      formatter={lineTooltipFormatter}
                      contentStyle={barTooltipContentStyle}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: "#6366f1", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Chưa có dữ liệu trong 7 ngày qua</p>
                    <p className="text-sm mt-1">
                      Hãy làm bài thi để xem tiến độ của bạn!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* So sánh các cấp độ */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                Thống kê theo cấp độ
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={levelComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="level"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip contentStyle={barTooltipContentStyle} />
                  <Bar dataKey="exams" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cột phải */}
          <div className="space-y-6">
            {/* Tỷ lệ đúng/sai */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-500" />
                Tỷ lệ trả lời
              </h2>
              <div className="flex justify-center mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={pieTooltipFormatter}
                      contentStyle={barTooltipContentStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">
                      Câu đúng
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {dashboardData.correctQuestions}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">
                      Câu sai
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {dashboardData.totalQuestionsDone -
                      dashboardData.correctQuestions}
                  </span>
                </div>
              </div>
            </div>

            {/* Mục tiêu học tập */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Mục tiêu tiếp theo
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Hoàn thành 10 bài thi</span>
                    <span>{dashboardData.totalExamsTaken}/10</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (dashboardData.totalExamsTaken / 10) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Đạt 80% độ chính xác</span>
                    <span>{dashboardData.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (dashboardData.accuracy / 80) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lời khuyên */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Lời khuyên
              </h2>
              <div className="space-y-3">
                {adviceCards.map((card, index) => (
                  <AdviceCard
                    key={index}
                    emoji={card.emoji}
                    title={card.title}
                    description={card.description}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
