"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Brain,
} from "lucide-react";
import {
  learningService,
  UserVocabProgressResponse,
} from "@/services/learningService";
import { LearningStatus } from "@/enums/LearningStatus";

interface VocabProgressCardProps {
  isDark: boolean;
}

const STATUS_CONFIG: Record<
  LearningStatus,
  { label: string; color: string; bg: string }
> = {
  [LearningStatus.NEW]: {
    label: "Chưa học",
    color: "#9ca3af",
    bg: "#9ca3af20",
  },
  [LearningStatus.LEARNING]: {
    label: "Đang học",
    color: "#06b6d4",
    bg: "#06b6d420",
  },
  [LearningStatus.KNOWN]: {
    label: "Đã biết",
    color: "#10b981",
    bg: "#10b98120",
  },
  [LearningStatus.FORGOTTEN]: {
    label: "Quên",
    color: "#ef4444",
    bg: "#ef444420",
  },
};

export default function VocabProgressCard({ isDark }: VocabProgressCardProps) {
  const [data, setData] = useState<UserVocabProgressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await learningService.getMyProgress();
        setData(res);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu từ vựng");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Stats tổng hợp ──
  const stats = useMemo(() => {
    const total = data.length;
    const known = data.filter((d) => d.status === LearningStatus.KNOWN).length;
    const learning = data.filter(
      (d) => d.status === LearningStatus.LEARNING
    ).length;
    const forgotten = data.filter(
      (d) => d.status === LearningStatus.FORGOTTEN
    ).length;
    const newWords = data.filter((d) => d.status === LearningStatus.NEW).length;
    const knownPct = total > 0 ? (known / total) * 100 : 0;
    return { total, known, learning, forgotten, newWords, knownPct };
  }, [data]);

  // ── Recent 5 từ ──
  const recent = useMemo(
    () =>
      [...data]
        .sort(
          (a, b) =>
            new Date(b.lastReviewedAt).getTime() -
            new Date(a.lastReviewedAt).getTime()
        )
        .slice(0, 5),
    [data]
  );

  const card = `rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`;

  // ── Loading ──
  if (loading) {
    return (
      <div className={card}>
        <div
          className={`px-5 py-4 flex items-center gap-2 border-b ${isDark ? "border-gray-700" : "border-gray-100"
            }`}
        >
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div
            className={`h-4 w-32 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"
              }`}
          />
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-8 w-full rounded-xl animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-100"
                }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className={`${card} px-5 py-5 text-center`}>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {error}
        </p>
      </div>
    );
  }

  // ── No data ──
  if (data.length === 0) {
    return (
      <div className={`${card} px-5 py-5 text-center`}>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Chưa có dữ liệu từ vựng
        </p>
      </div>
    );
  }

  return (
    <div className={card}>
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-center justify-between border-b ${isDark ? "border-gray-700" : "border-gray-100"
          }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <h3
            className={`font-bold text-sm ${isDark ? "text-gray-100" : "text-gray-800"
              }`}
          >
            Từ Vựng Của Tôi
          </h3>
        </div>
        <span className="text-xs font-bold text-purple-400">
          {stats.total} từ
        </span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Overall progress bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"
                }`}
            >
              Đã biết
            </span>
            <span className="text-xs font-bold text-emerald-500">
              {stats.knownPct.toFixed(0)}%
            </span>
          </div>
          <div
            className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${stats.knownPct}%`,
                background: "linear-gradient(90deg, #10b981, #34d399)",
              }}
            />
          </div>
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              icon: CheckCircle2,
              label: "Đã biết",
              value: stats.known,
              color: "#10b981",
            },
            {
              icon: BookOpen,
              label: "Đang học",
              value: stats.learning,
              color: "#06b6d4",
            },
            {
              icon: RotateCcw,
              label: "Đã quên",
              value: stats.forgotten,
              color: "#ef4444",
            },
            {
              icon: Brain,
              label: "Chưa học",
              value: stats.newWords,
              color: "#9ca3af",
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-gray-700/50" : "bg-gray-50"
                }`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color }}>
                  {value}
                </p>
                <p
                  className={`text-[10px] leading-tight ${isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent words */}
        {recent.length > 0 && (
          <div>
            <p
              className={`text-xs font-semibold mb-2 ${isDark ? "text-gray-400" : "text-gray-500"
                }`}
            >
              Gần đây
            </p>
            <div className="flex flex-col gap-1.5">
              {recent.map((item) => {
                const cfg =
                  STATUS_CONFIG[item.status as LearningStatus] ??
                  STATUS_CONFIG[LearningStatus.NEW];
                return (
                  <div
                    key={item.vocabId}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? "bg-gray-700/40" : "bg-gray-50"
                      }`}
                  >
                    <span
                      className={`text-xs font-medium ${isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                    >
                      {item.vocabWord}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
