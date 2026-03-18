"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useDarkMode } from "@/hooks/useDarkMode";
import LoadingCat from "@/components/LoadingCat";
import { courseService } from "@/services/courseService";
import { sectionService } from "@/services/sectionService";
import { enrollmentService } from "@/services/enrollmentService";
import { vnPayService } from "@/services/VnPayService";
import {
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";
import ProgressCard from "@/components/course/Progresscard ";
import CourseCard from "@/components/course/CourseCard";
import CoursePurchaseModal from "@/components/course/CoursePurchaseModal";

// Types
interface Section {
  id: string;
  title: string;
  lessonCount: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed?: string;
  instructor: string;
  duration?: string;
  createdAt?: string;
  sections: Section[];
  expanded?: boolean;
  currentLesson?: string;
  totalSongs?: number;
  isPaid?: boolean;
  price?: number;
  isBought?: boolean;
}

// Main Component
export default function MyCoursesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "inProgress" | "completed"
  >("all");
  const [purchaseModal, setPurchaseModal] = useState<{
    visible: boolean;
    courseId: string;
    courseTitle: string;
    price: number;
    isProcessing: boolean;
  }>({ visible: false, courseId: "", courseTitle: "", price: 0, isProcessing: false });

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiCourses = await courseService.getAll();

        const transformedCourses: Course[] = await Promise.all(
          apiCourses
            .filter((course) => course.isActive)
            .map(async (course) => {
              let sections: Section[] = [];
              try {
                const sectionsData = await sectionService.getByCourse(
                  course.id
                );
                sections = sectionsData.map((section) => ({
                  id: section.id,
                  title: section.title,
                  lessonCount: 0,
                }));
              } catch (err) {
                console.error(
                  `Error fetching sections for course ${course.id}:`,
                  err
                );
              }

              const totalLessons = sections.reduce(
                (sum, section) => sum + section.lessonCount,
                0
              );
              const completedLessons = 0;

              return {
                id: course.id,
                title: course.title,
                description: course.description,
                thumbnail: course.imageUrl || "",
                level: course.level,
                instructor: course.createdBy || "Sensei",
                createdAt: course.createdAt,
                totalLessons: totalLessons || 20,
                completedLessons: completedLessons,
                progress: Math.floor(Math.random() * 100), // Mock progress
                lastAccessed: course.createdAt,
                sections: sections,
                totalSongs: Math.floor(Math.random() * 50),
                isPaid: course.isPaid,
                price: course.price,
                isBought: await (async () => {
                  try {
                    const res = await enrollmentService.check(course.id);
                    // Handle both wrapped { data: { enrolled } } and direct { enrolled } responses
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data = (res as any).data ?? res;
                    return data.enrolled === true;
                  } catch (e) {
                    console.error("Enrollment check failed for", course.id, e);
                    return false;
                  }
                })(),
              };
            })
        );

        setCourses(transformedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Không thể tải khóa học. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchCourses();
    }
  }, [mounted]);

  const handleCourseClick = async (courseId: string) => {
    try {
      const checkResult = await enrollmentService.check(courseId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrollData = (checkResult as any).data ?? checkResult;
      if (enrollData.enrolled === true) {
        router.push(`/myCourses/${courseId}`);
      } else {
        const course = courses.find((c) => c.id === courseId);
        if (course?.isPaid) {
          setPurchaseModal({
            visible: true,
            courseId,
            courseTitle: course.title,
            price: course.price ?? 0,
            isProcessing: false,
          });
        } else {
          // free course but not enrolled — just navigate in
          router.push(`/myCourses/${courseId}`);
        }
      }
    } catch (err) {
      console.error("Enrollment check failed:", err);
    }
  };

  const handlePurchaseConfirm = async () => {
    setPurchaseModal((prev) => ({ ...prev, isProcessing: true }));
    try {
      const paymentRes = await vnPayService.create({
        productId: purchaseModal.courseId,
        productType: "COURSE",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentUrl = (paymentRes as any).data?.paymentUrl ?? paymentRes.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        alert("Không thể tạo link thanh toán. Vui lòng thử lại.");
        setPurchaseModal((prev) => ({ ...prev, isProcessing: false }));
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Đã xảy ra lỗi thanh toán. Vui lòng thử lại sau.");
      setPurchaseModal((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const toggleCourseExpand = (courseId: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((course) =>
        course.id === courseId
          ? { ...course, expanded: !course.expanded }
          : { ...course, expanded: false }
      )
    );
  };

  const filteredCourses = courses.filter((course) => {
    if (activeFilter === "inProgress") {
      return course.isBought && course.progress > 0 && course.progress < 100;
    }
    if (activeFilter === "completed") {
      return course.isBought && course.progress === 100;
    }
    return true;
  });

  const inProgressCourses = courses.filter(
    (c) => c.isBought && c.progress > 0 && c.progress < 100
  );

  const stats = {
    total: courses.length,
    inProgress: inProgressCourses.length,
    completed: courses.filter((c) => c.isBought && c.progress === 100).length,
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

  return (
    <>
      {/* Purchase Confirmation Modal */}
      {purchaseModal.visible && (
        <CoursePurchaseModal
          isDark={isDarkMode}
          courseTitle={purchaseModal.courseTitle}
          price={purchaseModal.price}
          isProcessing={purchaseModal.isProcessing}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => setPurchaseModal((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 5px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 5px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 5px;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

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
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          <div
            className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
          >
            <h1
              className={`text-3xl font-bold mb-6 ${isDarkMode ? "text-gray-100" : "text-gray-800"
                }`}
            >
              Khóa học của tôi
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div
                className={`${isDarkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl p-4 shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                    <BookOpen className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                      Tổng khóa học
                    </p>
                    <p
                      className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}
                    >
                      {stats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`${isDarkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl p-4 shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                      Đang học
                    </p>
                    <p
                      className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}
                    >
                      {stats.inProgress}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`${isDarkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl p-4 shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                      Hoàn thành
                    </p>
                    <p
                      className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}
                    >
                      {stats.completed}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2 rounded-lg transition ${activeFilter === "all"
                  ? "bg-cyan-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Tất cả ({stats.total})
              </button>
              <button
                onClick={() => setActiveFilter("inProgress")}
                className={`px-4 py-2 rounded-lg transition ${activeFilter === "inProgress"
                  ? "bg-cyan-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Đang học ({stats.inProgress})
              </button>
              <button
                onClick={() => setActiveFilter("completed")}
                className={`px-4 py-2 rounded-lg transition ${activeFilter === "completed"
                  ? "bg-cyan-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Hoàn thành ({stats.completed})
              </button>
            </div>
          </div>

          <div
            className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar"
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingCat
                  size="lg"
                  isDark={isDarkMode}
                  message="Đang tải khóa học"
                  subMessage="Vui lòng đợi trong giây lát"
                />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle
                    className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-cyan-400" : "text-cyan-500"
                      }`}
                  />
                  <p
                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    {error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:shadow-lg transition"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BookOpen
                    className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-cyan-400"
                      }`}
                  />
                  <p
                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    {activeFilter === "all"
                      ? "Chưa có khóa học nào"
                      : activeFilter === "inProgress"
                        ? "Không có khóa học đang học"
                        : "Chưa hoàn thành khóa học nào"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* In Progress Section - Special Layout */}
                {activeFilter === "inProgress" &&
                  inProgressCourses.length > 0 && (
                    <div className="mb-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {inProgressCourses.map((course, index) => (
                          <ProgressCard
                            key={course.id}
                            courseId={course.id}
                            isDark={isDarkMode}
                            onClick={() => handleCourseClick(course.id)}
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Standard Grid Layout for All/Completed */}
                {activeFilter !== "inProgress" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        isDark={isDarkMode}
                        onClick={() => handleCourseClick(course.id)}
                        onToggleExpand={() => toggleCourseExpand(course.id)}
                        isExpanded={course.expanded || false}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
