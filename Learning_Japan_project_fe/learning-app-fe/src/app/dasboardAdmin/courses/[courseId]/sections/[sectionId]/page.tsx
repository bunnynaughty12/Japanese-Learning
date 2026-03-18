"use client";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import { BookOpen, BookText, CheckCircle2, ChevronRight, Loader2, Plus, Trash2, ArrowLeft, Edit3, X, Save } from "lucide-react";
import { courseService, CourseResponse } from "@/services/courseService";
import { sectionService, SectionResponse } from "@/services/sectionService";
import { lessonService, LessonResponse, CreateLessonRequest } from "@/services/lessonService";

export default function AdminLessonManagerPage({ params }: { params: Promise<{ courseId: string, sectionId: string }> }) {
    const router = useRouter();
    const { courseId, sectionId } = use(params);
    const [isReady, setIsReady] = useState(false);
    const { isDarkMode: isDark } = useDarkMode();

    const [course, setCourse] = useState<CourseResponse | null>(null);
    const [section, setSection] = useState<SectionResponse | null>(null);
    const [lessons, setLessons] = useState<LessonResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newOrder, setNewOrder] = useState<number>(1);

    // Edit State
    const [editingLesson, setEditingLesson] = useState<LessonResponse | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editOrder, setEditOrder] = useState<number>(1);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (!isReady || !courseId || !sectionId) return;

        const fetchAll = async () => {
            try {
                const [courseData, sectionData, lessonsData] = await Promise.all([
                    courseService.getDetail(courseId),
                    sectionService.getDetail(sectionId),
                    lessonService.getBySection(sectionId)
                ]);
                setCourse(courseData);
                setSection(sectionData);

                // Sort lessons array just in case
                lessonsData.sort((a, b) => a.lessonOrder - b.lessonOrder);
                setLessons(lessonsData);
                setNewOrder(lessonsData.length + 1);
            } catch (error) {
                console.error("Failed to fetch lesson data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [isReady, courseId, sectionId]);

    const handleCreateLesson = async () => {
        if (!newTitle.trim() || newOrder < 1) return;
        setIsSubmitting(true);
        try {
            const req: CreateLessonRequest = {
                sectionId,
                title: newTitle.trim(),
                lessonOrder: newOrder
            };
            await lessonService.create(req);

            // Re-fetch lessons to get full updated array
            const updated = await lessonService.getBySection(sectionId);
            updated.sort((a, b) => a.lessonOrder - b.lessonOrder);
            setLessons(updated);

            setNewTitle("");
            setNewOrder(updated.length + 1);
            setIsAdding(false);
        } catch (error) {
            console.error(error);
            alert("Create failed!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (lesson: LessonResponse) => {
        setEditingLesson(lesson);
        setEditTitle(lesson.title);
        setEditOrder(lesson.lessonOrder);
        setIsAdding(false);
    };

    const handleUpdateLesson = async () => {
        if (!editTitle.trim() || editOrder < 1 || !editingLesson) return;
        setIsSubmitting(true);
        try {
            const req: CreateLessonRequest = {
                sectionId,
                title: editTitle.trim(),
                lessonOrder: editOrder
            };
            await lessonService.update(editingLesson.id, req);

            const updated = await lessonService.getBySection(sectionId);
            updated.sort((a, b) => a.lessonOrder - b.lessonOrder);
            setLessons(updated);

            setEditingLesson(null);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Cập nhật không thành công!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
        e.stopPropagation();
        if (!confirm("Bạn có chắc muốn xóa Lesson này? Mọi file đính kèm/nội dung bên trong sẽ bị mất.")) return;

        try {
            await lessonService.delete(lessonId);
            setLessons(prev => {
                const updated = prev.filter(l => l.id !== lessonId);
                // Update default next order
                setNewOrder(updated.length + 1);
                return updated;
            });
        } catch (error) {
            console.error("Failed to delete lesson", error);
            alert("Xóa không thành công!");
        }
    };

    if (!isReady) return null;

    return (
        <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
            {/* Breadcrumbs */}
            <div className={`flex items-center gap-2 text-sm font-bold mb-4 ${isDark ? "text-gray-400" : "text-gray-500"} overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar`}>
                <span className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push('/dasboardAdmin')}>Dashboard</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push('/dasboardAdmin/courses')}>Khóa học</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push(`/dasboardAdmin/courses/${courseId}`)}>{course?.title || "Đang tải..."}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className={`px-3 py-1 rounded-lg ${isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700"}`}>{section?.title || "Đang tải..."}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dasboardAdmin/courses/${courseId}`)}
                        className={`p-2.5 rounded-full border transition-all ${isDark ? "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div>
                            <h1 className={`text-4xl font-black tracking-tight flex items-center gap-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                                <div className={`p-2.5 rounded-2xl ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}>
                                    <BookText className={`w-8 h-8 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                                </div>
                                Bài giảng (Lessons)
                            </h1>
                            <p className={`text-sm mt-2 font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                Quản lý cấu trúc bài học cho chương: <span className={`px-2 py-0.5 rounded font-black ${isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700"}`}>{section?.title}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingLesson(null);
                    }}
                    className={`px-6 py-3 font-black rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95 text-sm ${isAdding
                        ? (isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700")
                        : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-blue-500/20"}`}
                >
                    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isAdding ? "Hủy" : "Tạo Lesson mới"}
                </button>
            </div>

            {/* Form thêm/sửa mới Glassmorphism style */}
            {(isAdding || editingLesson) && (
                <div className={`p-8 rounded-[32px] border shadow-2xl relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${isDark ? "bg-gray-800/50 border-blue-500/30 backdrop-blur-xl" : "bg-white border-blue-100 shadow-blue-200/50"}`}>
                    <div className={`absolute top-0 left-0 w-2 h-full ${editingLesson ? "bg-teal-500" : "bg-blue-600"}`} />

                    <h3 className={`text-2xl font-black mb-6 flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {editingLesson ? (
                            <><Edit3 className="w-7 h-7 text-teal-400" /> Chỉnh sửa Bài Giảng</>
                        ) : (
                            <><Plus className="w-7 h-7 text-blue-600" /> Thêm Bài Giảng Mới</>
                        )}
                    </h3>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                            <label className={`block text-sm font-black mb-2.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tên Bài học <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                autoFocus
                                value={editingLesson ? editTitle : newTitle}
                                onChange={(e) => editingLesson ? setEditTitle(e.target.value) : setNewTitle(e.target.value)}
                                placeholder="Ví dụ: Bài 1: Xin chào hội thoại"
                                className={`w-full px-5 py-3.5 rounded-2xl border text-base font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-300 ${isDark ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`}
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className={`block text-sm font-black mb-2.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Thứ tự <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min="1"
                                value={editingLesson ? editOrder : newOrder}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const finalVal = val < 1 ? 1 : val;
                                    editingLesson ? setEditOrder(finalVal) : setNewOrder(finalVal);
                                }}
                                className={`w-full px-5 py-3.5 rounded-2xl border text-base font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-300 ${isDark ? "bg-gray-900/50 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                            />
                        </div>

                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setEditingLesson(null);
                            }}
                            className={`px-6 py-3 font-black text-sm rounded-xl transition-all ${isDark ? "text-gray-400 hover:text-white hover:bg-gray-700/50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}
                            disabled={isSubmitting || (editingLesson ? !editTitle.trim() : !newTitle.trim())}
                            className={`px-8 py-3 font-black text-sm text-white rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : (editingLesson ? "bg-gradient-to-r from-teal-600 to-teal-500 shadow-teal-500/20" : "bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/20")}`}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {editingLesson ? "Cập nhật thay đổi" : "Xác nhận tạo Bài học"}
                        </button>
                    </div>
                </div>
            )}

            {/* Danh sách Lesson */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="space-y-4">
                    {lessons.length === 0 ? (
                        <div className={`p-12 text-center rounded-2xl border border-dashed flex flex-col items-center opacity-80 ${isDark ? "border-gray-700 bg-gray-800/20" : "border-gray-300 bg-gray-50"}`}>
                            <BookText className={`w-12 h-12 mx-auto mb-3 opacity-20 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                            <h3 className={`font-bold text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}>Chưa có Bài học (Lesson) nào</h3>
                            <p className={`text-sm mt-1 px-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Sau khi thêm lesson, bạn có thể bấm vào Lesson để thêm bài tập luyện tập, documents, hay vocab.</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 font-bold text-sm rounded-lg transition-colors"
                            >
                                Tạo Bài học đầu tiên
                            </button>
                        </div>
                    ) : (
                        lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[24px] border transition-all duration-500 overflow-hidden ${isDark
                                    ? "bg-gray-800 border-gray-700 hover:border-blue-500/50 hover:bg-gray-700/40"
                                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-[0_20px_40px_rgba(59,130,246,0.08)]"}`}
                            >
                                {/* Background Glow Effect on Hover */}
                                <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${isDark ? "bg-blue-500" : "bg-blue-400"}`} />

                                <div className="flex items-center gap-6 relative z-10">
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600 shadow-inner"}`}>
                                        {lesson.lessonOrder}
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-xl transition-colors duration-300 group-hover:text-blue-500 ${isDark ? "text-white" : "text-gray-900"}`}>{lesson.title}</h3>
                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <div className={`w-1 h-1 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-400"}`} />
                                                <span className="text-[11px] font-bold">
                                                    Đã tạo: {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString('vi-VN') : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-4 sm:mt-0 justify-end w-full sm:w-auto relative z-10">
                                    <button
                                        onClick={() => router.push(`/dasboardAdmin/courses/${courseId}/sections/${sectionId}/lessons/${lesson.id}`)}
                                        className={`px-5 py-2 rounded-xl border font-black text-[12px] tracking-tight transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${isDark
                                            ? "border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                                            : "border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"}`}
                                    >
                                        Cấu trúc Bài học
                                    </button>

                                    <div className="flex items-center bg-gray-50/50 dark:bg-gray-900/40 p-1 rounded-xl border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 transition-all duration-500">
                                        <button
                                            onClick={() => handleEditClick(lesson)}
                                            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? "hover:bg-teal-500/20 text-gray-500 hover:text-teal-400" : "hover:bg-teal-50 text-gray-400 hover:text-teal-600"}`}
                                            title="Chỉnh sửa bài học"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteLesson(e, lesson.id)}
                                            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? "hover:bg-red-500/20 text-gray-500 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"}`}
                                            title="Xóa bài học"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </main>
    );
}
