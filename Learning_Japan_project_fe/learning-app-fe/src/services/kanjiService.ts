import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface KanjiResponse {
  id: string;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  svgStrokes: string[]; // ✅ đổi sang SVG path
}

export interface CreateKanjiRequest {
  character: string;

}

/* ===================== SERVICE ===================== */

export const kanjiService = {
  /**
   * Lấy tất cả kanji
   */
  getAll(): Promise<KanjiResponse[]> {
    return http.get<KanjiResponse[]>(API_ENDPOINTS.KANJI.GET_ALL);
  },

  /**
   * Lấy kanji theo ID
   */
  getById(id: string): Promise<KanjiResponse> {
    return http.get<KanjiResponse>(API_ENDPOINTS.KANJI.GET_BY_ID(id));
  },

  /**
   * Tạo kanji mới
   */
  create(request: CreateKanjiRequest): Promise<KanjiResponse> {
    return http.post<KanjiResponse>(API_ENDPOINTS.KANJI.CREATE, request);
  },
};
