import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { FeedbackType } from "@/enums/FeedbackType";
import { FeedbackStatus } from "@/enums/FeedbackStatus";

export interface CreateFeedbackRequest {
    type: FeedbackType;
    content: string;
    attachmentUrl?: string;
}


export interface AdminUpdateFeedbackRequest {
    status?: FeedbackStatus;
    adminReply?: string;
}

export interface FeedbackResponse {
    id: string;
    userId: string;
    type: FeedbackType;
    content: string;
    attachmentUrl?: string;
    status: FeedbackStatus;
    createdAt: string;
    adminReply?: string;
    resolvedAt?: string;
}
export const feedbackService = {
    createFeedback(request: CreateFeedbackRequest): Promise<FeedbackResponse> {
        return http.post<FeedbackResponse>(API_ENDPOINTS.FEEDBACK.CREATE, request);
    },

    getMyFeedbacks(): Promise<FeedbackResponse[]> {
        return http.get<FeedbackResponse[]>(API_ENDPOINTS.FEEDBACK.GET_MY);
    },

    getAllFeedbacks(
        status?: FeedbackStatus
    ): Promise<FeedbackResponse[]> {
        if (status) {
            return http.get<FeedbackResponse[]>(
                `${API_ENDPOINTS.ADMIN_FEEDBACK.GET_ALL}?status=${status}`
            );
        }

        return http.get<FeedbackResponse[]>(
            API_ENDPOINTS.ADMIN_FEEDBACK.GET_ALL
        );
    },

    updateFeedback(
        id: string,
        request: AdminUpdateFeedbackRequest
    ): Promise<FeedbackResponse> {
        return http.put<FeedbackResponse>(
            API_ENDPOINTS.ADMIN_FEEDBACK.UPDATE(id),
            request
        );
    },
};