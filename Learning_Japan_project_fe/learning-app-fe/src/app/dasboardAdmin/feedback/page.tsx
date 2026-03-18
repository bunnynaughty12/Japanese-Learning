"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
    MessageSquare,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    MoreHorizontal,
    Bug,
    Lightbulb,
    Palette,
    BookOpen,
    Send,
    Calendar,
    ChevronDown,
    ChevronUp,
    AlertCircle,
} from "lucide-react";
import {
    feedbackService,
    FeedbackResponse,
    AdminUpdateFeedbackRequest,
} from "@/services/feedbackService";
import { FeedbackType } from "@/enums/FeedbackType";
import { FeedbackStatus } from "@/enums/FeedbackStatus";

const STATUS_CONFIG: Record<
    FeedbackStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
    PENDING: {
        label: "Chờ xử lý",
        icon: <Clock className="w-3.5 h-3.5" />,
        bg: "bg-amber-100 dark:bg-amber-900/40",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800/50",
    },
    REVIEWING: {
        label: "Đang xem xét",
        icon: <Search className="w-3.5 h-3.5" />,
        bg: "bg-blue-100 dark:bg-blue-900/40",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800/50",
    },
    RESOLVED: {
        label: "Đã giải quyết",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        bg: "bg-emerald-100 dark:bg-emerald-900/40",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-800/50",
    },
    REJECTED: {
        label: "Từ chối",
        icon: <XCircle className="w-3.5 h-3.5" />,
        bg: "bg-red-100 dark:bg-red-900/40",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800/50",
    },
};

const FEEDBACK_TYPES: Record<
    FeedbackType,
    { label: string; icon: React.ReactNode; color: string; gradient: string }
> = {
    BUG: {
        label: "Báo lỗi",
        icon: <Bug className="w-4 h-4" />,
        color: "text-red-500",
        gradient: "from-red-400 to-rose-500",
    },
    FEATURE_REQUEST: {
        label: "Yêu cầu tính năng",
        icon: <Lightbulb className="w-4 h-4" />,
        color: "text-amber-500",
        gradient: "from-amber-400 to-yellow-500",
    },
    UX_IMPROVEMENT: {
        label: "Cải thiện trải nghiệm",
        icon: <Palette className="w-4 h-4" />,
        color: "text-purple-500",
        gradient: "from-purple-400 to-violet-500",
    },
    CONTENT_REQUEST: {
        label: "Yêu cầu nội dung",
        icon: <BookOpen className="w-4 h-4" />,
        color: "text-cyan-500",
        gradient: "from-cyan-400 to-blue-500",
    },
    OTHER: {
        label: "Khác",
        icon: <MoreHorizontal className="w-4 h-4" />,
        color: "text-slate-500",
        gradient: "from-slate-400 to-gray-500",
    },
};

export default function AdminFeedbackPage() {
    const router = useRouter();
    const { isDarkMode: isDark } = useDarkMode();
    const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "ALL">("ALL");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [replies, setReplies] = useState<Record<string, string>>({});
    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchFeedbacks();
    }, [filterStatus]);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const statusParam = filterStatus === "ALL" ? undefined : filterStatus;
            const data = await feedbackService.getAllFeedbacks(statusParam);
            setFeedbacks(data || []);
        } catch (error) {
            console.error("Failed to load feedbacks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFeedback = async (id: string, status: FeedbackStatus) => {
        const adminReply = replies[id]?.trim();
        if (submittingIds.has(id)) return;

        try {
            setSubmittingIds((prev) => new Set(prev).add(id));
            const request: AdminUpdateFeedbackRequest = {
                status,
                adminReply: adminReply || undefined,
            };
            await feedbackService.updateFeedback(id, request);
            await fetchFeedbacks();
            setExpandedId(null);
            // Clear reply after success
            const newReplies = { ...replies };
            delete newReplies[id];
            setReplies(newReplies);
        } catch (error) {
            console.error("Failed to update feedback:", error);
            alert("Cập nhật phản hồi thất bại!");
        } finally {
            setSubmittingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    const filteredFeedbacks = feedbacks.filter((fb) =>
        fb.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>

                    <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <MessageSquare className={`w-8 h-8 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                        Quản lý Phản hồi
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Xem và xử lý các ý kiến đóng góp từ người dùng.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className={`p-4 rounded-3xl border flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm ${isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-100"}`}>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        <input
                            type="text"
                            placeholder="Tìm theo nội dung phản hồi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition ${isDark ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                        <Filter className={`w-4 h-4 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        {(["ALL", "PENDING", "REVIEWING", "RESOLVED", "REJECTED"] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterStatus === status
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                    : isDark
                                        ? "bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-transparent hover:border-gray-600"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                                    }`}
                            >
                                {status === "ALL" ? "Tất cả" : STATUS_CONFIG[status as FeedbackStatus].label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`text-sm font-medium shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Tìm thấy <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{filteredFeedbacks.length}</span> phản hồi
                </div>
            </div>

            {/* Feedback List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p className={`text-sm font-medium animate-pulse ${isDark ? "text-gray-500" : "text-gray-400"}`}>Đang tải dữ liệu...</p>
                    </div>
                </div>
            ) : filteredFeedbacks.length === 0 ? (
                <div className={`py-32 text-center rounded-3xl border border-dashed ${isDark ? "border-gray-700 bg-gray-800/20" : "border-gray-200 bg-gray-50"}`}>
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Không tìm thấy phản hồi</h3>
                    <p className="text-sm opacity-50">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredFeedbacks.map((fb) => {
                        const typeInfo = FEEDBACK_TYPES[fb.type] || FEEDBACK_TYPES.OTHER;
                        const statusInfo = STATUS_CONFIG[fb.status];
                        const isExpanded = expandedId === fb.id;
                        const isSubmitting = submittingIds.has(fb.id);

                        return (
                            <div
                                key={fb.id}
                                className={`rounded-3xl border overflow-hidden transition-all duration-300 ${isExpanded ? "ring-2 ring-indigo-500/20 shadow-xl scale-[1.01]" : "hover:border-indigo-500/30 hover:shadow-md shadow-sm"} ${isDark ? "bg-gray-800 border-gray-700/50" : "bg-white border-gray-100"}`}
                            >
                                {/* Main Row */}
                                <div
                                    className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                                >
                                    {/* Type Icon */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${typeInfo.gradient} text-white shadow-lg shrink-0`}>
                                        {typeInfo.icon}
                                    </div>

                                    {/* Content Preview */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1.5 overflow-hidden">
                                            <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                                {typeInfo.label}
                                            </span>

                                            <span className={`text-xs flex items-center gap-1.5 ${isDark ? "text-gray-500" : "text-gray-400"} hidden sm:flex`}>
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(fb.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-medium line-clamp-1 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                            {fb.content}
                                        </p>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                                            {statusInfo.icon}
                                            {statusInfo.label}
                                        </div>
                                        <div className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 opacity-40" /> : <ChevronDown className="w-5 h-5 opacity-40" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className={`px-5 pb-6 pt-2 space-y-6 animate-fade-in`}>
                                        <div className={`h-px w-full ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* User Message */}
                                            <div className="space-y-3">
                                                <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    Nội dung phản hồi
                                                </h4>
                                                <div className={`p-5 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap border ${isDark ? "bg-gray-900/30 border-gray-700/50" : "bg-gray-50/50 border-gray-200"}`}>
                                                    {fb.content}
                                                </div>
                                                {fb.createdAt && (
                                                    <span className={`text-[11px] font-medium flex items-center gap-1.5 px-1 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                                                        <Clock className="w-3 h-3" /> Gửi lúc: {formatDate(fb.createdAt)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Admin Action */}
                                            <div className="space-y-3">
                                                <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Xử lý & Phản hồi
                                                </h4>

                                                <div className="space-y-4">
                                                    <textarea
                                                        value={replies[fb.id] !== undefined ? replies[fb.id] : fb.adminReply || ""}
                                                        onChange={(e) => setReplies({ ...replies, [fb.id]: e.target.value })}
                                                        placeholder="Nhập nội dung phản hồi cho người dùng..."
                                                        className={`w-full p-4 rounded-3xl text-sm resize-none h-28 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none border transition-all ${isDark ? "bg-gray-900/50 border-gray-700 text-gray-200 placeholder-gray-600" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"}`}
                                                    />

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {(["REVIEWING", "RESOLVED", "REJECTED"] as FeedbackStatus[]).map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleUpdateFeedback(fb.id, status)}
                                                                disabled={isSubmitting}
                                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${status === "RESOLVED" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20" :
                                                                    status === "REJECTED" ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20" :
                                                                        "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                                                                    }`}
                                                            >
                                                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                                {STATUS_CONFIG[status].label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {fb.adminReply && !replies[fb.id] && fb.status !== "PENDING" && (
                                            <div className={`mt-2 flex items-center gap-2 text-[11px] font-bold ${isDark ? "text-emerald-500/80" : "text-emerald-600/80"}`}>
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Đã được xử lý bởi Admin
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </main>
    );
}
