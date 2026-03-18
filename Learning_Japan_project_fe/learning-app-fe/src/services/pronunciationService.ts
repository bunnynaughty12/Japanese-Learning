import { axiosClient } from "@/lib/axios";
import { ApiResponse } from "@/services/api-types";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/stores/authStore";

/* ===================== TYPES ===================== */

export interface PronunciationResult {
  expectedText: string;
  recognizedText: string;
  accuracy: number;
  feedback: string;
}

/* ===================== HELPERS ===================== */

const getHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  return {
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };
};

async function postFormAPI<T>(url: string, formData: FormData): Promise<T> {
  const res = await axiosClient.post<ApiResponse<T>>(url, formData, {
    headers: {
      ...getHeaders(),
    },
  });

  if (!res.data.success) throw new Error(res.data.message || "API Error");
  return res.data.result;
}

async function getAPI<T>(
  url: string,
  params?: Record<string, string>
): Promise<T> {
  const res = await axiosClient.get<ApiResponse<T>>(url, {
    headers: getHeaders(),
    params,
  });

  if (!res.data.success) throw new Error(res.data.message || "API Error");
  return res.data.result;
}

/* ===================== SERVICE ===================== */

export const pronunciationService = {
  async submitPronunciation(
    audioFile: File,
    expectedText: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append("audio", audioFile, audioFile.name);
    formData.append("expectedText", expectedText);

    return postFormAPI<string>(API_ENDPOINTS.PRONUNCIATION.SUBMIT, formData);
  },

  async getPronunciationResult(
    jobId: string
  ): Promise<PronunciationResult | null> {
    return getAPI<PronunciationResult | null>(
      API_ENDPOINTS.PRONUNCIATION.RESULT,
      { jobId }
    );
  },
};
