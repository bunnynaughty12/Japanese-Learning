"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Video,
  Play,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Gift,
  BookOpen,
  BookMarked,
  GraduationCap,
  PenTool,
} from "lucide-react";
import UpgradePlusModal from "./payment/Upgradeplusmodal ";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDarkMode: boolean;
  currentStreak: number;
  onStreakUpdate?: (newStreak: number) => void;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  isDarkMode,
  currentStreak,
  onStreakUpdate,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentDayIndex, setCurrentDayIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const [displayStreak, setDisplayStreak] = React.useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const isActive = (path: string) => {
    if (path === "/video") {
      return pathname === "/video" || pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  React.useEffect(() => {
    setMounted(true);

    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayFirstIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    setCurrentDayIndex(mondayFirstIndex);

    const loadStreak = () => {
      if (typeof window === "undefined") return;

      const lastStudyDate = localStorage.getItem("lastStudyDate");
      const storedStreak = localStorage.getItem("currentStreak");
      const todayStr = today.toDateString();

      if (!lastStudyDate) {
        localStorage.setItem("lastStudyDate", todayStr);
        localStorage.setItem("currentStreak", "1");
        setDisplayStreak(1);
        if (onStreakUpdate) onStreakUpdate(1);
        return;
      }

      const lastDate = new Date(lastStudyDate);
      const todayDate = new Date(todayStr);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      let newStreak = parseInt(storedStreak || "0");

      if (diffDays === 0) {
        setDisplayStreak(newStreak);
        return;
      } else if (diffDays === 1) {
        newStreak += 1;
        localStorage.setItem("lastStudyDate", todayStr);
        localStorage.setItem("currentStreak", newStreak.toString());
        setDisplayStreak(newStreak);
        if (onStreakUpdate) onStreakUpdate(newStreak);
      } else {
        newStreak = 1;
        localStorage.setItem("lastStudyDate", todayStr);
        localStorage.setItem("currentStreak", "1");
        setDisplayStreak(1);
        if (onStreakUpdate) onStreakUpdate(1);
      }
    };

    loadStreak();
  }, [onStreakUpdate]);

  if (!mounted) {
    return (
      <div className="w-72 bg-white/90 backdrop-blur-sm border-cyan-100 border-r transition-all duration-300 flex flex-col shadow-lg">
        <div className="p-4 border-cyan-100 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="cursor-pointer group">
              <img
                src="/logo-cat.png"
                alt="NIBO Academy"
                className="w-14 h-14 object-contain"
              />
            </div>
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 bg-clip-text text-transparent leading-tight">
                NIBO
              </div>
              <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent leading-tight -mt-1">
                ACADEMY
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  const navItems = [
    {
      path: "/video",
      icon: <Video className="w-5 h-5" />,
      label: "Danh sách video",
    },
    {
      path: "/myCourses",
      icon: <GraduationCap className="w-5 h-5" />,
      label: "Khóa học của tôi",
    },
    {
      path: "/vocabulary",
      icon: <BookMarked className="w-5 h-5" />,
      label: "Từ vựng của tôi",
    },
    {
      path: "/kanji",
      icon: <PenTool className="w-5 h-5" />,
      label: "Luyện viết Kanji",
    },
    {
      path: "/practice",
      icon: <BookOpen className="w-5 h-5" />,
      label: "Luyện đề",
    },
    // ✅ Đã xóa Chat Room (dùng FloatingChatButton thay thế)
    // ✅ Đã xóa Video Call
  ];

  return (
    <>

      <div
        className={`${sidebarOpen ? "w-72" : "w-24"} ${isDarkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white/90 backdrop-blur-sm border-cyan-100"
          } border-r transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div
          className={`p-4 ${isDarkMode ? "border-gray-700" : "border-cyan-100"
            } border-b flex items-center justify-between`}
        >
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  onClick={() => router.push("/video")}
                  className="cursor-pointer group"
                >
                  <img
                    src="/logo-cat.png"
                    alt="NIBO Academy"
                    className="w-14 h-14 object-contain transform group-hover:scale-110 transition-transform"
                  />
                </div>
                <div>
                  <div className="text-xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 bg-clip-text text-transparent leading-tight">
                    NIBO
                  </div>
                  <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent leading-tight -mt-1">
                    ACADEMY
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                  ? "text-gray-400 hover:bg-gray-700"
                  : "text-cyan-500 hover:bg-cyan-50"
                  }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full px-1">
              <div
                onClick={() => router.push("/video")}
                className="cursor-pointer group"
              >
                <img
                  src="/logo-cat.png"
                  alt="NIBO Academy"
                  className="w-12 h-12 object-contain transform group-hover:scale-110 transition-transform"
                />
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDarkMode
                  ? "text-gray-400 hover:bg-gray-700"
                  : "text-cyan-400 hover:bg-cyan-50"
                  }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Streak */}
        {sidebarOpen ? (
          <div
            className={`p-4 ${isDarkMode ? "border-gray-700" : "border-cyan-100"
              } border-b`}
          >
            <div
              className={`${isDarkMode
                ? "from-yellow-900/30 to-orange-900/30"
                : "from-cyan-50 via-blue-50 to-indigo-50"
                } bg-gradient-to-r rounded-xl p-3 shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-cyan-700"
                    }`}
                >
                  Streak
                </span>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="flex items-baseline gap-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-8 rounded ${i === currentDayIndex
                      ? "bg-gradient-to-t from-cyan-400 to-cyan-300 shadow-md"
                      : isDarkMode
                        ? "bg-gray-700"
                        : "bg-gray-200"
                      } flex items-end justify-center pb-1`}
                  >
                    <Star
                      className={`w-3 h-3 ${i === currentDayIndex
                        ? "text-white drop-shadow"
                        : isDarkMode
                          ? "text-gray-600"
                          : "text-gray-400"
                        }`}
                      fill={i === currentDayIndex ? "currentColor" : "none"}
                    />
                  </div>
                ))}
              </div>
              <div
                className={`flex justify-between mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-cyan-600"
                  }`}
              >
                {days.map((day, i) => (
                  <span
                    key={i}
                    className={
                      i === currentDayIndex ? "font-bold text-cyan-500" : ""
                    }
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`py-4 ${isDarkMode ? "border-gray-700" : "border-cyan-100"
              } border-b flex flex-col items-center gap-2`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode
                ? "bg-gradient-to-br from-orange-900/40 to-yellow-900/40"
                : "bg-gradient-to-br from-orange-100 to-yellow-100"
                }`}
            >
              <span className="text-2xl">🔥</span>
            </div>
            <span
              className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
            >
              {days[currentDayIndex]}
            </span>
          </div>
        )}

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-3 sidebar-scroll">
          <div className="space-y-2">
            {navItems.map(({ path, icon, label }) =>
              sidebarOpen ? (
                <button
                  key={path}
                  onClick={() => router.push(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition transform hover:scale-105 ${isActive(path)
                    ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-600 font-medium shadow-sm"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ) : (
                <button
                  key={path}
                  onClick={() => router.push(path)}
                  title={label}
                  className={`w-full flex items-center justify-center p-3.5 rounded-xl transition-all shadow-sm ${isActive(path)
                    ? isDarkMode
                      ? "bg-cyan-900/40 text-cyan-400"
                      : "bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-600"
                    : isDarkMode
                      ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                      : "text-gray-600 hover:bg-cyan-50 hover:text-cyan-600"
                    }`}
                >
                  {icon}
                </button>
              )
            )}
          </div>
        </div>

        {/* Upgrade */}
        {sidebarOpen ? (
          <div className="p-4">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-gradient-to-r from-pink-400 via-rose-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <Gift className="w-5 h-5" />
              Nâng cấp Plus
            </button>
          </div>
        ) : (
          <div className="p-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              title="Nâng cấp Plus"
              className="w-full bg-gradient-to-br from-pink-400 via-rose-500 to-purple-500 text-white p-3.5 rounded-xl hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center"
            >
              <Gift className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <UpgradePlusModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
