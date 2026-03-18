import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

/* ===================== SERVICE ===================== */

export const chatbotService = {
  /**
   * Gửi message tới AI chatbot
   */
  chat(request: ChatRequest): Promise<ChatResponse> {
    // http đã unwrap ApiResponse<T> → trả thẳng result
    return http.post<ChatResponse>(API_ENDPOINTS.AI.CHAT, request);
  },
};
