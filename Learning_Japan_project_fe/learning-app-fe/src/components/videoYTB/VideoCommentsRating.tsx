"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Star,
    Send,
    Trash2,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    CornerDownRight,
    X,
} from "lucide-react";
import {
    commentService,
    VideoCommentResponse,
} from "@/services/commentService";
import { ratingService, VideoRatingResponse } from "@/services/ratingService";

interface Props {
    videoId: string;
    isDarkMode?: boolean;
}

export default function VideoCommentsRating({
    videoId,
    isDarkMode = false,
}: Props) {
    /* =================== RATING STATE =================== */
    const [hoverStar, setHoverStar] = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);
    const [ratingData, setRatingData] = useState<VideoRatingResponse | null>(
        null
    );

    /* =================== COMMENT STATE =================== */
    const [comments, setComments] = useState<VideoCommentResponse[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyTarget, setReplyTarget] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
        new Set()
    );

    /* =================== FETCH =================== */
    const fetchComments = useCallback(async () => {
        try {
            const data = await commentService.getComments(videoId);
            setComments(data);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        }
    }, [videoId]);

    const fetchRating = useCallback(async () => {
        try {
            const data = await ratingService.getVideoRating(videoId);
            setRatingData(data);
            if (data.userRating) {
                setSelectedStar(data.userRating);
            }
        } catch (err) {
            console.error("Failed to fetch rating", err);
        }
    }, [videoId]);

    useEffect(() => {
        fetchComments();
        fetchRating();
    }, [fetchComments, fetchRating]);


    /* =================== COMMENT SUBMIT =================== */
    const handleSubmitComment = async () => {
        const trimmed = commentText.trim();
        if (!trimmed || isSubmitting) return;
        try {
            setIsSubmitting(true);
            await commentService.createComment({
                videoId,
                content: trimmed,
                parentId: replyTarget?.id,
                rating: !replyTarget && selectedStar > 0 ? selectedStar : undefined
            });
            setCommentText("");
            setReplyTarget(null);
            await fetchComments();
            await fetchRating(); // Refresh average if rating changed
        } catch (err) {
            console.error("Submit comment failed", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    /* =================== DELETE COMMENT =================== */
    const handleDeleteComment = async (commentId: string) => {
        try {
            await commentService.deleteComment(commentId);
            await fetchComments();
        } catch (err) {
            console.error("Delete comment failed", err);
        }
    };

    /* =================== HELPERS =================== */
    const toggleReplies = (id: string) => {
        setExpandedReplies((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch {
            return "";
        }
    };

    const card = isDarkMode
        ? "bg-gray-800 border border-gray-700"
        : "bg-white border border-gray-100 shadow-sm";

    const textMain = isDarkMode ? "text-gray-100" : "text-gray-900";
    const textSub = isDarkMode ? "text-gray-400" : "text-gray-500";
    const inputCls = isDarkMode
        ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-cyan-500"
        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-400";
    const divider = isDarkMode ? "border-gray-700" : "border-gray-100";

    /* =================== RENDER =================== */
    return (
        <div className="space-y-6 mt-6">
            {/* ── Mảng Rating cũ bị ẩn theo yêu cầu ── */}
            {/* <div className={`rounded-2xl p-6 ${card}`}> ... </div> */}

            {/* ── Comment Section ── */}
            <div className={`rounded-2xl p-6 ${card}`}>
                <h3
                    className={`text-base font-semibold mb-4 flex items-center gap-2 ${textMain}`}
                >
                    <MessageCircle className="w-5 h-5 text-cyan-500" />
                    Bình luận
                    {comments.length > 0 && (
                        <span
                            className={`text-sm font-normal ${textSub}`}
                        >{`(${comments.length})`}</span>
                    )}
                    {ratingData && ratingData.totalRatings > 0 && (
                        <div className="flex items-center gap-1 ml-auto text-sm font-normal">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className={`font-semibold ${textMain}`}>{ratingData.averageRating.toFixed(1)}</span>
                            <span className={textSub}>({ratingData.totalRatings} đánh giá)</span>
                        </div>
                    )}
                </h3>

                {/* Comment List */}
                <div className="space-y-4 mb-8">
                    {comments.length === 0 && (
                        <p className={`text-sm text-center py-6 ${textSub}`}>
                            Chưa có bình luận nào. Hãy là người đầu tiên!
                        </p>
                    )}

                    {comments.map((comment) => (
                        <div key={comment.id}>
                            {/* Main comment */}
                            <div className="flex gap-3">
                                {/* Avatar */}
                                {comment.avatarUrl ? (
                                    <img
                                        src={comment.avatarUrl}
                                        alt={comment.fullName}
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
                                        {comment.fullName?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0 bg-transparent">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-semibold ${textMain}`}>
                                            {comment.fullName}
                                        </span>
                                        {comment.userRating != null && comment.userRating > 0 && (
                                            <div className="flex items-center bg-yellow-500/10 px-1.5 py-0.5 rounded text-xs gap-1 ml-1 h-fit">
                                                <span className="text-yellow-500 font-medium leading-none">{comment.userRating}</span>
                                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                            </div>
                                        )}
                                        <span className={`text-xs ml-1 ${textSub}`}>
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${textMain}`}>
                                        {comment.content}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button
                                            onClick={() =>
                                                setReplyTarget({
                                                    id: comment.id,
                                                    name: comment.fullName,
                                                })
                                            }
                                            className={`text-xs font-medium transition-colors ${isDarkMode
                                                ? "text-gray-400 hover:text-cyan-400"
                                                : "text-gray-500 hover:text-cyan-500"
                                                }`}
                                        >
                                            Trả lời
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className={`text-xs transition-colors ${isDarkMode
                                                ? "text-gray-600 hover:text-red-400"
                                                : "text-gray-300 hover:text-red-500"
                                                }`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        {comment.replies && comment.replies.length > 0 && (
                                            <button
                                                onClick={() => toggleReplies(comment.id)}
                                                className={`text-xs flex items-center gap-1 transition-colors ${isDarkMode
                                                    ? "text-cyan-400 hover:text-cyan-300"
                                                    : "text-cyan-500 hover:text-cyan-600"
                                                    }`}
                                            >
                                                {expandedReplies.has(comment.id) ? (
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                ) : (
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                )}
                                                {comment.replies.length} trả lời
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Replies */}
                            {expandedReplies.has(comment.id) &&
                                comment.replies &&
                                comment.replies.length > 0 && (
                                    <div
                                        className={`ml-11 mt-3 space-y-3 pl-4 border-l-2 ${isDarkMode ? "border-gray-700" : "border-gray-100"
                                            }`}
                                    >
                                        {comment.replies.map((reply) => (
                                            <div key={reply.id} className="flex gap-3">
                                                {reply.avatarUrl ? (
                                                    <img
                                                        src={reply.avatarUrl}
                                                        alt={reply.fullName}
                                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
                                                        {reply.fullName?.[0]?.toUpperCase() ?? "?"}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-sm font-medium ${textMain}`}>
                                                            {reply.fullName}
                                                        </span>
                                                        <span className={`text-xs ${textSub}`}>
                                                            {formatDate(reply.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm leading-relaxed ${textMain}`}>
                                                        {reply.content}
                                                    </p>
                                                    <button
                                                        onClick={() => handleDeleteComment(reply.id)}
                                                        className={`mt-1 text-xs transition-colors ${isDarkMode
                                                            ? "text-gray-600 hover:text-red-400"
                                                            : "text-gray-300 hover:text-red-500"
                                                            }`}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            {/* Divider */}
                            <div className={`mt-4 border-t ${divider}`} />
                        </div>
                    ))}
                </div>

                {/* Input Area Moved Below */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                    {replyTarget ? (
                        <div
                            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-2 ${isDarkMode
                                ? "bg-cyan-900/30 text-cyan-300"
                                : "bg-cyan-50 text-cyan-600"
                                }`}
                        >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>
                                Đang trả lời <strong>{replyTarget.name}</strong>
                            </span>
                            <button
                                onClick={() => setReplyTarget(null)}
                                className="ml-auto opacity-60 hover:opacity-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 mb-3">
                            <span className={`text-sm mr-2 ${textMain}`}>Đánh giá của bạn:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverStar(star)}
                                    onMouseLeave={() => setHoverStar(0)}
                                    onClick={() => setSelectedStar(star)}
                                    className="transition-transform duration-150 hover:scale-110 active:scale-95"
                                >
                                    <Star
                                        className={`w-6 h-6 transition-colors duration-150 ${star <= (hoverStar || selectedStar)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : isDarkMode
                                                ? "text-gray-600"
                                                : "text-gray-300"
                                            }`}
                                    />
                                </button>
                            ))}
                            {selectedStar > 0 && (
                                <span className={`ml-2 text-xs font-medium ${textSub}`}>
                                    {["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"][
                                        selectedStar
                                    ]}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex gap-3 items-center">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitComment();
                                }
                            }}
                            placeholder={
                                replyTarget
                                    ? `Trả lời ${replyTarget.name}...`
                                    : "Viết bình luận... (Enter để gửi)"
                            }
                            rows={1}
                            className={`flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${inputCls}`}
                        />
                        <button
                            onClick={handleSubmitComment}
                            disabled={!commentText.trim() || isSubmitting}
                            className={`h-[44px] px-5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode
                                ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                                : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-400/30"
                                }`}
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? "..." : "Gửi"}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
