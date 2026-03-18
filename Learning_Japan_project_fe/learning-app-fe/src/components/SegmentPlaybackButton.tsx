"use client";

import React from "react";
import { Play, Pause } from "lucide-react";

interface TranscriptDTO {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  createdAt: string;
}

interface YoutubePlayerHandle {
  playSegment: (start: number, end: number) => void;
  stopSegment: () => void;
}

interface SegmentPlaybackButtonProps {
  transcript: TranscriptDTO;
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
  isPlaying: boolean;
  onPlayingChange: (isPlaying: boolean) => void;
}

export default function SegmentPlaybackButton({
  transcript,
  playerRef,
  isPlaying,
  onPlayingChange,
}: SegmentPlaybackButtonProps) {
  /** ======================
   * PLAY SEGMENT
   ====================== */
  const handlePlaySegment = () => {
    console.log("🎬 SegmentPlaybackButton: PLAY clicked");
    console.log("📍 playerRef.current:", playerRef.current);
    console.log("📍 transcript:", transcript);

    if (!playerRef.current || !transcript) {
      console.error("❌ Missing playerRef or transcript!");
      return;
    }

    console.log("✅ Calling playSegment with:", {
      start: transcript.startOffset,
      end: transcript.endOffset,
    });

    onPlayingChange(true);
    console.log("✅ Set isPlaying = true");

    playerRef.current.playSegment(transcript.startOffset, transcript.endOffset);

    console.log("✅ playSegment called successfully");
  };

  /** ======================
   * STOP PLAYBACK
   ====================== */
  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.stopSegment();
    }
    onPlayingChange(false);
  };

  return (
    <div className="mb-4 flex items-center gap-2">
      {isPlaying ? (
        <button
          onClick={stopPlayback}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white"
        >
          <Pause className="w-4 h-4 fill-white" />
          Dừng
        </button>
      ) : (
        <button
          onClick={handlePlaySegment}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white"
        >
          <Play className="w-4 h-4 fill-white" />
          Phát lại
        </button>
      )}
      <span className="text-xs text-cyan-500 font-medium">
        ({Math.floor(transcript.startOffset / 1000)}s -{" "}
        {Math.floor(transcript.endOffset / 1000)}s)
      </span>
    </div>
  );
}
