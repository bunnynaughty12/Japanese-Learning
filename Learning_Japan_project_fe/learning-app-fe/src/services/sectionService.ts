import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { LessonLevel } from "@/enums/LessonLevel";

/* ===================== TYPES ===================== */

export interface CreateSectionRequest {
  courseId: string;
  title: string;
}

export interface SectionResponse {
  id: string;
  title: string;
  createdAt: string;
}
export interface UpdateSectionRequest {
  title?: string;
}

/* ===================== SERVICE ===================== */

export const sectionService = {
  /**
   * ✅ Tạo section
   */
  async create(request: CreateSectionRequest): Promise<string> {
    const res = await http.post<any>(API_ENDPOINTS.SECTION.CREATE, request);
    return typeof res === 'object' && res !== null ? res.id : String(res);
  },
  /**
   * ✅ Cập nhật section (partial)
   */
  async update(
    sectionId: string,
    request: UpdateSectionRequest
  ): Promise<string> {
    const res = await http.put<any>(
      API_ENDPOINTS.SECTION.UPDATE(sectionId),
      request
    );
    return typeof res === 'object' && res !== null ? res.id : String(res);
  },
  /**
   * ✅ Lấy danh sách section theo course
   */
  getByCourse(courseId: string): Promise<SectionResponse[]> {
    return http.get<SectionResponse[]>(
      API_ENDPOINTS.SECTION.GET_BY_COURSE(courseId)
    );
  },

  /**
   * ✅ Lấy chi tiết section
   */
  getDetail(sectionId: string): Promise<SectionResponse> {
    return http.get<SectionResponse>(
      API_ENDPOINTS.SECTION.GET_DETAIL(sectionId)
    );
  },

  /**
   * ✅ Xóa section
   */
  delete(sectionId: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.SECTION.DELETE(sectionId));
  },
};
