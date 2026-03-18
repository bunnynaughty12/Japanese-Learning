"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useDarkMode } from "@/hooks/useDarkMode";
import LoadingCat from "@/components/LoadingCat";
import { courseService } from "@/services/courseService";
import { sectionService } from "@/services/sectionService";
import { lessonService } from "@/services/lessonService";
import { formatYoutubeDuration } from "@/utils/formatYoutubeDuration";
import VideoPlayerSection from "@/components/course/Videoplayersectioncourse";
import LessonSidebar from "@/components/Lessonsidebar";
import { lessonProgressService } from "@/services/lessonProgressService";

import {
  lessonPartService,
  LessonPartResponse,
} from "@/services/lessonPartService";
import {
  lessonDocumentService,
  LessonDocumentResponse,
} from "@/services/lessonDocumentService";
import { AlertCircle } from "lucide-react";

// Types
interface LessonPart {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  partOrder: number;
  isCompleted: boolean;
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

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  level: string;
  instructor: string;
  thumbnail: string;
  chapters: Chapter[];
  currentVideoUrl?: string;
}

// Main Component
export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [selectedPart, setSelectedPart] = useState<LessonPart | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Progress tracking state
  const [partProgress, setPartProgress] = useState<Record<string, number>>({});

  type TabType = "materials" | "discussion" | "toc" | "notes";
  const [activeTab, setActiveTab] = useState<TabType>("materials");

  // Load progress for all parts in the course
  const loadAllProgress = async (chapters: Chapter[]) => {
    const progressMap: Record<string, number> = {};

    for (const chapter of chapters) {
      for (const lesson of chapter.lessons) {
        for (const part of lesson.parts) {
          try {
            const progressData = await lessonProgressService.getProgress(
              part.id
            );
            progressMap[part.id] = progressData.progressPercent;
          } catch (error) {
            // If no progress exists, default to 0
            progressMap[part.id] = 0;
          }
        }
      }
    }

    setPartProgress(progressMap);
  };

  // ⭐ OPTIMIZED: Completely non-blocking progress update
  const handleProgressUpdate = (
    partId: string,
    progressPercent: number,
    isCompleted: boolean,
    lastWatchedSecond: number
  ) => {
    // ⭐ IMMEDIATE: Update UI in next animation frame (non-blocking)
    requestAnimationFrame(() => {
      setPartProgress((prev) => ({
        ...prev,
        [partId]: progressPercent,
      }));
    });

    // ⭐ DEFERRED: API call using requestIdleCallback for minimal impact
    const saveProgress = () => {
      lessonProgressService
        .updateProgress({
          lessonPartId: partId,
          progressPercent: Math.round(progressPercent),
          lastWatchedSecond: Math.floor(lastWatchedSecond),
        })
        .then(() => {
          console.log("✅ Progress saved:", {
            partId,
            progressPercent: Math.round(progressPercent),
            lastWatchedSecond: Math.floor(lastWatchedSecond),
          });

          // Update completion status if needed
          if (isCompleted && course) {
            requestAnimationFrame(() => {
              setCourse({
                ...course,
                chapters: course.chapters.map((chapter) => ({
                  ...chapter,
                  lessons: chapter.lessons.map((lesson) => ({
                    ...lesson,
                    parts: lesson.parts.map((part) =>
                      part.id === partId ? { ...part, isCompleted: true } : part
                    ),
                  })),
                })),
              });
            });
          }
        })
        .catch((error) => {
          console.error("❌ Failed to save progress (silent):", error);
        });
    };

    // ⭐ Use requestIdleCallback if available, else setTimeout
    if ("requestIdleCallback" in window) {
      requestIdleCallback(saveProgress);
    } else {
      setTimeout(saveProgress, 0);
    }
  };

  // Fetch course details
  useEffect(() => {
    const fetchCourseDetail = async () => {
      if (!courseId) return;

      setLoading(true);
      setError(null);
      try {
        // 1. Fetch course data
        const courseData = await courseService.getDetail(courseId);

        // 2. Fetch sections data
        const sectionsData = await sectionService.getByCourse(courseId);

        // 3. Fetch lessons, parts, and documents for each section
        const chaptersPromises = sectionsData.map(async (section) => {
          try {
            const lessonsData = await lessonService.getBySection(section.id);

            // Fetch parts and documents for each lesson
            const lessonsWithDetails = await Promise.all(
              lessonsData.map(async (lesson) => {
                try {
                  // Fetch lesson parts
                  const partsData = await lessonPartService.getByLesson(
                    lesson.id
                  );
                  const parts: LessonPart[] = partsData.map((part) => ({
                    id: part.id,
                    title: part.title,
                    videoUrl: part.videoUrl || "",
                    duration: part.duration
                      ? formatYoutubeDuration(part.duration)
                      : "00:00",
                    partOrder: part.partOrder,
                    isCompleted: false,
                  }));

                  // Fetch lesson documents
                  const documentsData = await lessonDocumentService.getByLesson(
                    lesson.id
                  );

                  return {
                    id: lesson.id,
                    title: lesson.title,
                    duration: "10:00",
                    isCompleted: false,
                    isLocked: false,
                    progress: 0,
                    isExpanded: false,
                    parts: parts.sort((a, b) => a.partOrder - b.partOrder),
                    documents: documentsData.sort(
                      (a, b) => a.documentOrder - b.documentOrder
                    ),
                  };
                } catch (err) {
                  console.error(
                    `Error fetching details for lesson ${lesson.id}:`,
                    err
                  );
                  return {
                    id: lesson.id,
                    title: lesson.title,
                    duration: "10:00",
                    isCompleted: false,
                    isLocked: false,
                    progress: 0,
                    isExpanded: false,
                    parts: [],
                    documents: [],
                  };
                }
              })
            );

            return {
              id: section.id,
              title: section.title,
              level: section.lessonLevel,
              isExpanded: true,
              lessons: lessonsWithDetails,
            };
          } catch (err) {
            console.error(
              `Error fetching lessons for section ${section.id}:`,
              err
            );
            return {
              id: section.id,
              title: section.title,
              level: section.lessonLevel,
              isExpanded: true,
              lessons: [],
            };
          }
        });

        const chapters = await Promise.all(chaptersPromises);

        const transformedCourse: CourseDetail = {
          id: courseData.id,
          title: courseData.title,
          description: courseData.description,
          level: courseData.level,
          instructor: courseData.createdBy || "Sensei",
          thumbnail: courseData.imageUrl || "",
          currentVideoUrl: "",
          chapters: chapters,
        };

        setCourse(transformedCourse);

        // Load progress for all parts
        await loadAllProgress(chapters);

        // Set first lesson part as selected
        if (chapters.length > 0 && chapters[0].lessons.length > 0) {
          const firstLesson = chapters[0].lessons[0];
          setSelectedLesson(firstLesson);

          if (firstLesson.parts.length > 0) {
            const firstPart = firstLesson.parts[0];
            setSelectedPart(firstPart);

            if (firstPart.videoUrl) {
              setCourse((prev) =>
                prev
                  ? {
                      ...prev,
                      currentVideoUrl: firstPart.videoUrl,
                    }
                  : null
              );
            }
          }
        }
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Không thể tải chi tiết khóa học. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchCourseDetail();
    }
  }, [courseId, mounted]);

  const toggleChapter = (chapterId: string) => {
    if (!course) return;
    setCourse({
      ...course,
      chapters: course.chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, isExpanded: !chapter.isExpanded }
          : chapter
      ),
    });
  };

  const toggleLesson = (lessonId: string) => {
    if (!course) return;
    setCourse({
      ...course,
      chapters: course.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) =>
          lesson.id === lessonId
            ? { ...lesson, isExpanded: !lesson.isExpanded }
            : lesson
        ),
      })),
    });
  };

  const handlePartClick = (lesson: Lesson, part: LessonPart) => {
    setSelectedLesson(lesson);
    setSelectedPart(part);

    if (part.videoUrl && course) {
      setCourse({
        ...course,
        currentVideoUrl: part.videoUrl,
      });
    }
  };

  const handleDocumentClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setActiveTab("materials");

    // Scroll to materials tab content
    setTimeout(() => {
      const materialsSection = document.getElementById("materials-section");
      if (materialsSection) {
        materialsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleBack = () => {
    router.push("/myCourses");
  };

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

  if (loading) {
    return (
      <div
        className={`flex h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingCat
            size="lg"
            isDark={isDarkMode}
            message="Đang tải khóa học"
            subMessage="Vui lòng đợi trong giây lát"
          />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div
        className={`flex h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p
              className={`text-lg ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {error || "Không tìm thấy khóa học"}
            </p>
            <button
              onClick={handleBack}
              className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#1f2937" : "#f3f4f6"};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? "#4b5563" : "#d1d5db"};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? "#6b7280" : "#9ca3af"};
        }
      `}</style>

      <div
        className={`flex h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          {/* Breadcrumb */}
          <div
            className={`px-6 py-3 border-b ${
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={handleBack}
                className={`hover:text-cyan-500 transition ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Trang chủ
              </button>
              <span className={isDarkMode ? "text-gray-600" : "text-gray-400"}>
                /
              </span>
              <button
                onClick={handleBack}
                className={`hover:text-cyan-500 transition ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Khóa học của tôi
              </button>
              <span className={isDarkMode ? "text-gray-600" : "text-gray-400"}>
                /
              </span>
              <span className="text-cyan-500">{course.title}</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Side - Video Player & Content */}
            <VideoPlayerSection
              isDarkMode={isDarkMode}
              course={course}
              selectedPart={selectedPart}
              selectedLesson={selectedLesson}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onProgressUpdate={handleProgressUpdate}
            />

            {/* Right Side - Lesson List */}
            <LessonSidebar
              isDarkMode={isDarkMode}
              course={course}
              selectedPart={selectedPart}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              toggleChapter={toggleChapter}
              toggleLesson={toggleLesson}
              handlePartClick={handlePartClick}
              handleDocumentClick={handleDocumentClick}
              partProgress={partProgress}
            />
          </div>
        </div>
      </div>
    </>
  );
}
