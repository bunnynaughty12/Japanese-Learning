import { axiosUpload } from "@/lib/axios";
import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

export interface S3ImageResponse {
    key: string;
    url: string;
}

export type S3FolderType = "images" | "audios" | "videos" | "exam";

export const s3Service = {
    upload: async (file: File, type: S3FolderType, onProgress?: (pct: number) => void) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        return axiosUpload.post(API_ENDPOINTS.S3.UPLOAD, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (evt) => {
                if (onProgress && evt.total) {
                    onProgress(Math.round((evt.loaded / evt.total) * 100));
                }
            },
        });
    },

    uploadExam: async (file: File, onProgress?: (pct: number) => void) => {
        return s3Service.upload(file, "exam", onProgress);
    },

    /**
     * Lấy danh sách URL hình ảnh từ S3
     */
    getImagesUrls(): Promise<S3ImageResponse[]> {
        return http.get<S3ImageResponse[]>(API_ENDPOINTS.S3.GET_IMAGES_FILES);
    },

    /**
     * Lấy danh sách URL âm thanh từ S3
     */
    getAudiosUrls(): Promise<S3ImageResponse[]> {
        return http.get<S3ImageResponse[]>(API_ENDPOINTS.S3.GET_AUDIOS_FILES);
    },
    /**
     * Xóa file trong S3
     */
    deleteAudio(key: string): Promise<void> {
        return http.delete<void>(API_ENDPOINTS.S3.DELETE_AUDIO, {
            params: { key },
        });
    },
    /**
     * Xóa file trong S3
     */
    deleteImage(key: string): Promise<void> {
        return http.delete<void>(API_ENDPOINTS.S3.DELETE_IMAGE, {
            params: { key },
        });
    },
    getAssessmentUrls(): Promise<S3ImageResponse[]> {
        return http.get<S3ImageResponse[]>(API_ENDPOINTS.S3.GET_ASSESSEMENT_FILES);
    },
    deleteAssessment(key: string): Promise<void> {
        return http.delete<void>(API_ENDPOINTS.S3.DELETE_ASSESSEMENT, {
            params: { key },
        });
    },
}