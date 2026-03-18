import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface CreateCommentRequest {
    videoId: string;
    content: string;
    parentId?: string;
    rating?: number; // ✅ thêm
}

export interface VideoCommentResponse {
    id: string;
    content: string;
    userId: string;
    fullName: string;
    userRating?: number | null; // ✅ FIX
    avatarUrl: string;
    createdAt: string;
    replies?: VideoCommentResponse[];
}
export const commentService = {
    /**
     * Tạo comment hoặc reply
     */
    createComment(
        request: CreateCommentRequest
    ): Promise<VideoCommentResponse> {
        return http.post<VideoCommentResponse>(
            API_ENDPOINTS.VIDEO.COMMENTS,
            request
        );
    },

    /**
     * Lấy tất cả comment theo video
     */
    getComments(videoId: string): Promise<VideoCommentResponse[]> {
        return http.get<VideoCommentResponse[]>(
            API_ENDPOINTS.VIDEO.GET_COMMENTS(videoId)
        );
    },

    /**
     * Xóa comment
     */
    deleteComment(commentId: string): Promise<void> {
        return http.delete<void>(
            API_ENDPOINTS.VIDEO.DELETE_COMMENT(commentId)
        );
    },
};