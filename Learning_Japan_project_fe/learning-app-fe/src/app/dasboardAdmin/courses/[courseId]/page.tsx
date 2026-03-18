"use client";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import { BookOpen, Layers, CheckCircle2, ChevronRight, Loader2, Plus, Trash2, ArrowLeft, Edit3, X, Save } from "lucide-react";
import { courseService, CourseResponse } from "@/services/courseService";
import { sectionService, SectionResponse, CreateSectionRequest, UpdateSectionRequest } from "@/services/sectionService";

export default function AdminSectionManagerPage({ params }: { params: Promise<{ courseId: string }> }) {
    const router = useRouter();
    const { courseId } = use(params);
    const [isReady, setIsReady] = useState(false);
    const { isDarkMode: isDark } = useDarkMode();

    const [course, setCourse] = useState<CourseResponse | null>(null);
    const [sections, setSections] = useState<SectionResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    // Edit state
    const [editingSection, setEditingSection] = useState<SectionResponse | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (!isReady || !courseId) return;

        const fetchAll = async () => {
            try {
                const [courseData, sectionsData] = await Promise.all([
                    courseService.getDetail(courseId),
                    sectionService.getByCourse(courseId)
                ]);
                setCourse(courseData);
                setSections(sectionsData);
            } catch (error) {
                console.error("Failed to fetch section data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [isReady, courseId]);

    const handleCreateSection = async () => {
        if (!newTitle.trim()) return;
        setIsSubmitting(true);
        try {
            const req: CreateSectionRequest = {
                courseId,
                title: newTitle.trim(),
            };
            await sectionService.create(req);

            const updated = await sectionService.getByCourse(courseId);
            setSections(updated);

            setNewTitle("");
            setIsAdding(false);
        } catch (error) {
            console.error(error);
            alert("Create failed!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (section: SectionResponse) => {
        setEditingSection(section);
        setEditTitle(section.title);
        setIsAdding(false); // Close add form if open
    };

    const handleUpdateSection = async () => {
        if (!editingSection || !editTitle.trim()) return;
        setIsSubmitting(true);
        try {
            const req: UpdateSectionRequest = {
                title: editTitle.trim(),
            };
            await sectionService.update(editingSection.id, req);

            setSections(prev => prev.map(s =>
                s.id === editingSection.id
                    ? { ...s, title: editTitle.trim() }
                    : s
            ));

            setEditingSection(null);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Cập nhật không thành công!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSection = async (e: React.MouseEvent, sectionId: string) => {
        e.stopPropagation();
        if (!confirm("Bạn có chắc muốn xóa section này? Mọi dữ liệu (lessons, documents) bên trong có thể bị mất.")) return;

        try {
            await sectionService.delete(sectionId);
            setSections(prev => prev.filter(s => s.id !== sectionId));
        } catch (error) {
            console.error("Failed to delete section", error);
            alert("Xóa không thành công!");
        }
    };

    if (!isReady) return null;

    return (
        <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
            {/* Breadcrumbs */}


            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => router.push('/dasboardAdmin/courses')}
                        className={`p-3 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 ${isDark ? "border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-gray-300" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                            <div className={`p-2 rounded-xl ${isDark ? "bg-purple-500/10" : "bg-purple-50"}`}>
                                <Layers className={`w-8 h-8 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                            </div>
                            Chương (Sections)
                        </h1>
                        <p className={`text-sm mt-1.5 font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Quản lý cấu trúc của khóa học: <span className={`px-2 py-0.5 rounded-lg ${isDark ? "bg-purple-500/10 text-purple-300" : "bg-purple-50 text-purple-700"}`}>{course?.title}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingSection(null);
                    }}
                    className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all duration-300 group ${isAdding ? "ring-2 ring-purple-400" : ""}`}
                >
                    {isAdding ? (
                        <><X className="w-5 h-5" /> Hủy Thêm</>
                    ) : (
                        <><Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> Tạo Section mới</>
                    )}
                </button>
            </div>

            {/* Form thêm hoặc sửa */}
            {(isAdding || editingSection) && (
                <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${isDark ? "bg-gray-800/50 border-gray-700 backdrop-blur-xl" : "bg-white border-purple-100"}`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${editingSection ? "bg-amber-500" : "bg-purple-600"}`} />

                    <h3 className={`text-xl font-black mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {editingSection ? (
                            <><Edit3 className="w-6 h-6 text-amber-500" /> Chỉnh sửa: <span className="text-amber-500">{editingSection.title}</span></>
                        ) : (
                            <><Plus className="w-6 h-6 text-purple-600" /> Thêm Chương (Section) Mới</>
                        )}
                    </h3>

                    <div>
                        <div>
                            <label className={`block text-sm font-bold mb-2.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tên Section <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                autoFocus
                                value={editingSection ? editTitle : newTitle}
                                onChange={(e) => editingSection ? setEditTitle(e.target.value) : setNewTitle(e.target.value)}
                                placeholder="Ví dụ: Chương 1: Bảng chữ cái"
                                className={`w-full px-5 py-3 rounded-2xl border text-base font-medium focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-300 ${isDark ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-600" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setEditingSection(null);
                            }}
                            className={`px-6 py-2.5 font-bold text-sm rounded-xl transition-all duration-300 ${isDark ? "text-gray-400 hover:text-white hover:bg-gray-700/50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={editingSection ? handleUpdateSection : handleCreateSection}
                            disabled={isSubmitting || (editingSection ? !editTitle.trim() : !newTitle.trim())}
                            className={`px-8 py-2.5 font-bold text-sm text-white rounded-xl shadow-lg active:scale-95 flex items-center gap-2 transition-all duration-300 ${isSubmitting || (editingSection ? !editTitle.trim() : !newTitle.trim()) ? "bg-gray-400 cursor-not-allowed" : (editingSection ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20")}`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> {editingSection ? "Đang lưu..." : "Đang thêm..."}</>
                            ) : (
                                <>{editingSection ? <><Save className="w-4 h-4" /> Lưu thay đổi</> : <><CheckCircle2 className="w-4 h-4" /> Xác nhận tạo</>}</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Danh sách Section */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : (
                <div className="space-y-4">
                    {sections.length === 0 ? (
                        <div className={`p-12 text-center rounded-2xl border border-dashed ${isDark ? "border-gray-700 bg-gray-800/30" : "border-gray-300 bg-gray-50"}`}>
                            <Layers className={`w-12 h-12 mx-auto mb-3 opacity-20 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                            <h3 className={`font-bold text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}>Chưa có Chương (Section) nào</h3>
                            <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Hãy tạo section đầu tiên để xây dựng cấu trúc khóa học.</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="mt-4 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 font-bold text-sm rounded-lg transition-colors"
                            >
                                Tạo Section ngay
                            </button>
                        </div>
                    ) : (
                        sections.map((section, index) => (
                            <div
                                key={section.id}
                                onClick={() => router.push(`/dasboardAdmin/courses/${courseId}/sections/${section.id}`)}
                                className={`group relative flex items-center justify-between p-6 rounded-3xl border cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${isDark ? "bg-gray-800/40 border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800" : "bg-white border-gray-100 hover:border-purple-200 hover:bg-purple-50/5"}`}
                            >
                                {/* Background glow effect on hover */}
                                <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isDark ? "bg-purple-500" : "bg-purple-400"}`} />

                                <div className="flex items-center gap-6 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${isDark ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 shadow-inner" : "bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-600 shadow-sm"}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-xl group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 ${isDark ? "text-white" : "text-gray-900"}`}>
                                            {section.title}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                                <div className={`w-1 h-1 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-300"}`} />
                                                Tạo lúc: {section.createdAt ? new Date(section.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 relative z-10">
                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 translate-x-4 lg:translate-x-8 group-hover:translate-x-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(section);
                                            }}
                                            className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${isDark ? "hover:bg-amber-500/20 text-amber-500" : "hover:bg-amber-50 text-amber-600"}`}
                                            title="Sửa section"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteSection(e, section.id)}
                                            className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${isDark ? "hover:bg-red-500/20 text-red-500" : "hover:bg-red-50 text-red-600"}`}
                                            title="Xóa section"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className={`p-2 rounded-xl transition-all duration-300 group-hover:bg-purple-500/10 ${isDark ? "text-gray-600" : "text-gray-300"}`}>
                                        <ChevronRight className={`w-6 h-6 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-purple-500`} />
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
