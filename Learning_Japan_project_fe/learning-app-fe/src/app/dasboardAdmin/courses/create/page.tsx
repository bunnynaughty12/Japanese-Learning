"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";

/* ---- services ---- */
import { courseService, CreateCourseRequest } from "@/services/courseService";
import { sectionService, SectionResponse } from "@/services/sectionService";
import { lessonService, LessonResponse } from "@/services/lessonService";
import { lessonPartService } from "@/services/lessonPartService";
import { lessonDocumentService } from "@/services/lessonDocumentService";
import { JLPTLevel } from "@/enums/JLPTLevel";
import { LessonProcess } from "@/enums/LessonProcess";
import { LessonLevel } from "@/enums/LessonLevel";
import { LessonPartType } from "@/enums/LessonPartType";

/* ---- icons ---- */
import {
    BookOpen, ImagePlus, ChevronLeft, CheckCircle2, AlertCircle,
    Loader2, Plus, Trash2, ChevronDown, ChevronUp, FileText,
    Layers, GraduationCap, PuzzleIcon,
} from "lucide-react";

/* ===================================================================
   CONSTANTS
=================================================================== */
const JLPT_OPTIONS = [
    { value: JLPTLevel.N5, label: "N5 – Sơ cấp 1" },
    { value: JLPTLevel.N4, label: "N4 – Sơ cấp 2" },
    { value: JLPTLevel.N3, label: "N3 – Trung cấp" },
    { value: JLPTLevel.N2, label: "N2 – Cao cấp" },
    { value: JLPTLevel.N1, label: "N1 – Thượng cấp" },
];
const PROCESS_OPTIONS = [
    { value: LessonProcess.JUNBI, label: "Học nền (Junbi)" },
    { value: LessonProcess.TAISAKU, label: "Ôn luyện chiến lược (Taisaku)" },
    { value: LessonProcess.PRACTICE, label: "Luyện đề (Practice)" },
];
const LESSON_LEVEL_OPTIONS = [
    { value: LessonLevel.N5_BEGINNER, label: "N5 Sơ cấp" },
    { value: LessonLevel.N5_ELEMENTARY, label: "N5 Trung sơ cấp" },
    { value: LessonLevel.N4_BEGINNER, label: "N4 Sơ cấp" },
    { value: LessonLevel.N4_ELEMENTARY, label: "N4 Trung sơ cấp" },
    { value: LessonLevel.N3_INTERMEDIATE, label: "N3 Trung cấp" },
    { value: LessonLevel.N2_UPPER, label: "N2 Cao cấp" },
    { value: LessonLevel.N1_ADVANCED, label: "N1 Thượng cấp" },
];



/* ===================================================================
   ALERT HELPERS
=================================================================== */
function ErrorAlert({ msg }: { msg: string }) {
    return (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />{msg}
        </div>
    );
}
function SuccessAlert({ msg }: { msg: string }) {
    return (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />{msg}
        </div>
    );
}

/* -------------------------------------------------------------------
   SHARED INPUT STYLES
------------------------------------------------------------------- */
const getInputCls = (isDark: boolean) => `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition ${isDark ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`;
const getLabelCls = (isDark: boolean) => `block text-sm font-semibold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`;
const btnPrimary = "px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2";
const getBtnSecondary = (isDark: boolean) => `px-5 py-2.5 rounded-xl border text-sm font-semibold transition ${isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`;

/* ===================================================================
   STEP 1 – Course info
=================================================================== */
interface Step1Props {
    onCreated: (courseId: string) => void;
    isDark: boolean;
}
function Step1Course({ onCreated, isDark }: Step1Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [level, setLevel] = useState<JLPTLevel>(JLPTLevel.N5);
    const [lessonProcess, setLessonProcess] = useState<LessonProcess>(LessonProcess.JUNBI);
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState(0);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setImage(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError("Vui lòng nhập tên khóa học."); return; }
        if (!description.trim()) { setError("Vui lòng nhập mô tả."); return; }
        if (isPaid && price <= 0) { setError("Vui lòng nhập giá hợp lệ."); return; }
        setError(null);
        setLoading(true);
        try {
            const req: CreateCourseRequest = {
                title, description, level, lessonProcess, isPaid,
                price: isPaid ? price : 0,
                image: image ?? undefined,
            };
            const courseId = await courseService.create(req);
            onCreated(courseId);
        } catch {
            setError("Tạo khóa học thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <ErrorAlert msg={error} />}

            {/* Thumbnail */}
            <div>
                <label className={getLabelCls(isDark)}>Ảnh bìa khóa học</label>
                <div
                    onClick={() => fileRef.current?.click()}
                    className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden group ${isDark ? "border-gray-700 bg-gray-800 hover:border-indigo-500 hover:bg-indigo-900/20" : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30"}`}
                >
                    {preview ? (
                        <>
                            <img src={preview} alt="preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-sm font-semibold">Đổi ảnh</span>
                            </div>
                        </>
                    ) : (
                        <div className={`flex flex-col items-center gap-2 transition-colors ${isDark ? "text-gray-500 group-hover:text-indigo-400" : "text-gray-400 group-hover:text-indigo-500"}`}>
                            <ImagePlus className="w-9 h-9" />
                            <span className="text-sm font-medium">Nhấn để chọn ảnh</span>
                            <span className="text-xs">PNG, JPG, WEBP tối đa 5MB</span>
                        </div>
                    )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
            </div>

            {/* Title */}
            <div>
                <label className={getLabelCls(isDark)}>Tên khóa học <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Ví dụ: Tiếng Nhật N5 cho người mới bắt đầu" className={getInputCls(isDark)} />
            </div>

            {/* Description */}
            <div>
                <label className={getLabelCls(isDark)}>Mô tả <span className="text-red-500">*</span></label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Mô tả nội dung, mục tiêu và đối tượng của khóa học…"
                    className={`${getInputCls(isDark)} resize-none`} />
            </div>

            {/* Level + Process */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={getLabelCls(isDark)}>Cấp độ JLPT</label>
                    <select value={level} onChange={e => setLevel(e.target.value as JLPTLevel)} className={getInputCls(isDark)}>
                        {JLPT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className={getLabelCls(isDark)}>Lộ trình học</label>
                    <select value={lessonProcess} onChange={e => setLessonProcess(e.target.value as LessonProcess)} className={getInputCls(isDark)}>
                        {PROCESS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Is Paid */}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Khóa học có phí</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Bật để thiết lập giá cho khóa học.</p>
                </div>
                <button type="button" onClick={() => { setIsPaid(!isPaid); if (isPaid) setPrice(0); }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${isPaid ? "bg-indigo-600" : isDark ? "bg-gray-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPaid ? "translate-x-6" : "translate-x-0"}`} />
                </button>
            </div>

            {isPaid && (
                <div>
                    <label className={getLabelCls(isDark)}>Giá (VNĐ) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input type="number" min={0} step={1000} value={price || ""}
                            onChange={e => {
                                const val = Number(e.target.value);
                                setPrice(val < 0 ? 0 : val);
                            }}
                            placeholder="Ví dụ: 299000" className={`${getInputCls(isDark)} pr-16`} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">VNĐ</span>
                    </div>
                    {price > 0 && <p className="text-xs text-indigo-500 mt-1 font-medium">≈ {price.toLocaleString("vi-VN")} đồng</p>}
                </div>
            )}

            <div className="pt-2 flex justify-end">
                <button type="submit" disabled={loading} className={`${btnPrimary} w-full sm:w-auto justify-center`}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo…</> : <>Xác nhận tạo khóa học <CheckCircle2 className="w-5 h-5" /></>}
                </button>
            </div>
        </form>
    );
}


/* ===================================================================
   MAIN PAGE
=================================================================== */
export default function CreateCoursePage() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const { isDarkMode: isDark } = useDarkMode();

    useEffect(() => {
        setIsReady(true);
    }, []);

    if (!isReady) return null;

    return (
        <main className="p-8 w-full max-w-3xl mx-auto">
            {/* Title */}
            <div className="mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 shadow-lg shadow-indigo-200 text-white rounded-2xl">
                        <BookOpen className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Tạo khóa học mới</h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>Điền thông tin cơ bản để bắt đầu xây dựng khóa học của bạn.</p>
                    </div>
                </div>
            </div>

            {/* Card */}
            <div className={`rounded-3xl border shadow-xl p-8 md:p-10 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-indigo-50"}`}>
                <Step1Course
                    onCreated={(id) => {
                        router.push("/dasboardAdmin/courses");
                    }}
                    isDark={isDark}
                />
            </div>
        </main>
    );
}
