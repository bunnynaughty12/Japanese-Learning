import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { AssessmentType } from "@/enums/assessmentType";
export interface AssessmentItemResponse {
    id: string;
    name: string;
    level: string;
    questionCount: number;
    pointPerQuestion: number;
    totalPoint: number;
    assessmentType: AssessmentType;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateAssessmentItemRequest {
    sectionId?: string;
    name?: string;
    level?: string;
    questionCount?: number;
    pointPerQuestion?: number;
    assessmentType?: AssessmentType;
}
export const assessmentItemService = {
    /* ================= GET BY SECTION ================= */
    getBySection: async (sectionId: string) => {
        return http.get<AssessmentItemResponse[]>(
            API_ENDPOINTS.ASSESSMENT_ITEM.BY_SECTION(sectionId)
        );
    },
    getAll: async () => {
        return http.get<AssessmentItemResponse[]>(
            API_ENDPOINTS.ASSESSMENT_ITEM.GET_ALL
        );
    },
    /* ================= GET DETAIL ================= */
    getDetail: async (id: string) => {
        return http.get<AssessmentItemResponse>(
            API_ENDPOINTS.ASSESSMENT_ITEM.DETAIL(id)
        );
    },

    /* ================= UPDATE ================= */
    update: async (
        id: string,
        data: UpdateAssessmentItemRequest
    ) => {
        return http.put(
            API_ENDPOINTS.ASSESSMENT_ITEM.UPDATE(id),
            data
        );
    },
};