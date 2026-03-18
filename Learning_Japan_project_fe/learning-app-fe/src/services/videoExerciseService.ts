import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface ExerciseOption {
  optionIndex: number;
  correct: boolean;
  content: string;
}

export interface ExerciseQuestion {
  questionId: string;
  transcriptText: string;
  questionText: string;
  questionType: string; // hoặc union type nếu bạn muốn strict hơn
  options: ExerciseOption[];
}

export interface VideoExerciseResponse {
  id: string;
  videoId: string;
  title: string;
  description: string;
  totalQuestions: number;
  createdAt: string; // Instant từ BE → ISO string
  questions: ExerciseQuestion[];
}

/* ===================== SERVICE ===================== */

export const videoExerciseService = {
  /**
   * Lấy exercise theo videoId
   */
  getByVideoId(videoId: string): Promise<VideoExerciseResponse> {
    return http.get<VideoExerciseResponse>(
      API_ENDPOINTS.VIDEO_EXERCISE.GET_BY_VIDEO(videoId)
    );
  },
};
