"use client";

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import YoutubePlayerWithTranscript from "./YoutubePlayerWithTranscript";
import ShareVideoModal from "@/components/chat/Sharevideomodal";
import VideoCommentsRating from "./VideoCommentsRating";
import { TranscriptDTO } from "@/services/transcriptService";
import { YoutubePlayerHandle } from "./YoutubePlayer";
import { JLPTLevel, VideoTag } from "@/types/video";

interface VideoPlayerSectionProps {
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
  videoId: string;
  videoTitle: string;
  transcripts: TranscriptDTO[];
  seekTimeMs: number | null;
  onSeekHandled: () => void;
  onTimeUpdate: (timeMs: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  hideWordBar?: boolean;
  onVocabSaved?: () => void;
  isDarkMode?: boolean;
  level: JLPTLevel;
  videoTag: VideoTag;
}

const levelDisplay: Record<JLPTLevel, string> = {
  N5: "N5 - Cơ bản",
  N4: "N4 - Sơ cấp",
  N3: "N3 - Trung cấp",
  N2: "N2 - Trung cao cấp",
  N1: "N1 - Nâng cao",
};

const tagDisplay: Record<VideoTag, string> = {
  NEWS: "Tin tức",
  BEGINNER: "Mới bắt đầu",
  PODCAST: "Podcast",
  TECHNOLOGY: "Công nghệ",
  BUSINESS: "Kinh doanh",
  TED: "TED",
  GRAMMAR: "Ngữ pháp",
  ANIME: "Hoạt hình",
  SHORT_VIDEO: "Video ngắn",
  MOVIE: "Phim",
  TRAVEL: "Du lịch",
  CULTURE: "Văn hóa",
  FOOD: "Ẩm thực",
  KIDS: "Kids",
};

export default function VideoPlayerSection({
  playerRef,
  videoId,
  videoTitle,
  transcripts,
  seekTimeMs,
  onSeekHandled,
  onTimeUpdate,
  onPlayingChange,
  hideWordBar = false,
  onVocabSaved,
  isDarkMode = false,
  level,
  videoTag,
}: VideoPlayerSectionProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <div
      id="video-content-scroll-container"
      className={`flex-1 overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
    >
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <YoutubePlayerWithTranscript
            ref={playerRef}
            videoId={videoId}
            transcripts={transcripts}
            seekTimeMs={seekTimeMs}
            onSeekHandled={onSeekHandled}
            onTimeUpdate={onTimeUpdate}
            onPlayingChange={onPlayingChange}
            hideWordBar={hideWordBar}
            onVocabSaved={onVocabSaved}
            isDarkMode={isDarkMode}
          />

          <div
            className={`rounded-2xl shadow-sm p-6 mt-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${isDarkMode
                      ? "bg-cyan-900/50 text-cyan-300"
                      : "bg-cyan-100 text-cyan-700"
                    }`}
                >
                  {level}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${isDarkMode
                      ? "bg-purple-900/50 text-purple-300"
                      : "bg-purple-100 text-purple-700"
                    }`}
                >
                  {tagDisplay[videoTag]}
                </span>
              </div>
              <button
                onClick={() => setShowShareModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-cyan-900/40 hover:text-cyan-400"
                    : "bg-gray-100 text-gray-600 hover:bg-cyan-50 hover:text-cyan-600"
                  }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                Chia sẻ
              </button>
            </div>

            <h1
              className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
            >
              {videoTitle || "Đang tải..."}
            </h1>

            <div
              className={`border-t pt-4 mt-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
            >
              <h3
                className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
              >
                Thông tin
              </h3>
              <div
                className={`space-y-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Độ khó:</span>
                  <span>{levelDisplay[level]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Thể loại:</span>
                  <span>{tagDisplay[videoTag]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments & Ratings Section */}
          <VideoCommentsRating videoId={videoId} isDarkMode={isDarkMode} />
        </div>
      </div>

      {showShareModal && (
        <ShareVideoModal
          videoId={videoId}
          videoTitle={videoTitle}
          isDarkMode={isDarkMode}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode
          ? "rgba(31,41,55,0.5)"
          : "rgba(243,244,246,0.5)"};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? "#4b5563" : "#d1d5db"};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? "#6b7280" : "#9ca3af"};
        }
      `}</style>
    </div>
  );
}
