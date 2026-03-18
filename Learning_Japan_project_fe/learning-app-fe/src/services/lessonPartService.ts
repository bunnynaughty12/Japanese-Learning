import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { LessonPartType } from "@/enums/LessonPartType";

/* ===================== SERVICE ===================== */
export interface CreateLessonPartRequest {
  lessonId: string;
  lessonPartType: LessonPartType;
  title: string;
  videoUrl: string;
  partOrder: number;
}

export interface UpdateLessonPartRequest {
  lessonPartType?: LessonPartType;
  title?: string;
  videoUrl?: string;
  partOrder?: number;
}
export interface LessonPartResponse {
  id: string;
  lessonPartType: string;
  videoUrl: string;
  title: string;
  duration: string;
  partOrder: number;
}

export const lessonPartService = {
  /**
   * ✅ Create lesson part
   */
  create(request: CreateLessonPartRequest): Promise<string> {
    return http.post<string>(API_ENDPOINTS.LESSON_PART.CREATE, request);
  },

  /**
   * ✅ Get lesson parts by lesson
   */
  getByLesson(lessonId: string): Promise<LessonPartResponse[]> {
    return http.get<LessonPartResponse[]>(
      API_ENDPOINTS.LESSON_PART.GET_BY_LESSON(lessonId)
    );
  },

  /**
   * ✅ Get detail
   */
  getDetail(id: string): Promise<LessonPartResponse> {
    return http.get<LessonPartResponse>(
      API_ENDPOINTS.LESSON_PART.GET_DETAIL(id)
    );
  },

  /**
   * ✅ Update
   */
  update(id: string, request: UpdateLessonPartRequest): Promise<string> {
    return http.put<string>(API_ENDPOINTS.LESSON_PART.UPDATE(id), request);
  },

  /**
   * ✅ Delete
   */
  delete(id: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.LESSON_PART.DELETE(id));
  },
};
