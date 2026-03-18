import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface LessonDocumentResponse {
  id: string;
  title: string;
  documentUrl: string;
  documentOrder: number;
}

export interface CreateLessonDocumentRequest {
  lessonId: string;
  title: string;
  documentOrder: number;
  file: File;
}

/* ===================== SERVICE ===================== */

export const lessonDocumentService = {
  /**
   * ✅ Upload document (multipart/form-data)
   */
  create(request: CreateLessonDocumentRequest): Promise<string> {
    const formData = new FormData();
    formData.append("lessonId", request.lessonId);
    formData.append("title", request.title);
    formData.append("documentOrder", request.documentOrder.toString());
    formData.append("file", request.file);

    return http.post<string>(API_ENDPOINTS.LESSON_DOCUMENT.CREATE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * ✅ Get documents by lesson
   */
  getByLesson(lessonId: string): Promise<LessonDocumentResponse[]> {
    return http.get<LessonDocumentResponse[]>(
      API_ENDPOINTS.LESSON_DOCUMENT.GET_BY_LESSON(lessonId)
    );
  },

  /**
   * ✅ Get document detail
   */
  getDetail(documentId: string): Promise<LessonDocumentResponse> {
    return http.get<LessonDocumentResponse>(
      API_ENDPOINTS.LESSON_DOCUMENT.GET_DETAIL(documentId)
    );
  },

  /**
   * ✅ Delete document
   */
  delete(documentId: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.LESSON_DOCUMENT.DELETE(documentId));
  },
};
