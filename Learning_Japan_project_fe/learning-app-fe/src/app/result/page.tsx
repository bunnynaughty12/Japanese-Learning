"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExamResultStore } from "@/stores/examResultStore";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useDarkMode } from "@/hooks/useDarkMode";
import MaziAIChat from "@/components/NiboChatAI";
import BackButton from "@/components/backButton";

function ExamResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);

  const result = useExamResultStore((state) => state.result);
  const [activeTab, setActiveTab] = useState<"answers" | "detail">("answers");
  const [currentSection, setCurrentSection] = useState(1);

  if (!result) {
    router.push("/");
    return null;
  }

  const sortedAnswers = [...result.answers].sort(
    (a, b) => a.questionOrder - b.questionOrder
  );

  const sections = Array.from(
    new Set(sortedAnswers.map((q) => q.sectionOrder ?? 1))
  ).sort((a, b) => a - b);

  const currentQuestions = sortedAnswers.filter(
    (q) => (q.sectionOrder ?? 1) === currentSection
  );

  const wrongAnswers = currentQuestions.filter(
    (q) => !q.isCorrect && q.answer !== null
  ).length;

  return (
    <>
      <div
        className={`flex h-screen ${isDarkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
          }`}
      >
        {/* Sidebar - giống VideoPage */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative z-0">
          {/* Header - giống VideoPage */}
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-5xl mx-auto">
              {/* Score Card */}
              <div
                className={`rounded-2xl shadow-lg border overflow-hidden mb-6 ${isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-cyan-100"
                  }`}
              >
                <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 px-8 py-6">
                  <h1 className="text-2xl font-bold text-white drop-shadow-md">
                    Kết quả luyện đề: {result.examCode}
                  </h1>
                </div>

                <div className="px-8 py-10">
                  <div className="flex flex-col items-center">
                    <h2 className="text-center text-cyan-500 font-bold text-xl mb-6 flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      Điểm số của bạn
                    </h2>

                    <div className="relative mb-8">
                      <div className="relative w-56 h-56">
                        <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                          <circle
                            cx="112"
                            cy="112"
                            r="100"
                            stroke="#f3f4f6"
                            strokeWidth="20"
                            fill="none"
                          />
                          <circle
                            cx="112"
                            cy="112"
                            r="100"
                            stroke="url(#gradient)"
                            strokeWidth="20"
                            fill="none"
                            strokeDasharray={`${(
                              (result.totalScore /
                                (result.totalQuestions || 1)) *
                              628
                            ).toFixed(2)} 628`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
                            {result.totalScore}
                          </span>
                          <span className="text-sm text-gray-500 mt-1">
                            / {result.totalQuestions || currentQuestions.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
                      <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl border-2 border-cyan-200 p-6 text-center hover:shadow-lg transition-all hover:scale-105">
                        <div className="text-4xl mb-3 animate-bounce">✅</div>
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          Số câu đúng
                        </div>
                        <div className="text-4xl font-bold text-cyan-500">
                          {currentQuestions.filter((q) => q.isCorrect).length}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-2 border-red-200 p-6 text-center hover:shadow-lg transition-all hover:scale-105">
                        <div className="text-4xl mb-3">❌</div>
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          Số câu sai
                        </div>
                        <div className="text-4xl font-bold text-red-500">
                          {wrongAnswers}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 p-6 text-center hover:shadow-lg transition-all hover:scale-105">
                        <div className="text-4xl mb-3">⊝</div>
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          Bỏ qua
                        </div>
                        <div className="text-4xl font-bold text-gray-600">
                          {
                            currentQuestions.filter((q) => q.answer === null)
                              .length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Navigation & Tabs */}
              <div
                className={`rounded-2xl shadow-lg border p-2 mb-6 ${isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-cyan-100"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {sections.length > 1 && (
                    <div className="flex gap-2">
                      {sections.map((section) => (
                        <button
                          key={section}
                          onClick={() => setCurrentSection(section)}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all ${currentSection === section
                              ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-md"
                              : isDarkMode
                                ? "text-gray-300 hover:bg-gray-700"
                                : "text-gray-700 hover:bg-cyan-50"
                            }`}
                        >
                          Phần {section}
                        </button>
                      ))}
                    </div>
                  )}
                  {sections.length > 1 && (
                    <div className="h-10 w-px bg-gray-300" />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab("answers")}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "answers"
                          ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-md"
                          : isDarkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-cyan-50"
                        }`}
                    >
                      📋 Đáp án
                    </button>
                    <button
                      onClick={() => setActiveTab("detail")}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "detail"
                          ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-md"
                          : isDarkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-cyan-50"
                        }`}
                    >
                      📝 Đề & Đáp án
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Title */}
              <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-2xl px-8 py-5 mb-6 shadow-lg">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <span className="text-2xl">📖</span>
                  Phần {currentSection}:{" "}
                  {currentSection === 1 ? "Kiến thức ngôn ngữ" : "Nghe hiểu"}
                </h2>
              </div>

              {/* Tab: Answers */}
              {activeTab === "answers" && (
                <div
                  className={`rounded-2xl shadow-lg border p-8 ${isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-cyan-100"
                    }`}
                >
                  <div className="grid grid-cols-10 gap-4">
                    {currentQuestions.map((q) => (
                      <div
                        key={q.questionId}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all group-hover:scale-110 ${q.isCorrect
                              ? "bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-600 border-2 border-cyan-300"
                              : q.answer === null
                                ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 border-2 border-gray-300"
                                : "bg-gradient-to-br from-red-100 to-red-200 text-red-600 border-2 border-red-300"
                            }`}
                        >
                          {q.questionOrder}
                        </div>
                        <div className="flex items-center justify-center h-7">
                          {q.isCorrect ? (
                            <span className="text-cyan-500 text-2xl font-bold">
                              ✓
                            </span>
                          ) : q.answer === null ? (
                            <span className="text-gray-400 text-2xl">○</span>
                          ) : (
                            <span className="text-red-500 text-2xl font-bold">
                              ✗
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Detail */}
              {activeTab === "detail" && (
                <div className="space-y-6 pb-8">
                  {currentQuestions.map((q) => {
                    const options = JSON.parse(q.optionsJson || "[]");
                    return (
                      <div
                        key={q.questionId}
                        className={`rounded-2xl border-2 shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-cyan-100"
                          }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-md ${q.isCorrect
                                  ? "bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-600 border-2 border-cyan-300"
                                  : q.answer === null
                                    ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 border-2 border-gray-300"
                                    : "bg-gradient-to-br from-red-100 to-red-200 text-red-600 border-2 border-red-300"
                                }`}
                            >
                              {q.questionOrder}
                            </div>
                            <h3
                              className={`text-lg font-medium leading-relaxed ${isDarkMode ? "text-gray-100" : "text-gray-900"
                                }`}
                            >
                              {q.questionText}
                            </h3>
                          </div>

                          {q.audioUrl && (
                            <div className="mb-4 bg-gray-50 rounded-xl p-4">
                              <audio controls className="w-full">
                                <source src={q.audioUrl} type="audio/mpeg" />
                              </audio>
                            </div>
                          )}

                          {q.imageUrl && (
                            <div className="mb-4">
                              <img
                                src={q.imageUrl}
                                alt="Question"
                                className="max-w-full h-auto rounded-xl shadow-md"
                              />
                            </div>
                          )}

                          <div className="space-y-3">
                            {options.map((option: string, idx: number) => {
                              const isUserAnswer = q.answer === option;
                              const isCorrectAnswer =
                                q.correctAnswer === option;
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isCorrectAnswer
                                      ? "border-cyan-300 bg-gradient-to-r from-cyan-50 to-cyan-100 shadow-md"
                                      : isUserAnswer && !q.isCorrect
                                        ? "border-red-300 bg-gradient-to-r from-red-50 to-red-100 shadow-md"
                                        : isDarkMode
                                          ? "border-gray-600 hover:border-gray-500"
                                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    checked={isUserAnswer}
                                    readOnly
                                    className="w-5 h-5"
                                  />
                                  <span
                                    className={`text-base flex-1 ${isCorrectAnswer
                                        ? "text-cyan-600 font-semibold"
                                        : isUserAnswer && !q.isCorrect
                                          ? "text-red-600 font-medium"
                                          : isDarkMode
                                            ? "text-gray-200"
                                            : "text-gray-900"
                                      }`}
                                  >
                                    {String.fromCharCode(65 + idx)}. {option}
                                  </span>
                                  {isCorrectAnswer && (
                                    <span className="ml-auto text-cyan-500 font-bold flex items-center gap-1 bg-cyan-100 px-3 py-1 rounded-full text-sm">
                                      ✓ Đáp án đúng
                                    </span>
                                  )}
                                  {isUserAnswer && !q.isCorrect && (
                                    <span className="ml-auto text-red-500 font-bold flex items-center gap-1 bg-red-100 px-3 py-1 rounded-full text-sm">
                                      ✗ Bạn đã chọn
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="mt-5 p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl border-2 border-cyan-200 shadow-sm">
                              <p className="text-sm text-cyan-900 leading-relaxed">
                                <span className="font-bold text-cyan-600 flex items-center gap-2 mb-2">
                                  💡 Giải thích:
                                </span>
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NIBO AI Chat */}
      <MaziAIChat isDarkMode={isDarkMode} />
    </>
  );
}

export default function ExamResultPage() {
  return (
    <React.Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-cyan-600">Đang tải kết quả...</div>}>
      <ExamResultContent />
    </React.Suspense>
  );
}
