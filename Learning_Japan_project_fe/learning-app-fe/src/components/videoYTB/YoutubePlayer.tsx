"use client";

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL TYPES — không dùng declare global, tránh xung đột TS2717
// ─────────────────────────────────────────────────────────────────────────────

type YTPlayer = {
  getCurrentTime: () => number | undefined;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
};

type YTPlayerStateChangeEvent = {
  data: number;
  target: YTPlayer;
};

// ✅ Constructor type tách riêng để tránh lỗi ts(7009)
type YTPlayerConstructor = new (
  elementId: string,
  config: {
    videoId: string;
    playerVars?: Record<string, unknown>;
    events?: {
      onReady?: () => void;
      onStateChange?: (event: YTPlayerStateChangeEvent) => void;
    };
  }
) => YTPlayer;

type YTWindowType = typeof window & {
  YT?: {
    Player: YTPlayerConstructor;
    PlayerState?: {
      PLAYING: number;
      PAUSED: number;
      ENDED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
};

const w = (): YTWindowType => window as unknown as YTWindowType;

// ─────────────────────────────────────────────────────────────────────────────

export interface YoutubePlayerHandle extends YTPlayer {
  playSegment: (startMs: number, endMs: number) => void;
  stopSegment: () => void;
  onDictationSegmentEnd?: () => void;
  onPronunciationSegmentEnd?: () => void;
}

interface YoutubePlayerProps {
  videoId: string;
  onPlayerReady?: (player: YTPlayer) => void;
  onSegmentEnd?: () => void;
  onStateChange?: (event: YTPlayerStateChangeEvent) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

const YoutubePlayer = forwardRef<YoutubePlayerHandle, YoutubePlayerProps>(
  ({ videoId, onPlayerReady, onSegmentEnd, onStateChange }, ref) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const handleRef = useRef<YoutubePlayerHandle | null>(null);
    const isInitializedRef = useRef(false);

    /** ── STOP SEGMENT ── */
    const stopSegment = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      try {
        playerRef.current?.pauseVideo();
      } catch {}
    };

    /** ── PLAY SEGMENT (startMs → endMs) ── */
    const playSegment = (startMs: number, endMs: number) => {
      console.log("🎬 YoutubePlayer: playSegment called", { startMs, endMs });

      if (!playerRef.current) {
        console.error("❌ YoutubePlayer: playerRef.current is null!");
        return;
      }

      const startSec = startMs / 1000;
      const endSec = endMs / 1000;

      stopSegment();

      try {
        playerRef.current.seekTo(startSec, true);
        playerRef.current.playVideo();
        console.log("✅ YoutubePlayer: playing from", startSec, "to", endSec);

        intervalRef.current = setInterval(() => {
          if (!playerRef.current) {
            stopSegment();
            return;
          }
          const currentTime = playerRef.current.getCurrentTime();
          if (typeof currentTime === "number" && currentTime >= endSec) {
            console.log("🎯 YoutubePlayer: Segment END at", currentTime);
            stopSegment();
            onSegmentEnd?.();
            handleRef.current?.onDictationSegmentEnd?.();
            handleRef.current?.onPronunciationSegmentEnd?.();
          }
        }, 50);
      } catch (error) {
        console.warn("Error playing segment:", error);
        stopSegment();
      }
    };

    /** ── IMPERATIVE HANDLE ── */
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
          playSegment,
          stopSegment,
        };
        handleRef.current = handle;
        console.log("🔗 YoutubePlayer: Handle created");
        return handle;
      },
      []
    );

    /** ── INIT YOUTUBE PLAYER ── */
    const initPlayer = () => {
      const ytWindow = w();
      if (!ytWindow.YT?.Player || isInitializedRef.current) {
        console.log(
          "⏳ YoutubePlayer: Waiting for YT API or already initialized"
        );
        return;
      }

      console.log("🚀 YoutubePlayer: Initializing player for video", videoId);

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {
            console.warn("Error destroying player:", e);
          }
          playerRef.current = null;
        }

        // ✅ Lưu constructor vào biến có type rõ ràng → tránh lỗi ts(7009)
        const YTPlayerClass: YTPlayerConstructor = ytWindow.YT.Player;

        playerRef.current = new YTPlayerClass("youtube-player", {
          videoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            autoplay: 0,
          },
          events: {
            onReady: () => {
              console.log("✅ YoutubePlayer: Player ready for", videoId);
              isInitializedRef.current = true;
              if (playerRef.current) onPlayerReady?.(playerRef.current);
            },
            // ✅ Type rõ ràng cho event → tránh lỗi ts(7006)
            onStateChange: (event: YTPlayerStateChangeEvent) => {
              console.log("🎬 Player state changed:", event.data);
              onStateChange?.(event);
            },
          },
        });
      } catch (error) {
        console.error("❌ Error initializing player:", error);
        isInitializedRef.current = false;
      }
    };

    /** ── CLEANUP ── */
    const cleanup = () => {
      stopSegment();
      isInitializedRef.current = false;
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
    };

    /** ── LOAD API & INIT ── */
    useEffect(() => {
      console.log("🔄 YoutubePlayer: Effect triggered for videoId", videoId);
      isInitializedRef.current = false;

      const ytWindow = w();

      const initializePlayer = () => {
        if (ytWindow.YT?.Player) initPlayer();
      };

      if (ytWindow.YT?.Player) {
        console.log("✅ YT API already loaded, initializing immediately");
        const t = setTimeout(initializePlayer, 100);
        return () => {
          clearTimeout(t);
          cleanup();
        };
      }

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        console.log("📥 Loading YouTube IFrame API");
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }

      const original = ytWindow.onYouTubeIframeAPIReady;
      ytWindow.onYouTubeIframeAPIReady = () => {
        console.log("✅ YouTube IFrame API Ready");
        if (original) original();
        initializePlayer();
      };

      const checkInterval = setInterval(() => {
        if (w().YT?.Player) {
          console.log("✅ YT API detected via polling");
          clearInterval(checkInterval);
          initializePlayer();
        }
      }, 100);

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        console.warn("⏰ YT API loading timeout");
      }, 10_000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        cleanup();
      };
    }, [videoId]);

    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-2">
        <div className="relative pt-[56.25%] bg-black">
          <div
            id="youtube-player"
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </div>
    );
  }
);

YoutubePlayer.displayName = "YoutubePlayer";
export default YoutubePlayer;
