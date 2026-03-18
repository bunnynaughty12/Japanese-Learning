"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import { BookOpen, Map, ChevronRight, Loader2, Library, EyeOff, LayoutGrid, Search, Edit3, X, Check, DollarSign, Type, FileText } from "lucide-react";
import { courseService, CourseResponse, UpdateCourseRequest } from "@/services/courseService";
import { JLPTLevel } from "@/enums/JLPTLevel";
import { LessonProcess } from "@/enums/LessonProcess";

export default function AdminCourseManagerPage() {
    const router = useRouter();
    const { isDarkMode: isDark } = useDarkMode();
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit Modal State
    const [editingCourse, setEditingCourse] = useState<CourseResponse | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editForm, setEditForm] = useState<UpdateCourseRequest>({
        title: "",
        description: "",
        level: JLPTLevel.N5,
        lessonProcess: LessonProcess.JUNBI,
        price: 0
    });

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await courseService.getAll();
                setCourses(data);
            } catch (error) {
                console.error("Failed to load courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const handleToggleActive = async (e: React.MouseEvent, courseId: string) => {
        e.stopPropagation();
        try {
            await courseService.toggleActive(courseId);
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isActive: !c.isActive } : c));
        } catch (error) {
            console.error("Failed to toggle course active status:", error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.level.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (e: React.MouseEvent, course: CourseResponse) => {
        e.stopPropagation();
        setEditingCourse(course);
        setEditForm({
            title: course.title,
            description: course.description,
            level: course.level,
            lessonProcess: course.lessonProcess,
            price: course.price
        });
    };

    const handleUpdate = async () => {
        if (!editingCourse) return;
        setIsUpdating(true);
        try {
            await courseService.update(editingCourse.id, editForm);
            setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...editForm } : c));
            setEditingCourse(null);
            alert("Cập nhật khóa học thành công!");
        } catch (error: any) {
            console.error("Failed to update course:", error);
            alert(error.message || "Cập nhật khóa học thất bại");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <main className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>

                    <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <Library className={`w-8 h-8 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                        Quản lý Khóa học
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Xem, chỉnh sửa và quản lý các khóa học trong hệ thống.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dasboardAdmin/courses/create')}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all text-sm"
                    >
                        <BookOpen className="w-4 h-4" /> Tạo khóa học mới
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-100"}`}>
                <div className="relative w-full sm:w-96">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên khóa học, level..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition ${isDark ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`}
                    />
                </div>
                <div className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Tổng cộng: <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{filteredCourses.length}</span> khóa học
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredCourses.map((course) => (
                        <div
                            key={course.id}
                            onClick={() => router.push(`/dasboardAdmin/courses/${course.id}`)}
                            className={`group cursor-pointer rounded-3xl border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDark ? "bg-gray-800 border-gray-700/50 hover:border-indigo-500/50" : "bg-white border-gray-100 hover:border-indigo-200"}`}
                        >
                            <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                {course.imageUrl ? (
                                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
                                        <BookOpen className="w-12 h-12 text-indigo-300 dark:text-indigo-700" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-black tracking-wider uppercase shadow-sm">
                                        {course.level}
                                    </span>
                                </div>
                                {!course.isActive && (
                                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center">
                                        <span className="px-3 py-1 bg-gray-800/80 text-gray-200 text-xs font-bold rounded-lg border border-gray-600 flex items-center gap-1">
                                            <EyeOff className="w-3.5 h-3.5" /> Bị ẩn
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className={`font-bold text-lg line-clamp-2 leading-tight ${isDark ? "text-white" : "text-gray-900"} group-hover:text-indigo-500 transition-colors`}>{course.title}</h3>

                                <div className="mt-auto pt-4 flex flex-col gap-3">
                                    <div className={`flex items-center justify-between text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                        <div className="flex items-center gap-1.5">
                                            <Map className="w-4 h-4" />
                                            <span>{
                                                course.lessonProcess === "JUNBI" ? "Học nền" :
                                                    course.lessonProcess === "TAISAKU" ? "Ôn luyện chiến lược" :
                                                        course.lessonProcess === "PRACTICE" ? "Luyện đề" :
                                                            "Không xác định"
                                            }</span>
                                        </div>
                                    </div>

                                    <div className={`pt-3 border-t flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                                        {course.isPaid ? (
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-amber-500" : "text-amber-600"}`}>Premium</span>
                                                <span className={`font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>{formatCurrency(course.price)}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-green-500" : "text-green-600"}`}>Miễn phí</span>
                                                <span className={`font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>0 đ</span>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>

                            {/* Action bar on hover? Or static */}
                            <div className={`px-5 py-3 border-t flex items-center justify-between transition-colors ${isDark ? "bg-gray-800/80 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                                <button
                                    onClick={(e) => handleToggleActive(e, course.id)}
                                    className={`text-[11px] font-bold uppercase py-1.5 px-3 rounded-lg border transition-all ${course.isActive ? isDark ? "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20" : "border-green-200 text-green-600 bg-green-50 hover:bg-green-100" : isDark ? "border-gray-600 text-gray-400 bg-gray-800 hover:bg-gray-700" : "border-gray-300 text-gray-500 bg-white hover:bg-gray-100"}`}
                                >
                                    {course.isActive ? "Đang hiển thị" : "Bị ẩn"}
                                </button>
                                <button
                                    onClick={(e) => handleEditClick(e, course)}
                                    className={`text-[11px] font-bold uppercase py-1.5 px-3 rounded-lg border transition-all flex items-center gap-1.5 ${isDark ? "border-amber-500/30 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" : "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"}`}
                                >
                                    <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                                </button>
                                <span className={`text-xs font-bold flex items-center gap-1 transition-colors ${isDark ? "text-gray-400 group-hover:text-indigo-400" : "text-gray-500 group-hover:text-indigo-600"}`}>
                                    Chi tiết <ChevronRight className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    ))}
                    {filteredCourses.length === 0 && !loading && (
                        <div className={`col-span-full py-20 text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Không tìm thấy khóa học nào</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Course Modal */}
            {editingCourse && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setEditingCourse(null)}
                    ></div>
                    <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className={`text-2xl font-extrabold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                                        Chỉnh sửa Khóa học
                                    </h3>
                                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                        Cập nhật thông tin chi tiết của khóa học này.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingCourse(null)}
                                    className={`p-2 rounded-xl transition-colors ${isDark ? "bg-gray-700 text-gray-400 hover:text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"}`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Title */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        <Type className="w-3.5 h-3.5" /> Tiêu đề khóa học
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        <FileText className="w-3.5 h-3.5" /> Mô tả
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    />
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        <DollarSign className="w-3.5 h-3.5" /> Giá tiền (VND)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={editForm.price || ""}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setEditForm({ ...editForm, price: val < 0 ? 0 : val });
                                        }}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    />
                                </div>

                                {/* Level */}
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        <Library className="w-3.5 h-3.5" /> Trình độ JLPT
                                    </label>
                                    <select
                                        value={editForm.level}
                                        onChange={(e) => setEditForm({ ...editForm, level: e.target.value as JLPTLevel })}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none cursor-pointer ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    >
                                        {Object.values(JLPTLevel).map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Lesson Process */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        <Map className="w-3.5 h-3.5" /> Lộ trình bài học
                                    </label>
                                    <select
                                        value={editForm.lessonProcess}
                                        onChange={(e) => setEditForm({ ...editForm, lessonProcess: e.target.value as LessonProcess })}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none cursor-pointer ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    >
                                        <option value={LessonProcess.JUNBI}>Học nền (JUNBI)</option>
                                        <option value={LessonProcess.TAISAKU}>Ôn luyện chiến lược (TAISAKU)</option>
                                        <option value={LessonProcess.PRACTICE}>Luyện đề (PRACTICE)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setEditingCourse(null)}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className={`flex-[2] py-3.5 rounded-2xl font-bold text-sm text-white transition-all bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 ${isUpdating ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
                                >
                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

