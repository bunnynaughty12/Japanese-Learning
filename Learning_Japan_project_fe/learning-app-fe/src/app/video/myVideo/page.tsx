"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { youtubeService, YoutubeVideoSummary } from "@/services/videoService";
import {
  BookmarkCheck,
  Play,
  Clock,
  Trash2,
  Video,
  Loader2,
  History,
  Eye,
  CheckCircle2,
  Calendar,
} from "lucide-react";

type RecentlyViewedVideo = YoutubeVideoSummary & {
  lastViewedAt?: string;
  completionPercentage?: number;
  completed?: boolean;
};

export default function MyLibraryPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentStreak] = useState(4);
  const [isMounted, setIsMounted] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"SAVED" | "HISTORY">("SAVED");

  // Data states
  const [savedVideos, setSavedVideos] = useState<YoutubeVideoSummary[]>([]);
  const [historyVideos, setHistoryVideos] = useState<RecentlyViewedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initial data load
  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted]);

  // Realtime time update
  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Realtime history updates
  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") loadHistory();
    }, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadHistory();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("video_progress_") || e.key === "video_progress_update") loadHistory();
    };

    const handleCustom = () => loadHistory();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("videoProgressUpdated", handleCustom);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("videoProgressUpdated", handleCustom);
    };
  }, [isMounted]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadSavedVideos(), loadHistory()]);
    setIsLoading(false);
  };

  const loadSavedVideos = async () => {
    try {
      const data = await youtubeService.getMySavedVideos();
      setSavedVideos(data);
    } catch (err) {
      console.error("❌ Failed to load saved videos:", err);
      setError("Không thể tải danh sách video đã lưu");
    }
  };

  const loadHistory = async () => {
    try {
      const progressList = await youtubeService.getAllVideoProgress();
      if (!progressList || progressList.length === 0) {
        setHistoryVideos([]);
        return;
      }

      const allVideos = await youtubeService.getAll();
      const merged: RecentlyViewedVideo[] = progressList
        .map((p) => {
          const video = allVideos.find((v) => v.id === p.videoId);
          if (!video) return null;

          const durationSeconds = parseDurationToSeconds(video.duration);
          const completionPercentage = durationSeconds > 0
            ? Math.min(100, Math.floor((p.lastPositionSeconds / durationSeconds) * 100))
            : 0;

          return {
            ...video,
            lastViewedAt: p.lastWatchedAt,
            completionPercentage,
            completed: p.completed,
          };
        })
        .filter(Boolean) as RecentlyViewedVideo[];

      merged.sort((a, b) => new Date(b.lastViewedAt || b.createdAt).getTime() - new Date(a.lastViewedAt || a.createdAt).getTime());
      setHistoryVideos(merged);
    } catch (err) {
      console.error("❌ Failed to load history:", err);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (deletingId) return;
    try {
      setDeletingId(videoId);
      await youtubeService.removeSavedVideo(videoId);
      setSavedVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      console.error("❌ Failed to remove video:", err);
      alert("Không thể xóa video. Vui lòng thử lại!");
    } finally {
      setDeletingId(null);
    }
  };

  const handleVideoClick = (videoId: string) => router.push(`/video/${videoId}`);

  const getYoutubeThumbnail = (videoId: string) => `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const formatDuration = (duration: string) => {
    const seconds = parseDurationToSeconds(duration);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getTimeAgo = (date?: string) => {
    if (!date) return "";
    const diff = Math.floor((currentTime.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "Vừa xem";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const stats = useMemo(() => ({
    totalHistory: historyVideos.length,
    completed: historyVideos.filter(v => v.completionPercentage === 100).length,
    inProgress: historyVideos.filter(v => v.completionPercentage! > 0 && v.completionPercentage! < 100).length,
  }), [historyVideos]);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <>

      <div className={`fixed inset-0 flex transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"}`}>
        <Sidebar sidebarOpen={showSidebar} setSidebarOpen={setShowSidebar} isDarkMode={isDarkMode} currentStreak={currentStreak} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          {/* Tab Navigation */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-cyan-100"}`}>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("SAVED")}
                className={`flex items-center gap-2 pb-2 border-b-2 transition-all font-semibold ${activeTab === "SAVED"
                  ? "border-cyan-500 text-cyan-500"
                  : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
              >
                <BookmarkCheck className="w-5 h-5" />
                <span>Video đã lưu</span>
              </button>
              <button
                onClick={() => setActiveTab("HISTORY")}
                className={`flex items-center gap-2 pb-2 border-b-2 transition-all font-semibold ${activeTab === "HISTORY"
                  ? "border-cyan-500 text-cyan-500"
                  : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
              >
                <History className="w-5 h-5" />
                <span>Lịch sử xem</span>
              </button>
            </div>

            {activeTab === "HISTORY" && historyVideos.length > 0 && (
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{stats.completed} Xong</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-bold border border-orange-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{stats.inProgress} Dở</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className={`w-12 h-12 animate-spin text-cyan-500`} />
                <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Đang tải...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-500 font-medium">{error}</p>
                <button onClick={loadData} className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg">Thử lại</button>
              </div>
            ) : activeTab === "SAVED" ? (
              // SAVED TAB CONTENT
              savedVideos.length === 0 ? (
                <EmptyState icon="📚" title="Chưa có video đã lưu" desc="Bắt đầu học ngay!" onAction={() => router.push("/video")} isDarkMode={isDarkMode} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {savedVideos.map((video) => (
                    <VideoCard key={video.id} video={video} onRemove={handleRemoveVideo} onClick={handleVideoClick} isDarkMode={isDarkMode} deletingId={deletingId} getYoutubeThumbnail={getYoutubeThumbnail} formatDuration={formatDuration} />
                  ))}
                </div>
              )
            ) : (
              // HISTORY TAB CONTENT
              historyVideos.length === 0 ? (
                <EmptyState icon="👀" title="Chưa có lịch sử xem" desc="Xem video để ghi lại quá trình." onAction={() => router.push("/video")} isDarkMode={isDarkMode} />
              ) : (
                <div className="space-y-4 max-w-5xl mx-auto">
                  {historyVideos.map((video) => (
                    <HistoryItem key={video.id} video={video} onClick={handleVideoClick} isDarkMode={isDarkMode} getYoutubeThumbnail={getYoutubeThumbnail} formatDuration={formatDuration} getTimeAgo={getTimeAgo} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const EmptyState = ({ icon, title, desc, onAction, isDarkMode }: any) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <div className="text-6xl mb-4 opacity-50">{icon}</div>
    <p className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{title}</p>
    <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
    <button onClick={onAction} className="px-8 py-3 bg-cyan-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
      <Video className="w-5 h-5" />
      Khám phá ngay
    </button>
  </div>
);

const VideoCard = ({ video, onRemove, onClick, isDarkMode, deletingId, getYoutubeThumbnail, formatDuration }: any) => (
  <div className={`group rounded-2xl overflow-hidden border-2 transition-all hover:scale-[1.03] ${isDarkMode ? "bg-gray-800 border-gray-700 hover:border-cyan-500" : "bg-white border-gray-100 hover:border-cyan-400 shadow-sm"}`}>
    <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => onClick(video.id)}>
      <img src={getYoutubeThumbnail(video.id)} alt={video.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg"><Play className="w-6 h-6 text-white ml-1" /></div>
      </div>
      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-bold">{formatDuration(video.duration)}</div>
    </div>
    <div className="p-4">
      <h3 className={`text-sm font-bold line-clamp-2 mb-3 cursor-pointer hover:text-cyan-500 transition-colors ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} onClick={() => onClick(video.id)}>{video.title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500 font-medium italic">{new Date(video.createdAt).toLocaleDateString("vi-VN")}</span>
        <button onClick={() => onRemove(video.id)} disabled={deletingId === video.id} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">{deletingId === video.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
      </div>
    </div>
  </div>
);

const HistoryItem = ({ video, onClick, isDarkMode, getYoutubeThumbnail, formatDuration, getTimeAgo }: any) => (
  <div className={`group rounded-2xl border transition-all hover:scale-[1.01] cursor-pointer ${isDarkMode ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-cyan-500" : "bg-white border-gray-100 hover:border-cyan-400 shadow-sm"}`} onClick={() => onClick(video.id)}>
    <div className="flex gap-4 p-4 items-center">
      <div className="relative w-40 h-24 rounded-xl overflow-hidden shadow-md flex-shrink-0">
        <img src={getYoutubeThumbnail(video.id)} alt={video.title} className="w-full h-full object-cover" />
        <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white font-bold">{formatDuration(video.duration)}</div>
        {video.completionPercentage !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-900/40">
            <div className={`h-full transition-all ${video.completionPercentage === 100 ? "bg-green-500" : "bg-cyan-500"}`} style={{ width: `${video.completionPercentage}%` }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <h3 className={`font-bold text-sm mb-2 line-clamp-1 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>{video.title}</h3>
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 text-orange-500/80"><Clock className="w-3.5 h-3.5" /><span>{formatDuration(video.duration)}</span></div>
          <div className={`flex items-center gap-1.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}><Calendar className="w-3.5 h-3.5" /><span>{getTimeAgo(video.lastViewedAt || video.createdAt)}</span></div>
          {video.completionPercentage !== undefined && (
            <div className={`px-2 py-0.5 rounded text-[10px] ${video.completionPercentage === 100 ? "bg-green-500/20 text-green-500" : "bg-cyan-500/20 text-cyan-500"}`}>{video.completionPercentage}% Hoàn thành</div>
          )}
        </div>
      </div>
      <div className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-all mr-2"><Play className="w-6 h-6 fill-current" /></div>
    </div>
  </div>
);

const parseDurationToSeconds = (duration: string): number => {
  const match = duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return parseInt(h || "0") * 3600 + parseInt(m || "0") * 60 + parseInt(s || "0");
};
