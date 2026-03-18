"use client";
import { youtubeService } from "@/services/videoService";
import { useVideoStore } from "@/stores/videoStore";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useDarkMode } from "@/hooks/useDarkMode";
import Header from "@/components/Header";
import VideoBanner from "@/components/videoYTB/VideoBanner";
import LoadingCat from "@/components/LoadingCat";
import UploadVideoModal from "@/components/videoYTB/UploadVideoModal";

import React, { useState, useEffect } from "react";

import { Play, Clock, X, AlertCircle, Video } from "lucide-react";
import { JLPTLevel, VideoTag } from "@/types/video";

// Types
interface YoutubeVideoSummary {
  id: string;
  title: string;
  urlVideo: string;
  duration: string;
  videoTag: VideoTag;
  level: JLPTLevel;
  createdAt: string;
}

interface VideoCardProps {
  video: YoutubeVideoSummary;
  isDark: boolean;
  onClick: () => void;
}

interface VideoModalProps {
  video: YoutubeVideoSummary;
  isDark: boolean;
  onClose: () => void;
}

// Mapping tabs to VideoTag
const TAB_TO_TAG_MAP: Record<string, VideoTag | "ALL"> = {
  "Toàn bộ": "ALL",
  "Tin tức": "NEWS",
  "Mới bắt đầu": "BEGINNER",
  Podcast: "PODCAST",
  "Công nghệ": "TECHNOLOGY",
  "Kinh doanh": "BUSINESS",
  TED: "TED",
  "Ngữ pháp": "GRAMMAR",
  "Hoạt hình": "ANIME",
  "Video ngắn": "SHORT_VIDEO",
  Phim: "MOVIE",
  "Du lịch": "TRAVEL",
  "Văn hóa": "CULTURE",
  "Ẩm thực": "FOOD",
  Kids: "KIDS",
};

// Video Modal
const VideoModal: React.FC<VideoModalProps> = ({ video, isDark, onClose }) => {
  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/
    );
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
    return url;
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ zIndex: 9998 }}
    >
      <div
        className={`${isDark ? "bg-gray-800" : "bg-white"
          } rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"
            }`}
        >
          <h2
            className={`text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-800"
              } line-clamp-1`}
          >
            {video.title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
          >
            <X
              className={`w-5 h-5 ${isDark ? "text-gray-300" : "text-gray-600"
                }`}
            />
          </button>
        </div>
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={getYouTubeEmbedUrl(video.urlVideo)}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-4">
          <div
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(video.duration)}
              </span>
              <span>{formatDate(video.createdAt)}</span>
              <span className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white text-xs font-bold rounded-full">
                {video.level}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Video Card
const VideoCard: React.FC<VideoCardProps> = ({ video, isDark, onClick }) => {
  const getYouTubeThumbnail = (url: string) => {
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/
    );
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
    }
    return null;
  };

  const thumbnailUrl = getYouTubeThumbnail(video.urlVideo);

  const getThumbnailGradient = (videoId: string) => {
    const colors = [
      "from-cyan-400 to-cyan-500",
      "from-cyan-300 to-cyan-600",
      "from-cyan-400 to-teal-500",
      "from-teal-400 to-cyan-500",
      "from-cyan-500 to-cyan-600",
      "from-cyan-300 to-teal-400",
    ];
    let hash = 0;
    for (let i = 0; i < videoId.length; i++) {
      hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div
      onClick={onClick}
      className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border`}
    >
      <div className="relative">
        {thumbnailUrl ? (
          <div className="w-full h-40 relative bg-gray-200">
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement?.classList.add(
                  "bg-gradient-to-br",
                  getThumbnailGradient(video.id)
                );
              }}
            />
          </div>
        ) : (
          <div
            className={`w-full h-40 bg-gradient-to-br ${getThumbnailGradient(
              video.id
            )} flex items-center justify-center`}
          >
            <Play className="w-16 h-16 text-white/80" />
          </div>
        )}

        {/* Level Badge - Top Left */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white text-xs font-bold rounded shadow-lg">
          {video.level}
        </div>

        {/* Duration Badge - Bottom Right */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(video.duration)}
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-lg">
            <Play className="w-7 h-7 text-cyan-500 ml-1" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3
          className={`font-semibold ${isDark ? "text-gray-100" : "text-gray-800"
            } text-sm line-clamp-2 mb-2 min-h-[40px]`}
        >
          {video.title}
        </h3>
        <div
          className={`flex items-center gap-3 text-xs ${isDark ? "text-gray-400" : "text-gray-600"
            }`}
        >
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(video.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility functions
const formatDuration = (duration?: string): string => {
  if (!duration) return "00:00";
  if (duration.includes(":")) return duration;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "00:00";
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatDate = (dateString?: string): string => {
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

// Main Component
export default function VideoListPage() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const {
    videos,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    fetchVideos
  } = useVideoStore();

  const [activeTab, setActiveTab] = useState("Toàn bộ");
  const [activeLevel, setActiveLevel] = useState<JLPTLevel | "ALL">("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideoSummary | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleVideoClick = (video: YoutubeVideoSummary) => {
    youtubeService.getById(video.id).catch((err) => console.error(err));
    router.push(`/video/${video.id}`);
  };

  // Get active tag from tab
  const activeTag = TAB_TO_TAG_MAP[activeTab] || "ALL";

  // Filter videos by search query, level, and tag
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesLevel = activeLevel === "ALL" || video.level === activeLevel;
    const matchesTag = activeTag === "ALL" || video.videoTag === activeTag;
    const isShadowingVideo = !!video.videoTag; // Extra safety check
    return matchesSearch && matchesLevel && matchesTag && isShadowingVideo;
  });

  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <LoadingCat
            size="xl"
            isDark={true}
            message="Đang tải"
            subMessage="Vui lòng đợi trong giây lát"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 5px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 5px;
          transition: background 0.2s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 10px;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 5px;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 5px;
          transition: background 0.2s;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <div
        className={`flex h-screen ${isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
          }`}
      >
        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            isDark={isDarkMode}
            onClose={() => setSelectedVideo(null)}
          />
        )}

        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative z-0">
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          <VideoBanner
            isDarkMode={isDarkMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onUploadClick={() => setIsUploadModalOpen(true)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeLevel={activeLevel}
            onLevelChange={setActiveLevel}
          />

          {/* Video Content */}
          <div
            className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar"
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingCat
                  size="lg"
                  isDark={isDarkMode}
                  message="Đang tải video"
                  subMessage="Vui lòng đợi trong giây lát"
                />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle
                    className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-cyan-400" : "text-cyan-500"
                      }`}
                  />
                  <p
                    className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                  >
                    Không thể tải video
                  </p>
                  <p
                    className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    {error}
                  </p>
                  <button
                    onClick={fetchVideos}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:shadow-lg transition"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Video
                    className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-cyan-400"
                      }`}
                  />
                  <p
                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    {searchQuery ||
                      activeLevel !== "ALL" ||
                      activeTab !== "Toàn bộ"
                      ? "Không tìm thấy video nào"
                      : "Chưa có video nào"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isDark={isDarkMode}
                    onClick={() => handleVideoClick(video)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchVideos}
        isDark={isDarkMode}
      />
    </>
  );
}
