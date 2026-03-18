"use client";
import UserDropdown from "@/components/UserDropdown";
import { useDarkMode } from "@/hooks/useDarkMode";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import VideoPlayerSection from "@/components/videoYTB/VideoPlayerSection";
import DictationPractice from "@/components/Dictation";
import Sidebar from "@/components/Sidebar";
import { youtubeService } from "@/services/videoService";
import { YoutubePlayerHandle } from "@/components/videoYTB/YoutubePlayer";
import AutoScrollToggle from "@/components/AutoScrollToggle";
import PronunciationPractice from "@/components/PronunciationPractice";
import VocabularySidebar from "@/components/videoYTB/VocabularySidebar";
import { JLPTLevel, VideoTag } from "@/types/video";
import VideoExercise from "@/components/videoYTB/Videoexercise";

import {
  Video,
  Menu,
  Play,
  Volume2,
  BookOpen,
  X,
  Bookmark,
  BookmarkCheck,
  Languages,
} from "lucide-react";

import {
  transcriptService,
  YoutubeTranscriptResponse,
  TranscriptDTO,
} from "@/services/transcriptService";

type ViewMode = "video" | "dictation" | "pronunciation" | "exercise";

function VideoLearningContent({ videoId }: { videoId: string }) {
  const router = useRouter();
  const [seekTimeMs, setSeekTimeMs] = useState<number | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);

  const [showSidebar, setShowSidebar] = useState(true);
  const [showVocabSidebar, setShowVocabSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("video");
  const [transcripts, setTranscripts] = useState<TranscriptDTO[]>([]);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [videoLevel, setVideoLevel] = useState<JLPTLevel>("N5");
  const [videoTag, setVideoTag] = useState<VideoTag>("BEGINNER");
  const [selectedText, setSelectedText] = useState<string>("");
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();
  const [currentStreak] = useState(4);

  const [vocabRefreshTrigger, setVocabRefreshTrigger] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Tracking states
  const [isPlaying, setIsPlaying] = useState(false);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const transcriptRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayerHandle | null>(null);

  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [showSidebarTranslation, setShowSidebarTranslation] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVideoTimeRef = useRef<number | null>(null);
  const accumulatedWatchTimeRef = useRef<number>(0);

  const handleSeekToTime = (timeMs: number) => {
    setSeekTimeMs(timeMs);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleVocabSaved = () => {
    setVocabRefreshTrigger((prev) => prev + 1);
    setShowVocabSidebar(true);
  };

  const handleSaveVideo = async () => {
    if (isSaving || isSaved) return;

    try {
      setIsSaving(true);
      await youtubeService.saveVideo(videoId);
      setIsSaved(true);
      console.log("✅ Video saved successfully");
    } catch (error) {
      console.error("❌ Failed to save video:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const activeTranscript = useMemo(
    () =>
      transcripts.find(
        (t) => currentTimeMs >= t.startOffset && currentTimeMs < t.endOffset
      ),
    [transcripts, currentTimeMs]
  );

  // Tracking progress chỉ khi đang phát thật sự
  useEffect(() => {
    if (!videoId) return;

    if (!isPlaying) {
      lastVideoTimeRef.current = null;
      return;
    }

    if (lastVideoTimeRef.current === null) {
      lastVideoTimeRef.current = currentTimeMs;
      return;
    }

    const deltaVideoMs = currentTimeMs - lastVideoTimeRef.current;

    if (deltaVideoMs <= 0 || deltaVideoMs > 1500) {
      lastVideoTimeRef.current = currentTimeMs;
      return;
    }

    accumulatedWatchTimeRef.current += deltaVideoMs;
    lastVideoTimeRef.current = currentTimeMs;

    if (accumulatedWatchTimeRef.current >= 5000) {
      const watchedSeconds = Math.floor(accumulatedWatchTimeRef.current / 1000);
      const currentSecond = Math.floor(currentTimeMs / 1000);

      youtubeService.trackingProgess({
        videoId,
        lastPositionSeconds: currentSecond,
        watchedSecondsDelta: watchedSeconds,
      });

      accumulatedWatchTimeRef.current = 0;
    }
  }, [currentTimeMs, isPlaying, videoId]);

  useEffect(() => {
    if (
      autoScrollEnabled &&
      !isUserScrolling &&
      activeTranscript &&
      transcriptRefs.current[activeTranscript.id]
    ) {
      const element = transcriptRefs.current[activeTranscript.id];
      const container = scrollContainerRef.current;

      if (element && container) {
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2;

        container.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    }
  }, [activeTranscript, isUserScrolling, autoScrollEnabled]);

  useEffect(() => {
    if (!videoId) return;

    let isMounted = true;

    async function fetchVideoData() {
      try {
        console.log("🔄 Fetching video data for videoId:", videoId);

        const transcriptData: YoutubeTranscriptResponse =
          await transcriptService.getTranscripts(videoId);

        if (isMounted) {
          console.log(
            "✅ Transcripts loaded:",
            transcriptData.transcriptsDTOS.length
          );
          setTranscripts(transcriptData.transcriptsDTOS);
          setVideoTitle(transcriptData.title);
        }

        try {
          const videos = await youtubeService.getAll();
          const currentVideo = videos.find((v) => v.id === videoId);

          if (currentVideo && isMounted) {
            console.log("✅ Video metadata loaded:", currentVideo);
            setVideoLevel(currentVideo.level);
            setVideoTag(currentVideo.videoTag);
          }
        } catch (metaError) {
          console.warn("⚠️ Failed to fetch video metadata:", metaError);
        }

        // Kiểm tra xem video đã được lưu chưa
        try {
          const savedVideos = await youtubeService.getMySavedVideos();
          if (isMounted && savedVideos.some((v) => v.id === videoId)) {
            setIsSaved(true);
            console.log("✅ Video is already saved");
          }
        } catch (saveError) {
          console.warn("⚠️ Failed to check saved status:", saveError);
        }
      } catch (err) {
        console.error("❌ Failed to fetch video data", err);
        if (isMounted) {
          setTranscripts([]);
          setVideoTitle("Không tải được video");
        }
      }
    }

    fetchVideoData();

    return () => {
      isMounted = false;
      console.log("🧹 Cleanup VideoLearningContent for videoId:", videoId);
    };
  }, [videoId]);

  const handleUserScroll = () => {
    if (!autoScrollEnabled) return;

    setIsUserScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  };

  const toggleAutoScroll = () => {
    setAutoScrollEnabled((prev) => !prev);
    setIsUserScrolling(false);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0 && text.length < 100) {
        setSelectedText(text);
        setShowVocabSidebar(true);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 flex transition-colors duration-300 ${isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800"
          : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
          }`}
      >
        <Sidebar
          sidebarOpen={showSidebar}
          setSidebarOpen={setShowSidebar}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ── Top Nav Bar ── */}
          <div
            className={`backdrop-blur-sm border-b px-6 py-4 flex items-center justify-center flex-shrink-0 relative shadow-lg transition-colors duration-300 z-50 ${isDarkMode
              ? "bg-gray-800/90 border-gray-700"
              : "bg-white/80 border-cyan-100"
              }`}
          >
            <button
              className={`lg:hidden absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${isDarkMode
                ? "text-cyan-400 hover:bg-gray-700"
                : "text-cyan-500 hover:bg-cyan-50"
                }`}
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode("video")}
                className={`px-8 py-3.5 rounded-full text-base font-medium flex items-center gap-3 transition-all ${viewMode === "video"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700 bg-gray-800 border-2 border-gray-600"
                    : "text-gray-700 hover:bg-cyan-50 bg-white border-2 border-cyan-100"
                  }`}
              >
                <Video className="w-5 h-5" />
                <span>Video</span>
              </button>

              <button
                onClick={() => setViewMode("dictation")}
                className={`px-8 py-3.5 rounded-full text-base font-medium flex items-center gap-3 transition-all ${viewMode === "dictation"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700 bg-gray-800 border-2 border-gray-600"
                    : "text-gray-700 hover:bg-cyan-50 bg-white border-2 border-cyan-100"
                  }`}
              >
                <span className="text-lg">🎯</span>
                <span>Chép chính tả</span>
              </button>

              <button
                onClick={() => setViewMode("pronunciation")}
                className={`px-8 py-3.5 rounded-full text-base font-medium flex items-center gap-3 transition-all ${viewMode === "pronunciation"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700 bg-gray-800 border-2 border-gray-600"
                    : "text-gray-700 hover:bg-cyan-50 bg-white border-2 border-cyan-100"
                  }`}
              >
                <Volume2 className="w-5 h-5" />
                <span>Phát âm</span>
              </button>

              <button
                onClick={() => setViewMode("exercise")}
                className={`px-8 py-3.5 rounded-full text-base font-medium flex items-center gap-3 transition-all border-2 ${viewMode === "exercise"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg border-transparent"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700 bg-gray-800 border-gray-600"
                    : "text-gray-700 hover:bg-cyan-50 bg-white border-cyan-100"
                  }`}
              >
                <span className="text-lg">❓</span>
                <span>Bài tập</span>
              </button>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[10000]">
              <UserDropdown
                isDark={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            </div>
          </div>

          {/* ── Main Content Area ── */}
          <div className="flex-1 flex overflow-hidden relative">
            {showVocabSidebar && (
              <VocabularySidebar
                key={`vocab-${videoId}`}
                videoId={videoId}
                isVisible={showVocabSidebar}
                onToggle={() => {
                  setShowVocabSidebar(false);
                  setSelectedText("");
                }}
                onAddFromSelection={setSelectedText}
                refreshTrigger={vocabRefreshTrigger}
                isDarkMode={isDarkMode}
              />
            )}

            {!showVocabSidebar && (
              <button
                onClick={() => setShowVocabSidebar(true)}
                className={`fixed ${showSidebar ? "left-72" : "left-24"
                  } top-1/2 -translate-y-1/2 z-40 w-8 h-16 border-2 rounded-r-lg flex flex-col items-center justify-center gap-1 transition-all shadow-lg hover:w-10 group ${isDarkMode
                    ? "bg-gray-800 border-gray-600 hover:bg-gray-700"
                    : "bg-white border-cyan-200 hover:bg-cyan-50"
                  }`}
                title="Mở từ vựng"
              >
                <BookOpen
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${isDarkMode ? "text-cyan-400" : "text-cyan-500"
                    }`}
                />
                <span
                  className={`text-[10px] font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                  📖
                </span>
              </button>
            )}

            {/* Video Player — hiện cho tất cả các mode */}
            {(viewMode === "video" ||
              viewMode === "dictation" ||
              viewMode === "pronunciation" ||
              viewMode === "exercise") && (
                <VideoPlayerSection
                  key={`player-${videoId}`}
                  playerRef={playerRef}
                  videoId={videoId}
                  videoTitle={videoTitle}
                  transcripts={transcripts}
                  seekTimeMs={seekTimeMs}
                  onSeekHandled={() => setSeekTimeMs(null)}
                  onTimeUpdate={setCurrentTimeMs}
                  onPlayingChange={setIsPlaying}
                  hideWordBar={
                    viewMode === "dictation" ||
                    viewMode === "pronunciation" ||
                    viewMode === "exercise"
                  }
                  onVocabSaved={handleVocabSaved}
                  isDarkMode={isDarkMode}
                  level={videoLevel}
                  videoTag={videoTag}
                />
              )}

            {/* ── Video Mode: Transcript Sidebar ── */}
            {viewMode === "video" && (
              <div
                className={`w-96 backdrop-blur-sm border-l flex flex-col flex-shrink-0 shadow-xl transition-colors duration-300 relative z-10 ${isDarkMode
                  ? "bg-gray-800/90 border-gray-700"
                  : "bg-white/90 border-cyan-100"
                  }`}
              >
                <div
                  className={`p-4 border-b flex-shrink-0 transition-colors duration-300 ${isDarkMode ? "border-gray-700" : "border-cyan-100"
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2
                      className={`text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode
                        ? "from-cyan-400 to-cyan-500"
                        : "from-cyan-500 to-cyan-600"
                        }`}
                    >
                      Phụ đề
                    </h2>
                    <div className="flex items-center gap-2">
                      <AutoScrollToggle
                        autoScrollEnabled={autoScrollEnabled}
                        onToggle={toggleAutoScroll}
                      />
                      <button
                        onClick={() =>
                          setShowSidebarTranslation(!showSidebarTranslation)
                        }
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${showSidebarTranslation
                          ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                          : isDarkMode
                            ? "text-cyan-400 hover:bg-gray-700"
                            : "text-cyan-500 hover:bg-cyan-50"
                          }`}
                        title={
                          showSidebarTranslation ? "Ẩn bản dịch" : "Hiện bản dịch"
                        }
                      >
                        <Languages className="w-5 h-5" />
                      </button>
                      <button
                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                          ? "text-cyan-400 hover:bg-gray-700"
                          : "text-cyan-500 hover:bg-cyan-50"
                          }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveVideo}
                    disabled={isSaving || isSaved}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium 
                      flex items-center justify-center gap-2 transition-all
                      ${isSaved
                        ? isDarkMode
                          ? "bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50 cursor-not-allowed"
                          : "bg-cyan-100 text-cyan-700 border-2 border-cyan-300 cursor-not-allowed"
                        : isDarkMode
                          ? "bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600"
                          : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
                      }
                      ${isSaving ? "opacity-60 cursor-wait" : ""}
                    `}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <BookmarkCheck className="w-5 h-5" />
                        <span>Đã lưu</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-5 h-5" />
                        <span>Lưu video</span>
                      </>
                    )}
                  </button>
                </div>

                <div
                  ref={scrollContainerRef}
                  onScroll={handleUserScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
                >
                  {transcripts.map((t) => {
                    const isActive = activeTranscript?.id === t.id;

                    return (
                      <div
                        key={t.id}
                        ref={(el) => {
                          transcriptRefs.current[t.id] = el;
                        }}
                        className={`group p-3 rounded-lg cursor-pointer transition-all duration-300 border ${isActive
                          ? isDarkMode
                            ? "bg-gradient-to-r from-gray-700 via-slate-700 to-gray-700 border-cyan-500 shadow-lg shadow-cyan-500/20 scale-105"
                            : "bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border-cyan-300 shadow-lg scale-105"
                          : isDarkMode
                            ? "hover:bg-gray-700 border-transparent hover:border-gray-600 bg-gray-800/50"
                            : "hover:bg-cyan-50 border-transparent hover:border-cyan-200 bg-white/70"
                          }`}
                        onClick={() => handleSeekToTime(t.startOffset)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isActive
                              ? "bg-gradient-to-r from-cyan-400 to-cyan-500"
                              : isDarkMode
                                ? "bg-gray-700 group-hover:bg-gray-600"
                                : "bg-gray-100 group-hover:bg-cyan-100"
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeekToTime(t.startOffset);
                            }}
                          >
                            <Play
                              className={`w-3 h-3 ${isActive
                                ? "text-white"
                                : isDarkMode
                                  ? "text-gray-300 group-hover:text-cyan-400"
                                  : "text-gray-600 group-hover:text-cyan-500"
                                }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-medium ${isActive
                              ? isDarkMode
                                ? "text-cyan-400"
                                : "text-cyan-700"
                              : isDarkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                              }`}
                          >
                            {formatTime(t.startOffset)}
                          </span>

                          <div className="ml-auto">
                            {isActive && (
                              <div className="flex gap-1">
                                <div
                                  className={`w-1 h-3 rounded animate-pulse ${isDarkMode ? "bg-cyan-400" : "bg-cyan-500"
                                    }`}
                                ></div>
                                <div
                                  className={`w-1 h-3 rounded animate-pulse ${isDarkMode ? "bg-cyan-400" : "bg-cyan-500"
                                    }`}
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                                <div
                                  className={`w-1 h-3 rounded animate-pulse ${isDarkMode ? "bg-cyan-400" : "bg-cyan-500"
                                    }`}
                                  style={{ animationDelay: "0.4s" }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <p
                          className={`leading-relaxed text-sm ${isActive
                            ? isDarkMode
                              ? "text-gray-100 font-medium"
                              : "text-gray-900 font-medium"
                            : isDarkMode
                              ? "text-gray-300"
                              : "text-gray-900"
                            }`}
                        >
                          {t.text}
                        </p>

                        {/* Translation display for this segment */}
                        {showSidebarTranslation && t.translatedText && (
                          <div
                            className={`mt-2 p-2 rounded-lg text-sm transition-all duration-300 animate-in fade-in slide-in-from-top-1 border-l-2 ${isActive
                              ? isDarkMode
                                ? "bg-cyan-500/10 text-cyan-200 border-cyan-400"
                                : "bg-cyan-50 text-cyan-700 border-cyan-500"
                              : isDarkMode
                                ? "bg-gray-700/50 text-gray-300 border-gray-600"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                          >
                            {t.translatedText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Dictation Mode ── */}
            {viewMode === "dictation" && (
              <DictationPractice
                key={`dictation-${videoId}`}
                transcripts={transcripts}
                videoId={videoId}
                playerRef={playerRef}
                isDarkMode={isDarkMode}
              />
            )}

            {/* ── Pronunciation Mode ── */}
            {viewMode === "pronunciation" && (
              <PronunciationPractice
                key={`pronunciation-${videoId}`}
                transcripts={transcripts}
                videoId={videoId}
                playerRef={playerRef}
                isDarkMode={isDarkMode}
              />
            )}

            {/* ── Exercise Mode ── */}
            {viewMode === "exercise" && (
              <VideoExercise
                key={`exercise-${videoId}`}
                videoId={videoId}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${isDarkMode
            ? "rgba(55, 65, 81, 0.3)"
            : "rgba(207, 250, 254, 0.3)"};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #22d3ee, #06b6d4);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #06b6d4, #0891b2);
          }
        `}</style>
      </div>
    </>
  );
}

export default function VideoLearningPage() {
  const pathname = usePathname();
  const videoId = pathname.split("/").pop() || "";

  console.log("🔄 VideoLearningPage render with videoId:", videoId);

  return <VideoLearningContent key={videoId} videoId={videoId} />;
}
