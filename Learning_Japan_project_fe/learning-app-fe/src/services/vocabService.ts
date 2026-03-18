// src/services/vocabService.ts
import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";
import { LearningStatus } from "@/enums/LearningStatus";

/* ===================== TYPES ===================== */

export interface UpdateVocabRequest {
  surface: string;
  translated: string;
}
export interface MarkVocabRequest {
  remembered: boolean;
  vocabId: string;
}
export interface VocabStatusResponse {
  vocabId: string;
  status: LearningStatus;
}
export interface VocabResponse {
  id: string;
  surface: string;
  reading: string;
  romaji: string;
  translated: string;
  partOfSpeech: string;
  audioUrl?: string;
  status?: LearningStatus;
}

/* ===================== SERVICE ===================== */

export const vocabService = {
  /**
   * Lưu vocab cho user hiện tại
   */
  save(surface: string): Promise<void> {
    return http.post<void>(API_ENDPOINTS.VOCAB.CREATE, { surface });
  },

  getMyVocabsByVideo(videoId: string): Promise<VocabResponse[]> {
    return http.get<VocabResponse[]>(API_ENDPOINTS.VOCAB.GET_MY_VIDEO(videoId));
  },
  /**
   * Lấy danh sách vocab đã lưu
   */ getMyVocabs(): Promise<VocabResponse[]> {
    return http.get<VocabResponse[]>(API_ENDPOINTS.VOCAB.GET_MY);
  },

  /**
   * Chỉ sửa nghĩa vocab
   */
  updateMeaning(request: UpdateVocabRequest): Promise<void> {
    return http.put<void>(API_ENDPOINTS.VOCAB.UPDATE_MEANING, request);
  },

  /**
   * Xóa vocab của user hiện tại
   */
  remove(surface: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.VOCAB.DELETE(surface));
  },

  markVocab(request: MarkVocabRequest): Promise<void> {
    return http.post<void>(API_ENDPOINTS.VOCAB.MARK_VOCAB, request);
  }, // ✅ GET vocab status
  getStatus(vocabId: string): Promise<VocabStatusResponse> {
    return http.get<VocabStatusResponse>(
      API_ENDPOINTS.VOCAB.GET_STATUS(vocabId)
    );
  },
};
