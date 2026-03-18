"use client";
import React, { useEffect, useReducer, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  videoExerciseService,
  VideoExerciseResponse,
  ExerciseQuestion,
} from "@/services/videoExerciseService";

interface VideoExerciseProps {
  videoId: string;
  isDarkMode: boolean;
}

type AnswerState = "idle" | "correct" | "wrong";

interface UserAnswer {
  questionId: string;
  selectedIndex: number;
  state: AnswerState;
}

/* ─── Result Screen ──────────────────────────────────────────────────────── */
function ResultScreen({
  correct,
  total,
  isDarkMode,
  onRetry,
}: {
  correct: number;
  total: number;
  isDarkMode: boolean;
  onRetry: () => void;
}) {
  const pct = Math.round((correct / total) * 100);
  const isPerfect = correct === total;
  const isGood = pct >= 70;

  const emoji = isPerfect ? "🏆" : isGood ? "🎉" : "💪";
  const label = isPerfect
    ? "Xuất sắc!"
    : isGood
    ? "Làm tốt lắm!"
    : "Cố lên nào!";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="8"
            className={isDarkMode ? "stroke-gray-700" : "stroke-cyan-100"}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={isGood ? "stroke-cyan-400" : "stroke-amber-400"}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: dashOffset,
              transition: "stroke-dashoffset 1s ease-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black bg-gradient-to-br from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
            {pct}%
          </span>
          <span
            className={`text-xs font-medium ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {correct}/{total}
          </span>
        </div>
      </div>

      <div>
        <p className="text-4xl mb-2">{emoji}</p>
        <h3
          className={`text-xl font-bold mb-1 ${
            isDarkMode ? "text-gray-100" : "text-gray-800"
          }`}
        >
          {label}
        </h3>
        <p
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Bạn trả lời đúng {correct} / {total} câu hỏi
        </p>
      </div>

      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-semibold shadow-lg hover:brightness-110 transition-all active:scale-95"
      >
        <RotateCcw size={16} />
        Làm lại
      </button>
    </div>
  );
}

/* ─── Question Card ──────────────────────────────────────────────────────── */
function QuestionCard({
  question,
  index,
  total,
  userAnswer,
  isDarkMode,
  onSelect,
}: {
  question: ExerciseQuestion;
  index: number;
  total: number;
  userAnswer?: UserAnswer;
  isDarkMode: boolean;
  onSelect: (optionIndex: number) => void;
}) {
  const answered = !!userAnswer;
  const isCorrect = userAnswer?.state === "correct";
  // ✅ Allow changing answer if wrong or haven't answered yet
  const canChangeAnswer = !isCorrect;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Progress bar */}
      <div
        className={`h-1.5 rounded-full overflow-hidden ${
          isDarkMode ? "bg-gray-700" : "bg-cyan-100"
        }`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question number */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isDarkMode
              ? "bg-cyan-500/20 text-cyan-400"
              : "bg-cyan-100 text-cyan-700"
          }`}
        >
          Câu {index + 1} / {total}
        </span>
        {answered && (
          <span
            className={`text-xs font-semibold flex items-center gap-1 ${
              userAnswer.state === "correct"
                ? "text-emerald-500"
                : "text-red-500"
            }`}
          >
            {userAnswer.state === "correct" ? (
              <>
                <CheckCircle2 size={13} /> Đúng
              </>
            ) : (
              <>
                <XCircle size={13} /> Sai - Chọn lại
              </>
            )}
          </span>
        )}
      </div>

      {/* Question text */}
      <p
        className={`text-sm font-semibold leading-relaxed flex-shrink-0 ${
          isDarkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {question.questionText}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {question.options.map((opt) => {
          const isSelected = userAnswer?.selectedIndex === opt.optionIndex;

          let optStyle = "";
          if (!answered || (answered && !isCorrect)) {
            // Not answered yet OR answered wrong (can change)
            optStyle = isDarkMode
              ? "border-gray-600 bg-gray-700/60 hover:border-cyan-500 hover:bg-cyan-500/10 cursor-pointer"
              : "border-cyan-100 bg-white hover:border-cyan-400 hover:bg-cyan-50 cursor-pointer";
          } else if (isSelected && isCorrect) {
            // Selected and correct - locked
            optStyle = "border-emerald-400 bg-emerald-500/15 cursor-default";
          } else {
            // Not selected, correct answer found - dim it
            optStyle = isDarkMode
              ? "border-gray-700 bg-gray-800/40 opacity-50 cursor-default"
              : "border-gray-100 bg-gray-50 opacity-50 cursor-default";
          }

          return (
            <button
              key={opt.optionIndex}
              onClick={() => canChangeAnswer && onSelect(opt.optionIndex)}
              disabled={isCorrect}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${optStyle}`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isSelected && userAnswer?.state === "correct"
                    ? "bg-emerald-500 text-white"
                    : isSelected && userAnswer?.state === "wrong"
                    ? "bg-red-500 text-white"
                    : isDarkMode
                    ? "bg-gray-600 text-gray-300"
                    : "bg-cyan-100 text-cyan-700"
                }`}
              >
                {String.fromCharCode(65 + opt.optionIndex)}
              </span>
              <span
                className={`text-sm leading-snug ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {opt.content}
              </span>
              {isSelected && userAnswer?.state === "correct" && (
                <CheckCircle2
                  size={16}
                  className="ml-auto shrink-0 text-emerald-500"
                />
              )}
              {isSelected && userAnswer?.state === "wrong" && (
                <XCircle size={16} className="ml-auto shrink-0 text-red-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Fetch state reducer ─────────────────────────────────────────────────── */
interface FetchState {
  exercise: VideoExerciseResponse | null;
  isLoading: boolean;
  error: string | null;
}

type FetchAction =
  | { type: "LOADING" }
  | { type: "SUCCESS"; payload: VideoExerciseResponse }
  | { type: "ERROR"; payload: string };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "LOADING":
      return { exercise: null, isLoading: true, error: null };
    case "SUCCESS":
      return { exercise: action.payload, isLoading: false, error: null };
    case "ERROR":
      return { exercise: null, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function VideoExercise({
  videoId,
  isDarkMode,
}: VideoExerciseProps) {
  const [{ exercise, isLoading, error }, dispatch] = useReducer(fetchReducer, {
    exercise: null,
    isLoading: true,
    error: null,
  });

  const [refetchKey, setRefetchKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [showResult, setShowResult] = useState(false);

  // ✅ Fetch exercise data
  useEffect(() => {
    if (!videoId) {
      dispatch({
        type: "ERROR",
        payload: "No video ID provided",
      });
      return;
    }

    let cancelled = false;

    dispatch({ type: "LOADING" });

    // Use IIFE to handle async
    (async () => {
      try {
        console.log("🎬 [VideoExercise] Fetching exercise for:", videoId);
        const data = await videoExerciseService.getByVideoId(videoId);

        if (!cancelled) {
          console.log("✅ [VideoExercise] Data received:", data);
          dispatch({ type: "SUCCESS", payload: data });
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to load exercise. Please try again.";
          console.error("❌ [VideoExercise] Error:", errorMessage);
          dispatch({ type: "ERROR", payload: errorMessage });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoId, refetchKey]);

  const questions = exercise?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.questionId]
    : undefined;

  // ✅ Handle answer selection with correct validation
  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (!currentQuestion) return;

      const selectedOption = currentQuestion.options.find(
        (opt) => opt.optionIndex === optionIndex
      );

      const state: AnswerState = selectedOption?.correct ? "correct" : "wrong";

      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.questionId]: {
          questionId: currentQuestion.questionId,
          selectedIndex: optionIndex,
          state,
        },
      }));
    },
    [currentQuestion]
  );

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResult(false);
    setRefetchKey((k) => k + 1);
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(
    (a) => a.state === "correct"
  ).length;

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center gap-3 ${
          isDarkMode ? "bg-gray-800/90" : "bg-white/90"
        }`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <p
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Đang tải bài tập...
        </p>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !exercise) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center gap-4 p-8 ${
          isDarkMode ? "bg-gray-800/90" : "bg-white/90"
        }`}
      >
        <AlertCircle className="w-10 h-10 text-red-400" />
        <div className="text-center">
          <p
            className={`text-sm font-semibold mb-1 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Không tải được bài tập
          </p>
          <p
            className={`text-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {error}
          </p>
        </div>
        <button
          onClick={() => setRefetchKey((k) => k + 1)}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-semibold hover:brightness-110 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  /* ── Result ── */
  if (showResult) {
    return (
      <div
        className={`flex-1 flex flex-col border-l shadow-xl transition-colors duration-300 ${
          isDarkMode
            ? "bg-gray-800/90 border-gray-700"
            : "bg-white/90 border-cyan-100"
        }`}
      >
        <div
          className={`p-4 border-b flex-shrink-0 ${
            isDarkMode ? "border-gray-700" : "border-cyan-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy
              className={`w-5 h-5 ${
                isDarkMode ? "text-amber-400" : "text-amber-500"
              }`}
            />
            <h2
              className={`text-base font-bold ${
                isDarkMode ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Kết quả
            </h2>
          </div>
        </div>
        <ResultScreen
          correct={correctCount}
          total={questions.length}
          isDarkMode={isDarkMode}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  /* ── Quiz ── */
  return (
    <div
      className={`w-96 flex-shrink-0 flex flex-col border-l shadow-xl transition-colors duration-300 ${
        isDarkMode
          ? "bg-gray-800/90 border-gray-700"
          : "bg-white/90 border-cyan-100"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b flex-shrink-0 ${
          isDarkMode ? "border-gray-700" : "border-cyan-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen
              className={`w-5 h-5 ${
                isDarkMode ? "text-cyan-400" : "text-cyan-500"
              }`}
            />
            <h2
              className={`text-base font-bold truncate max-w-[200px] ${
                isDarkMode ? "text-gray-100" : "text-gray-800"
              }`}
            >
              {exercise.title}
            </h2>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isDarkMode
                ? "bg-gray-700 text-gray-400"
                : "bg-cyan-50 text-cyan-600"
            }`}
          >
            {answeredCount}/{questions.length} đã trả lời
          </span>
        </div>
        {exercise.description && (
          <p
            className={`mt-1 text-xs leading-relaxed ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {exercise.description}
          </p>
        )}
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-hidden p-4">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            userAnswer={currentAnswer}
            isDarkMode={isDarkMode}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Navigation */}
      <div
        className={`px-4 py-3 border-t flex flex-col gap-3 flex-shrink-0 ${
          isDarkMode
            ? "border-gray-700 bg-gray-800/60"
            : "border-cyan-100 bg-white/60"
        }`}
      >
        {/* First row: Previous button + Dot indicators */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap ${
              isDarkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
            }`}
          >
            <ChevronLeft size={14} />
            Trước
          </button>

          {/* Dot indicators */}
          <div className="flex-1 flex items-center justify-center gap-1 overflow-hidden">
            {questions.map((q, idx) => {
              const ans = answers[q.questionId];
              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`rounded-full transition-all duration-200 flex-shrink-0 ${
                    idx === currentIndex
                      ? "w-4 h-2 bg-cyan-500"
                      : ans
                      ? ans.state === "correct"
                        ? "w-2 h-2 bg-emerald-400"
                        : "w-2 h-2 bg-red-400"
                      : isDarkMode
                      ? "w-2 h-2 bg-gray-600"
                      : "w-2 h-2 bg-cyan-200"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Second row: Next/Submit button */}
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!currentAnswer}
            className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isDarkMode
                ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
            }`}
          >
            Tiếp
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={answeredCount < questions.length}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-400 to-cyan-500 text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Nộp bài
            <Trophy size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
