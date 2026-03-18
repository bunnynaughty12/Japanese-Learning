import { axiosClient, axiosUpload } from "@/lib/axios";
import { ApiResponse } from "@/services/api-types";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { http } from "@/lib/http";
import { JLPTLevel, VideoTag } from "@/types/video";

/* ===================== TYPES ===================== */
export interface SearchYoutubeVideoRequest {
  key?: string; // trùng tên backend
  level?: JLPTLevel;
  videoTag?: VideoTag;
}
export interface VideoProgressResponse {
  videoId: string;
  lastPositionSeconds: number;
  totalWatchedSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
}

export interface VideoProgressRequest {
  videoId: string;
  lastPositionSeconds: number;
  watchedSecondsDelta: number;
}

export interface UploadYoutubeVideoRequest {
  url: string;
  videoTag: VideoTag;
  level: JLPTLevel;
} /* ===================== ENUM ===================== */

export interface YoutubeVideoSummary {
  id: string;
  title: string;
  urlVideo: string;
  duration: string;
  videoTag: VideoTag;
  level: JLPTLevel;
  createdAt: string;
}

export interface YoutubeVideoDetail extends YoutubeVideoSummary {
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt?: string;
  updatedAt: string;
}
export interface UpdateYoutubeVideoRequest {
  videoTag?: VideoTag;
  level?: JLPTLevel;
}
/* ===================== HELPERS ===================== */

const getHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  return {
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };
};

async function fetchAPI<T>(url: string): Promise<T> {
  try {
    const res = await axiosClient.get<ApiResponse<T>>(url, {
      headers: getHeaders(),
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "API Error");
    }

    return res.data.result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? error.message);
    }
    throw error;
  }
}

/* ===================== SERVICE ===================== */

export const youtubeService = {
  /**
   * Upload video - sử dụng axiosUpload với timeout 10 phút
   */
  async uploadVideo(request: UploadYoutubeVideoRequest): Promise<void> {
    try {
      const res = await axiosUpload.post<ApiResponse<void>>(
        API_ENDPOINTS.VIDEO.UPLOAD,
        request,
        {
          headers: getHeaders(),
        }
      );

      if (!res.data.success) {
        throw new Error(res.data.message || "Upload failed");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message ?? error.message);
      }
      throw error;
    }
  },
  /**
   * Lấy danh sách tất cả video
   * ❌ Không cache
   */
  async getAll(): Promise<YoutubeVideoSummary[]> {
    return fetchAPI<YoutubeVideoSummary[]>(API_ENDPOINTS.VIDEO.VIEW);
  },

  async getVideoByVocab(): Promise<YoutubeVideoSummary[]> {
    return fetchAPI<YoutubeVideoSummary[]>(API_ENDPOINTS.VIDEO.VIEW_BY_VOCAB);
  },

  /**
   * Trigger API lấy chi tiết video
   * (Backend xử lý async, FE không cần data)
   */
  async getById(id: string): Promise<void> {
    await fetchAPI<void>(`${API_ENDPOINTS.VIDEO.VIEW}/${id}`);
    console.log(`[API CALLED] Video detail: ${id}`);
  },
  getAllVideoProgress(): Promise<VideoProgressResponse[]> {
    return http.get<VideoProgressResponse[]>(
      API_ENDPOINTS.VIDEO.GET_ALL_PROGRESS
    );
  },
  saveVideo(videoId: string): Promise<void> {
    return http.post<void>(API_ENDPOINTS.VIDEO.SAVE(videoId));
  },
  /**
   * ✅ Update video metadata (videoTag + level)
   */
  updateVideo(
    videoId: string,
    request: UpdateYoutubeVideoRequest
  ): Promise<void> {
    return http.put<void>(
      API_ENDPOINTS.VIDEO.UPDATE(videoId), // dùng cùng endpoint /{videoId}
      request
    );
  },
  /**
   * Remove video đã save
   */
  removeSavedVideo(videoId: string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.VIDEO.SAVE(videoId));
  },
  /**
   * ✅ NEW — Get video đã save của user hiện tại
   */ getMySavedVideos(): Promise<YoutubeVideoSummary[]> {
    return http.get(API_ENDPOINTS.VIDEO.MY_SAVED);
  },
  trackingProgess(request: VideoProgressRequest): Promise<void> {
    return http.post<void>(API_ENDPOINTS.VIDEO.TRACK_PROGRESS, request);
  },
  async search(
    params: SearchYoutubeVideoRequest
  ): Promise<YoutubeVideoSummary[]> {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== "")
        .map(([k, v]) => {
          if (k === "keyword") return ["key", String(v)]; // map keyword → key
          return [k, String(v)];
        })
    ).toString();

    return fetchAPI<YoutubeVideoSummary[]>(
      `${API_ENDPOINTS.VIDEO.SEARCH}?${query}`
    );
  },
};
