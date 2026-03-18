// src/services/courseService.ts
import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { JLPTLevel } from "@/enums/JLPTLevel";
import { LessonProcess } from "@/enums/LessonProcess";

/* ===================== TYPES ===================== */

export interface CreateCourseRequest {
  title: string;
  description: string;
  level: JLPTLevel;
  price: number;
  isPaid: boolean;
  lessonProcess: LessonProcess;
  image?: File;
}
export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  level?: JLPTLevel;
  lessonProcess?: LessonProcess;
  price?: number;
}
export interface CourseResponse {
  id: string;
  title: string;
  description: string;
  level: JLPTLevel;
  price: number;
  isPaid: boolean;
  lessonProcess: LessonProcess;
  createdBy: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  isBought: boolean; // ✅ thêm dòng này
}

/* ===================== SERVICE ===================== */

export const courseService = {
  async create(request: CreateCourseRequest): Promise<string> {
    const formData = new FormData();

    // Debugging FE payload
    console.log("Creating Course with request:", request);

    formData.append("title", request.title.trim());
    formData.append("description", request.description.trim());
    formData.append("level", String(request.level));
    formData.append("lessonProcess", String(request.lessonProcess));
    formData.append("isPaid", String(request.isPaid));
    formData.append("price", String(request.price));

    if (request.image) {
      formData.append("image", request.image);
    }

    try {
      const result = await http.post<any>(API_ENDPOINTS.COURSE.CREATE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // If result is an object, extract id. Otherwise return as string.
      return typeof result === "object" && result !== null ? result.id : String(result);
    } catch (error: any) {
      console.error("Course creation failed details:", error.response?.data || error.message);
      throw error;
    }
  },

  getAll(): Promise<CourseResponse[]> {
    return http.get<CourseResponse[]>(API_ENDPOINTS.COURSE.GET_ALL);
  },
  update(courseId: string, request: UpdateCourseRequest): Promise<string> {
    console.log("Updating Course:", courseId, request);

    return http.put<string>(
      API_ENDPOINTS.COURSE.UPDATE(courseId),
      request
    );
  },
  getDetail(courseId: string): Promise<CourseResponse> {
    return http.get<CourseResponse>(API_ENDPOINTS.COURSE.GET_DETAIL(courseId));
  },

  toggleActive(courseId: string): Promise<void> {
    return http.put<void>(API_ENDPOINTS.COURSE.TOGGLE_ACTIVE(courseId));
  },
};
