"use client";
import React, { useState, useEffect } from "react";
import {
    Send,
    Bug,
    Lightbulb,
    Palette,
    BookOpen,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    MessageSquareText,
    ChevronDown,
    ChevronUp,
    Loader2,
    AlertCircle,
    Sparkles,
    HelpCircle,
    MoreHorizontal,
} from "lucide-react";
import {
    feedbackService,
    CreateFeedbackRequest,
    FeedbackResponse,
} from "@/services/feedbackService";
import { FeedbackType } from "@/enums/FeedbackType";
import { FeedbackStatus } from "@/enums/FeedbackStatus";

interface FeedbackPageProps {
    isDark: boolean;
}

/* ── Type config ── */
const FEEDBACK_TYPES: {
    value: FeedbackType;
    label: string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
}[] = [
        {
            value: "BUG",
            label: "Báo lỗi",
            icon: <Bug className="w-5 h-5" />,
            color: "text-red-500",
            gradient: "from-red-400 to-rose-500",
        },
        {
            value: "FEATURE_REQUEST",
            label: "Yêu cầu tính năng",
            icon: <Lightbulb className="w-5 h-5" />,
            color: "text-amber-500",
            gradient: "from-amber-400 to-yellow-500",
        },
        {
            value: "UX_IMPROVEMENT",
            label: "Cải thiện trải nghiệm",
            icon: <Palette className="w-5 h-5" />,
            color: "text-purple-500",
            gradient: "from-purple-400 to-violet-500",
        },
        {
            value: "CONTENT_REQUEST",
            label: "Yêu cầu nội dung",
            icon: <BookOpen className="w-5 h-5" />,
            color: "text-cyan-500",
            gradient: "from-cyan-400 to-blue-500",
        },

        {
            value: "OTHER",
            label: "Khác",
            icon: <MoreHorizontal className="w-5 h-5" />,
            color: "text-slate-500",
            gradient: "from-slate-400 to-gray-500",
        },
    ];

const STATUS_CONFIG: Record<
    FeedbackStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
    PENDING: {
        label: "Chờ xử lý",
        icon: <Clock className="w-3.5 h-3.5" />,
        bg: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-500/20",
    },
    REVIEWING: {
        label: "Đang xem xét",
        icon: <Search className="w-3.5 h-3.5" />,
        bg: "bg-blue-50 dark:bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-500/20",
    },
    RESOLVED: {
        label: "Đã giải quyết",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-500/20",
    },
    REJECTED: {
        label: "Từ chối",
        icon: <XCircle className="w-3.5 h-3.5" />,
        bg: "bg-red-50 dark:bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-200 dark:border-red-500/20",
    },
};

export default function FeedbackPage({ isDark }: FeedbackPageProps) {
    /* ── State ── */
    const [selectedType, setSelectedType] = useState<FeedbackType>("BUG");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    /* ── Load feedbacks ── */
    useEffect(() => {
        loadFeedbacks();
    }, []);

    const loadFeedbacks = async () => {
        try {
            setIsLoading(true);
            const data = await feedbackService.getMyFeedbacks();
            setFeedbacks(data || []);
        } catch (err) {
            console.error("Failed to load feedbacks:", err);
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (!content.trim()) return;
        setIsSubmitting(true);
        setSubmitError("");
        try {
            const request: CreateFeedbackRequest = {
                type: selectedType,
                content: content.trim(),
            };
            await feedbackService.createFeedback(request);
            setSubmitSuccess(true);
            setContent("");
            await loadFeedbacks();
            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to submit:", err);
            setSubmitError("Gửi phản hồi thất bại. Vui lòng thử lại.");
            setTimeout(() => setSubmitError(""), 4000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeConfig = FEEDBACK_TYPES.find((t) => t.value === selectedType)!;

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

    return (
        <div className="space-y-6 pb-8">
            {/* ═══════════ HERO HEADER ═══════════ */}
            <div
                className={`relative overflow-hidden rounded-2xl p-6 ${isDark
                    ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-700"
                    : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
                    }`}
            >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-2xl" />

                <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
                        <MessageSquareText className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1
                            className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"
                                }`}
                        >
                            Hỗ trợ & Phản hồi
                        </h1>
                        <p
                            className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Gửi ý kiến để chúng tôi cải thiện trải nghiệm học tập cho bạn
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══════════ FORM GỬI PHẢN HỒI ═══════════ */}
            <div
                className={`rounded-2xl border overflow-hidden ${isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200 shadow-sm"
                    }`}
            >
                {/* Title bar */}
                <div
                    className={`px-5 py-3 border-b flex items-center gap-2 ${isDark ? "border-gray-700 bg-gray-800/80" : "border-gray-100 bg-gray-50/80"
                        }`}
                >
                    <Sparkles className={`w-4 h-4 ${isDark ? "text-cyan-400" : "text-cyan-500"}`} />
                    <span className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                        Gửi phản hồi mới
                    </span>
                </div>

                <div className="p-5 space-y-4">
                    {/* Feedback type selector */}
                    <div>
                        <label
                            className={`text-xs font-medium mb-2 block ${isDark ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Loại phản hồi
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {FEEDBACK_TYPES.map((type) => {
                                const isSelected = selectedType === type.value;
                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => setSelectedType(type.value)}
                                        className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${isSelected
                                            ? isDark
                                                ? "border-cyan-500/60 bg-cyan-900/30 text-cyan-300"
                                                : "border-cyan-400 bg-cyan-50 text-cyan-700 shadow-sm shadow-cyan-100"
                                            : isDark
                                                ? "border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300"
                                                : "border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${type.gradient} ${!isSelected ? "opacity-60" : "opacity-100 shadow-sm"
                                                } transition-opacity`}
                                        >
                                            {type.icon}
                                        </div>
                                        <span className="truncate text-xs sm:text-sm">{type.label}</span>
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-white dark:border-gray-800" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content textarea */}
                    <div>
                        <label
                            className={`text-xs font-medium mb-2 block ${isDark ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Nội dung phản hồi
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Mô tả chi tiết vấn đề hoặc ý tưởng của bạn..."
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl border text-sm resize-none transition-all focus:outline-none focus:ring-2 ${isDark
                                ? "bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-cyan-500/40 focus:border-cyan-500/60"
                                : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-cyan-400/40 focus:border-cyan-400"
                                }`}
                        />
                        <div
                            className={`mt-1 text-xs flex justify-between ${isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                        >
                            <span>
                                Đang chọn:{" "}
                                <span className={typeConfig.color}>{typeConfig.label}</span>
                            </span>
                            <span>{content.length} / 2000</span>
                        </div>
                    </div>

                    {/* Submit area */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${!content.trim() || isSubmitting
                                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-md shadow-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95"
                                }`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
                        </button>

                        {submitSuccess && (
                            <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium animate-fade-in">
                                <CheckCircle2 className="w-4 h-4" />
                                Gửi thành công!
                            </div>
                        )}
                        {submitError && (
                            <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                                <AlertCircle className="w-4 h-4" />
                                {submitError}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════ LỊCH SỬ PHẢN HỒI ═══════════ */}
            <div
                className={`rounded-2xl border overflow-hidden ${isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200 shadow-sm"
                    }`}
            >
                <div
                    className={`px-5 py-3 border-b flex items-center justify-between ${isDark ? "border-gray-700 bg-gray-800/80" : "border-gray-100 bg-gray-50/80"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${isDark ? "text-cyan-400" : "text-cyan-500"}`} />
                        <span className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                            Lịch sử phản hồi
                        </span>
                    </div>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                            }`}
                    >
                        {feedbacks.length}
                    </span>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className={`w-6 h-6 animate-spin ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-100"
                                }`}
                        >
                            <MessageSquareText
                                className={`w-8 h-8 ${isDark ? "text-gray-600" : "text-gray-300"}`}
                            />
                        </div>
                        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            Bạn chưa gửi phản hồi nào
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {feedbacks.map((fb) => {
                            const typeInfo = FEEDBACK_TYPES.find((t) => t.value === fb.type);
                            const statusInfo = STATUS_CONFIG[fb.status];
                            const isExpanded = expandedId === fb.id;

                            return (
                                <div
                                    key={fb.id}
                                    className={`transition-colors ${isDark ? "hover:bg-gray-700/40" : "hover:bg-gray-50/80"
                                        }`}
                                >
                                    {/* Row header */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                                        className="w-full px-5 py-4 flex items-center gap-3 text-left"
                                    >
                                        {/* Type icon */}
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${typeInfo?.gradient ?? "from-gray-400 to-gray-500"
                                                } shrink-0 shadow-sm`}
                                        >
                                            {typeInfo?.icon}
                                        </div>

                                        {/* Content preview */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span
                                                    className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"
                                                        }`}
                                                >
                                                    {typeInfo?.label}
                                                </span>
                                                <span
                                                    className={`text-xs ${isDark ? "text-gray-600" : "text-gray-300"
                                                        }`}
                                                >
                                                    •
                                                </span>
                                                <span
                                                    className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"
                                                        }`}
                                                >
                                                    {formatDate(fb.createdAt)}
                                                </span>
                                            </div>
                                            <p
                                                className={`text-sm truncate ${isDark ? "text-gray-200" : "text-gray-800"
                                                    }`}
                                            >
                                                {fb.content}
                                            </p>
                                        </div>

                                        <div
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold shrink-0 border shadow-sm ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                                        >
                                            {statusInfo.icon}
                                            <span className="hidden sm:inline uppercase tracking-tight">{statusInfo.label}</span>
                                        </div>

                                        {/* Expand icon */}
                                        {isExpanded ? (
                                            <ChevronUp
                                                className={`w-4 h-4 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"
                                                    }`}
                                            />
                                        ) : (
                                            <ChevronDown
                                                className={`w-4 h-4 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"
                                                    }`}
                                            />
                                        )}
                                    </button>

                                    {/* Expanded detail */}
                                    {isExpanded && (
                                        <div
                                            className={`px-5 pb-4 ml-12 space-y-3 animate-fade-in`}
                                        >
                                            {/* Full content */}
                                            <div
                                                className={`text-sm whitespace-pre-wrap leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"
                                                    }`}
                                            >
                                                {fb.content}
                                            </div>

                                            {/* Admin reply */}
                                            {fb.adminReply && (
                                                <div
                                                    className={`rounded-xl p-4 border-l-4 ${isDark
                                                        ? "bg-cyan-900/20 border-cyan-500 text-cyan-200"
                                                        : "bg-cyan-50 border-cyan-400 text-cyan-800"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <MessageSquareText className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-semibold">
                                                            Phản hồi từ quản trị viên
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed">
                                                        {fb.adminReply}
                                                    </p>
                                                    {fb.resolvedAt && (
                                                        <p
                                                            className={`text-xs mt-2 ${isDark ? "text-cyan-400/60" : "text-cyan-500/70"
                                                                }`}
                                                        >
                                                            Đã giải quyết: {formatDate(fb.resolvedAt)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── inline animation keyframes ── */}
            <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
        </div>
    );
}
