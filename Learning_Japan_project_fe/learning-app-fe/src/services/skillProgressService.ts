// src/services/skillProgressService.ts

import { http } from "@/lib/http";
import { API_ENDPOINTS } from "@/config/api";

/* ===================== TYPES ===================== */

export interface SkillProgressResponse {
  vocabulary: number;
  grammar: number;
  reading: number;
  listening: number;
  kanji: number;
}

/* ===================== SERVICE ===================== */

export const skillProgressService = {
  /**
   * Lấy dashboard skill progress của user hiện tại
   */
  getMySkillProgress(): Promise<SkillProgressResponse> {
    return http.get<SkillProgressResponse>(API_ENDPOINTS.SKILL_PROGRESS.GET_MY);
  },
};
