"use client";
import React, { useEffect, useState } from "react";
import { BookOpen, PlayCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  courseService,
  CourseProgressResponse,
} from "@/services/userCourseProgressService";

interface JLPTRoadmapCardProps {
  isDark: boolean;
}

const colors = [
  {
    bg: "from-cyan-400 to-cyan-500",
    border: "border-l-cyan-400",
    hex: "#06b6d4",
  },
  {
    bg: "from-emerald-400 to-emerald-500",
    border: "border-l-emerald-400",
    hex: "#10b981",
  },
  { bg: "from-red-400 to-red-500", border: "border-l-red-400", hex: "#ef4444" },
  {
    bg: "from-purple-400 to-purple-500",
    border: "border-l-purple-400",
    hex: "#a855f7",
  },
];

const getLevelBadgeColor = (level: string) => {
  const map: Record<string, string> = {
    N5: "bg-green-100 text-green-700",
    N4: "bg-blue-100 text-blue-700",
    N3: "bg-purple-100 text-purple-700",
    N2: "bg-orange-100 text-orange-700",
    N1: "bg-cyan-100 text-cyan-700",
  };
  return map[level] || map.N5;
};

// ── Single card ──
const CourseProgressCard: React.FC<{
  data: CourseProgressResponse;
  index: number;
  isDark: boolean;
  onClick: () => void;
}> = ({ data, index, isDark, onClick }) => {
  const color = colors[index % colors.length];
  const { course, percent, completed } = data;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 ${color.border
        } ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {completed && (
              <div className="mb-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                  ✓ Hoàn thành
                </span>
              </div>
            )}
            <h3
              className={`text-base font-bold mb-1 ${isDark ? "text-gray-100" : "text-gray-900"
                }`}
            >
              {index + 1}. {course.title}
            </h3>
            <p
              className={`text-xs line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"
                }`}
            >
              {course.description}
            </p>
          </div>

          {/* Circle Progress */}
          <div className="ml-4 flex-shrink-0">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke={isDark ? "#374151" : "#E5E7EB"}
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke={color.hex}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${percent * 1.76} 176`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-lg font-bold ${isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                >
                  {Math.round(percent)}%
                </span>
                <span className="text-[9px] text-gray-500">Tiến độ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-gray-400" />
            <span
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"
                }`}
            >
              {course.lessonProcess}
            </span>
          </div>
          <span
            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Giảng viên: {course.createdBy}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div
            className={`h-2 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"
              }`}
          >
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${color.bg} transition-all duration-500`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Button */}
        <button
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${color.bg} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <PlayCircle className="w-4 h-4" />
          {completed ? "Ôn tập" : percent > 0 ? "Tiếp tục học" : "Bắt đầu"}
        </button>
      </div>
    </div>
  );
};

// ── Main ──
export default function JLPTRoadmapCard({ isDark }: JLPTRoadmapCardProps) {
  const router = useRouter();
  const [list, setList] = useState<CourseProgressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await courseService.getMyProgress();
        setList(data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu khóa học");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`rounded-2xl border-l-4 border-l-cyan-400 h-48 flex items-center justify-center ${isDark ? "bg-gray-800" : "bg-white"
              }`}
          >
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Đang tải...
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl p-6 text-center ${isDark ? "bg-gray-800" : "bg-white"
          }`}
      >
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-cyan-500 hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div
        className={`rounded-2xl p-6 text-center ${isDark ? "bg-gray-800" : "bg-white"
          }`}
      >
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Chưa có dữ liệu khóa học
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {list.map((item, i) => (
        <CourseProgressCard
          key={item.id}
          data={item}
          index={i}
          isDark={isDark}
          onClick={() => router.push(`/myCourses/${item.course.id}`)}
        />
      ))}
    </div>
  );
}
