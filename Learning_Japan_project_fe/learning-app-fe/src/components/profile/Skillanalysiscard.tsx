"use client";
import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import {
  skillProgressService,
  SkillProgressResponse,
} from "@/services/skillProgressService";

// ── Config: label + màu cho từng skill ──
const SKILL_CONFIG: {
  key: keyof SkillProgressResponse;
  label: string;
  color: string;
  trackColor: string;
}[] = [
    {
      key: "vocabulary",
      label: "Từ vựng",
      color: "#9ca3af", // xám (như ảnh)
      trackColor: "#374151",
    },
    {
      key: "grammar",
      label: "Ngữ pháp",
      color: "#06b6d4", // cyan
      trackColor: "#164e63",
    },
    {
      key: "reading",
      label: "Đọc hiểu",
      color: "#f59e0b", // vàng amber
      trackColor: "#78350f",
    },
    {
      key: "listening",
      label: "Nghe hiểu",
      color: "#ef4444", // đỏ
      trackColor: "#7f1d1d",
    },
    {
      key: "kanji",
      label: "Kanji",
      color: "#8b5cf6", // tím
      trackColor: "#3b0764",
    },
  ];

// ── Neko advice theo kỹ năng yếu nhất ──
function getNekoAdvice(skills: SkillProgressResponse): string {
  const entries = SKILL_CONFIG.map((c) => ({
    label: c.label,
    value: skills[c.key],
  }));
  const weakest = entries.reduce((a, b) => (a.value < b.value ? a : b));
  const map: Record<string, string> = {
    "Từ vựng":
      "Bạn nên tập trung cải thiện từ vựng, hãy học 10 từ mỗi ngày nhé!",
    "Ngữ pháp":
      "Bạn nên tập trung cải thiện ngữ pháp, luyện thêm các mẫu câu nhé!",
    "Đọc hiểu": "Bạn nên tập trung cải thiện đọc hiểu và nghe hiểu nhé!",
    "Nghe hiểu": "Bạn nên tập trung cải thiện nghe hiểu và đọc hiểu nhé!",
    Kanji: "Bạn nên tập trung cải thiện Kanji, viết và đọc mỗi ngày nhé!",
  };
  return map[weakest.label] ?? "Hãy luyện tập đều đặn mỗi ngày nhé!";
}

interface SkillAnalysisCardProps {
  isDark: boolean;
}

export default function SkillAnalysisCard({ isDark }: SkillAnalysisCardProps) {
  const [skills, setSkills] = useState<SkillProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    skillProgressService
      .getMySkillProgress()
      .then(setSkills)
      .catch(() => setSkills(null))
      .finally(() => setLoading(false));
  }, []);

  const card = `rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`;

  return (
    <div className={card}>
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-center gap-2 border-b ${isDark ? "border-gray-700" : "border-gray-100"
          }`}
      >
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-cyan-500" />
        </div>
        <h3
          className={`font-bold text-sm ${isDark ? "text-gray-100" : "text-gray-800"
            }`}
        >
          Phân tích AI
        </h3>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {loading ? (
          // Skeleton
          <div className="flex flex-col gap-3">
            {SKILL_CONFIG.map((c) => (
              <div key={c.key} className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <div
                    className={`h-3 w-16 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"
                      }`}
                  />
                  <div
                    className={`h-3 w-8 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"
                      }`}
                  />
                </div>
                <div
                  className={`h-2 w-full rounded-full ${isDark ? "bg-gray-700" : "bg-gray-100"
                    }`}
                />
              </div>
            ))}
          </div>
        ) : !skills ? (
          <p
            className={`text-xs text-center py-4 ${isDark ? "text-gray-500" : "text-gray-400"
              }`}
          >
            Chưa có dữ liệu kỹ năng
          </p>
        ) : (
          <>
            {/* Skill bars */}
            <div className="flex flex-col gap-3 mb-4">
              {SKILL_CONFIG.map((c) => {
                const pct = Math.min(Math.max(skills[c.key], 0), 100);
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                      >
                        {c.label}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: c.color }}
                      >
                        {pct}%
                      </span>
                    </div>
                    {/* Track */}
                    <div
                      className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-100"
                        }`}
                    >
                      {/* Fill */}
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Neko Sensei advice */}
            <div
              className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? "bg-gray-700/50" : "bg-gray-50"
                }`}
            >
              {/* Avatar Neko */}
              <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-cyan-300">
                {/* Fallback emoji nếu không có ảnh */}
                <span className="text-lg">🐱</span>
              </div>
              <div>
                <p
                  className={`text-xs font-semibold mb-0.5 ${isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                >
                  Neko Sensei khuyên:
                </p>
                <p
                  className={`text-xs italic ${isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                  &ldquo;{getNekoAdvice(skills)}&rdquo;
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
