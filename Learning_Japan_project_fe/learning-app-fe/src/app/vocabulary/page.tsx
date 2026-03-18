"use client";
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useDarkMode } from "@/hooks/useDarkMode";
import LoadingCat from "@/components/LoadingCat";
import Flashcard from "@/components/Flashcard";
import VocabularyList from "@/components/VocabularyList";

// Main Component
export default function VocabularyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);
  const [activeTab, setActiveTab] = useState("flashcard");
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();

  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <LoadingCat
            size="xl"
            isDark={true}
            message="Đang tải"
            subMessage="Vui lòng đợi trong giây lát"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex h-screen ${isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
          }`}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Component */}
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          {/* Page Title Bar */}
          <div
            className={`${isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white/80 backdrop-blur-sm border-cyan-100"
              } border-b px-6 py-3 shadow-sm`}
          >
            <h1
              className={`text-xl font-bold ${isDarkMode
                ? "text-gray-100"
                : "bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent"
                }`}
            >
              Từ vựng của tôi
            </h1>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto pt-6 pb-8 px-4">
              {/* Tab Navigation */}
              <div className="flex gap-3 mb-6 max-w-3xl mx-auto">
                <button
                  onClick={() => setActiveTab("flashcard")}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition ${activeTab === "flashcard"
                    ? "bg-cyan-500 text-white hover:bg-cyan-600"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Flashcard
                </button>
                <button
                  onClick={() => setActiveTab("vocabulary")}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition ${activeTab === "vocabulary"
                    ? "bg-cyan-500 text-white hover:bg-cyan-600"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Vocabulary
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition ${activeTab === "quiz"
                    ? "bg-cyan-500 text-white hover:bg-cyan-600"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Quiz
                </button>
                <button
                  onClick={() => setActiveTab("write")}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition ${activeTab === "write"
                    ? "bg-cyan-500 text-white hover:bg-cyan-600"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Write
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "flashcard" && <Flashcard isDark={isDarkMode} />}

              {activeTab === "vocabulary" && (
                <VocabularyList isDarkMode={isDarkMode} />
              )}

              {activeTab === "quiz" && (
                <div className="flex flex-col items-center justify-center min-h-[500px]">
                  <div className="text-6xl mb-4">❓</div>
                  <p
                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    Quiz tab đang được phát triển
                  </p>
                </div>
              )}

              {activeTab === "write" && (
                <div className="flex flex-col items-center justify-center min-h-[500px]">
                  <div className="text-6xl mb-4">✍️</div>
                  <p
                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    Write tab đang được phát triển
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
