import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface RateVideoRequest {
    videoId: string;
    rating: number; // 1-5
}

export interface VideoRatingResponse {
    averageRating: number;
    totalRatings: number;
    userRating?: number;
}

export const ratingService = {
    /**
     * Rate hoặc update rating
     */
    rateVideo(request: RateVideoRequest): Promise<void> {
        return http.post<void>(
            API_ENDPOINTS.VIDEO.RATINGS,
            request
        );
    },

    /**
     * Lấy rating trung bình
     */
    getVideoRating(videoId: string): Promise<VideoRatingResponse> {
        return http.get<VideoRatingResponse>(
            API_ENDPOINTS.VIDEO.GET_RATING(videoId)
        );
    },

    /**
     * Xóa rating của user hiện tại
     */
    deleteMyRating(videoId: string): Promise<void> {
        return http.delete<void>(
            API_ENDPOINTS.VIDEO.DELETE_RATING(videoId)
        );
    },
};      