import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface LessonPartProgressRequest {
  lessonPartId: string;
  progressPercent: number;
  lastWatchedSecond: number;
}

export interface LessonPartProgressResponse {
  progressPercent: number;
  lastWatchedSecond: number;
  completed: boolean;
}

/* ===================== SERVICE ===================== */

export const lessonProgressService = {
  /**
   * Update progress video
   */
  updateProgress(request: LessonPartProgressRequest): Promise<void> {
    return http.post<void>(API_ENDPOINTS.LESSON_PART_PROGRESS.UPDATE, request);
  },

  /**
   * Get progress để resume video
   */
  getProgress(lessonPartId: string): Promise<LessonPartProgressResponse> {
    return http.get<LessonPartProgressResponse>(
      API_ENDPOINTS.LESSON_PART_PROGRESS.GET(lessonPartId)
    );
  },
};
