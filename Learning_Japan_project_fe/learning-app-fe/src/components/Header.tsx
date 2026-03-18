// components/Header.tsx
import React, { useState, useEffect } from "react";
import { Search, Settings, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import UserDropdown from "@/components/UserDropdown";
import NotificationBell from "@/components/notificationBell"; // ← Giữ nguyên import
import { youtubeService, YoutubeVideoSummary } from "@/services/videoService";
import { useVideoStore } from "@/stores/videoStore";

interface SimpleHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({
  isDarkMode,
  onToggleDarkMode,
}: SimpleHeaderProps) {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    fetchVideos,
    filteredVideos,
    loading
  } = useVideoStore();

  const results = filteredVideos();

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getThumbnailUrl = (urlVideo: string): string => {
    const videoIdMatch = urlVideo.match(
      /(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/
    );
    if (videoIdMatch) {
      return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
    }
    return "/placeholder-video.jpg";
  };

  const getTagColor = (tag: string): string => {
    const tagColors: Record<string, string> = {
      Podcast: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      NEWS: "bg-gradient-to-r from-red-500 to-red-600 text-white",
      TECHNOLOGY: "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white",
      BUSINESS: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
      BEGINNER: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      TED: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
      GRAMMAR: "bg-gradient-to-r from-pink-500 to-pink-600 text-white",
      ANIME: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white",
      SHORT_VIDEO: "bg-gradient-to-r from-violet-500 to-violet-600 text-white",
      MOVIE: "bg-gradient-to-r from-rose-500 to-rose-600 text-white",
      TRAVEL: "bg-gradient-to-r from-teal-500 to-teal-600 text-white",
      CULTURE: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
      FOOD: "bg-gradient-to-r from-lime-500 to-lime-600 text-white",
      KIDS: "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white",
    };
    return (
      tagColors[tag] || "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
    );
  };

  const getLevelColor = (level: string): string => {
    const levelColors: Record<string, string> = {
      N5: "bg-gradient-to-r from-green-500 to-teal-500 text-white",
      N4: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
      N3: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
      N2: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
      N1: "bg-gradient-to-r from-red-500 to-rose-600 text-white",
    };
    return (
      levelColors[level] ||
      "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
    );
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Gần đây";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  const handleVideoClick = (video: YoutubeVideoSummary) => {
    youtubeService.getById(video.id).catch((err) => console.error(err));
    setSearchQuery("");
    router.push(`/video/${video.id}`);
  };

  return (
    <div
      className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-b px-4 py-2 transition-colors duration-300`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar - Left */}
        <div className="flex-1 max-w-2xl relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
          />
          <input
            type="text"
            placeholder="Nhập từ khóa để tìm kiếm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all ${isDarkMode
              ? "bg-gray-700 text-gray-100 placeholder:text-gray-400"
              : "bg-gray-50 text-gray-800 placeholder:text-gray-500 border border-gray-200"
              }`}
          />

          {/* Search Results Dropdown */}
          {searchQuery && results.length > 0 && (
            <div
              className={`absolute z-50 mt-2 w-full rounded-lg shadow-xl max-h-96 overflow-y-auto border ${isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
                }`}
            >
              {results.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className={`flex gap-3 p-3 border-b last:border-b-0 transition-all duration-200 cursor-pointer ${isDarkMode
                    ? "hover:bg-gray-700/50 border-gray-700"
                    : "hover:bg-cyan-50 border-gray-100"
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={getThumbnailUrl(video.urlVideo)}
                      alt={video.title}
                      className="w-32 h-20 object-cover rounded-lg shadow-md"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-black/90 text-white text-xs px-2 py-0.5 rounded font-semibold">
                      {formatDuration(video.duration)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium line-clamp-2 mb-1 ${isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                    >
                      {video.title}
                    </h4>

                    <p
                      className={`text-xs mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                      Corodomo • {formatDate(video.createdAt)}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      <span
                        className={`${getTagColor(
                          video.videoTag
                        )} text-xs px-2.5 py-1 rounded-full font-medium shadow-sm`}
                      >
                        {video.videoTag}
                      </span>
                      <span
                        className={`${getLevelColor(
                          video.level
                        )} text-xs px-2.5 py-1 rounded-full font-medium shadow-sm`}
                      >
                        {video.level}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading State */}
          {searchQuery && loading && (
            <div
              className={`absolute z-50 mt-2 w-full rounded-lg shadow-xl px-4 py-3 text-sm border ${isDarkMode
                ? "bg-gray-800 text-gray-100 border-gray-700"
                : "bg-white text-gray-800 border-gray-200"
                }`}
            >
              Đang tìm kiếm...
            </div>
          )}

          {/* No results */}
          {searchQuery && results.length === 0 && !loading && (
            <div
              className={`absolute z-50 mt-2 w-full rounded-lg shadow-xl px-4 py-3 text-sm border ${isDarkMode
                ? "bg-gray-800 text-gray-100 border-gray-700"
                : "bg-white text-gray-800 border-gray-200"
                }`}
            >
              Không có kết quả
            </div>
          )}
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-3">
          {/* ✅ Nút Video của tôi */}
          <button
            onClick={() => router.push("/video/myVideo")}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#00CFE8] text-white rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="text-sm">Video của tôi</span>
          </button>

          {/* ✅ Notification Bell - KHÔNG CẦN TRUYỀN userId */}
          <NotificationBell isDarkMode={isDarkMode} />

          <button
            className={`p-1.5 rounded-lg transition-all ${isDarkMode
              ? "hover:bg-gray-700 text-gray-300"
              : "hover:bg-gray-100 text-gray-600"
              }`}
            title="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </button>

          <UserDropdown
            isDark={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        </div>
      </div>
    </div>
  );
}
