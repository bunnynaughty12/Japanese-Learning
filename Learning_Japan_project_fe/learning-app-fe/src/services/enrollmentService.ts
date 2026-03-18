
import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

export interface EnrollmentCheckData {
    courseId: string;
    enrolled: boolean;
}
export interface CourseResponse {
    id: string;
    title: string;
    description: string;
    level: string;
    lessonProcess: string;
    createdBy: string;
    isPaid: boolean;
    price: number;
    imageUrl: string;
    isActive: boolean;
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}


export const enrollmentService = {
    /**
     * Kiểm tra xem user đã đăng ký khóa học này chưa
     */
    async check(courseId: string): Promise<ApiResponse<EnrollmentCheckData>> {
        return http.get<ApiResponse<EnrollmentCheckData>>(
            API_ENDPOINTS.ENROLLMENT.CHECK(courseId)
        );
    },
    async getMyCourses(): Promise<ApiResponse<CourseResponse[]>> {
        return http.get<ApiResponse<CourseResponse[]>>(
            API_ENDPOINTS.ENROLLMENT.MY_COURSES
        );
    }
};