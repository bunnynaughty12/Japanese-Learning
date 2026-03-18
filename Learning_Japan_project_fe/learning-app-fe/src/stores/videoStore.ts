import { create } from "zustand";
import { youtubeService, YoutubeVideoSummary } from "@/services/videoService";

interface VideoState {
    videos: YoutubeVideoSummary[];
    searchQuery: string;
    loading: boolean;
    error: string | null;

    setSearchQuery: (query: string) => void;
    fetchVideos: () => Promise<void>;
    filteredVideos: () => YoutubeVideoSummary[];
}

export const useVideoStore = create<VideoState>((set, get) => ({
    videos: [],
    searchQuery: "",
    loading: false,
    error: null,

    setSearchQuery: (query) => set({ searchQuery: query }),

    fetchVideos: async () => {
        if (get().videos.length > 0) return; // Chỉ load một lần

        set({ loading: true, error: null });
        try {
            const data = await youtubeService.getAll();
            // Lọc bỏ các video không có tag hoặc level (thường là video khóa học)
            const filteredData = data.filter(video =>
                video.videoTag &&
                video.level &&
                video.videoTag !== ("" as any) &&
                video.level !== ("" as any)
            );
            set({ videos: filteredData, loading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : "Không thể tải video", loading: false });
        }
    },

    filteredVideos: () => {
        const { videos, searchQuery } = get();
        if (!searchQuery.trim()) return []; // Trả về rỗng nếu không có keyword (cho dropdown header)

        return videos.filter(video =>
            video.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
}));
