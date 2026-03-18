"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, Check, X } from "lucide-react";
import SegmentPlaybackButton from "./SegmentPlaybackButton";

// TranscriptDTO interface
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

interface DictationPracticeProps {
  transcripts: TranscriptDTO[];
  videoId: string;
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
  isDarkMode?: boolean;
}

export default function DictationPractice({
  transcripts,
  videoId,
  playerRef,
  isDarkMode = false,
}: DictationPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [revealedChars, setRevealedChars] = useState<Set<number>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<boolean[]>(
    new Array(transcripts.length).fill(false)
  );
  const [attempted, setAttempted] = useState<boolean[]>(
    new Array(transcripts.length).fill(false)
  );
  const [isPlaying, setIsPlaying] = useState(false);
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

  /** ======================
   * HANDLE SEGMENT END - Tự động chuyển về nút "Phát lại"
   ====================== */
  const handleSegmentEnd = () => {
    console.log("=== Segment ended - switching back to Play button ===");
    setIsPlaying(false);
  };

  /** ======================
   * STOP PLAYBACK
   ====================== */
  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.stopSegment();
    }
    setIsPlaying(false);
  };

  /** ======================
   * CLEANUP on unmount or transcript change
   ====================== */
  useEffect(() => {
    // Cleanup when switching questions
    return () => {
      if (playerRef.current) {
        playerRef.current.stopSegment();
      }
      setIsPlaying(false);
    };
  }, [currentIndex]);

  /** ======================
   * SETUP CALLBACK for segment end
   ====================== */
  useEffect(() => {
    console.log(
      "🔧 Dictation: Setting up callback, playerRef.current:",
      playerRef.current
    );

    if (playerRef.current) {
      const player = playerRef.current as YoutubePlayerHandle & {
        onDictationSegmentEnd?: () => void;
      };
      player.onDictationSegmentEnd = handleSegmentEnd;
      console.log("✅ Dictation: Callback assigned successfully!");
    } else {
      console.log("❌ Dictation: playerRef.current is null!");
    }

    return () => {
      if (playerRef.current) {
        const player = playerRef.current as YoutubePlayerHandle & {
          onDictationSegmentEnd?: () => void;
        };
        player.onDictationSegmentEnd = undefined;
      }
    };
  }, []);

  /** ======================
   * HELPER FUNCTIONS
   ====================== */
  const normalizeText = (text: string) => {
    return text
      .replace(/[\s、。！？「」『』（）.,!?;:'"()\[\]{}]/g, "")
      .toLowerCase()
      .trim();
  };

  const maskText = (text: string, revealed: Set<number>) =>
    text.split("").map((char, idx) => {
      const isPunctuation = /[\s、。！？「」『』（）.,!?;:'"()\[\]{}]/.test(
        char
      );
      const isRevealed = revealed.has(idx) || isPunctuation;

      return (
        <span
          key={idx}
          onClick={() => {
            if (!isRevealed && !showAnswer) {
              setRevealedChars(new Set([...revealedChars, idx]));
            }
          }}
          className={`inline-block transition-all duration-200 ${
            !isRevealed && !showAnswer
              ? "cursor-pointer hover:bg-gradient-to-br hover:from-yellow-100 hover:to-amber-100 hover:scale-125 hover:shadow-lg rounded-lg px-1 mx-0.5 hover:-translate-y-0.5"
              : ""
          }`}
          style={{ minWidth: char === " " ? "0.5em" : "auto" }}
        >
          {isRevealed ? (
            char
          ) : (
            <span className="inline-flex items-center justify-center w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full shadow-md hover:shadow-xl hover:from-yellow-400 hover:via-amber-400 hover:to-orange-400 transition-all duration-300"></span>
          )}
        </span>
      );
    });

  const revealHint = () => {
    const text = currentTranscript.text;
    const allIndices = new Set(
      text
        .split("")
        .map((_, i) => i)
        .filter(
          (i) => !/[\s、。！？「」『』（）.,!?;:'"()\[\]{}]/.test(text[i])
        )
    );
    setRevealedChars(allIndices);
  };

  const checkAnswer = () => {
    const normalizedInput = normalizeText(userInput);
    const normalizedAnswer = normalizeText(currentTranscript.text);

    const isCorrect = normalizedInput === normalizedAnswer;
    const newResults = [...results];
    const newAttempted = [...attempted];
    newResults[currentIndex] = isCorrect;
    newAttempted[currentIndex] = true;
    setResults(newResults);
    setAttempted(newAttempted);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      stopPlayback();

      // Mark current question as skipped if not attempted
      if (!showAnswer) {
        const newAttempted = [...attempted];
        newAttempted[currentIndex] = true;
        setAttempted(newAttempted);
      }

      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setRevealedChars(new Set());
      setShowAnswer(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      stopPlayback();

      // Mark current question as skipped if not attempted
      if (!showAnswer) {
        const newAttempted = [...attempted];
        newAttempted[currentIndex] = true;
        setAttempted(newAttempted);
      }

      setCurrentIndex(currentIndex - 1);
      setUserInput("");
      setRevealedChars(new Set());
      setShowAnswer(false);
    }
  };

  const handleReset = () => {
    stopPlayback();
    setUserInput("");
    setRevealedChars(new Set());
    setShowAnswer(false);
  };

  const handleQuestionSelect = (idx: number) => {
    stopPlayback();

    // Mark current question as skipped if moving to a different question and not attempted
    if (idx !== currentIndex && !showAnswer) {
      const newAttempted = [...attempted];
      newAttempted[currentIndex] = true;
      setAttempted(newAttempted);
    }

    setCurrentIndex(idx);
    setUserInput("");
    setRevealedChars(new Set());
    setShowAnswer(false);
  };

  const correctCount = results.filter(Boolean).length;
  const totalAnswered = attempted.filter(Boolean).length;

  // Get button style based on status
  const getButtonStyle = (idx: number) => {
    if (idx === currentIndex) {
      return "bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-md";
    }

    if (attempted[idx]) {
      if (results[idx]) {
        // Correct answer
        return "bg-gradient-to-r from-cyan-400 to-blue-400 text-white";
      } else {
        // Wrong or skipped
        return isDarkMode
          ? "bg-red-900/50 text-red-300 border border-red-800"
          : "bg-red-100 text-red-700 border border-red-300";
      }
    }

    // Not attempted yet
    return isDarkMode
      ? "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-yellow-600 hover:border-yellow-500 hover:text-white hover:shadow-md hover:scale-105 transition-all duration-200"
      : "bg-white text-gray-700 border border-cyan-200 hover:bg-yellow-100 hover:border-yellow-400 hover:shadow-md hover:scale-105 transition-all duration-200";
  };

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
            className={`font-bold bg-gradient-to-r bg-clip-text text-transparent text-lg ${
              isDarkMode
                ? "from-cyan-400 to-cyan-500"
                : "from-cyan-500 via-blue-500 to-blue-600"
            }`}
          >
            Chép chính tả
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
          (Câu hỏi {currentIndex + 1}/{totalQuestions})
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
              isDarkMode
                ? "bg-cyan-900/50 text-cyan-300"
                : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700"
            }`}
          >
            {correctCount}/{totalAnswered} đúng
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
              isDarkMode
                ? "bg-cyan-900/50 text-cyan-300"
                : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700"
            }`}
          >
            {totalAnswered > 0
              ? Math.round((correctCount / totalAnswered) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      {/* Question navigation */}
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
        <p
          className={`text-sm mb-3 ${
            isDarkMode ? "text-cyan-400" : "text-cyan-700"
          }`}
        >
          Nhập những gì bạn nghe được (không cần gõ dấu câu)...
        </p>

        {/* Playback Button Component */}
        <SegmentPlaybackButton
          transcript={currentTranscript}
          playerRef={playerRef}
          isPlaying={isPlaying}
          onPlayingChange={setIsPlaying}
        />

        <div
          className={`mb-4 p-5 rounded-2xl border shadow-sm transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-700/50 border-gray-600"
              : "bg-gradient-to-r from-cyan-50/50 via-blue-50/50 to-indigo-50/50 border-cyan-100/50"
          }`}
        >
          <p
            className={`text-center text-lg font-medium tracking-wide leading-relaxed ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {maskText(currentTranscript.text, revealedChars)}
          </p>
        </div>

        {!showAnswer && (
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Gõ câu trả lời của bạn ở đây..."
            className={`w-full h-32 p-4 border-2 rounded-xl resize-none outline-none transition ${
              isDarkMode
                ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-900/50"
                : "border-cyan-200 bg-white text-gray-900 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            }`}
          />
        )}

        {showAnswer && (
          <div className="space-y-3">
            <div className="flex items-center justify-center mb-3">
              {results[currentIndex] ? (
                <div
                  className={`flex items-center gap-2 px-5 py-2 rounded-full shadow-sm ${
                    isDarkMode
                      ? "bg-emerald-900/50 text-emerald-300"
                      : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700"
                  }`}
                >
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Chính xác!</span>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-2 px-5 py-2 rounded-full ${
                    isDarkMode
                      ? "bg-red-900/50 text-red-300"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <X className="w-5 h-5" />
                  <span className="font-semibold">Chưa chính xác</span>
                </div>
              )}
            </div>

            <div
              className={`border rounded-xl p-4 shadow-sm transition-colors duration-300 ${
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
                Đáp án đúng:
              </p>
              <p
                className={`text-base ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {currentTranscript.text}
              </p>
            </div>

            {!results[currentIndex] && (
              <div
                className={`border rounded-xl p-4 ${
                  isDarkMode
                    ? "bg-red-900/20 border-red-800"
                    : "bg-red-50/50 border-red-100"
                }`}
              >
                <p
                  className={`text-xs font-medium mb-2 ${
                    isDarkMode ? "text-red-400" : "text-red-600"
                  }`}
                >
                  Câu trả lời của bạn:
                </p>
                <p
                  className={`text-base ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {userInput}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div
        className={`p-4 border-t space-y-2 flex-shrink-0 transition-colors duration-300 ${
          isDarkMode
            ? "border-gray-700 bg-gray-800"
            : "border-cyan-100 bg-white"
        }`}
      >
        {!showAnswer ? (
          <div className="flex gap-3">
            <button
              onClick={revealHint}
              className="group relative p-3.5 bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
              title="Gợi ý"
            >
              <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
              <Lightbulb className="w-5 h-5 text-white relative z-10 drop-shadow-sm" />
            </button>
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Kiểm tra
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
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
