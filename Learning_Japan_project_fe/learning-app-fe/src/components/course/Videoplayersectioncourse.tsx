import React, { useRef, useEffect, useState } from "react";
import { Play, Heart, MessageSquare, BookOpen, FileText } from "lucide-react";
import { lessonProgressService } from "@/services/lessonProgressService";

// YouTube IFrame API Types
interface YTPlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

interface YTEvent {
  target: YTPlayer;
  data: number;
}

interface YTPlayerConfig {
  videoId: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
  };
  events?: {
    onReady?: (event: YTEvent) => void;
    onStateChange?: (event: YTEvent) => void;
    onError?: (event: YTEvent) => void;
  };
}

interface YouTubeAPI {
  Player: new (
    element: HTMLElement | string,
    config: YTPlayerConfig
  ) => YTPlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Types
interface LessonPart {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  partOrder: number;
  isCompleted: boolean;
}

interface LessonDocumentResponse {
  id: string;
  title: string;
  documentUrl: string;
  documentOrder: number;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  progress: number;
  description?: string;
  isExpanded: boolean;
  parts: LessonPart[];
  documents: LessonDocumentResponse[];
}

type TabType = "materials" | "discussion" | "toc" | "notes";

interface VideoPlayerSectionProps {
  isDarkMode: boolean;
  course: {
    title: string;
    thumbnail: string;
    currentVideoUrl?: string;
  };
  selectedPart: LessonPart | null;
  selectedLesson: Lesson | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onProgressUpdate?: (
    lessonPartId: string,
    progress: number,
    isCompleted: boolean,
    lastWatchedSecond: number
  ) => void;
}

// Helper function to convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuBeMatch) {
    return `https://www.youtube.com/embed/${youtuBeMatch[1]}?enablejsapi=1`;
  }

  const youtubeMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1`;
  }

  if (url.includes("youtube.com/embed/")) {
    return url.includes("?") ? `${url}&enablejsapi=1` : `${url}?enablejsapi=1`;
  }

  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return null;
  }

  return null;
};

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuBeMatch) return youtuBeMatch[1];

  const youtubeMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) return youtubeMatch[1];

  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
};

export default function VideoPlayerSection({
  isDarkMode,
  course,
  selectedPart,
  selectedLesson,
  activeTab,
  setActiveTab,
  onProgressUpdate,
}: VideoPlayerSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [pendingSeekTime, setPendingSeekTime] = useState<number | null>(null);

  // Load saved progress when video changes
  useEffect(() => {
    const loadProgress = async () => {
      if (!selectedPart?.id) return;

      try {
        setIsLoading(true);
        const progressData = await lessonProgressService.getProgress(
          selectedPart.id
        );

        setLastSavedProgress(progressData.progressPercent);

        // Resume video at last watched position
        if (progressData.lastWatchedSecond > 0) {
          if (videoRef.current && !isYouTube) {
            videoRef.current.currentTime = progressData.lastWatchedSecond;
          } else if (isYouTube) {
            // Store the seek time to be applied when YouTube player is ready
            setPendingSeekTime(progressData.lastWatchedSecond);
          }
        }
      } catch (error) {
        console.error("Error loading progress:", error);
        setLastSavedProgress(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [selectedPart?.id, isYouTube]);

  // Apply pending seek when YouTube player becomes ready
  useEffect(() => {
    if (youtubeReady && playerRef.current && pendingSeekTime !== null) {
      try {
        console.log(`⏩ Seeking to ${pendingSeekTime}s`);
        playerRef.current.seekTo(pendingSeekTime, true);
        setPendingSeekTime(null);
      } catch (error) {
        console.error("Error seeking YouTube video:", error);
      }
    }
  }, [youtubeReady, pendingSeekTime]);

  // ⭐ OPTIMIZED: HTML5 Video Tracking - Zero blocking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedPart?.id || isYouTube) return;

    let lastUpdateTime = 0;
    let pendingUpdate = false;
    const UPDATE_INTERVAL = 10000; // 10 seconds

    // ⭐ Debounced progress scheduler
    const scheduleProgressUpdate = () => {
      if (pendingUpdate) return;

      const currentTime = video.currentTime;
      const duration = video.duration;

      if (!duration || duration <= 0 || isNaN(duration)) return;

      const progressPercent = Math.round((currentTime / duration) * 100);
      const now = Date.now();

      const shouldUpdate =
        Math.abs(progressPercent - lastSavedProgress) >= 10 ||
        now - lastUpdateTime >= UPDATE_INTERVAL;

      if (shouldUpdate) {
        pendingUpdate = true;
        const isCompleted = progressPercent >= 90;

        // ⭐ Use requestIdleCallback for zero-impact updates
        const callback = () => {
          console.log("📹 Progress:", progressPercent + "%");

          onProgressUpdate?.(
            selectedPart.id,
            progressPercent,
            isCompleted,
            currentTime
          );

          setLastSavedProgress(progressPercent);
          lastUpdateTime = now;
          pendingUpdate = false;
        };

        if ("requestIdleCallback" in window) {
          requestIdleCallback(callback);
        } else {
          setTimeout(callback, 0);
        }
      }
    };

    // ⭐ RAF-based throttling (smooth, no blocking)
    let rafId: number | null = null;
    const handleTimeUpdate = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        scheduleProgressUpdate();
        rafId = null;
      });
    };

    // ⭐ Immediate save (deferred via setTimeout)
    const handlePauseOrEnd = () => {
      setTimeout(() => {
        const currentTime = video.currentTime;
        const duration = video.duration;

        if (duration && duration > 0) {
          const progressPercent = Math.round((currentTime / duration) * 100);
          const isCompleted = progressPercent >= 90;

          onProgressUpdate?.(
            selectedPart.id,
            progressPercent,
            isCompleted,
            currentTime
          );
        }
      }, 0);
    };

    video.addEventListener("timeupdate", handleTimeUpdate, { passive: true });
    video.addEventListener("pause", handlePauseOrEnd);
    video.addEventListener("ended", handlePauseOrEnd);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePauseOrEnd);
      video.removeEventListener("ended", handlePauseOrEnd);

      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [selectedPart?.id, lastSavedProgress, isYouTube]);

  // ⭐ FIXED: YouTube IFrame API Integration - Non-blocking
  useEffect(() => {
    if (!course.currentVideoUrl || !selectedPart?.id) return;

    const videoId = getYouTubeVideoId(course.currentVideoUrl);
    const isYouTubeVideo = !!videoId;
    setIsYouTube(isYouTubeVideo);

    if (!isYouTubeVideo) return;

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initYouTubePlayer = () => {
      if (!iframeRef.current) return;

      // Destroy existing player
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // Clear existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Reset ready state
      setYoutubeReady(false);

      // Create new player
      if (!window.YT?.Player) return;

      playerRef.current = new window.YT.Player(iframeRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: YTEvent) => {
            console.log("✅ YouTube Player Ready");
            setYoutubeReady(true);

            // ⭐ NON-BLOCKING: Start progress tracking in background
            progressIntervalRef.current = setInterval(() => {
              if (!playerRef.current) return;

              try {
                const currentTime = playerRef.current.getCurrentTime();
                const duration = playerRef.current.getDuration();

                if (duration > 0) {
                  const progressPercent = Math.round(
                    (currentTime / duration) * 100
                  );
                  const isCompleted = progressPercent >= 90;

                  console.log("📺 YouTube Progress Update:", {
                    partId: selectedPart.id,
                    currentTime: currentTime.toFixed(2),
                    duration: duration.toFixed(2),
                    progressPercent,
                    isCompleted,
                  });

                  // ⭐ CRITICAL: Fire and forget - không await
                  onProgressUpdate?.(
                    selectedPart.id,
                    progressPercent,
                    isCompleted,
                    currentTime
                  );

                  setLastSavedProgress(progressPercent);
                }
              } catch (error) {
                // Ignore errors silently to not disrupt playback
                console.warn("YouTube progress tracking error:", error);
              }
            }, 10000); // Update every 10 seconds (reduced frequency)
          },
          onStateChange: (event: YTEvent) => {
            // ⭐ NON-BLOCKING: Save progress when paused or ended
            if (
              event.data === window.YT?.PlayerState.PAUSED ||
              event.data === window.YT?.PlayerState.ENDED
            ) {
              if (!playerRef.current) return;

              try {
                const currentTime = playerRef.current.getCurrentTime();
                const duration = playerRef.current.getDuration();

                if (duration > 0) {
                  const progressPercent = Math.round(
                    (currentTime / duration) * 100
                  );
                  const isCompleted = progressPercent >= 90;

                  console.log("⏸️ YouTube paused/ended - saving progress");

                  // ⭐ Fire and forget
                  onProgressUpdate?.(
                    selectedPart.id,
                    progressPercent,
                    isCompleted,
                    currentTime
                  );
                }
              } catch (error) {
                console.warn("YouTube pause save error:", error);
              }
            }
          },
          onError: (event: YTEvent) => {
            console.error("❌ YouTube Player Error:", event.data);
          },
        },
      });
    };

    // Initialize player when API is ready
    if (window.YT?.Player) {
      initYouTubePlayer();
    } else {
      window.onYouTubeIframeAPIReady = initYouTubePlayer;
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setYoutubeReady(false);
      setPendingSeekTime(null);
    };
  }, [course.currentVideoUrl, selectedPart?.id]);

  return (
    <>
      <style jsx>{`
        /* Custom scrollbar for video player section */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#1f2937" : "#f3f4f6"};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? "#4b5563" : "#d1d5db"};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? "#6b7280" : "#9ca3af"};
        }
      `}</style>

      <div
        className={`flex-1 overflow-y-auto custom-scrollbar ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Video Player */}
        <div className={`${isDarkMode ? "bg-black" : "bg-gray-900"} relative`}>
          <div className="relative w-full" style={{ paddingBottom: "45%" }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading...</p>
                </div>
              </div>
            )}

            <div className="absolute inset-0">
              {selectedPart && course.currentVideoUrl ? (
                (() => {
                  const embedUrl = getYouTubeEmbedUrl(course.currentVideoUrl);

                  if (embedUrl) {
                    // YouTube Video
                    return (
                      <div
                        ref={iframeRef}
                        className="w-full h-full"
                        id="youtube-player"
                      />
                    );
                  } else {
                    // HTML5 Video
                    return (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        controls
                        poster={course.thumbnail}
                        key={selectedPart.id}
                      >
                        <source src={course.currentVideoUrl} type="video/mp4" />
                        <source
                          src={course.currentVideoUrl}
                          type="video/webm"
                        />
                        <source src={course.currentVideoUrl} type="video/ogg" />
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    );
                  }
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <Play className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">
                      {selectedPart
                        ? "Video chưa có sẵn"
                        : "Chọn một phần để bắt đầu"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          {selectedPart && lastSavedProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${lastSavedProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div
          className={`p-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h2
            className={`text-xl font-bold mb-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {selectedPart?.title || selectedLesson?.title || course.title}
          </h2>

          <div className="flex items-center gap-4">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm">Yêu thích</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Báo cáo</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex px-6">
            {[
              { id: "materials" as const, label: "Tài liệu" },
              { id: "discussion" as const, label: "Bình luận" },
              { id: "toc" as const, label: "Mục lục" },
              { id: "notes" as const, label: "Ghi chú" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-500"
                    : isDarkMode
                    ? "border-transparent text-gray-400 hover:text-gray-300"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6" id="materials-section">
          {activeTab === "materials" && (
            <div className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
              <h3 className="font-bold text-lg mb-4">Tài liệu học tập</h3>

              {/* Display Lesson Documents */}
              {selectedLesson && selectedLesson.documents.length > 0 ? (
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-md mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-500" />
                    Tài liệu bài học
                  </h4>
                  {selectedLesson.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-4 rounded-lg border transition ${
                        isDarkMode
                          ? "border-gray-700 hover:bg-gray-700 hover:border-cyan-500"
                          : "border-gray-200 hover:bg-gray-50 hover:border-cyan-500"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-cyan-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            isDarkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tài liệu học tập
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4 py-8 text-center">
                  Chưa có tài liệu cho bài học này
                </p>
              )}

              <div className="flex gap-4">
                <button className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Thêm Flashcard
                </button>
                <button className="px-6 py-2 border border-cyan-500 text-cyan-500 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition">
                  Ghi chú
                </button>
              </div>
            </div>
          )}
          {activeTab === "discussion" && (
            <div
              className={`text-center py-8 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có bình luận nào</p>
            </div>
          )}
          {activeTab === "toc" && (
            <div className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
              <p>Xem danh sách bài học ở cột bên phải</p>
            </div>
          )}
          {activeTab === "notes" && (
            <div
              className={`text-center py-8 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có ghi chú nào</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
