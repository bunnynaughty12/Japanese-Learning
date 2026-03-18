import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { LessonLevel } from "@/enums/LessonLevel";

export interface CreateLessonRequest {
  sectionId: string;
  title: string;
  lessonOrder: number;
}

export interface LessonResponse {
  id: string;
  title: string;
  lessonOrder: number;
  createdAt: string;
}

/* ===================== SERVICE ===================== */

export const lessonService = {
  /**
   * ✅ Create lesson
   */
  async create(request: CreateLessonRequest): Promise<string> {
    const res = await http.post<any>(API_ENDPOINTS.LESSON.CREATE, request);
    return typeof res === 'object' && res !== null ? res.id : String(res);
  },
  update: async (id: string, data: CreateLessonRequest): Promise<string> => {
    const res = await http.put<any>(API_ENDPOINTS.LESSON.UPDATE(id), data);
    return typeof res === "object" && res !== null ? res.id : String(res);
  },
  /**
   * ✅ Get lessons by section
   */
  getBySection(sectionId: string): Promise<LessonResponse[]> {
    return http.get<LessonResponse[]>(
      API_ENDPOINTS.LESSON.GET_BY_SECTION(sectionId)
    );
  },

  /**
   * ✅ Get lesson detail
   */
  getDetail(lessonId: string): Promise<LessonResponse> {
    return http.get<LessonResponse>(API_ENDPOINTS.LESSON.GET_DETAIL(lessonId));
  },

  /**
   * ✅ Delete lesson
   */
  delete(lessonId: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.LESSON.DELETE(lessonId));
  },
};
