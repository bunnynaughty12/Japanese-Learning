"use client";
import { pronunciationService } from "@/services/pronunciationService";
import { useRef } from "react";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  Volume2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import SegmentPlaybackButton from "./SegmentPlaybackButton";

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

interface PronunciationPracticeProps {
  transcripts: TranscriptDTO[];
  videoId: string;
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
  isDarkMode?: boolean;
}

export default function PronunciationPractice({
  transcripts,
  videoId,
  playerRef,
  isDarkMode = false,
}: PronunciationPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(
    null
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [completionRate, setCompletionRate] = useState<number | null>(null);
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [results, setResults] = useState<
    Array<{ score: number; accuracy: number; completion: number } | null>
  >(new Array(transcripts.length).fill(null));
  const [attempted, setAttempted] = useState<boolean[]>(
    new Array(transcripts.length).fill(false)
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentTranscript = transcripts[currentIndex];
  const totalQuestions = transcripts.length;

  /** ======================
   * AUTO SCROLL TO CURRENT QUESTION
   ====================== */
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const buttons = container.children;
      const currentButton = buttons[currentIndex] as HTMLElement;

      if (currentButton) {
        const containerWidth = container.offsetWidth;
        const buttonLeft = currentButton.offsetLeft;
        const buttonWidth = currentButton.offsetWidth;
        const scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [currentIndex]);

  const handleSegmentEnd = () => {
    console.log("🎉 Pronunciation: SEGMENT ENDED - Switching to Play button");
    console.log("🔄 Setting isPlaying = false");
    setIsPlaying(false);
  };

  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.stopSegment();
    }
    setIsPlaying(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });

        const file = new File([blob], "record.webm", {
          type: "audio/webm",
        });

        await submitPronunciation(file);

        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      setTimeout(() => {
        recorder.stop();
      }, 3000);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const submitPronunciation = async (file: File) => {
    try {
      console.log("📤 Submitting pronunciation to backend...");
      setIsProcessing(true);

      const jobId = await pronunciationService.submitPronunciation(
        file,
        currentTranscript.text
      );

      setIsRecording(false);
      console.log("✅ Got jobId:", jobId);

      const pollResult = async (): Promise<void> => {
        const result = await pronunciationService.getPronunciationResult(jobId);

        if (result) {
          console.log("✅ Got result:", result);
          const accuracy = Math.round(result.accuracy);

          setPronunciationScore(accuracy);
          setAccuracyScore(accuracy);
          setCompletionRate(accuracy);

          const newResults = [...results];
          newResults[currentIndex] = {
            score: accuracy,
            accuracy,
            completion: accuracy,
          };
          setResults(newResults);

          const newAttempted = [...attempted];
          newAttempted[currentIndex] = true;
          setAttempted(newAttempted);

          setIsProcessing(false);
        } else {
          console.log("⏳ Still processing, polling again...");
          setTimeout(pollResult, 2000);
        }
      };

      pollResult();
    } catch (e) {
      console.error("Pronunciation API failed", e);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const pollResult = async (jobId: string) => {
      if (isCancelled) return;
      const result = await pronunciationService.getPronunciationResult(jobId);
      if (result) {
        const accuracy = Math.round(result.accuracy);
        if (!isCancelled) {
          setPronunciationScore(accuracy);
          setAccuracyScore(accuracy);
          setCompletionRate(accuracy);
          const newResults = [...results];
          newResults[currentIndex] = {
            score: accuracy,
            accuracy,
            completion: accuracy,
          };
          setResults(newResults);
        }
      } else {
        setTimeout(() => pollResult(jobId), 2000);
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [currentIndex, results]);

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      stopPlayback();

      // Mark current question as skipped if not attempted
      if (pronunciationScore === null) {
        const newAttempted = [...attempted];
        newAttempted[currentIndex] = true;
        setAttempted(newAttempted);
      }

      setCurrentIndex(currentIndex + 1);
      resetScores();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      stopPlayback();

      // Mark current question as skipped if not attempted
      if (pronunciationScore === null) {
        const newAttempted = [...attempted];
        newAttempted[currentIndex] = true;
        setAttempted(newAttempted);
      }

      setCurrentIndex(currentIndex - 1);
      resetScores();
    }
  };

  const handleQuestionSelect = (idx: number) => {
    stopPlayback();

    // Mark current question as skipped if moving to a different question and not attempted
    if (idx !== currentIndex && pronunciationScore === null) {
      const newAttempted = [...attempted];
      newAttempted[currentIndex] = true;
      setAttempted(newAttempted);
    }

    setCurrentIndex(idx);
    resetScores();
  };

  const resetScores = () => {
    setPronunciationScore(null);
    setCompletionRate(null);
    setAccuracyScore(null);
    setIsProcessing(false);
  };

  const handleRetry = () => {
    resetScores();
  };

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.stopSegment();
      }
      setIsPlaying(false);
    };
  }, [currentIndex, playerRef]);

  useEffect(() => {
    console.log(
      "🔧 Pronunciation: Setting up callback, playerRef.current:",
      playerRef.current
    );

    if (playerRef.current) {
      const player = playerRef.current as YoutubePlayerHandle & {
        onPronunciationSegmentEnd?: () => void;
      };
      player.onPronunciationSegmentEnd = handleSegmentEnd;
      console.log("✅ Pronunciation: Callback assigned successfully!");
    } else {
      console.log("❌ Pronunciation: playerRef.current is null!");
    }

    return () => {
      if (playerRef.current) {
        const player = playerRef.current as YoutubePlayerHandle & {
          onPronunciationSegmentEnd?: () => void;
        };
        player.onPronunciationSegmentEnd = undefined;
      }
    };
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90)
      return isDarkMode ? "text-emerald-400" : "text-emerald-600";
    if (score >= 75) return isDarkMode ? "text-cyan-400" : "text-cyan-500";
    if (score >= 60) return isDarkMode ? "text-cyan-300" : "text-cyan-400";
    return isDarkMode ? "text-gray-400" : "text-gray-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90)
      return isDarkMode
        ? "bg-emerald-900/30 border-emerald-700"
        : "bg-gradient-to-r from-emerald-50/50 via-green-50/50 to-emerald-50/50 border-emerald-200";
    if (score >= 75)
      return isDarkMode
        ? "bg-cyan-900/30 border-cyan-700"
        : "bg-gradient-to-r from-cyan-50/50 via-blue-50/50 to-indigo-50/50 border-cyan-200";
    if (score >= 60)
      return isDarkMode
        ? "bg-cyan-900/20 border-cyan-800"
        : "bg-gradient-to-r from-cyan-50/40 via-blue-50/40 to-cyan-50/40 border-cyan-100";
    return isDarkMode
      ? "bg-gray-800/50 border-gray-700"
      : "bg-gradient-to-r from-gray-50/50 via-gray-50/50 to-gray-50/50 border-gray-200";
  };

  // Get button style based on status
  const getButtonStyle = (idx: number) => {
    if (idx === currentIndex) {
      return "bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-md";
    }

    if (results[idx] !== null) {
      // Has result (completed with score)
      const score = results[idx]!.score;
      if (score >= 75) {
        return "bg-gradient-to-r from-cyan-400 to-blue-400 text-white";
      } else {
        return isDarkMode
          ? "bg-yellow-900/50 text-yellow-300 border border-yellow-800"
          : "bg-yellow-100 text-yellow-700 border border-yellow-300";
      }
    }

    if (attempted[idx]) {
      // Attempted but no result (skipped)
      return isDarkMode
        ? "bg-red-900/50 text-red-300 border border-red-800"
        : "bg-red-100 text-red-700 border border-red-300";
    }

    // Not attempted yet
    return isDarkMode
      ? "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-yellow-600 hover:border-yellow-500 hover:text-white hover:shadow-md hover:scale-105 transition-all duration-200"
      : "bg-white text-gray-700 border border-cyan-200 hover:bg-yellow-100 hover:border-yellow-400 hover:shadow-md hover:scale-105 transition-all duration-200";
  };

  const completedCount = results.filter((r) => r !== null).length;
  const totalAnswered = attempted.filter(Boolean).length;
  const avgScore =
    completedCount > 0
      ? Math.round(
          results
            .filter((r) => r !== null)
            .reduce((sum, r) => sum + r!.score, 0) / completedCount
        )
      : 0;

  return (
    <div
      className={`w-96 backdrop-blur-sm border-l flex flex-col flex-shrink-0 shadow-xl transition-colors duration-300 ${
        isDarkMode
          ? "bg-gray-800/90 border-gray-700"
          : "bg-white/90 border-cyan-100"
      }`}
    >
      {/* Header */}
      <div
        className={`p-5 border-b flex-shrink-0 transition-colors duration-300 ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border-cyan-100"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <h3
            className={`font-bold bg-gradient-to-r bg-clip-text text-transparent text-lg flex items-center gap-2 ${
              isDarkMode
                ? "from-cyan-400 to-cyan-500"
                : "from-cyan-500 to-cyan-600"
            }`}
          >
            <Volume2
              className={`w-5 h-5 ${
                isDarkMode ? "text-cyan-400" : "text-cyan-500"
              }`}
            />
            Luyện phát âm
          </h3>
          <button
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "text-cyan-400 hover:bg-gray-700"
                : "text-cyan-500 hover:bg-cyan-50"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p
          className={`text-sm ${
            isDarkMode ? "text-cyan-400" : "text-cyan-700"
          }`}
        >
          (Câu {currentIndex + 1}/{totalQuestions})
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
              isDarkMode
                ? "bg-cyan-900/50 text-cyan-300"
                : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700"
            }`}
          >
            {completedCount}/{totalAnswered} hoàn thành
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
              isDarkMode
                ? "bg-cyan-900/50 text-cyan-300"
                : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700"
            }`}
          >
            TB: {avgScore} điểm
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div
        className={`p-4 border-b flex items-center gap-2 flex-shrink-0 transition-colors duration-300 ${
          isDarkMode
            ? "border-gray-700 bg-gray-800/50"
            : "border-cyan-50 bg-gradient-to-r from-white via-cyan-50/30 to-white"
        }`}
      >
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`p-2 rounded-lg border transition-all ${
            isDarkMode
              ? "border-gray-600 bg-gray-700 hover:bg-gray-600 disabled:opacity-30"
              : "border-cyan-200 bg-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 disabled:opacity-30"
          } disabled:cursor-not-allowed`}
        >
          <ChevronLeft
            className={`w-5 h-5 ${
              isDarkMode ? "text-cyan-400" : "text-cyan-600"
            }`}
          />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex-1 flex gap-2 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {transcripts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleQuestionSelect(idx)}
              className={`min-w-[68px] h-11 rounded-lg font-medium text-sm px-3 flex-shrink-0 ${getButtonStyle(
                idx
              )}`}
            >
              Câu {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === totalQuestions - 1}
          className={`p-2 rounded-lg border transition-all ${
            isDarkMode
              ? "border-gray-600 bg-gray-700 hover:bg-gray-600 disabled:opacity-30"
              : "border-cyan-200 bg-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 disabled:opacity-30"
          } disabled:cursor-not-allowed`}
        >
          <ChevronRight
            className={`w-5 h-5 ${
              isDarkMode ? "text-cyan-400" : "text-cyan-600"
            }`}
          />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div
        className={`flex-1 overflow-y-auto p-5 transition-colors duration-300 ${
          isDarkMode
            ? "bg-gradient-to-b from-gray-800 via-gray-800 to-gray-900"
            : "bg-gradient-to-b from-white via-cyan-50/20 to-blue-50/30"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Current Sentence Display */}
        <div
          className={`mb-4 p-5 rounded-2xl border shadow-sm transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-700/50 border-gray-600"
              : "bg-gradient-to-r from-cyan-50/50 via-blue-50/50 to-indigo-50/50 border-cyan-100/50"
          }`}
        >
          <p
            className={`text-sm font-medium mb-2 ${
              isDarkMode ? "text-cyan-400" : "text-cyan-700"
            }`}
          >
            Câu hiện tại:
          </p>
          <p
            className={`text-center text-lg font-medium tracking-wide leading-relaxed ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {currentTranscript.text}
          </p>
        </div>

        {/* Playback Controls */}
        <SegmentPlaybackButton
          transcript={currentTranscript}
          playerRef={playerRef}
          isPlaying={isPlaying}
          onPlayingChange={setIsPlaying}
        />

        {/* Recording Section */}
        <div className="mb-6">
          <div
            className={`rounded-2xl p-6 border shadow-sm transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-gradient-to-r from-cyan-50/50 via-blue-50/50 to-indigo-50/50 border-cyan-100/50"
            }`}
          >
            {isRecording ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <p
                  className={`text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Đang ghi âm...
                </p>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Hãy đọc theo câu mẫu
                </p>
              </div>
            ) : isProcessing ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div
                    className={`absolute inset-0 border-4 rounded-full ${
                      isDarkMode ? "border-gray-700" : "border-cyan-100"
                    }`}
                  ></div>
                  <div
                    className={`absolute inset-0 border-4 border-transparent rounded-full animate-spin ${
                      isDarkMode ? "border-t-cyan-400" : "border-t-cyan-400"
                    }`}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl">🤖</div>
                  </div>
                </div>
                <p
                  className={`text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Đang phân tích...
                </p>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Vui lòng đợi trong giây lát
                </p>

                <div className="flex justify-center gap-1 mt-3">
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${
                      isDarkMode ? "bg-cyan-400" : "bg-cyan-400"
                    }`}
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${
                      isDarkMode ? "bg-blue-400" : "bg-blue-400"
                    }`}
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${
                      isDarkMode ? "bg-indigo-400" : "bg-indigo-400"
                    }`}
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            ) : (
              <button
                onClick={startRecording}
                disabled={pronunciationScore !== null}
                className="w-full"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  {pronunciationScore !== null
                    ? "Đã ghi âm"
                    : "Nhấn để bắt đầu"}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Results Display */}
        {pronunciationScore !== null && (
          <div className="space-y-3 animate-fadeIn">
            {/* Overall Score */}
            <div
              className={`p-4 rounded-xl border shadow-sm ${getScoreBgColor(
                pronunciationScore
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Điểm phát âm
                </span>
                {pronunciationScore >= 75 ? (
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      isDarkMode ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  />
                ) : (
                  <XCircle
                    className={`w-5 h-5 ${
                      isDarkMode ? "text-cyan-400" : "text-cyan-500"
                    }`}
                  />
                )}
              </div>
              <p
                className={`text-4xl font-bold ${getScoreColor(
                  pronunciationScore
                )}`}
              >
                {pronunciationScore}
                <span className="text-lg">/100</span>
              </p>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3 border rounded-xl shadow-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gradient-to-r from-cyan-50/50 via-blue-50/50 to-indigo-50/50 border-cyan-100/50"
                }`}
              >
                <p
                  className={`text-xs font-medium mb-1 ${
                    isDarkMode ? "text-cyan-400" : "text-cyan-700"
                  }`}
                >
                  Độ chính xác
                </p>
                <p
                  className={`text-2xl font-bold ${
                    accuracyScore !== null ? getScoreColor(accuracyScore) : ""
                  }`}
                >
                  {accuracyScore ?? 0}
                  <span className="text-sm">/100</span>
                </p>
              </div>
              <div
                className={`p-3 border rounded-xl shadow-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gradient-to-r from-cyan-50/50 via-blue-50/50 to-indigo-50/50 border-cyan-100/50"
                }`}
              >
                <p
                  className={`text-xs font-medium mb-1 ${
                    isDarkMode ? "text-cyan-400" : "text-cyan-700"
                  }`}
                >
                  Độ hoàn thiện
                </p>
                <p
                  className={`text-2xl font-bold ${getScoreColor(
                    completionRate!
                  )}`}
                >
                  {completionRate}
                  <span className="text-sm">/100</span>
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div
              className={`p-4 border rounded-xl shadow-sm transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-700/50 border-gray-600"
                  : "bg-gradient-to-r from-cyan-50/50 via-blue-50/50 to-indigo-50/50 border-cyan-100"
              }`}
            >
              <p
                className={`text-xs font-medium mb-2 ${
                  isDarkMode ? "text-cyan-400" : "text-cyan-700"
                }`}
              >
                Đánh giá:
              </p>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {pronunciationScore >= 90
                  ? "Xuất sắc! Phát âm của bạn rất tốt."
                  : pronunciationScore >= 75
                  ? "Tốt! Tiếp tục luyện tập để hoàn thiện hơn."
                  : "Cần cải thiện. Hãy nghe kỹ mẫu và thử lại."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div
        className={`p-4 border-t space-y-2 flex-shrink-0 transition-colors duration-300 ${
          isDarkMode
            ? "border-gray-700 bg-gray-800"
            : "border-cyan-100 bg-white"
        }`}
      >
        {pronunciationScore === null ? (
          <div
            className={`text-center text-sm py-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Nhấn mic để ghi âm câu trả lời
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Thử lại
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === totalQuestions - 1}
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 disabled:bg-gray-300 text-white rounded-xl font-bold shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none flex items-center justify-center gap-2"
            >
              Tiếp
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
