"use client";
import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
    BookText,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Plus,
    Trash2,
    ArrowLeft,
    Video,
    FileText,
    UploadCloud,
    X,
    FolderSync
} from "lucide-react";
import { courseService, CourseResponse } from "@/services/courseService";
import { sectionService, SectionResponse } from "@/services/sectionService";
import { lessonService, LessonResponse } from "@/services/lessonService";
import { lessonPartService, LessonPartResponse, CreateLessonPartRequest, UpdateLessonPartRequest } from "@/services/lessonPartService";
import { lessonDocumentService, LessonDocumentResponse, CreateLessonDocumentRequest } from "@/services/lessonDocumentService";
import { LessonPartType } from "@/enums/LessonPartType";

export default function AdminLessonBuilderPage({ params }: { params: Promise<{ courseId: string, sectionId: string, lessonId: string }> }) {
    const router = useRouter();
    const { courseId, sectionId, lessonId } = use(params);
    const [isReady, setIsReady] = useState(false);
    const { isDarkMode: isDark } = useDarkMode();

    // Breadcrumbs Data
    const [course, setCourse] = useState<CourseResponse | null>(null);
    const [section, setSection] = useState<SectionResponse | null>(null);
    const [lesson, setLesson] = useState<LessonResponse | null>(null);
    const [globalLoading, setGlobalLoading] = useState(true);

    // Active Tab (parts | documents)
    const [activeTab, setActiveTab] = useState<"parts" | "docs">("parts");

    /* --- LESSON PARTS STATE --- */
    const [parts, setParts] = useState<LessonPartResponse[]>([]);
    const [isAddingPart, setIsAddingPart] = useState(false);
    const [newPartTitle, setNewPartTitle] = useState("");
    const [newPartType, setNewPartType] = useState<LessonPartType>(LessonPartType.VOCABULARY);
    const [newPartVideoUrl, setNewPartVideoUrl] = useState("");
    const [newPartOrder, setNewPartOrder] = useState(1);

    // Edit Part State
    const [editingPart, setEditingPart] = useState<LessonPartResponse | null>(null);
    const [editPartTitle, setEditPartTitle] = useState("");
    const [editPartType, setEditPartType] = useState<LessonPartType>(LessonPartType.VOCABULARY);
    const [editPartVideoUrl, setEditPartVideoUrl] = useState("");
    const [editPartOrder, setEditPartOrder] = useState(1);

    const [isSubmittingPart, setIsSubmittingPart] = useState(false);

    /* --- LESSON DOCUMENTS STATE --- */
    const [docs, setDocs] = useState<LessonDocumentResponse[]>([]);
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState("");
    const [newDocOrder, setNewDocOrder] = useState(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (!isReady || !courseId || !sectionId || !lessonId) return;

        const fetchAll = async () => {
            try {
                const [c, s, l, p, d] = await Promise.all([
                    courseService.getDetail(courseId),
                    sectionService.getDetail(sectionId),
                    lessonService.getDetail(lessonId),
                    lessonPartService.getByLesson(lessonId),
                    lessonDocumentService.getByLesson(lessonId)
                ]);

                setCourse(c);
                setSection(s);
                setLesson(l);

                p.sort((a, b) => a.partOrder - b.partOrder);
                setParts(p);
                setNewPartOrder(p.length + 1);

                d.sort((a, b) => a.documentOrder - b.documentOrder);
                setDocs(d);
                setNewDocOrder(d.length + 1);

            } catch (error) {
                console.error("Failed to fetch builder data:", error);
            } finally {
                setGlobalLoading(false);
            }
        };

        fetchAll();
    }, [isReady, courseId, sectionId, lessonId]);

    /* =================== LESSON PART HANDLERS =================== */
    const handleCreatePart = async () => {
        if (!newPartTitle.trim() || newPartOrder < 1) return;
        setIsSubmittingPart(true);
        try {
            const req: CreateLessonPartRequest = {
                lessonId,
                title: newPartTitle.trim(),
                lessonPartType: newPartType,
                videoUrl: newPartVideoUrl.trim(),
                partOrder: newPartOrder
            };
            await lessonPartService.create(req);

            const updated = await lessonPartService.getByLesson(lessonId);
            updated.sort((a, b) => a.partOrder - b.partOrder);
            setParts(updated);

            setNewPartTitle("");
            setNewPartVideoUrl("");
            setNewPartOrder(updated.length + 1);
            setIsAddingPart(false);
        } catch (error) {
            console.error(error);
            alert("Create Part failed!");
        } finally {
            setIsSubmittingPart(false);
        }
    };

    const handleEditPartClick = (part: LessonPartResponse) => {
        setEditingPart(part);
        setEditPartTitle(part.title);
        setEditPartType(part.lessonPartType as LessonPartType);
        setEditPartVideoUrl(part.videoUrl || "");
        setEditPartOrder(part.partOrder);
        setIsAddingPart(false);
    };

    const handleUpdatePart = async () => {
        if (!editingPart || !editPartTitle.trim()) return;
        setIsSubmittingPart(true);
        try {
            const req: UpdateLessonPartRequest = {
                title: editPartTitle.trim(),
                lessonPartType: editPartType,
                videoUrl: editPartVideoUrl.trim(),
                partOrder: editPartOrder
            };
            await lessonPartService.update(editingPart.id, req);

            const updated = await lessonPartService.getByLesson(lessonId);
            updated.sort((a, b) => a.partOrder - b.partOrder);
            setParts(updated);

            setEditingPart(null);
        } catch (error) {
            console.error("Update Part failed:", error);
            alert("Cập nhật Part không thành công!");
        } finally {
            setIsSubmittingPart(false);
        }
    };

    const handleDeletePart = async (e: React.MouseEvent, partId: string) => {
        e.stopPropagation();
        if (!confirm("Bạn có chắc muốn xóa phần học này?")) return;
        try {
            await lessonPartService.delete(partId);
            setParts(prev => {
                const arr = prev.filter(x => x.id !== partId);
                setNewPartOrder(arr.length + 1);
                return arr;
            });
        } catch (error) {
            console.error(error);
            alert("Xóa không thành công!");
        }
    };

    /* =================== LESSON DOCUMENT HANDLERS =================== */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            // Tự động gán tên file làm title nếu title rỗng
            if (!newDocTitle) {
                setNewDocTitle(e.target.files[0].name.split(".")[0] || "");
            }
        }
    };

    const handleCreateDoc = async () => {
        if (!selectedFile || !newDocTitle.trim() || newDocOrder < 1) return;
        setIsSubmittingDoc(true);
        try {
            const req: CreateLessonDocumentRequest = {
                lessonId,
                title: newDocTitle.trim(),
                documentOrder: newDocOrder,
                file: selectedFile
            };
            await lessonDocumentService.create(req);

            // Re-fetch
            const updated = await lessonDocumentService.getByLesson(lessonId);
            updated.sort((a, b) => a.documentOrder - b.documentOrder);
            setDocs(updated);

            setNewDocTitle("");
            setSelectedFile(null);
            setNewDocOrder(updated.length + 1);
            setIsAddingDoc(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error(error);
            alert("Upload Document failed!");
        } finally {
            setIsSubmittingDoc(false);
        }
    };

    const handleDeleteDoc = async (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        if (!confirm("Bạn có chắc muốn xóa tài liệu này vĩnh viễn?")) return;
        try {
            await lessonDocumentService.delete(docId);
            setDocs(prev => {
                const arr = prev.filter(x => x.id !== docId);
                setNewDocOrder(arr.length + 1);
                return arr;
            });
        } catch (error) {
            console.error(error);
            alert("Xóa tài liệu không thành công!");
        }
    };


    if (!isReady || globalLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
            {/* Breadcrumbs */}
            <div className={`flex items-center gap-2 text-sm font-medium mb-4 ${isDark ? "text-gray-400" : "text-gray-500"} overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar`}>
                <span className="hover:text-indigo-500 cursor-pointer transition-colors" onClick={() => router.push('/dasboardAdmin')}>Dashboard</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className="hover:text-indigo-500 cursor-pointer transition-colors" onClick={() => router.push('/dasboardAdmin/courses')}>Khóa học</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className="hover:text-indigo-500 cursor-pointer transition-colors truncate max-w-[150px]" onClick={() => router.push(`/dasboardAdmin/courses/${courseId}`)}>{course?.title}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className="hover:text-indigo-500 cursor-pointer transition-colors truncate max-w-[150px]" onClick={() => router.push(`/dasboardAdmin/courses/${courseId}/sections/${sectionId}`)}>{section?.title}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className={`font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>{lesson?.title}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dasboardAdmin/courses/${courseId}/sections/${sectionId}`)}
                        className={`p-2.5 rounded-full border transition-all ${isDark ? "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                            <div className={`p-2 rounded-2xl ${isDark ? "bg-teal-500/10" : "bg-teal-50"}`}>
                                <FolderSync className={`w-8 h-8 ${isDark ? "text-teal-400" : "text-teal-600"}`} />
                            </div>
                            Cấu trúc Bài học
                        </h1>
                        <p className={`text-sm mt-1.5 font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Thiết lập nội dung & file tài liệu cho bài: <span className={`px-2 py-0.5 rounded-lg font-bold ${isDark ? "bg-teal-500/10 text-teal-300" : "bg-teal-50 text-teal-700"}`}>{lesson?.title}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Dashboard Split View / Tabs */}
            <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

                {/* Tab Switcher */}
                <div className={`flex border-b p-1 gap-1 ${isDark ? "border-gray-700 bg-gray-900/20" : "border-gray-200 bg-gray-50/50"}`}>
                    <button
                        onClick={() => setActiveTab("parts")}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 ${activeTab === "parts"
                            ? isDark ? "bg-teal-500/10 text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.1)]" : "bg-white text-teal-600 shadow-sm ring-1 ring-gray-200"
                            : isDark ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                            }`}
                    >
                        <div className={`p-1.5 rounded-lg ${activeTab === "parts" ? (isDark ? "bg-teal-400/20" : "bg-teal-50") : (isDark ? "bg-gray-800" : "bg-gray-100")}`}>
                            <Video className="w-4 h-4" />
                        </div>
                        Lesson Parts (Nội dung bài)
                    </button>
                    <button
                        onClick={() => setActiveTab("docs")}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 ${activeTab === "docs"
                            ? isDark ? "bg-orange-500/10 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "bg-white text-orange-600 shadow-sm ring-1 ring-gray-200"
                            : isDark ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                            }`}
                    >
                        <div className={`p-1.5 rounded-lg ${activeTab === "docs" ? (isDark ? "bg-orange-400/20" : "bg-orange-50") : (isDark ? "bg-gray-800" : "bg-gray-100")}`}>
                            <FileText className="w-4 h-4" />
                        </div>
                        Documents (Tài liệu)
                    </button>
                </div>

                {/* Content Area */}
                {activeTab === "parts" && (
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold text-lg ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                Các phần nội dung bài học ({parts.length})
                            </h3>
                            {!isAddingPart && (
                                <button onClick={() => setIsAddingPart(true)} className="px-4 py-2 font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 transition active:scale-95">
                                    <Plus className="w-4 h-4" /> Thêm Part
                                </button>
                            )}
                        </div>

                        {/* Add/Edit Form for Lesson Parts */}
                        {(isAddingPart || editingPart) && (
                            <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${isDark ? "bg-gray-900/50 border-teal-500/30 backdrop-blur-xl" : "bg-white border-teal-100"}`}>
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${editingPart ? "bg-teal-400" : "bg-teal-600"}`} />

                                <h4 className={`text-xl font-black mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                                    {editingPart ? (
                                        <><Video className="w-6 h-6 text-teal-400" /> Chỉnh sửa: <span className="text-teal-400">{editingPart.title}</span></>
                                    ) : (
                                        <><Plus className="w-6 h-6 text-teal-600" /> Thêm Phần Nội Dung Mới</>
                                    )}
                                </h4>

                                <div className="grid gap-6 sm:grid-cols-4">
                                    <div className="sm:col-span-2">
                                        <label className={`block text-sm font-bold mb-2.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tiêu đề phần <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            autoFocus
                                            value={editingPart ? editPartTitle : newPartTitle}
                                            onChange={(e) => editingPart ? setEditPartTitle(e.target.value) : setNewPartTitle(e.target.value)}
                                            placeholder="Ví dụ: Từ vựng 1"
                                            className={`w-full px-5 py-3 rounded-2xl border text-base font-medium outline-none transition-all duration-300 ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400"}`}
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className={`block text-sm font-bold mb-2.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Loại nội dung <span className="text-red-500">*</span></label>
                                        <select
                                            value={editingPart ? editPartType : newPartType}
                                            onChange={(e) => {
                                                const val = e.target.value as LessonPartType;
                                                editingPart ? setEditPartType(val) : setNewPartType(val);
                                            }}
                                            className={`w-full px-5 py-3 rounded-2xl border text-base font-medium outline-none transition-all duration-300 appearance-none ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400"}`}
                                        >
                                            <option value={LessonPartType.VOCABULARY}>Từ vựng</option>
                                            <option value={LessonPartType.GRAMMAR}>Ngữ pháp</option>
                                            <option value={LessonPartType.LISTENING}>Nghe hiểu</option>
                                            <option value={LessonPartType.READING}>Đọc hiểu</option>
                                            <option value={LessonPartType.PRACTICE}>Luyện tập</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className={`block text-sm font-bold mb-2.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Thứ tự <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={editingPart ? editPartOrder : newPartOrder}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                const finalVal = val < 1 ? 1 : val;
                                                editingPart ? setEditPartOrder(finalVal) : setNewPartOrder(finalVal);
                                            }}
                                            className={`w-full px-5 py-3 rounded-2xl border text-base font-medium outline-none transition-all duration-300 ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400"}`}
                                        />
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label className={`block text-sm font-bold mb-2.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Video URL (YouTube)</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500">
                                                <Video className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editingPart ? editPartVideoUrl : newPartVideoUrl}
                                                onChange={(e) => editingPart ? setEditPartVideoUrl(e.target.value) : setNewPartVideoUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className={`w-full pl-12 pr-5 py-3 rounded-2xl border text-base font-medium outline-none transition-all duration-300 ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400"}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setIsAddingPart(false);
                                            setEditingPart(null);
                                        }}
                                        className={`px-6 py-2.5 font-bold text-sm transition-all duration-300 rounded-xl ${isDark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={editingPart ? handleUpdatePart : handleCreatePart}
                                        disabled={isSubmittingPart || (editingPart ? !editPartTitle.trim() : !newPartTitle.trim())}
                                        className={`px-8 py-2.5 font-black text-sm text-white rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all duration-300 active:scale-95 ${isSubmittingPart || (editingPart ? !editPartTitle.trim() : !newPartTitle.trim()) ? "bg-gray-500/50 cursor-not-allowed" : "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600"}`}
                                    >
                                        {isSubmittingPart ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {editingPart ? "Lưu thay đổi" : "Lưu Part"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* List Parts */}
                        <div className="grid gap-3">
                            {parts.length === 0 ? (
                                <div className={`text-center py-10 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Chưa có phần học nào.</div>
                            ) : (
                                parts.map(p => (
                                    <div
                                        key={p.id}
                                        className={`group relative flex items-center justify-between p-6 rounded-2xl border transition-all duration-500 overflow-hidden ${isDark ? "bg-gray-800/40 border-gray-700/50 hover:border-teal-500/40 hover:bg-gray-800" : "bg-white border-gray-100 hover:border-teal-200 hover:bg-teal-50/5 hover:shadow-xl"}`}
                                    >
                                        <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isDark ? "bg-teal-500" : "bg-teal-400"}`} />

                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-300 group-hover:scale-110 ${isDark ? "bg-teal-500/20 text-teal-400" : "bg-teal-50 text-teal-600"}`}>
                                                {p.partOrder}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <p className={`font-black text-lg transition-colors duration-300 group-hover:text-teal-500 ${isDark ? "text-gray-100" : "text-gray-900"}`}>{p.title}</p>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${isDark ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-teal-50 text-teal-600 border border-teal-100"}`}>
                                                        {p.lessonPartType}
                                                    </span>
                                                </div>
                                                {p.videoUrl && (
                                                    <div className="flex items-center gap-2 mt-1.5 group/url">
                                                        <Video className="w-3 h-3 text-gray-500 group-hover/url:text-teal-500 transition-colors" />
                                                        <p className="text-xs text-gray-500 truncate max-w-xs transition-colors group-hover/url:text-teal-600/70">{p.videoUrl}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 relative z-10">
                                            <button
                                                onClick={() => handleEditPartClick(p)}
                                                className={`p-2.5 rounded-xl transition-all duration-300 opacity-60 lg:opacity-0 group-hover:opacity-100 hover:scale-110 ${isDark ? "hover:bg-teal-500/20 text-teal-400" : "hover:bg-teal-50 text-teal-600"}`}
                                                title="Sửa phần học"
                                            >
                                                <X className="w-5 h-5 rotate-45" /> {/* Using X rotated as a simple Edit icon or Import Lucide Edit3 */}
                                            </button>
                                            <button
                                                onClick={(e) => handleDeletePart(e, p.id)}
                                                className={`p-2.5 rounded-xl transition-all duration-300 opacity-60 lg:opacity-0 group-hover:opacity-100 hover:scale-110 ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-50 text-red-500"}`}
                                                title="Xóa phần học"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "docs" && (
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold text-lg ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                Các file tài liệu ({docs.length})
                            </h3>
                            {!isAddingDoc && (
                                <button onClick={() => setIsAddingDoc(true)} className="px-4 py-2 font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition active:scale-95">
                                    <Plus className="w-4 h-4" /> Tải tài liệu lên
                                </button>
                            )}
                        </div>

                        {/* Upload Form */}
                        {isAddingDoc && (
                            <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900/50 border-orange-500/30" : "bg-orange-50/50 border-orange-100"}`}>
                                <div className="grid gap-4 sm:grid-cols-4">
                                    <div className="sm:col-span-3">
                                        <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tên tài liệu hiển thị <span className="text-red-500">*</span></label>
                                        <input type="text" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="Tên tài liệu (sẽ lấy theo tên file tự động)" className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-orange-400" : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500"}`} />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Thứ tự <span className="text-red-500">*</span></label>
                                        <input type="number" min="1" value={newDocOrder} onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setNewDocOrder(val < 1 ? 1 : val);
                                        }} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-orange-400" : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500"}`} />
                                    </div>

                                    <div className="sm:col-span-4 mt-2">
                                        <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Chọn File (PDF, DOCX...) <span className="text-red-500">*</span></label>
                                        <div className={`flex items-center gap-4 p-4 border border-dashed rounded-xl ${isDark ? "border-gray-600 bg-gray-800/50" : "border-gray-300 bg-white"}`}>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center gap-2 ${isDark ? "border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"}`}>
                                                <UploadCloud className="w-4 h-4" /> Duyệt từ máy tính
                                            </label>

                                            {selectedFile ? (
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className={`text-sm font-medium truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>{selectedFile.name}</span>
                                                    <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                    <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; setNewDocTitle(""); }} className="p-1 hover:bg-red-500/20 text-red-400 rounded-full"><X className="w-3 h-3" /></button>
                                                </div>
                                            ) : (
                                                <span className={`text-sm italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>Chưa chọn file nào</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button onClick={() => setIsAddingDoc(false)} className={`px-4 py-2 font-bold text-sm transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>Hủy</button>
                                    <button onClick={handleCreateDoc} disabled={isSubmittingDoc || !newDocTitle || !selectedFile} className={`px-5 py-2 font-bold text-sm text-white rounded-xl shadow-md flex items-center gap-2 ${isSubmittingDoc || !newDocTitle || !selectedFile ? "bg-gray-500/50 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"}`}>
                                        {isSubmittingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Upload Tài liệu
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* List Docs */}
                        <div className="grid gap-3">
                            {docs.length === 0 ? (
                                <div className={`text-center py-10 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Chưa có tài liệu đính kèm nào.</div>
                            ) : (
                                docs.map(d => (
                                    <div
                                        key={d.id}
                                        className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 overflow-hidden ${isDark ? "bg-gray-800/40 border-gray-700/50 hover:border-orange-500/40 hover:bg-gray-800" : "bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50/5 hover:shadow-lg"}`}
                                    >
                                        <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isDark ? "bg-orange-500" : "bg-orange-400"}`} />

                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 group-hover:scale-110 ${isDark ? "bg-orange-500/20 text-orange-400 shadow-inner" : "bg-orange-50 text-orange-600 shadow-sm"}`}>
                                                {d.documentOrder}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${isDark ? "bg-gray-800 group-hover:bg-orange-500/10" : "bg-gray-50 group-hover:bg-orange-50"} transition-colors duration-300`}>
                                                    <FileText className={`w-6 h-6 ${isDark ? "text-orange-400" : "text-orange-500"}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-black text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300 ${isDark ? "text-gray-100" : "text-gray-900"}`}>{d.title}</p>
                                                    <a href={d.documentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:text-blue-600 hover:underline transition-colors mt-1 inline-block">Mở tài liệu (Click để tải)</a>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteDoc(e, d.id)}
                                            className={`p-2.5 rounded-xl transition-all duration-300 opacity-60 lg:opacity-0 group-hover:opacity-100 hover:scale-110 relative z-10 ${isDark ? "hover:bg-red-500/20 text-red-500/70 hover:text-red-400" : "hover:bg-red-50 text-red-400 hover:text-red-500"}`}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
