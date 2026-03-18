import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== SERVICE ===================== */
import { LearningStatus } from "@/enums/LearningStatus";

export interface UserVocabProgressResponse {
  vocabId: string;
  vocabWord: string;
  status: LearningStatus;
  reviewCount: number;
  forgottenCount: number;
  lastReviewedAt: string;
  createdAt: string;
}
export const learningService = {
  /**
   * Lấy toàn bộ quá trình học vocab của user hiện tại
   */
  getMyProgress(): Promise<UserVocabProgressResponse[]> {
    return http.get<UserVocabProgressResponse[]>(
      API_ENDPOINTS.VOCAB.GET_PROGRESS
    );
  },
};
