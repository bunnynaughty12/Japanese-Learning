"use client";
import React, { useEffect, useState } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { youtubeService, YoutubeVideoSummary } from "@/services/videoService";
import { VideoTag, JLPTLevel } from "@/types/video";
import { Video, Loader2, Calendar, Tag, Layers, ExternalLink } from "lucide-react";
import VideoCreationBar from "@/components/admin/dashboard/VideoCreationBar";

const TAB_TO_TAG_MAP: Record<string, VideoTag | "ALL"> = {
    "Toàn bộ": "ALL",
    "Tin tức": "NEWS",
    "Mới bắt đầu": "BEGINNER",
    Podcast: "PODCAST",
    "Công nghệ": "TECHNOLOGY",
    "Kinh doanh": "BUSINESS",
    TED: "TED",
    "Ngữ pháp": "GRAMMAR",
    "Hoạt hình": "ANIME",
    "Video ngắn": "SHORT_VIDEO",
    Phim: "MOVIE",
    "Du lịch": "TRAVEL",
    "Văn hóa": "CULTURE",
    "Ẩm thực": "FOOD",
    Kids: "KIDS",
};

const tabs = [
    { icon: "✨", label: "Toàn bộ" },
    { icon: "⏰", label: "Tin tức" },
    { icon: "🔥", label: "Mới bắt đầu" },
    { icon: "🎙️", label: "Podcast" },
    { icon: "💻", label: "Công nghệ" },
    { icon: "💼", label: "Kinh doanh" },
    { icon: "🎯", label: "TED" },
    { icon: "⚖️", label: "Ngữ pháp" },
    { icon: "🎬", label: "Hoạt hình" },
    { icon: "🧠", label: "Video ngắn" },
    { icon: "🎭", label: "Phim" },
    { icon: "🏫", label: "Du lịch" },
    { icon: "🎵", label: "Văn hóa" },
    { icon: "🍱", label: "Ẩm thực" },
    { icon: "😊", label: "Kids" },
];

const jlptLevels: Array<JLPTLevel | "ALL"> = ["ALL", "N5", "N4", "N3", "N2", "N1"];

export default function AdminVideosPage() {
    const { isDarkMode: isDark } = useDarkMode();
    const [videos, setVideos] = useState<YoutubeVideoSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Toàn bộ");
    const [activeLevel, setActiveLevel] = useState<JLPTLevel | "ALL">("ALL");

    const [editingVideo, setEditingVideo] = useState<YoutubeVideoSummary | null>(null);
    const [newTag, setNewTag] = useState<VideoTag>("BEGINNER");
    const [newLevel, setNewLevel] = useState<JLPTLevel>("N5");
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchVideos = async () => {
        setIsLoading(true);
        try {
            const data = await youtubeService.getAll();
            const filteredData = data.filter(video =>
                video.videoTag &&
                video.level &&
                video.videoTag !== ("" as any) &&
                video.level !== ("" as any)
            );
            setVideos(filteredData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Failed to fetch videos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    // Get active tag from tab
    const activeTag = TAB_TO_TAG_MAP[activeTab] || "ALL";

    // Filtering logic
    const filteredVideos = videos.filter((video) => {
        const matchesLevel = activeLevel === "ALL" || video.level === activeLevel;
        const matchesTag = activeTag === "ALL" || video.videoTag === activeTag;
        return matchesLevel && matchesTag;
    });

    const getYouTubeThumbnail = (url: string) => {
        const videoIdMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/
        );
        if (videoIdMatch && videoIdMatch[1]) {
            return `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
        }
        return null;
    };

    const handleEditClick = (video: YoutubeVideoSummary) => {
        setEditingVideo(video);
        setNewTag(video.videoTag as VideoTag);
        setNewLevel(video.level as JLPTLevel);
    };

    const handleUpdate = async () => {
        if (!editingVideo) return;
        setIsUpdating(true);
        try {
            await youtubeService.updateVideo(editingVideo.id, {
                videoTag: newTag,
                level: newLevel
            });
            await fetchVideos();
            setEditingVideo(null);
            alert("Cập nhật video thành công!");
        } catch (error: any) {
            console.error("Failed to update video:", error);
            alert(error.message || "Cập nhật video thất bại");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <main className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <Video className={`w-8 h-8 ${isDark ? "text-teal-400" : "text-teal-600"}`} />
                        Quản lý Video Shadowing
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Thêm mới và xem danh sách các video luyện tập Shadowing trên hệ thống.
                    </p>
                </div>
            </div>

            {/* Creation Bar */}
            <VideoCreationBar isDark={isDark} onSuccess={fetchVideos} />

            {/* Filters Section */}
            <div className="space-y-4">
                {/* Category Tabs */}
                <div className={`${isDark ? "bg-gray-800/50" : "bg-white"} p-4 rounded-2xl shadow-sm border ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.label}
                                onClick={() => setActiveTab(tab.label)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium text-xs transition-all ${activeTab === tab.label
                                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                                    : isDark
                                        ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Level Filters */}
                <div className="flex items-center gap-3 px-1">
                    <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        Trình độ:
                    </span>
                    <div className="flex gap-2">
                        {jlptLevels.map((level) => (
                            <button
                                key={level}
                                onClick={() => setActiveLevel(level)}
                                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${activeLevel === level
                                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                                    : isDark
                                        ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {level === "ALL" ? "TOÀN BỘ" : level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Video List Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                    <h3 className={`font-bold uppercase tracking-wider text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                        Danh sách video ({filteredVideos.length})
                    </h3>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className={`text-center py-20 rounded-3xl border border-dashed ${isDark ? "border-gray-700 bg-gray-800/50 text-gray-500" : "border-gray-200 bg-white text-gray-400"}`}>
                        <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Không tìm thấy video nào phù hợp.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVideos.map((video) => (
                            <div
                                key={video.id}
                                className={`group rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md ${isDark ? "bg-gray-800 border-gray-700 hover:border-teal-500/50" : "bg-white border-gray-100 hover:border-teal-300"}`}
                            >
                                {/* Thumbnail */}
                                <div className={`aspect-video w-full relative overflow-hidden ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
                                    {getYouTubeThumbnail(video.urlVideo) ? (
                                        <img
                                            src={getYouTubeThumbnail(video.urlVideo)!}
                                            alt={video.title}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-indigo-500/20">
                                            <Video className={`w-12 h-12 opacity-20 ${isDark ? "text-white" : "text-gray-900"}`} />
                                        </div>
                                    )}

                                    {/* Link overlay */}
                                    <a
                                        href={`/video/${video.id}`}
                                        target="_blank"
                                        className="absolute inset-0 z-10"
                                    ></a>

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                                            {video.level}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-500/80 text-white backdrop-blur-md">
                                            {video.videoTag}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    <h4 className={`font-bold text-sm line-clamp-2 leading-snug h-10 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                                        {video.title}
                                    </h4>

                                    <div className={`flex items-center justify-between text-[11px] font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {video.createdAt ? new Date(video.createdAt).toLocaleDateString('vi-VN') : "N/A"}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5" />
                                            {video.duration || "N/A"}
                                        </div>
                                    </div>

                                    <div className="pt-2 flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(video)}
                                            className={`flex-1 py-2 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${isDark ? "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30" : "bg-teal-50 text-teal-600 hover:bg-teal-100"}`}
                                        >
                                            <Tag className="w-3.5 h-3.5" /> Chỉnh sửa
                                        </button>
                                        <a
                                            href={video.urlVideo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-3 py-2 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Edit Modal */}
            {editingVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setEditingVideo(null)}
                    ></div>
                    <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className={`text-xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                                    Chỉnh sửa Video
                                </h3>
                                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                    Cập nhật phân loại và trình độ cho video.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        Tiêu đề video (Xem lại)
                                    </label>
                                    <p className={`text-sm font-medium leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                        {editingVideo.title}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                            Phân loại (Tag)
                                        </label>
                                        <select
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value as VideoTag)}
                                            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition cursor-pointer appearance-none ${isDark
                                                ? "bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-teal-500/50"
                                                : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500/20"
                                                }`}
                                        >
                                            {Object.entries(TAB_TO_TAG_MAP)
                                                .filter(([_, value]) => value !== "ALL")
                                                .map(([label, value]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                            Trình độ (Level)
                                        </label>
                                        <select
                                            value={newLevel}
                                            onChange={(e) => setNewLevel(e.target.value as JLPTLevel)}
                                            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition cursor-pointer appearance-none ${isDark
                                                ? "bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-teal-500/50"
                                                : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500/20"
                                                }`}
                                        >
                                            {jlptLevels.filter(l => l !== "ALL").map(l => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingVideo(null)}
                                    className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className={`flex-[2] py-3 rounded-2xl font-bold text-sm text-white transition-all bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu thay đổi"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
