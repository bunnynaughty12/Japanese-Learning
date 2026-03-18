"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import YoutubePlayer, { YoutubePlayerHandle } from "./YoutubePlayer";
import TranscriptWordBar from "./transcriptWordBar";
import { TranscriptDTO } from "@/services/transcriptService";

interface Props {
  videoId: string;
  transcripts: TranscriptDTO[];
  seekTimeMs?: number | null;
  onSeekHandled?: () => void;
  onTimeUpdate?: (timeMs: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  hideWordBar?: boolean;
  onVocabSaved?: () => void;
  isDarkMode?: boolean;
}

interface YouTubePlayerStateChangeEvent {
  data: number;
}

const YoutubePlayerWithTranscript = forwardRef<YoutubePlayerHandle, Props>(
  (
    {
      videoId,
      transcripts,
      seekTimeMs,
      onSeekHandled,
      onTimeUpdate,
      onPlayingChange,
      hideWordBar = false,
      onVocabSaved,
      isDarkMode = false,
    },
    ref
  ) => {
    const playerRef = useRef<YoutubePlayerHandle | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [currentTimeMs, setCurrentTimeMs] = useState(0);
    const isPlayerReadyRef = useRef(false);

    // ✅ Log mount/unmount
    useEffect(() => {
      console.log(
        "🎬 YoutubePlayerWithTranscript MOUNTED for videoId:",
        videoId
      );
      return () => {
        console.log(
          "🧹 YoutubePlayerWithTranscript UNMOUNTED for videoId:",
          videoId
        );
        // ✅ Cleanup interval on unmount
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [videoId]);

    // Expose playerRef to parent component
    useImperativeHandle(
      ref,
      () => {
        const handle: YoutubePlayerHandle = {
          getCurrentTime: () => playerRef.current?.getCurrentTime(),
          seekTo: (seconds: number, allowSeekAhead: boolean) =>
            playerRef.current?.seekTo(seconds, allowSeekAhead),
          playVideo: () => playerRef.current?.playVideo(),
          pauseVideo: () => playerRef.current?.pauseVideo(),
          destroy: () => playerRef.current?.destroy(),
          playSegment: (startMs: number, endMs: number) =>
            playerRef.current?.playSegment(startMs, endMs),
          stopSegment: () => playerRef.current?.stopSegment(),

          get onDictationSegmentEnd() {
            return playerRef.current?.onDictationSegmentEnd;
          },
          set onDictationSegmentEnd(callback: (() => void) | undefined) {
            if (playerRef.current) {
              console.log(
                "🔗 YoutubePlayerWithTranscript: Setting onDictationSegmentEnd callback"
              );
              playerRef.current.onDictationSegmentEnd = callback;
            }
          },

          get onPronunciationSegmentEnd() {
            return playerRef.current?.onPronunciationSegmentEnd;
          },
          set onPronunciationSegmentEnd(callback: (() => void) | undefined) {
            if (playerRef.current) {
              console.log(
                "🔗 YoutubePlayerWithTranscript: Setting onPronunciationSegmentEnd callback"
              );
              playerRef.current.onPronunciationSegmentEnd = callback;
            }
          },
        };
        return handle;
      },
      []
    );

    /** ======================
     * ✅ HANDLE PLAYER STATE CHANGE
     ====================== */
    const handlePlayerStateChange = (event: YouTubePlayerStateChangeEvent) => {
      // YouTube Player States:
      // -1 (unstarted)
      // 0 (ended)
      // 1 (playing)
      // 2 (paused)
      // 3 (buffering)
      // 5 (video cued)

      const state = event.data;
      const isPlaying = state === 1;

      console.log(
        `🎵 Player state changed: ${state} (${
          isPlaying ? "PLAYING" : "NOT PLAYING"
        })`
      );

      onPlayingChange?.(isPlaying);
    };

    /** ======================
     * HANDLE PLAYER READY
     ====================== */
    const handlePlayerReady = () => {
      console.log(
        "✅ YoutubePlayerWithTranscript: Player ready for videoId:",
        videoId
      );

      isPlayerReadyRef.current = true;

      // ✅ Clear previous interval if exists
      if (intervalRef.current) {
        console.log("🧹 Clearing previous time tracking interval");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reset current time
      setCurrentTimeMs(0);

      // ✅ Start tracking time with proper error handling
      intervalRef.current = setInterval(() => {
        if (!playerRef.current || !isPlayerReadyRef.current) {
          console.warn("⏸️ Player not ready, skipping time update");
          return;
        }

        try {
          const time = playerRef.current.getCurrentTime();

          if (typeof time === "number" && !isNaN(time)) {
            const timeMs = Math.floor(time * 1000);
            setCurrentTimeMs(timeMs);
            onTimeUpdate?.(timeMs);
          }
        } catch (error) {
          console.warn("Error getting current time:", error);
        }
      }, 300);

      console.log("⏱️ Time tracking interval started");
    };

    /** ======================
     * SEEK FROM OUTSIDE
     ====================== */
    useEffect(() => {
      if (seekTimeMs != null && playerRef.current && isPlayerReadyRef.current) {
        try {
          console.log("⏩ Seeking to", seekTimeMs, "ms");
          playerRef.current.seekTo(seekTimeMs / 1000, true);
          playerRef.current.playVideo();
          onSeekHandled?.();
        } catch (error) {
          console.warn("Error seeking video:", error);
        }
      }
    }, [seekTimeMs, onSeekHandled]);

    /** ======================
     * CLEANUP ON VIDEO CHANGE
     ====================== */
    useEffect(() => {
      // ✅ Reset ready state when videoId changes
      isPlayerReadyRef.current = false;
      setCurrentTimeMs(0);

      return () => {
        console.log("🧹 Cleaning up for videoId:", videoId);
        isPlayerReadyRef.current = false;

        // ✅ Clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [videoId]);

    return (
      <>
        {/* ✅ VIDEO - Force re-mount with key */}
        <YoutubePlayer
          key={`youtube-${videoId}`}
          ref={playerRef}
          videoId={videoId}
          onPlayerReady={handlePlayerReady}
          onStateChange={handlePlayerStateChange}
        />

        {/* WORD BAR - Only show when hideWordBar = false */}
        {!hideWordBar && (
          <TranscriptWordBar
            key={`wordbar-${videoId}`}
            transcripts={transcripts}
            currentTimeMs={currentTimeMs}
            videoId={videoId}
            onVocabSaved={onVocabSaved}
            isDarkMode={isDarkMode}
          />
        )}
      </>
    );
  }
);

YoutubePlayerWithTranscript.displayName = "YoutubePlayerWithTranscript";

export default YoutubePlayerWithTranscript;
