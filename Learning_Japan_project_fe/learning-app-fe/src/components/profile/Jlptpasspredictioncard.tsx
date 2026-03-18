"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Trophy, AlertCircle } from "lucide-react";
import {
  learningProgressService,
  UserLearningDashboardResponse,
} from "@/services/learningProgressService";

interface JLPTPassPredictionCardProps {
  isDark: boolean;
}

const LEVEL_CONFIG: Record<
  string,
  {
    passScore: number;
    liệtScore: number;
    totalScore: number;
    passAccuracy: number;
    liệtAccuracy: number;
    color: string;
    border: string;
    bg: string;
  }
> = {
  N5: {
    passScore: 80,
    liệtScore: 19,
    totalScore: 180,
    passAccuracy: 44.44,
    liệtAccuracy: 10.56,
    color: "#10b981",
    border: "border-l-emerald-400",
    bg: "#10b98115",
  },
  N4: {
    passScore: 90,
    liệtScore: 19,
    totalScore: 180,
    passAccuracy: 50.0,
    liệtAccuracy: 10.56,
    color: "#06b6d4",
    border: "border-l-cyan-400",
    bg: "#06b6d415",
  },
  N3: {
    passScore: 95,
    liệtScore: 19,
    totalScore: 180,
    passAccuracy: 52.78,
    liệtAccuracy: 10.56,
    color: "#8b5cf6",
    border: "border-l-purple-400",
    bg: "#8b5cf615",
  },
  N2: {
    passScore: 90,
    liệtScore: 19,
    totalScore: 180,
    passAccuracy: 50.0,
    liệtAccuracy: 10.56,
    color: "#f59e0b",
    border: "border-l-amber-400",
    bg: "#f59e0b15",
  },
  N1: {
    passScore: 100,
    liệtScore: 19,
    totalScore: 180,
    passAccuracy: 55.56,
    liệtAccuracy: 10.56,
    color: "#ef4444",
    border: "border-l-red-400",
    bg: "#ef444415",
  },
};

function calcPassRate(
  accuracy: number,
  passAccuracy: number,
  liệtAccuracy: number
): number {
  if (accuracy <= 0) return 0;
  const liệtThreshold = liệtAccuracy * 3;
  if (accuracy < liệtThreshold) return 0;
  if (accuracy >= passAccuracy + 15) return 99;
  const ratio = (accuracy - liệtThreshold) / (passAccuracy - liệtThreshold);
  return Math.min(99, Math.round(ratio * ratio * 90));
}

function getVerdict(
  accuracy: number,
  passAccuracy: number,
  liệtAccuracy: number,
  hasData: boolean
) {
  if (!hasData)
    return { label: "Chưa có dữ liệu", color: "#6b7280", emoji: "❓" };
  const passRate = calcPassRate(accuracy, passAccuracy, liệtAccuracy);
  if (passRate >= 75)
    return { label: "Có thể đậu", color: "#10b981", emoji: "✅" };
  if (passRate >= 40)
    return { label: "Cần cố gắng thêm", color: "#f59e0b", emoji: "⚠️" };
  return { label: "Chưa sẵn sàng", color: "#ef4444", emoji: "❌" };
}

function MiniCircle({
  pct,
  color,
  size = 44,
}: {
  pct: number;
  color: string;
  size?: number;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#374151"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.7s ease" }}
      />
    </svg>
  );
}

export default function JLPTPassPredictionCard({
  isDark,
}: JLPTPassPredictionCardProps) {
  const [data, setData] = useState<UserLearningDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await learningProgressService.view();
        setData(res);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const predictions = useMemo(() => {
    return ["N5", "N4", "N3", "N2", "N1"]
      .map((lvl) => {
        const levelData = data?.levels.find((l) => l.level === lvl);
        const accuracy = levelData?.accuracy ?? 0;
        const hasData = (levelData?.totalExamsTaken ?? 0) > 0;
        const cfg = LEVEL_CONFIG[lvl];
        const passRate = hasData
          ? calcPassRate(accuracy, cfg.passAccuracy, cfg.liệtAccuracy)
          : 0;
        const verdict = getVerdict(
          accuracy,
          cfg.passAccuracy,
          cfg.liệtAccuracy,
          hasData
        );
        const estimatedScore = Math.round((accuracy * cfg.totalScore) / 100);
        return {
          lvl,
          accuracy,
          hasData,
          passRate,
          verdict,
          cfg,
          estimatedScore,
        };
      })
      .filter((p) => p.hasData);
  }, [data]);

  const card = `rounded-2xl border shadow-sm overflow-hidden ${
    isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
  }`;

  if (loading) {
    return (
      <div className={card}>
        <div
          className={`px-5 py-4 flex items-center gap-2 border-b ${
            isDark ? "border-gray-700" : "border-gray-100"
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <div
            className={`h-4 w-40 rounded animate-pulse ${
              isDark ? "bg-gray-700" : "bg-gray-200"
            }`}
          />
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-24 w-full rounded-xl animate-pulse ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${card} px-5 py-5 text-center`}>
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {error}
        </p>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className={`${card} px-5 py-5 text-center`}>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Chưa có dữ liệu luyện đề
        </p>
      </div>
    );
  }

  return (
    <div className={card}>
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-center justify-between border-b ${
          isDark ? "border-gray-700" : "border-gray-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <h3
            className={`font-bold text-sm ${
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Dự đoán thi đậu JLPT
          </h3>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {predictions.map(
          ({
            lvl,
            accuracy,
            hasData,
            passRate,
            verdict,
            cfg,
            estimatedScore,
          }) => (
            <div
              key={lvl}
              className={`rounded-xl border-l-4 ${cfg.border} p-3`}
              style={{ background: cfg.bg }}
            >
              <div className="flex items-center gap-3">
                {/* Level badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                  style={{ background: cfg.color }}
                >
                  {lvl}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: verdict + accuracy */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-semibold ${
                        isDark ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {verdict.emoji} {verdict.label}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: cfg.color }}
                    >
                      Điểm dự đoán: {estimatedScore}/{cfg.totalScore}đ
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative">
                    <div
                      className={`w-full h-2 rounded-full overflow-hidden ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(accuracy, 100)}%`,
                          background: cfg.color,
                        }}
                      />
                    </div>
                    {/* Marker điểm liệt */}
                    <div
                      className="absolute top-0 w-0.5 h-2 bg-orange-400 opacity-80"
                      style={{ left: `${Math.min(cfg.liệtAccuracy * 3, 98)}%` }}
                    />
                    {/* Marker điểm đậu */}
                    <div
                      className="absolute top-0 w-0.5 h-2 bg-white opacity-60"
                      style={{ left: `${Math.min(cfg.passAccuracy, 98)}%` }}
                    />
                  </div>

                  {/* Row 3: cần tối thiểu + khả năng đậu */}
                  <div className="flex items-center justify-between mt-1.5">
                    <span
                      className={`text-[10px] ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Cần tối thiểu{" "}
                      <span className="font-bold" style={{ color: cfg.color }}>
                        {cfg.passScore}đ
                      </span>
                      {estimatedScore >= cfg.passScore ? (
                        <span className="text-emerald-500 font-bold"> ✓</span>
                      ) : (
                        <span className="text-red-400 font-bold">
                          {" "}
                          (thiếu {cfg.passScore - estimatedScore}đ)
                        </span>
                      )}
                    </span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: verdict.color }}
                    >
                      {passRate === 0
                        ? "Chưa đủ điều kiện"
                        : `${passRate}% khả năng đậu`}
                    </span>
                  </div>
                </div>

                {/* Mini circle */}
                <div className="relative flex-shrink-0">
                  <MiniCircle pct={accuracy} color={cfg.color} size={44} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: cfg.color }}
                    >
                      {accuracy.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Score breakdown: 3 phần + tổng */}
              <div
                className={`mt-2.5 pt-2 border-t grid grid-cols-4 gap-1 ${
                  isDark ? "border-gray-700" : "border-black/5"
                }`}
              >
                {[
                  {
                    jp: "Ngữ pháp + Hán tự + Từ vựng",
                    vn: "Hán tự・Từ vựng・Ngữ pháp",
                    color: "#06b6d4",
                  },
                  { jp: "Đọc hiểu", vn: "Đọc hiểu", color: "#8b5cf6" },
                  { jp: "Nghe hiểu", vn: "Nghe hiểu", color: "#10b981" },
                ].map((part) => (
                  <div key={part.jp} className="text-center">
                    <p
                      className="text-[9px] font-bold mb-0.5"
                      style={{ color: part.color }}
                    >
                      {part.jp}
                    </p>
                    <p
                      className={`text-[9px] ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      ≥<span className="font-bold">{cfg.liệtScore}</span>đ
                    </p>
                  </div>
                ))}
                <div
                  className={`text-center border-l ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <p
                    className="text-[9px] font-bold mb-0.5"
                    style={{ color: cfg.color }}
                  >
                    Tổng
                  </p>
                  <p
                    className={`text-[9px] ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    ≥<span className="font-bold">{cfg.passScore}</span>đ
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
