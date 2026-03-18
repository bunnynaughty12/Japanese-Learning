import React from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  BookOpen,
  Search,
  FileText,
  Video,
  PlayCircle,
} from "lucide-react";

// Types
interface LessonPart {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  partOrder: number;
  isCompleted: boolean;
  progressPercent?: number;
  lastWatchedSecond?: number;
}

interface LessonDocumentResponse {
  id: string;
  title: string;
  documentUrl: string;
  documentOrder: number;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  progress: number;
  description?: string;
  isExpanded: boolean;
  parts: LessonPart[];
  documents: LessonDocumentResponse[];
}

interface Chapter {
  id: string;
  title: string;
  level: string;
  isExpanded: boolean;
  lessons: Lesson[];
}

interface LessonSidebarProps {
  isDarkMode: boolean;
  course: {
    title: string;
    chapters: Chapter[];
  };
  selectedPart: LessonPart | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleChapter: (chapterId: string) => void;
  toggleLesson: (lessonId: string) => void;
  handlePartClick: (lesson: Lesson, part: LessonPart) => void;
  handleDocumentClick: (lesson: Lesson) => void;
  partProgress?: Record<string, number>; // Map of partId to progress percentage
}

export default function LessonSidebar({
  isDarkMode,
  course,
  selectedPart,
  searchQuery,
  setSearchQuery,
  toggleChapter,
  toggleLesson,
  handlePartClick,
  handleDocumentClick,
  partProgress = {},
}: LessonSidebarProps) {
  // Calculate lesson overall progress - uses BOTH part.progressPercent and partProgress prop
  const calculateLessonProgress = (lesson: Lesson): number => {
    if (lesson.parts.length === 0) return 0;

    const totalProgress = lesson.parts.reduce((sum, part) => {
      // Prioritize partProgress prop, fallback to part.progressPercent
      const progress = partProgress[part.id] ?? part.progressPercent ?? 0;
      return sum + progress;
    }, 0);

    return Math.round(totalProgress / lesson.parts.length);
  };

  // Calculate chapter progress
  const calculateChapterProgress = (chapter: Chapter): number => {
    if (chapter.lessons.length === 0) return 0;

    const totalProgress = chapter.lessons.reduce((sum, lesson) => {
      return sum + calculateLessonProgress(lesson);
    }, 0);

    return Math.round(totalProgress / chapter.lessons.length);
  };

  return (
    <div
      className={`w-96 flex flex-col border-l ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* Course Title */}
      <div
        className={`p-4 border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <h3
          className={`font-bold mb-1 ${
            isDarkMode ? "text-gray-100" : "text-gray-800"
          }`}
        >
          {course.title}
        </h3>
        <button
          onClick={() => {}}
          className="text-cyan-500 text-sm flex items-center gap-1 hover:gap-2 transition-all"
        >
          Xem chi tiết
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div
        className={`p-4 border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDarkMode ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài học"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-sm ${
              isDarkMode
                ? "text-gray-300 placeholder-gray-500"
                : "text-gray-700 placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {course.chapters.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có bài học nào</p>
          </div>
        ) : (
          course.chapters.map((chapter) => {
            const chapterProgress = calculateChapterProgress(chapter);

            return (
              <div
                key={chapter.id}
                className={`border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition ${
                    chapter.isExpanded
                      ? isDarkMode
                        ? "bg-gray-700/50"
                        : "bg-gray-50"
                      : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-bold ${
                          chapter.level === "N5_BEGINNER" ||
                          chapter.level === "Elementary"
                            ? "text-green-500"
                            : chapter.level === "N4_INTERMEDIATE" ||
                              chapter.level === "Intermediate"
                            ? "text-cyan-500"
                            : chapter.level === "N3_ADVANCED" ||
                              chapter.level === "Advanced"
                            ? "text-purple-500"
                            : "text-orange-500"
                        }`}
                      >
                        {chapter.title}
                      </span>
                    </div>
                  </div>

                  {chapter.isExpanded ? (
                    <ChevronUp
                      className={`w-4 h-4 ml-3 flex-shrink-0 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    />
                  ) : (
                    <ChevronDown
                      className={`w-4 h-4 ml-3 flex-shrink-0 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    />
                  )}
                </button>

                {/* Lessons */}
                {chapter.isExpanded && (
                  <div>
                    {chapter.lessons.length === 0 ? (
                      <div
                        className={`px-4 py-6 text-center text-sm ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Chưa có bài học nào
                      </div>
                    ) : (
                      chapter.lessons
                        .filter((lesson) =>
                          lesson.title
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((lesson) => {
                          const lessonProgress =
                            calculateLessonProgress(lesson);

                          return (
                            <div key={lesson.id}>
                              {/* Lesson Header */}
                              <button
                                onClick={() => toggleLesson(lesson.id)}
                                disabled={lesson.isLocked}
                                className={`w-full px-4 py-3.5 pl-6 flex items-center justify-between hover:bg-gray-700/20 transition ${
                                  lesson.isLocked
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                } ${
                                  lesson.isExpanded
                                    ? isDarkMode
                                      ? "bg-gray-700/30"
                                      : "bg-gray-100/50"
                                    : ""
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p
                                      className={`text-sm font-medium flex-1 ${
                                        isDarkMode
                                          ? "text-gray-200"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {lesson.title}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs">
                                    <div
                                      className={`flex items-center gap-1.5 ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      <Video className="w-3.5 h-3.5" />
                                      <span>{lesson.parts.length} phần</span>
                                    </div>
                                    <div
                                      className={`flex items-center gap-1.5 ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>
                                        {lesson.documents.length} tài liệu
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {lesson.isExpanded ? (
                                  <ChevronUp
                                    className={`w-4 h-4 ml-3 flex-shrink-0 ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  />
                                ) : (
                                  <ChevronDown
                                    className={`w-4 h-4 ml-3 flex-shrink-0 ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  />
                                )}
                              </button>

                              {/* Lesson Parts */}
                              {lesson.isExpanded && lesson.parts.length > 0 && (
                                <div
                                  className={
                                    isDarkMode
                                      ? "bg-gray-900/40"
                                      : "bg-gray-50/70"
                                  }
                                >
                                  {lesson.parts.map((part) => {
                                    // Get progress from prop first, then part property
                                    const currentPartProgress =
                                      partProgress[part.id] ??
                                      part.progressPercent ??
                                      0;
                                    const isPartCompleted =
                                      part.isCompleted ||
                                      currentPartProgress >= 90;
                                    const isWatching =
                                      selectedPart?.id === part.id;

                                    return (
                                      <button
                                        key={part.id}
                                        onClick={() =>
                                          handlePartClick(lesson, part)
                                        }
                                        className={`w-full px-4 py-2.5 pl-12 flex items-center gap-3 hover:bg-gray-700/20 transition text-left relative ${
                                          isWatching
                                            ? isDarkMode
                                              ? "bg-cyan-900/30 border-l-3 border-cyan-500"
                                              : "bg-cyan-50 border-l-3 border-cyan-500"
                                            : ""
                                        }`}
                                      >
                                        <div className="flex-shrink-0 z-10">
                                          {isPartCompleted ? (
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                          ) : isWatching ? (
                                            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                                              <PlayCircle className="w-5 h-5 text-white" />
                                            </div>
                                          ) : currentPartProgress > 0 ? (
                                            <div className="relative w-8 h-8 flex items-center justify-center">
                                              <svg className="w-8 h-8 transform -rotate-90">
                                                <circle
                                                  cx="16"
                                                  cy="16"
                                                  r="14"
                                                  stroke={
                                                    isDarkMode
                                                      ? "#374151"
                                                      : "#E5E7EB"
                                                  }
                                                  strokeWidth="2.5"
                                                  fill="none"
                                                />
                                                <circle
                                                  cx="16"
                                                  cy="16"
                                                  r="14"
                                                  stroke="#06B6D4"
                                                  strokeWidth="2.5"
                                                  fill="none"
                                                  strokeDasharray={`${
                                                    currentPartProgress * 0.88
                                                  } 88`}
                                                  strokeLinecap="round"
                                                />
                                              </svg>
                                              <span className="absolute text-[9px] font-semibold text-cyan-500">
                                                {currentPartProgress}%
                                              </span>
                                            </div>
                                          ) : (
                                            <div
                                              className={`w-8 h-8 rounded-full border-2 ${
                                                isDarkMode
                                                  ? "border-gray-600"
                                                  : "border-gray-300"
                                              }`}
                                            ></div>
                                          )}
                                        </div>

                                        <div className="flex-1 min-w-0 z-10">
                                          <div className="flex items-center gap-2">
                                            <p
                                              className={`text-sm flex-1 truncate ${
                                                isWatching
                                                  ? isDarkMode
                                                    ? "text-cyan-300 font-medium"
                                                    : "text-cyan-700 font-medium"
                                                  : isDarkMode
                                                  ? "text-gray-300"
                                                  : "text-gray-700"
                                              }`}
                                            >
                                              {part.title}
                                            </p>
                                          </div>

                                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{part.duration}</span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Lesson Documents Preview */}
                              {lesson.isExpanded &&
                                lesson.documents.length > 0 && (
                                  <div
                                    className={`px-4 py-3 pl-12 ${
                                      isDarkMode
                                        ? "bg-gray-900/40"
                                        : "bg-gray-50/70"
                                    }`}
                                  >
                                    <button
                                      onClick={() =>
                                        handleDocumentClick(lesson)
                                      }
                                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                                        isDarkMode
                                          ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                                          : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm"
                                      }`}
                                    >
                                      <FileText className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                                      <span className="text-sm flex-1 text-left truncate">
                                        {lesson.documents[0].title}
                                      </span>
                                      {lesson.documents.length > 1 && (
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full ${
                                            isDarkMode
                                              ? "bg-gray-700 text-gray-400"
                                              : "bg-gray-100 text-gray-600"
                                          }`}
                                        >
                                          +{lesson.documents.length - 1}
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
