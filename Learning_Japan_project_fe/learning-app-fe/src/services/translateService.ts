import { axiosClient } from "@/lib/axios";
import { ApiResponse } from "@/services/api-types";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/stores/authStore";
import { isJapaneseLang, isJapaneseText } from "@/utils/japanese";

/* ==================== TYPES ==================== */

export interface TranslateRequest {
  videoId?: string; // ID video liên quan (optional)
  text: string; // từ/câu cần dịch
  sourceLang: string; // "ja"
  targetLang: string; // "vi"
}

export interface TranslateResult {
  surface: string;
  translated: string;
  reading?: string;
  romaji?: string;
  explain?: string;
  partOfSpeech?: string;
  audioUrl?: string;
  videoId?: string;
}

/* ==================== HELPERS ==================== */

const getHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  return {
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };
};

/* ==================== SERVICE ==================== */

export const translateService = {
  /**
   * Dịch từ / câu
   * ❌ Không cache
   */
  async translate(payload: TranslateRequest): Promise<TranslateResult> {
    if (!isJapaneseLang(payload.sourceLang)) {
      throw new Error("Chỉ hỗ trợ dịch tiếng Nhật");
    }

    if (!isJapaneseText(payload.text)) {
      throw new Error("Nội dung không phải tiếng Nhật");
    }

    const res = await axiosClient.post<ApiResponse<TranslateResult>>(
      API_ENDPOINTS.TRANSLATE.CREATE,
      payload,
      { headers: getHeaders() }
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Translate API error");
    }

    return res.data.result;
  },
};
