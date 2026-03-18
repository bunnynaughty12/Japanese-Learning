import React, { useEffect, useState } from "react";
import { BookOpen, PlayCircle, Loader2 } from "lucide-react";
import {
  courseService,
  CourseProgressResponse,
} from "@/services/userCourseProgressService";

interface ProgressCardProps {
  courseId: string;
  isDark: boolean;
  onClick: () => void;
  index: number;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  courseId,
  isDark,
  onClick,
  index,
}) => {
  const [data, setData] = useState<CourseProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course progress on mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await courseService.getProgress(courseId);
        setData(response);
      } catch (err) {
        console.error("Error fetching course progress:", err);
        setError("Không thể tải dữ liệu khóa học");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [courseId]);

  const colors = [
    {
      bg: "from-cyan-400 to-cyan-500",
      accent: "cyan",
      border: "border-l-cyan-400",
    },
    {
      bg: "from-orange-400 to-orange-500",
      accent: "orange",
      border: "border-l-orange-400",
    },
    {
      bg: "from-pink-400 to-pink-500",
      accent: "pink",
      border: "border-l-pink-400",
    },
    {
      bg: "from-purple-400 to-purple-500",
      accent: "purple",
      border: "border-l-purple-400",
    },
  ];

  const color = colors[index % colors.length];

  const getLevelBadgeColor = (level: string) => {
    const levelColors: Record<string, string> = {
      N5: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      N4: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      N3: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      N2: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      N1: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    };
    return levelColors[level] || levelColors.N5;
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } rounded-2xl overflow-hidden shadow-sm border-l-4 ${color.border
          } relative h-64 flex items-center justify-center`}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div
        className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-red-400 relative h-64 flex items-center justify-center`}
      >
        <div className="text-center p-6">
          <p className="text-red-500 text-sm mb-2">
            {error || "Không thể tải dữ liệu"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-cyan-500 hover:underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const { course, percent, completed } = data;

  return (
    <div
      onClick={onClick}
      className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 ${color.border
        }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${getLevelBadgeColor(
                  course.level
                )}`}
              >
                GIAI ĐOẠN {index + 1}
              </span>
              <span
                className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"
                  }`}
              >
                {course.level}
              </span>
              {completed && (
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded font-semibold">
                  ✓ Hoàn thành
                </span>
              )}
            </div>
            <h3
              className={`text-base font-bold mb-1 ${isDark ? "text-gray-100" : "text-gray-900"
                }`}
            >
              {index + 1}. {course.title}
            </h3>
            <p
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"
                } line-clamp-2`}
            >
              {course.description}
            </p>
          </div>

          {/* Progress Circle */}
          <div className="ml-4">
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
                  stroke={`url(#gradient-${index})`}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${percent * 1.76} 176`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient
                    id={`gradient-${index}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      className={`text-${color.accent}-400`}
                      stopColor="currentColor"
                    />
                    <stop
                      offset="100%"
                      className={`text-${color.accent}-500`}
                      stopColor="currentColor"
                    />
                  </linearGradient>
                </defs>
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

        {/* Stats - Note: API doesn't provide section/lesson counts, so we show minimal info */}
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
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"
                }`}
            >
              Giảng viên: {course.createdBy}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div
            className={`h-2 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"
              }`}
          >
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${color.bg} transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${color.bg} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
        >
          <PlayCircle className="w-4 h-4" />
          {completed ? "Ôn tập" : percent > 0 ? "Tiếp tục học" : "Bắt đầu"}
        </button>
      </div>
    </div>
  );
};

export default ProgressCard;
