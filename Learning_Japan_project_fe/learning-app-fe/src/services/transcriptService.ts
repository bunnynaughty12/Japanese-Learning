import { axiosClient } from "@/lib/axios";
import { ApiResponse } from "@/services/api-types";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/stores/authStore";

/* ==================== TYPES ==================== */

export interface TranscriptDTO {
  id: string;
  text: string;
  startOffset: number; // ms
  endOffset: number; // ms
  translatedText: string
  createdAt: string; // ISO string
}

export interface YoutubeTranscriptResponse {
  id: string;
  videoId: string;
  title: string;
  urlVideo?: string;
  transcriptsDTOS: TranscriptDTO[];
}

/* ==================== HELPERS ==================== */

const getHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  return {
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };
};

async function fetchAPI<T>(url: string): Promise<T> {
  const res = await axiosClient.get<ApiResponse<T>>(url, {
    headers: getHeaders(),
  });

  if (!res.data.success) {
    throw new Error(res.data.message || "API Error");
  }

  return res.data.result;
}

/* ==================== SERVICE ==================== */

export const transcriptService = {
  /**
   * Lấy transcript theo videoId
   * ❌ Không cache
   */
  async getTranscripts(videoId: string): Promise<YoutubeTranscriptResponse> {
    return fetchAPI<YoutubeTranscriptResponse>(
      `${API_ENDPOINTS.VIDEO.VIEW_BY_ID}/${videoId}`
    );
  },
};
