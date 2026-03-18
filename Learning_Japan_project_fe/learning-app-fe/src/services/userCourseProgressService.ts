import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface CourseResponse {
  id: string;
  title: string;
  description: string;
  level: string;
  lessonProcess: string;
  createdBy: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface CourseProgressResponse {
  id: string;
  percent: number;
  completed: boolean;
  completedAt: string | null;
  course: CourseResponse;
}

/* ===================== SERVICE ===================== */

export const courseService = {
  /**
   * Lấy progress của course hiện tại
   */
  getProgress(courseId: string): Promise<CourseProgressResponse> {
    return http.get<CourseProgressResponse>(
      API_ENDPOINTS.COURSE.GET_PROGRESS(courseId)
    );
  },
  getMyProgress(): Promise<CourseProgressResponse[]> {
    return http.get<CourseProgressResponse[]>(
      API_ENDPOINTS.COURSE.GET_MY_PROGRESS
    );
  },
};
