"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
    FileEdit,
    ChevronRight,
    ChevronDown,
    Loader2,
    Plus,
    Trash2,
    Clock,
    CheckCircle2,
    Trophy,
    Calendar,
    Users as UsersIcon,
    ArrowLeft,
    Zap,
    AlertCircle,
    BookOpen,
    Layers,
    Hash,
    Activity,
    Target,
    Volume2,
    ImageIcon,
    CheckSquare,
    XSquare,
    Edit3,
    Save,
    X,
    Type,
    ListOrdered,
    Upload,
    FileUp,
} from "lucide-react";
import { examService, ExamResponse, SectionWithQuestionsResponse } from "@/services/examService";
import { assessmentItemService, AssessmentItemResponse, UpdateAssessmentItemRequest } from "@/services/assessmentItemService";
import { batchService } from "@/services/batchService";
import { BatchJobType } from "@/enums/BatchJobType";
import { AssessmentType } from "@/enums/assessmentType";
import { s3Service, S3ImageResponse, S3FolderType } from "@/services/s3Service";
import { questionService, QuestionApiResponse } from "@/services/questionService";
import { passageService } from "@/services/passageService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";


interface ExamDetail {
    sections: SectionWithQuestionsResponse[];
    assessmentItems: Record<string, AssessmentItemResponse[]>;
}

export default function ExamManagementPage() {
    const router = useRouter();
    const { isDarkMode: isDark } = useDarkMode();

    const [exams, setExams] = useState<ExamResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'exams' | 'scoring'>('exams');
    const [allAssessmentItems, setAllAssessmentItems] = useState<AssessmentItemResponse[]>([]);
    const [filterLevel, setFilterLevel] = useState<string>('N5');
    const [scoringLoading, setScoringLoading] = useState(false);

    const [isRunningBatch, setIsRunningBatch] = useState(false);
    const [batchMessage, setBatchMessage] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingJob, setPendingJob] = useState<BatchJobType | null>(null);

    // Delete confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: "", message: "", onConfirm: () => { } });

    // Upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadType, setUploadType] = useState<"exam" | "images" | "audios">("exam");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Inline detail state
    const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [examDetails, setExamDetails] = useState<Record<string, ExamDetail>>({});
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // Assessment item edit state
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editLevel, setEditLevel] = useState("");
    const [editCount, setEditCount] = useState(0);
    const [editPoint, setEditPoint] = useState(0);
    const [editType, setEditType] = useState<AssessmentType>(AssessmentType.VOCAB_CONTEXT);
    const [isUpdatingItem, setIsUpdatingItem] = useState(false);
    const [updateMsg, setUpdateMsg] = useState<{ text: string; ok: boolean } | null>(null);

    // Question edit state
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [editQuestionText, setEditQuestionText] = useState("");
    const [editQuestionAnswer, setEditQuestionAnswer] = useState("");
    const [editQuestionOptions, setEditQuestionOptions] = useState<string[]>([]);
    const [editQuestionType, setEditQuestionType] = useState("");
    const [editQuestionOrder, setEditQuestionOrder] = useState(0);
    const [editQuestionImageUrl, setEditQuestionImageUrl] = useState("");
    const [editQuestionAudioUrl, setEditQuestionAudioUrl] = useState("");
    const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false);
    const [showAssetsLibrary, setShowAssetsLibrary] = useState(false);
    const [libraryTab, setLibraryTab] = useState<"images" | "audios" | "assessment">("images");
    const [s3Images, setS3Images] = useState<S3ImageResponse[]>([]);
    const [s3Audios, setS3Audios] = useState<S3ImageResponse[]>([]);
    const [s3Assessments, setS3Assessments] = useState<S3ImageResponse[]>([]);
    const [isLoadingS3, setIsLoadingS3] = useState(false);

    // Passage edit state
    const [editingPassageId, setEditingPassageId] = useState<string | null>(null);
    const [editPassageTitle, setEditPassageTitle] = useState("");
    const [editPassageContent, setEditPassageContent] = useState("");
    const [editPassageOrder, setEditPassageOrder] = useState(0);
    const [isUpdatingPassage, setIsUpdatingPassage] = useState(false);

    const startEditPassage = (passage: any) => {
        setEditingPassageId(passage.id);
        setEditPassageTitle(passage.title || "");
        setEditPassageContent(passage.content || "");
        setEditPassageOrder(passage.passageOrder || 0);
    };

    const handleUpdatePassage = async (examId: string) => {
        if (!editingPassageId) return;
        setIsUpdatingPassage(true);
        try {
            await passageService.update(editingPassageId, {
                title: editPassageTitle,
                content: editPassageContent,
                passageOrder: editPassageOrder,
            });
            // Refresh exam detail to get updated passage
            const [sections, questionsWithPassage] = await Promise.all([
                examService.getSections(examId),
                questionService.getByExamId(examId),
            ]);
            const passageMap = new Map<string, any>();
            questionsWithPassage.forEach(q => {
                if (q.passage) passageMap.set(q.id, q.passage);
            });
            const sectionsWithPassage = sections.map(section => ({
                ...section,
                questions: section.questions.map(q => ({
                    ...q,
                    passage: passageMap.get(q.id),
                })),
            }));
            const itemsMap: Record<string, any[]> = {};
            for (const section of sectionsWithPassage) {
                itemsMap[section.id] = await assessmentItemService.getBySection(section.id);
            }
            setExamDetails(prev => ({ ...prev, [examId]: { sections: sectionsWithPassage as any, assessmentItems: itemsMap } }));
            setEditingPassageId(null);
        } catch (err) {
            console.error("Failed to update passage:", err);
            alert("Cập nhật bài đọc thất bại!");
        } finally {
            setIsUpdatingPassage(false);
        }
    };

    const fetchExams = async () => {
        try {
            const data = await examService.getAll();
            setExams(data);
        } catch (error) {
            console.error("Failed to fetch exams:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchScoringData = async () => {
        setScoringLoading(true);
        try {
            const data = await assessmentItemService.getAll();
            console.log("📊 Assessment items from API:", data);
            console.log("📊 Total count:", data.length);
            setAllAssessmentItems(data);
        } catch (error) {
            console.error("Failed to fetch assessment items:", error);
        } finally {
            setScoringLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
        fetchScoringData();
    }, []);

    const triggerBatch = (type: BatchJobType) => {
        setPendingJob(type);
        setShowConfirm(true);
    };

    const handleConfirmBatch = async () => {
        if (!pendingJob) return;
        setShowConfirm(false);
        setIsRunningBatch(true);
        setBatchMessage(null);
        try {
            await batchService.runJob(pendingJob);
            setBatchMessage(`Batch job ${pendingJob} đã được kích hoạt thành công!`);
            setTimeout(() => setBatchMessage(null), 5000);
            if (pendingJob === BatchJobType.EXAM) fetchExams();
        } catch (error) {
            console.error("Batch job failed:", error);
            alert("Kích hoạt batch job thất bại!");
        } finally {
            setIsRunningBatch(false);
            setPendingJob(null);
        }
    };

    const handleToggleExam = async (examId: string) => {
        if (expandedExamId === examId) {
            setExpandedExamId(null);
            return;
        }
        setExpandedExamId(examId);

        if (examDetails[examId]) return; // already loaded

        setDetailLoading(true);
        try {
            const [sections, questionsWithPassage] = await Promise.all([
                examService.getSections(examId),
                questionService.getByExamId(examId),
            ]);

            // Build a map of questionId -> passage from the questionService response
            const passageMap = new Map<string, typeof questionsWithPassage[0]['passage']>();
            questionsWithPassage.forEach(q => {
                if (q.passage) passageMap.set(q.id, q.passage);
            });

            // Merge passage data into section questions
            const sectionsWithPassage = sections.map(section => ({
                ...section,
                questions: section.questions.map(q => ({
                    ...q,
                    passage: passageMap.get(q.id),
                })),
            }));

            const itemsMap: Record<string, AssessmentItemResponse[]> = {};
            for (const section of sectionsWithPassage) {
                itemsMap[section.id] = await assessmentItemService.getBySection(section.id);
            }
            setExamDetails(prev => ({ ...prev, [examId]: { sections: sectionsWithPassage as any, assessmentItems: itemsMap } }));
            // Auto-expand first section
            if (sections.length > 0) {
                setExpandedSections(prev => ({ ...prev, [sections[0].id]: true }));
            }
        } catch (err) {
            console.error("Failed to load exam detail:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const parseOptions = (optionsJson: string): string[] => {
        try { return JSON.parse(optionsJson); } catch { return []; }
    };

    const startEditItem = (item: AssessmentItemResponse) => {
        setEditingItemId(item.id);
        setEditName(item.name);
        setEditLevel(item.level);
        setEditCount(item.questionCount);
        setEditPoint(item.pointPerQuestion);
        setEditType(item.assessmentType);
        setUpdateMsg(null);
    };

    const handleUpdateItem = async (examId: string, sectionId: string) => {
        if (!editingItemId) return;
        setIsUpdatingItem(true);
        try {
            const req: UpdateAssessmentItemRequest = {
                name: editName,
                level: editLevel,
                questionCount: editCount,
                pointPerQuestion: editPoint,
                assessmentType: editType,
            };
            await assessmentItemService.update(editingItemId, req);
            // Refresh items for this section
            const updated = await assessmentItemService.getBySection(sectionId);
            setExamDetails(prev => ({
                ...prev,
                [examId]: {
                    ...prev[examId],
                    assessmentItems: { ...prev[examId].assessmentItems, [sectionId]: updated },
                },
            }));
            setEditingItemId(null);
            setUpdateMsg({ text: "Cập nhật thành công!", ok: true });
            setTimeout(() => setUpdateMsg(null), 3000);
        } catch (err) {
            console.error(err);
            setUpdateMsg({ text: "Cập nhật thất bại!", ok: false });
        } finally {
            setIsUpdatingItem(false);
        }
    };

    const handleUpdateItemGlobal = async () => {
        if (!editingItemId) return;
        setIsUpdatingItem(true);
        try {
            const req: UpdateAssessmentItemRequest = {
                name: editName,
                level: editLevel,
                questionCount: editCount,
                pointPerQuestion: editPoint,
                assessmentType: editType,
            };
            await assessmentItemService.update(editingItemId, req);
            // Refresh global list
            await fetchScoringData();

            setEditingItemId(null);
            setUpdateMsg({ text: "Cập nhật thành công!", ok: true });
            setTimeout(() => setUpdateMsg(null), 3000);
        } catch (err) {
            console.error(err);
            setUpdateMsg({ text: "Cập nhật thất bại!", ok: false });
        } finally {
            setIsUpdatingItem(false);
        }
    };

    const startEditQuestion = (q: any) => {
        setEditingQuestionId(q.id);
        setEditQuestionText(q.questionText);
        setEditQuestionAnswer(q.answer);
        setEditQuestionOptions(parseOptions(q.options));
        setEditQuestionType(q.questionType);
        setEditQuestionOrder(q.questionOrder);
        setEditQuestionImageUrl(q.imageUrl || "");
        setEditQuestionAudioUrl(q.audioUrl || "");
        setUpdateMsg(null);
    };

    const handleUpdateQuestion = async (examId: string, sectionId: string, originalQuestion: any) => {
        if (!editingQuestionId) return;
        setIsUpdatingQuestion(true);
        try {
            const req: QuestionApiResponse = {
                ...originalQuestion,
                id: editingQuestionId,
                questionText: editQuestionText,
                answer: editQuestionAnswer,
                options: JSON.stringify(editQuestionOptions),
                questionType: editQuestionType,
                questionOrder: editQuestionOrder,
                imageUrl: editQuestionImageUrl,
                audioUrl: editQuestionAudioUrl,
            };
            await questionService.updateQuestion(req);

            // Refresh exam details
            const sections = await examService.getSections(examId);
            const itemsMap: Record<string, AssessmentItemResponse[]> = {};
            for (const section of sections) {
                itemsMap[section.id] = await assessmentItemService.getBySection(section.id);
            }
            setExamDetails(prev => ({ ...prev, [examId]: { sections, assessmentItems: itemsMap } }));

            setEditingQuestionId(null);
            setUpdateMsg({ text: "Cập nhật câu hỏi thành công!", ok: true });
            setTimeout(() => setUpdateMsg(null), 3000);
        } catch (err) {
            console.error(err);
            setUpdateMsg({ text: "Cập nhật câu hỏi thất bại!", ok: false });
        } finally {
            setIsUpdatingQuestion(false);
        }
    };

    const handleDeleteQuestion = (examId: string, questionId: string) => {
        setConfirmDialog({
            open: true,
            title: "Xóa câu hỏi",
            message: "Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.",
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }));
                try {
                    await questionService.delete(questionId);

                    const [sections, questionsWithPassage] = await Promise.all([
                        examService.getSections(examId),
                        questionService.getByExamId(examId),
                    ]);

                    const passageMap = new Map<string, any>();
                    questionsWithPassage.forEach(q => {
                        if (q.passage) passageMap.set(q.id, q.passage);
                    });

                    const sectionsWithPassage = sections.map(section => ({
                        ...section,
                        questions: section.questions.map(q => ({
                            ...q,
                            passage: passageMap.get(q.id),
                        })),
                    }));

                    const itemsMap: Record<string, AssessmentItemResponse[]> = {};
                    for (const section of sectionsWithPassage) {
                        itemsMap[section.id] = await assessmentItemService.getBySection(section.id);
                    }

                    setExamDetails(prev => ({ ...prev, [examId]: { sections: sectionsWithPassage as any, assessmentItems: itemsMap } }));
                    setUpdateMsg({ text: "Xóa câu hỏi thành công!", ok: true });
                    setTimeout(() => setUpdateMsg(null), 3000);
                } catch (err) {
                    console.error(err);
                    setUpdateMsg({ text: "Xóa câu hỏi thất bại!", ok: false });
                }
            },
        });
    };

    const handleDeleteExam = (examId: string, examCode: string) => {
        setConfirmDialog({
            open: true,
            title: "Xóa đề thi",
            message: `Bạn có chắc chắn muốn xóa toàn bộ đề thi "${examCode}" và tất cả câu hỏi liên quan? Hành động này không thể hoàn tác.`,
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }));
                try {
                    await examService.delete(examId);
                    setBatchMessage("Xóa đề thi thành công!");
                    setTimeout(() => setBatchMessage(""), 3000);
                    fetchExams();
                } catch (err) {
                    console.error(err);
                    setBatchMessage("Xóa đề thi thất bại!");
                    setTimeout(() => setBatchMessage(""), 3000);
                }
            },
        });
    };

    const handleUpload = async (fileToUpload?: File, explicitType?: S3FolderType) => {
        const file = fileToUpload || uploadFile;
        const type = explicitType || uploadType;
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadResult(null);
        try {
            if (type === "exam") {
                await s3Service.uploadExam(file, setUploadProgress);
                setUploadResult({ ok: true, msg: `Import "${file.name}" thành công!` });
                await fetchExams();
            } else {
                await s3Service.upload(file, type!, setUploadProgress);
                setUploadResult({ ok: true, msg: `Tải lên "${file.name}" thành công!` });
                await fetchS3Media();
            }
            setUploadFile(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Tải lên thất bại, vui lòng thử lại.";
            setUploadResult({ ok: false, msg });
        } finally {
            setIsUploading(false);
        }
    };

    const fetchS3Media = async () => {
        setIsLoadingS3(true);
        try {
            const [images, audios, assessments] = await Promise.all([
                s3Service.getImagesUrls(),
                s3Service.getAudiosUrls(),
                s3Service.getAssessmentUrls()
            ]);
            setS3Images(images);
            setS3Audios(audios);
            setS3Assessments(assessments);
        } catch (err) {
            console.error(`Failed to fetch S3 media:`, err);
        } finally {
            setIsLoadingS3(false);
        }
    };

    const handleDeleteMedia = async (key: string, type: "images" | "audios" | "assessment") => {
        let typeVi = "file";
        if (type === "images") typeVi = "hình ảnh";
        if (type === "audios") typeVi = "âm thanh";
        if (type === "assessment") typeVi = "bản dịch/giải thích";

        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${typeVi} này khỏi S3?`)) return;
        try {
            if (type === "images") {
                await s3Service.deleteImage(key);
            } else if (type === "audios") {
                await s3Service.deleteAudio(key);
            } else {
                await s3Service.deleteAssessment(key);
            }
            alert("Xóa thành công!");
            fetchS3Media(); // Refresh list
        } catch (err) {
            console.error(`Failed to delete ${type}:`, err);
            alert("Xóa thất bại!");
        }
    };

    useEffect(() => {
        if (showAssetsLibrary) {
            fetchS3Media();
        }
    }, [showAssetsLibrary, libraryTab]);

    const getAllAssets = () => {
        return {
            images: s3Images,
            audios: s3Audios
        };
    };

    const assets = getAllAssets();

    return (
        <main className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700 relative">

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
                    <div className={`relative w-full max-w-md p-8 rounded-[32px] border shadow-2xl ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDark ? "bg-amber-500/10 text-amber-500" : "bg-amber-50 text-amber-600"}`}>
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black mb-2 italic">Xác nhận chạy Batch?</h3>
                        <p className={`text-sm mb-8 font-medium leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Bạn đang yêu cầu chạy tiến trình <span className="text-blue-500 font-bold underline">Batch {pendingJob}</span>. Quá trình này sẽ đồng bộ dữ liệu hệ thống và có thể mất vài phút.
                        </p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowConfirm(false)} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>Hủy bỏ</button>
                            <button onClick={handleConfirmBatch} className="flex-1 py-4 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!isUploading) { setShowUploadModal(false); setUploadFile(null); setUploadResult(null); } }} />
                    <div className={`relative w-full max-w-md p-8 rounded-[40px] shadow-2xl border animate-in zoom-in-95 duration-300 ${isDark ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <h3 className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                                {uploadType === "exam" ? "Import Excel" : uploadType === "images" ? "Tải lên Hình ảnh" : "Tải lên Âm thanh"}
                            </h3>
                            <button onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadResult(null); }} className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-gray-800 text-gray-500" : "hover:bg-gray-100 text-gray-400"}`}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Drop Zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) { setUploadFile(f); setUploadResult(null); } }}
                                className={`p-10 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 ${isDragging
                                    ? (isDark ? "border-violet-400 bg-violet-500/10" : "border-violet-400 bg-violet-50")
                                    : uploadFile
                                        ? (isDark ? "border-emerald-500/50 bg-emerald-500/5" : "border-emerald-300 bg-emerald-50/50")
                                        : (isDark ? "border-gray-700 hover:border-gray-500" : "border-gray-200 hover:border-violet-300")
                                    }`}
                            >
                                {uploadFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <p className={`font-black text-sm text-center line-clamp-1 max-w-[200px] ${isDark ? "text-white" : "text-gray-900"}`}>{uploadFile.name}</p>
                                        <p className={`text-xs font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                        <button onClick={() => setUploadFile(null)} className={`mt-1 text-xs font-black underline ${isDark ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}>Xóa file</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        {uploadType === "exam" ? <Upload className={`w-10 h-10 ${isDark ? "text-gray-600" : "text-gray-300"}`} /> : uploadType === "images" ? <ImageIcon className={`w-10 h-10 ${isDark ? "text-gray-600" : "text-gray-300"}`} /> : <Volume2 className={`w-10 h-10 ${isDark ? "text-gray-600" : "text-gray-300"}`} />}
                                        <p className={`font-black text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Kéo thả file vào đây</p>
                                        <p className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>hoặc</p>
                                        <label className={`px-5 py-2.5 rounded-xl font-black text-sm cursor-pointer transition-all active:scale-95 ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
                                            Chọn file
                                            <input
                                                type="file"
                                                accept={uploadType === "exam" ? ".csv,.xlsx,.xls" : uploadType === "images" ? "image/*" : "audio/*"}
                                                className="hidden"
                                                onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setUploadResult(null); } }}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Progress */}
                            {isUploading && (
                                <div className="mt-5 space-y-2">
                                    <div className="flex justify-between">
                                        <span className={`text-xs font-black ${isDark ? "text-gray-400" : "text-gray-500"}`}>Đang tải lên...</span>
                                        <span className={`text-xs font-black text-violet-500`}>{uploadProgress}%</span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Result message */}
                            {uploadResult && (
                                <div className={`mt-4 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold ${uploadResult.ok ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700") : (isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700")}`}>
                                    {uploadResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                    {uploadResult.msg}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadResult(null); }}
                                    disabled={isUploading}
                                    className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"} disabled:opacity-40`}
                                >
                                    {uploadResult?.ok ? "Đóng" : "Hủy"}
                                </button>
                                <button
                                    onClick={() => handleUpload()}
                                    disabled={!uploadFile || isUploading}
                                    className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${!uploadFile || isUploading ? "bg-gray-400 text-gray-200 cursor-not-allowed shadow-none" : (uploadType === "exam" ? "bg-gradient-to-r from-violet-600 to-blue-600 shadow-violet-500/20 hover:shadow-violet-500/30" : uploadType === "images" ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/30" : "bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-500/20 hover:shadow-amber-500/30") + " text-white"}`}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {isUploading ? "Đang tải lên..." : uploadType === "exam" ? "Import ngay" : "Tải lên ngay"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* General Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                isDark={isDark}
            />

            {/* Breadcrumbs */}
            <div className={`flex items-center gap-2 text-[13px] font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                <span className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push('/dasboardAdmin')}>Dashboard</span>
                <span className="opacity-40">/</span>
                <span className={`px-2 py-0.5 rounded-lg ${isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700 font-bold"}`}>Quản lý Đề thi</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button onClick={() => router.push('/dasboardAdmin')} className={`p-3 rounded-2xl border transition-all ${isDark ? "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"}`}>
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight flex items-center gap-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${isDark ? "from-indigo-900/40 to-blue-900/40" : "from-indigo-50 to-blue-50"}`}>
                                <FileEdit className={`w-10 h-10 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                            </div>
                            Quản lý Đề thi
                        </h1>
                        <div className={`text-sm mt-3 font-medium ${isDark ? "text-gray-400" : "text-gray-500"} flex items-center gap-2`}>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Tổng số bài thi: <span className="font-black text-blue-500">{exams.length}</span> bài thi JLPT
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className={`flex items-center p-1 rounded-2xl gap-1 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                        <button onClick={() => triggerBatch(BatchJobType.EXAM)} disabled={isRunningBatch} className={`px-4 py-2.5 font-black rounded-xl flex items-center gap-2 text-xs transition-all active:scale-95 ${isRunningBatch ? "opacity-50 cursor-not-allowed" : isDark ? "hover:bg-gray-700 text-emerald-400" : "hover:bg-white text-emerald-600 shadow-sm"}`}>
                            <Zap className="w-4 h-4" /> Exam
                        </button>
                        <button onClick={() => triggerBatch(BatchJobType.SECTION_ASSESSMENT)} disabled={isRunningBatch} className={`px-4 py-2.5 font-black rounded-xl flex items-center gap-2 text-xs transition-all active:scale-95 ${isRunningBatch ? "opacity-50 cursor-not-allowed" : isDark ? "hover:bg-gray-700 text-amber-400" : "hover:bg-white text-amber-600 shadow-sm"}`}>
                            <Zap className="w-4 h-4" /> Assessment
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAssetsLibrary(true)}
                        className={`px-6 py-3.5 font-black rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 text-sm border ${isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-500/10" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-emerald-100"}`}
                        title="Quản lý Media (Upload/Xem/Xóa)"
                    >
                        <ImageIcon className="w-5 h-5" /> Media Manager
                    </button>
                    <button
                        onClick={() => { setShowUploadModal(true); setUploadType("exam"); setUploadResult(null); setUploadFile(null); }}
                        className="px-6 py-3.5 font-black rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 text-sm bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                        <Plus className="w-5 h-5" /> Tạo Đề mới
                    </button>
                </div>
            </div>

            {/* View Toggle Tabs */}
            <div className={`flex border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
                <button
                    onClick={() => setViewMode('exams')}
                    className={`px-8 py-4 font-black text-sm transition-all border-b-2 ${viewMode === 'exams'
                        ? "border-blue-500 text-blue-500"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                >
                    Đề thi
                </button>
                <button
                    onClick={() => setViewMode('scoring')}
                    className={`px-8 py-4 font-black text-sm transition-all border-b-2 ${viewMode === 'scoring'
                        ? "border-blue-500 text-blue-500"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                >
                    Cách tính điểm
                </button>
            </div>

            {/* Level Filter (Only for Scoring View) */}
            {viewMode === 'scoring' && (
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>Lọc theo:</span>
                    <div className="relative">
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className={`appearance-none pl-4 pr-10 py-2 rounded-xl font-black text-xs transition-all outline-none border cursor-pointer ${isDark
                                ? "bg-gray-800 border-gray-700 text-white hover:border-blue-500/50"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-500/30 shadow-sm"
                                }`}
                        >
                            {['N1', 'N2', 'N3', 'N4', 'N5'].map((lvl) => (
                                <option key={lvl} value={lvl}>
                                    {lvl}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                </div>
            )}

            {batchMessage && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 ${isDark ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border border-emerald-100 text-emerald-700"}`}>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-bold">{batchMessage}</span>
                </div>
            )}

            {/* Main Content Area */}
            {viewMode === 'exams' ? (
                /* Exam List View */
                loading ? (
                    <div className="flex flex-col items-center justify-center py-32 rounded-[40px] border-2 border-dashed border-gray-700/20">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                        <p className={`font-black tracking-widest text-sm uppercase ${isDark ? "text-gray-500" : "text-gray-400"}`}>Đang tải danh sách đề thi...</p>
                    </div>
                ) : exams.length === 0 ? (
                    <div className={`p-20 text-center rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center ${isDark ? "border-gray-800 bg-gray-800/20" : "border-gray-200 bg-gray-50"}`}>
                        <AlertCircle className={`w-16 h-16 mb-4 ${isDark ? "text-gray-700" : "text-gray-200"}`} />
                        <h3 className={`text-2xl font-black mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Chưa có dữ liệu bài thi</h3>
                        <p className={`max-w-md mx-auto text-sm ${isDark ? "text-gray-500" : "text-gray-400"} font-medium`}>Nhấn "Tạo Đề mới" hoặc chạy Batch Update để đồng bộ dữ liệu.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {exams.map((exam) => {
                            const isOpen = expandedExamId === exam.id;
                            const detail = examDetails[exam.id];
                            return (
                                <div key={exam.id} className={`rounded-[28px] border overflow-hidden transition-all duration-500 ${isOpen
                                    ? (isDark ? "border-blue-500/50 shadow-xl shadow-blue-500/10" : "border-blue-200 shadow-xl shadow-blue-100")
                                    : (isDark ? "border-gray-700 hover:border-gray-500" : "border-gray-100 hover:border-blue-200")
                                    } ${isDark ? "bg-gray-800/40" : "bg-white"}`}>

                                    {/* Exam Header Row */}
                                    <div
                                        className={`flex items-center justify-between p-6 cursor-pointer transition-all duration-300 ${isOpen ? (isDark ? "bg-blue-500/5" : "bg-blue-50/60") : ""}`}
                                        onClick={() => handleToggleExam(exam.id)}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg ${isDark ? "bg-gradient-to-br from-blue-600/30 to-indigo-600/30 text-blue-300" : "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700"}`}>
                                                <span className="text-[9px] uppercase tracking-widest opacity-60">JLPT</span>
                                                <span className="text-xl">{exam.level}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className={`text-xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                                                        Đề <span className={isOpen ? "text-blue-500" : ""}>{exam.code}</span>
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>{exam.level}</span>
                                                </div>
                                                <div className={`flex items-center gap-4 text-xs font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {exam.duration} phút</span>
                                                    <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {exam.numQuestions} câu hỏi</span>
                                                    <span className="flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" /> {exam.participant} lượt thi</span>
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(exam.updatedAt || exam.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteExam(exam.id, exam.code);
                                                }}
                                                className={`p-2.5 rounded-xl border transition-all duration-300 ${isDark ? "border-gray-700 hover:bg-red-500/10 hover:text-red-400 text-gray-500" : "border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-400"}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className={`p-2.5 rounded-xl border transition-all duration-300 ${isOpen ? (isDark ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600") : (isDark ? "border-gray-700 text-gray-500" : "border-gray-200 text-gray-400")}`}>
                                                <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {isOpen && (
                                        <div className={`border-t ${isDark ? "border-gray-700/60" : "border-gray-100"} p-6 space-y-6`}>
                                            {detailLoading && !detail ? (
                                                <div className="flex items-center justify-center py-12 gap-3">
                                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                                    <span className={`font-bold text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Đang tải chi tiết đề thi...</span>
                                                </div>
                                            ) : detail ? (
                                                <div className="space-y-4">
                                                    {detail.sections.map((section, sIdx) => {
                                                        const isSectionOpen = !!expandedSections[section.id];
                                                        const items = detail.assessmentItems[section.id] || [];
                                                        return (
                                                            <div key={section.id} className={`rounded-[20px] border overflow-hidden ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                                                                {/* Section Header */}
                                                                <div
                                                                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isSectionOpen ? (isDark ? "bg-indigo-500/10" : "bg-indigo-50/80") : (isDark ? "bg-gray-800/60 hover:bg-gray-800" : "bg-gray-50 hover:bg-gray-100/80")}`}
                                                                    onClick={() => toggleSection(section.id)}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow ${isDark ? "bg-indigo-600/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                                                                            {section.sectionOrder}
                                                                        </div>
                                                                        <div>
                                                                            <p className={`font-black text-base ${isDark ? "text-white" : "text-gray-900"}`}>{section.title}</p>
                                                                            <p className={`text-[11px] font-bold flex items-center gap-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{section.sectionDuration} phút</span>
                                                                                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{section.questions?.length || 0} câu hỏi</span>
                                                                                <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{items.length} nhóm đánh giá</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isSectionOpen ? "rotate-180 text-indigo-500" : (isDark ? "text-gray-500" : "text-gray-400")}`} />
                                                                </div>

                                                                {/* Section Content */}
                                                                {isSectionOpen && (
                                                                    <div className={`p-5 space-y-6 ${isDark ? "bg-gray-900/30" : "bg-white"}`}>



                                                                        {/* Questions */}
                                                                        {section.questions && section.questions.length > 0 ? (
                                                                            <div>
                                                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                                                                    <BookOpen className="w-3.5 h-3.5" /> Danh sách câu hỏi ({section.questions.length} câu)
                                                                                </p>
                                                                                <div className="space-y-3">
                                                                                    {(() => {
                                                                                        const sortedQuestions = [...section.questions].sort((a, b) => a.questionOrder - b.questionOrder);
                                                                                        // Group questions by passage
                                                                                        const subGroups: { passage?: any; questions: typeof sortedQuestions }[] = [];
                                                                                        let lastPassageId: string | undefined = undefined;

                                                                                        sortedQuestions.forEach((q: any) => {
                                                                                            const currentPassageId = q.passage?.id;
                                                                                            if (subGroups.length === 0 || currentPassageId !== lastPassageId) {
                                                                                                subGroups.push({ passage: q.passage, questions: [q] });
                                                                                                lastPassageId = currentPassageId;
                                                                                            } else {
                                                                                                subGroups[subGroups.length - 1].questions.push(q);
                                                                                            }
                                                                                        });

                                                                                        return subGroups.map((sub, sIndex) => (
                                                                                            <div key={sub.passage?.id ? `passage-${sub.passage.id}-${sIndex}` : `no-passage-${sIndex}`}>
                                                                                                {/* Passage Card */}
                                                                                                {sub.passage && (
                                                                                                    <div className={`rounded-2xl border overflow-hidden mb-3 group/passage ${isDark ? "border-blue-500/30 bg-blue-500/5" : "border-blue-200 bg-blue-50/30"}`}>
                                                                                                        <div className={`px-5 py-4 ${isDark ? "bg-blue-500/10" : "bg-blue-50/60"}`}>
                                                                                                            {editingPassageId === sub.passage.id ? (
                                                                                                                /* ── PASSAGE EDIT MODE ── */
                                                                                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                                                                    <div className="flex items-center gap-3 mb-2">
                                                                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                                                                                                                            <BookOpen className="w-4 h-4" />
                                                                                                                        </div>
                                                                                                                        <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                                                                                                            Chỉnh sửa bài đọc
                                                                                                                        </span>
                                                                                                                    </div>
                                                                                                                    <div className="space-y-1">
                                                                                                                        <label className="text-[10px] font-black uppercase text-gray-500">Tiêu đề</label>
                                                                                                                        <input
                                                                                                                            type="text"
                                                                                                                            value={editPassageTitle}
                                                                                                                            onChange={e => setEditPassageTitle(e.target.value)}
                                                                                                                            className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-sm outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white" : "border-gray-200 focus:border-blue-400 text-gray-900"}`}
                                                                                                                            placeholder="Tiêu đề bài đọc..."
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                    <div className="space-y-1">
                                                                                                                        <label className="text-[10px] font-black uppercase text-gray-500">Nội dung</label>
                                                                                                                        <textarea
                                                                                                                            value={editPassageContent}
                                                                                                                            onChange={e => setEditPassageContent(e.target.value)}
                                                                                                                            rows={8}
                                                                                                                            className={`w-full px-3 py-2 rounded-xl border bg-transparent text-sm outline-none leading-relaxed ${isDark ? "border-gray-700 focus:border-blue-500 text-white" : "border-gray-200 focus:border-blue-400 text-gray-900"}`}
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                    <div className="flex items-center justify-end gap-2 pt-2">
                                                                                                                        <button onClick={() => setEditingPassageId(null)} className="px-4 py-2 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-gray-500 font-black text-xs transition-all">Hủy</button>
                                                                                                                        <button
                                                                                                                            onClick={() => handleUpdatePassage(exam.id)}
                                                                                                                            disabled={isUpdatingPassage}
                                                                                                                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                                                                                                        >
                                                                                                                            {isUpdatingPassage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                                                                                            Lưu bài đọc
                                                                                                                        </button>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            ) : (
                                                                                                                /* ── PASSAGE VIEW MODE ── */
                                                                                                                <>
                                                                                                                    <div className="flex items-center gap-3 mb-2">
                                                                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                                                                                                                            <BookOpen className="w-4 h-4" />
                                                                                                                        </div>
                                                                                                                        <div className="flex items-center gap-2 flex-1">
                                                                                                                            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                                                                                                                Bài đọc
                                                                                                                            </span>
                                                                                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                                                                                                                                {sub.questions.length} câu hỏi
                                                                                                                            </span>
                                                                                                                        </div>
                                                                                                                        <button onClick={() => startEditPassage(sub.passage)} className="p-1.5 rounded-lg opacity-0 group-hover/passage:opacity-100 transition-all hover:bg-blue-500/10 text-blue-500">
                                                                                                                            <Edit3 className="w-3.5 h-3.5" />
                                                                                                                        </button>
                                                                                                                    </div>
                                                                                                                    {sub.passage.title && (
                                                                                                                        <h4 className={`text-sm font-black mb-2 ${isDark ? "text-blue-300" : "text-blue-800"}`}>
                                                                                                                            {sub.passage.title}
                                                                                                                        </h4>
                                                                                                                    )}
                                                                                                                    <div className={`text-sm leading-relaxed whitespace-pre-wrap rounded-xl p-4 ${isDark ? "bg-gray-900/60 text-gray-300 border border-gray-700/50" : "bg-white text-gray-700 border border-blue-100 shadow-sm"}`}>
                                                                                                                        {sub.passage.content}
                                                                                                                    </div>
                                                                                                                </>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Questions in this subGroup */}
                                                                                                {sub.questions.map((q: any) => {
                                                                                                    const options = parseOptions(q.options);
                                                                                                    return (
                                                                                                        <div key={q.id} className={`rounded-2xl border p-4 group mb-3 ${isDark ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
                                                                                                            {editingQuestionId === q.id ? (
                                                                                                                /* ── EDIT MODE ── */
                                                                                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                                                        <div className="space-y-4">
                                                                                                                            <div className="space-y-1">
                                                                                                                                <label className="text-[10px] font-black uppercase text-gray-500">Nội dung câu hỏi</label>
                                                                                                                                <textarea
                                                                                                                                    value={editQuestionText}
                                                                                                                                    onChange={e => setEditQuestionText(e.target.value)}
                                                                                                                                    rows={3}
                                                                                                                                    className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-sm outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white" : "border-gray-200 focus:border-blue-400 text-gray-900"}`}
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                                                                <div className="space-y-1">
                                                                                                                                    <label className="text-[10px] font-black uppercase text-gray-500">Image URL</label>
                                                                                                                                    <input type="text" value={editQuestionImageUrl} onChange={e => setEditQuestionImageUrl(e.target.value)} className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-xs outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white" : "border-gray-200 focus:border-blue-400 text-gray-900"}`} placeholder="https://..." />
                                                                                                                                </div>
                                                                                                                                <div className="space-y-1">
                                                                                                                                    <label className="text-[10px] font-black uppercase text-gray-500">Audio URL</label>
                                                                                                                                    <input type="text" value={editQuestionAudioUrl} onChange={e => setEditQuestionAudioUrl(e.target.value)} className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-xs outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white" : "border-gray-200 focus:border-blue-400 text-gray-900"}`} placeholder="https://..." />
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                        <div className="space-y-4">
                                                                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                                                                <div className="space-y-1">
                                                                                                                                    <label className="text-[10px] font-black uppercase text-gray-500">Loại</label>
                                                                                                                                    <select
                                                                                                                                        value={editQuestionType}
                                                                                                                                        onChange={e => setEditQuestionType(e.target.value)}
                                                                                                                                        className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-sm outline-none cursor-pointer ${isDark ? "border-gray-700 focus:border-blue-500 text-white bg-gray-900" : "border-gray-200 focus:border-blue-400 text-gray-900 bg-white"}`}
                                                                                                                                    >
                                                                                                                                        {Object.values(AssessmentType).map((type) => (
                                                                                                                                            <option key={type} value={type} className={isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"}>
                                                                                                                                                {type}
                                                                                                                                            </option>
                                                                                                                                        ))}
                                                                                                                                    </select>
                                                                                                                                </div>
                                                                                                                                <div className="space-y-1">
                                                                                                                                    <label className="text-[10px] font-black uppercase text-gray-500">Thứ tự</label>
                                                                                                                                    <input type="number" value={editQuestionOrder} onChange={e => setEditQuestionOrder(parseInt(e.target.value))} className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-sm outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white text-center" : "border-gray-200 focus:border-blue-400 text-gray-900 text-center"}`} />
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                            <div className="space-y-1">
                                                                                                                                <label className="text-[10px] font-black uppercase text-gray-500">Đáp án chính xác</label>
                                                                                                                                <input type="text" value={editQuestionAnswer} onChange={e => setEditQuestionAnswer(e.target.value)} className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-sm outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white" : "border-gray-200 focus:border-blue-400 text-gray-900"}`} />
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    <div className="space-y-2">
                                                                                                                        <label className="text-[10px] font-black uppercase text-gray-500">Các lựa chọn</label>
                                                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                                                                            {editQuestionOptions.map((opt, oi) => (
                                                                                                                                <div key={oi} className="flex items-center gap-2">
                                                                                                                                    <span className="text-xs font-black text-gray-400 w-4">{oi + 1}.</span>
                                                                                                                                    <input
                                                                                                                                        type="text"
                                                                                                                                        value={opt}
                                                                                                                                        onChange={e => {
                                                                                                                                            const newOpts = [...editQuestionOptions];
                                                                                                                                            newOpts[oi] = e.target.value;
                                                                                                                                            setEditQuestionOptions(newOpts);
                                                                                                                                        }}
                                                                                                                                        className={`flex-1 px-3 py-1.5 rounded-lg border bg-transparent font-medium text-xs outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white" : "border-gray-200 focus:border-blue-400 text-gray-900"}`}
                                                                                                                                    />
                                                                                                                                </div>
                                                                                                                            ))}
                                                                                                                            {editQuestionOptions.length < 4 && (
                                                                                                                                <button onClick={() => setEditQuestionOptions([...editQuestionOptions, ""])} className={`px-3 py-1.5 rounded-lg border border-dashed text-[10px] font-black flex items-center justify-center gap-2 ${isDark ? "border-gray-700 text-gray-500 hover:bg-gray-800" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}>
                                                                                                                                    <Plus className="w-3 h-3" /> Thêm lựa chọn
                                                                                                                                </button>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100/10">
                                                                                                                        <button onClick={() => setEditingQuestionId(null)} className="px-4 py-2 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-gray-500 font-black text-xs transition-all">Hủy</button>
                                                                                                                        <button
                                                                                                                            onClick={() => handleUpdateQuestion(exam.id, section.id, q)}
                                                                                                                            disabled={isUpdatingQuestion}
                                                                                                                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                                                                                                        >
                                                                                                                            {isUpdatingQuestion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                                                                                            Lưu câu hỏi
                                                                                                                        </button>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            ) : (
                                                                                                                /* ── VIEW MODE ── */
                                                                                                                <>
                                                                                                                    {/* Question Header */}
                                                                                                                    <div className="flex items-start gap-3 mb-3">
                                                                                                                        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-600"}`}>
                                                                                                                            {sortedQuestions.indexOf(q) + 1}
                                                                                                                        </div>
                                                                                                                        <div className="flex-1 min-w-0">
                                                                                                                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                                                                                                                                <div className="flex items-center gap-2">
                                                                                                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>{q.questionType}</span>
                                                                                                                                    {q.audioUrl && <span className={`px-2 py-0.5 rounded-md text-[9px] font-black flex items-center gap-1 ${isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-600"}`}><Volume2 className="w-3 h-3" />Audio</span>}
                                                                                                                                    {q.imageUrl && <span className={`px-2 py-0.5 rounded-md text-[9px] font-black flex items-center gap-1 ${isDark ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600"}`}><ImageIcon className="w-3 h-3" />Image</span>}
                                                                                                                                </div>
                                                                                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                                                                                    <button onClick={() => startEditQuestion(q)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500">
                                                                                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                                                                                    </button>
                                                                                                                                    <button
                                                                                                                                        onClick={() => handleDeleteQuestion(exam.id, q.id)}
                                                                                                                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                                                                                                                                    >
                                                                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                                                                    </button>
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                            <p className={`text-sm font-medium leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>{q.questionText}</p>
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    {/* Assets View (Images/Audio) */}
                                                                                                                    {(q.imageUrl || q.audioUrl) && (
                                                                                                                        <div className="ml-11 mb-4 flex flex-col gap-3">
                                                                                                                            {q.imageUrl && (
                                                                                                                                <div className="relative group/img w-fit">
                                                                                                                                    <img
                                                                                                                                        src={q.imageUrl}
                                                                                                                                        alt="Question"
                                                                                                                                        className="max-w-[240px] h-auto rounded-xl border border-gray-100/10 shadow-sm transition-all group-hover/img:scale-[1.02]"
                                                                                                                                        referrerPolicy="no-referrer"
                                                                                                                                    />
                                                                                                                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-all rounded-xl" />
                                                                                                                                </div>
                                                                                                                            )}
                                                                                                                            {q.audioUrl && (
                                                                                                                                <div className={`p-2 rounded-xl border w-fit ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                                                                                                                                    <audio controls className="h-8 w-48">
                                                                                                                                        <source src={q.audioUrl} type="audio/mpeg" />
                                                                                                                                    </audio>
                                                                                                                                </div>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    )}

                                                                                                                    {/* Options */}
                                                                                                                    {options.length > 0 && (
                                                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 ml-11">
                                                                                                                            {options.map((opt, oi) => {
                                                                                                                                const isCorrect = q.answer === opt;
                                                                                                                                return (
                                                                                                                                    <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isCorrect
                                                                                                                                        ? (isDark ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border border-emerald-200 text-emerald-700")
                                                                                                                                        : (isDark ? "bg-gray-800/60 border border-gray-700/50 text-gray-400" : "bg-gray-50 border border-gray-100 text-gray-500")
                                                                                                                                        }`}>
                                                                                                                                        {isCorrect
                                                                                                                                            ? <CheckSquare className="w-4 h-4 shrink-0 text-emerald-500" />
                                                                                                                                            : <XSquare className={`w-4 h-4 shrink-0 opacity-30 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                                                                                                                                        }
                                                                                                                                        <span className="font-bold text-xs mr-1">{oi + 1}.</span>
                                                                                                                                        {opt}
                                                                                                                                    </div>
                                                                                                                                );
                                                                                                                            })}
                                                                                                                        </div>
                                                                                                                    )}

                                                                                                                    {/* Answer Key (text answer if no options) */}
                                                                                                                    {options.length === 0 && q.answer && (
                                                                                                                        <div className={`ml-11 mt-2 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                                                                                                                            <CheckSquare className="w-4 h-4" /> Đáp án: {q.answer}
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        ));
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDark ? "border-gray-800 text-gray-600" : "border-gray-100 text-gray-300"}`}>
                                                                                <BookOpen className="w-7 h-7 mb-2 opacity-30" />
                                                                                <p className="text-sm font-black italic opacity-40">Phần này chưa có câu hỏi</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* Assessment (Scoring) View */
                scoringLoading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                        <p className={`font-black tracking-widest text-sm uppercase ${isDark ? "text-gray-500" : "text-gray-400"}`}>Đang tải cấu trúc chấm điểm...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {(() => {
                            const filtered = allAssessmentItems.filter(i => filterLevel === 'All' || i.level === filterLevel);
                            const groups = [
                                {
                                    title: "Phần Chữ Hán - Từ vựng - Ngữ Pháp",
                                    icon: <Type className="w-5 h-5" />,
                                    color: "from-orange-500 to-red-500",
                                    items: filtered.filter(i => [
                                        AssessmentType.KANJI_READING, AssessmentType.KANJI_MEMORY, AssessmentType.VOCAB_CONTEXT,
                                        AssessmentType.FILL_BLANK, AssessmentType.SENTENCE_ORDER, AssessmentType.PARAPHRASE,
                                        AssessmentType.GRAMMAR_SELECT, AssessmentType.TEXT_COMPLETION
                                    ].includes(i.assessmentType as AssessmentType))
                                },
                                {
                                    title: "Phần Đọc hiểu",
                                    icon: <BookOpen className="w-5 h-5" />,
                                    color: "from-blue-500 to-indigo-500",
                                    items: filtered.filter(i => i.assessmentType.toString().startsWith('READING'))
                                },
                                {
                                    title: "Phần Nghe hiểu",
                                    icon: <Volume2 className="w-5 h-5" />,
                                    color: "from-purple-500 to-pink-500",
                                    items: filtered.filter(i => i.assessmentType.toString().startsWith('LISTENING'))
                                }
                            ];

                            return groups.map((g, idx) => (
                                <div key={idx} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${g.color} text-white shadow-lg`}>
                                            {g.icon}
                                        </div>
                                        <h2 className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>{g.title}</h2>
                                    </div>

                                    <div className={`rounded-[32px] border overflow-hidden ${isDark ? "border-gray-800 bg-gray-900/40" : "border-gray-100 bg-white shadow-xl shadow-gray-100"}`}>
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className={`${isDark ? "bg-gray-800/50" : "bg-gray-50/50"}`}>
                                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-500">Mondai</th>
                                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-500">Nội dung</th>
                                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-500 text-center">Số câu</th>
                                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-500 text-center">Điểm / Câu</th>
                                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-500 text-right">Tổng điểm</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-100"}`}>
                                                {g.items.length > 0 ? g.items.map((item, iIdx) => {
                                                    const isEditing = editingItemId === item.id;
                                                    return (
                                                        <tr key={item.id} className={`group transition-colors ${isEditing ? (isDark ? "bg-blue-500/5 shadow-inner" : "bg-blue-50/50") : (isDark ? "hover:bg-white/5" : "hover:bg-blue-50/30")}`}>
                                                            {isEditing ? (
                                                                /* ── EDIT MODE ROW ── */
                                                                <td colSpan={5} className="px-6 py-4">
                                                                    <div className="flex flex-wrap items-end gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                        <div className="flex-1 min-w-[200px] space-y-1">
                                                                            <label className="text-[10px] font-black uppercase text-gray-500">Tên nội dung</label>
                                                                            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-sm outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white" : "border-gray-200 focus:border-blue-400 text-gray-900"}`} />
                                                                        </div>
                                                                        <div className="w-24 space-y-1">
                                                                            <label className="text-[10px] font-black uppercase text-gray-500">Số câu</label>
                                                                            <input type="number" value={editCount} onChange={e => setEditCount(parseInt(e.target.value))} className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-sm outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white text-center" : "border-gray-200 focus:border-blue-400 text-gray-900 text-center"}`} />
                                                                        </div>
                                                                        <div className="w-24 space-y-1">
                                                                            <label className="text-[10px] font-black uppercase text-gray-500">Điểm/Câu</label>
                                                                            <input type="number" step="0.1" value={editPoint} onChange={e => setEditPoint(parseFloat(e.target.value))} className={`w-full px-3 py-2 rounded-xl border bg-transparent font-bold text-sm outline-none ${isDark ? "border-gray-700 focus:border-blue-500 text-white text-center" : "border-gray-200 focus:border-blue-400 text-gray-900 text-center"}`} />
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button onClick={handleUpdateItemGlobal} disabled={isUpdatingItem} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                                                                {isUpdatingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                                                Lưu
                                                                            </button>
                                                                            <button onClick={() => setEditingItemId(null)} className="px-4 py-2 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-gray-500 font-black text-xs transition-all">Hủy</button>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            ) : (
                                                                /* ── VIEW MODE ROW ── */
                                                                <>
                                                                    <td className="px-6 py-5 font-black text-sm text-blue-500">{iIdx + 1}</td>
                                                                    <td className="px-6 py-5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex flex-col">
                                                                                <span className={`font-black text-sm ${isDark ? "text-gray-200" : "text-gray-800"}`}>{item.name}</span>
                                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{item.assessmentType}</span>
                                                                            </div>
                                                                            <button onClick={() => startEditItem(item)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500/10 text-blue-500">
                                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className={`px-6 py-5 text-sm font-black text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>{item.questionCount}</td>
                                                                    <td className="px-6 py-5 text-center">
                                                                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                                                                            {item.pointPerQuestion} đ
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-5 text-right">
                                                                        <span className={`text-base font-black ${isDark ? "text-white" : "text-gray-900"}`}>{item.totalPoint}</span>
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    );
                                                }) : (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-10 text-center italic text-gray-500 font-medium">
                                                            Chưa có dữ liệu cho phần này ở level {filterLevel}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {g.items.length > 0 && (
                                                <tfoot>
                                                    <tr className={`${isDark ? "bg-gray-800/20" : "bg-gray-50/30"} font-black`}>
                                                        <td colSpan={2} className="px-6 py-5 text-right text-gray-500 uppercase text-[10px] tracking-widest">Tổng cộng phần này:</td>
                                                        <td className="px-6 py-5 text-center text-blue-500">{g.items.reduce((acc, current) => acc + current.questionCount, 0)} câu</td>
                                                        <td></td>
                                                        <td className="px-6 py-5 text-right text-emerald-500 text-lg">{g.items.reduce((acc, current) => acc + current.totalPoint, 0)} điểm</td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )
            )}
            {/* Assets Library Modal */}
            {showAssetsLibrary && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAssetsLibrary(false)} />
                    <div className={`relative w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col rounded-[40px] shadow-2xl border animate-in zoom-in-95 duration-300 ${isDark ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                        {/* Header */}
                        <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-100/10">
                            <div>
                                <h3 className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Thư viện Tài nguyên</h3>
                                <p className={`text-xs font-bold mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Tất cả hình ảnh và âm thanh trong dữ liệu hiện tại</p>
                            </div>
                            <button onClick={() => setShowAssetsLibrary(false)} className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-gray-800 text-gray-500" : "hover:bg-gray-100 text-gray-400"}`}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Custom Scrollbar Styles */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 8px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: ${isDark ? "#374151" : "#E5E7EB"};
                                border-radius: 20px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: ${isDark ? "#4B5563" : "#D1D5DB"};
                            }
                        `}} />

                        {/* Tabs */}
                        <div className="px-8 pt-4 flex gap-4">
                            <button
                                onClick={() => setLibraryTab("images")}
                                className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${libraryTab === "images"
                                    ? (isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-100")
                                    : (isDark ? "text-gray-500 hover:bg-gray-800" : "text-gray-400 hover:bg-gray-50")
                                    }`}
                            >
                                <ImageIcon className="w-4 h-4" /> Hình ảnh ({assets.images.length})
                            </button>
                            <button
                                onClick={() => setLibraryTab("audios")}
                                className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${libraryTab === "audios"
                                    ? (isDark ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-purple-50 text-purple-700 border border-purple-100")
                                    : (isDark ? "text-gray-500 hover:bg-gray-800" : "text-gray-400 hover:bg-gray-50")
                                    }`}
                            >
                                <Volume2 className="w-4 h-4" /> Âm thanh ({assets.audios.length})
                            </button>
                            <button
                                onClick={() => setLibraryTab("assessment")}
                                className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${libraryTab === "assessment"
                                    ? (isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-700 border border-amber-100")
                                    : (isDark ? "text-gray-500 hover:bg-gray-800" : "text-gray-400 hover:bg-gray-50")
                                    }`}
                            >
                                <Zap className="w-4 h-4" /> Bản dịch/Giải thích ({s3Assessments.length})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                            {/* Unified Upload Section */}
                            <div className={`mb-10 p-6 rounded-[32px] border-2 border-dashed transition-all ${isDark ? "bg-gray-800/20 border-gray-700 hover:border-emerald-500/50" : "bg-gray-50 border-gray-200 hover:border-emerald-500/50 shadow-inner"}`}>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="text-lg font-black tracking-tight text-white/90">Tải lên {libraryTab === "images" ? "Hình ảnh" : libraryTab === "audios" ? "Âm thanh" : "Bản dịch/Giải thích"} mới</h4>
                                        <p className="text-xs font-bold opacity-60 mt-1">Chọn file hoặc kéo thả vào đây để tải lên hệ thống</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            id="library-upload"
                                            className="hidden"
                                            accept={libraryTab === "images" ? "image/*" : libraryTab === "audios" ? "audio/*" : ".zip,.rar,.pdf,.doc,.docx,.xls,.xlsx,.csv"}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleUpload(file, libraryTab as any);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => document.getElementById('library-upload')?.click()}
                                            disabled={isUploading}
                                            className={`px-8 py-3.5 font-black rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 text-sm ${isDark ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/40" : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"}`}
                                        >
                                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                            {isUploading ? "Đang tải lên..." : "Chọn File"}
                                        </button>
                                    </div>
                                </div>
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="mt-6">
                                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`w-full h-px mb-10 ${isDark ? "bg-gray-800" : "bg-gray-100"}`} />

                            {isLoadingS3 && (
                                <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                                    <p className="text-sm font-black text-gray-500 animate-pulse">Đang làm mới danh sách...</p>
                                </div>
                            )}

                            {libraryTab === "images" ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
                                    {assets.images.length > 0 ? (
                                        assets.images.map((img: { url: string; key?: string }, iIdx: number) => (
                                            <div key={iIdx} className={`group relative aspect-square rounded-3xl border overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ${isDark ? "bg-gray-800 border-gray-700 shadow-xl" : "bg-white border-gray-100 shadow-md"}`}>
                                                <img src={img.url} alt="Library Item" className="w-full h-full object-cover transition-all" referrerPolicy="no-referrer" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(img.url); alert("Đã copy URL!"); }}
                                                        className="px-4 py-2 rounded-xl bg-white text-gray-900 font-black text-xs shadow-xl active:scale-95 transition-all w-full"
                                                    >
                                                        Copy URL
                                                    </button>
                                                    {img.key && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMedia(img.key!, "images"); }}
                                                            className="px-4 py-2 rounded-xl bg-red-500 text-white font-black text-xs shadow-xl active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center opacity-40">Chưa có hình ảnh nào</div>
                                    )}
                                </div>
                            ) : libraryTab === "audios" ? (
                                <div className="space-y-3 pb-20">
                                    {assets.audios.length > 0 ? (
                                        assets.audios.map((aud: { url: string; key?: string }, iIdx: number) => (
                                            <div key={iIdx} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-700"}`}>
                                                        <Volume2 className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-xs font-bold truncate opacity-60 text-blue-500 underline uppercase">{aud.url.split('/').pop()}</p>
                                                </div>
                                                <audio controls className="h-8 w-48 shrink-0">
                                                    <source src={aud.url} type="audio/mpeg" />
                                                </audio>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(aud.url); alert("Đã copy URL!"); }}
                                                        className={`p-2 rounded-xl transition-all ${isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                                                        title="Copy URL"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    {aud.key && (
                                                        <button
                                                            onClick={() => handleDeleteMedia(aud.key!, "audios")}
                                                            className={`p-2.5 rounded-xl transition-all ${isDark ? "bg-red-500/10 hover:bg-red-500/20 text-red-500" : "bg-red-50 hover:bg-red-100 text-red-600"}`}
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center opacity-40">Chưa có âm thanh nào</div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 pb-20">
                                    {s3Assessments.length > 0 ? (
                                        s3Assessments.map((ass, iIdx) => (
                                            <div key={iIdx} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
                                                        <Zap className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-xs font-bold truncate opacity-60 text-blue-500 underline uppercase">{ass.key.split('/').pop()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={ass.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={`p-2.5 rounded-[12px] font-black text-[10px] uppercase tracking-wider transition-all ${isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"} shadow-lg`}
                                                    >
                                                        Xem file
                                                    </a>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(ass.url); alert("Đã copy URL!"); }}
                                                        className={`p-2.5 rounded-xl transition-all ${isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                                                        title="Copy URL"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMedia(ass.key, "assessment")}
                                                        className={`p-2.5 rounded-xl transition-all ${isDark ? "bg-red-500/10 hover:bg-red-500/20 text-red-500" : "bg-red-50 hover:bg-red-100 text-red-600"}`}
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center opacity-40">Chưa có bản dịch/giải thích nào</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 pt-0 flex justify-between items-center bg-gradient-to-t from-white/90 dark:from-gray-900/90 to-transparent backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-xs font-bold opacity-40 animate-pulse">
                                <ChevronDown className="w-4 h-4" /> Cuộn để xem thêm
                            </div>
                            <button
                                onClick={() => setShowAssetsLibrary(false)}
                                className={`px-10 py-3.5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all ${isDark ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-900 hover:bg-black text-white"}`}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
