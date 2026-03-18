"use client";
import React, { useState } from "react";
import { Video, Loader2, CheckCircle2 } from "lucide-react";
import { youtubeService, UploadYoutubeVideoRequest } from "@/services/videoService";
import { JLPTLevel, VideoTag } from "@/types/video";

interface VideoCreationBarProps {
    isDark: boolean;
    onSuccess?: () => void;
}

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const TAGS: VideoTag[] = [
    "BEGINNER", "NEWS", "PODCAST", "TECHNOLOGY", "BUSINESS", "TED",
    "GRAMMAR", "ANIME", "SHORT_VIDEO", "MOVIE", "TRAVEL", "CULTURE",
    "FOOD", "KIDS"
];

export default function VideoCreationBar({ isDark, onSuccess }: VideoCreationBarProps) {
    const [url, setUrl] = useState("");
    const [level, setLevel] = useState<JLPTLevel>("N5");
    const [tag, setTag] = useState<VideoTag>("BEGINNER");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!url.trim()) return;

        setIsLoading(true);
        try {
            const request: UploadYoutubeVideoRequest = {
                url: url.trim(),
                level,
                videoTag: tag
            };
            await youtubeService.uploadVideo(request);
            setUrl("");
            if (onSuccess) onSuccess();
            alert("Video created successfully!");
        } catch (error: any) {
            console.error("Failed to create video:", error);
            alert(error.message || "Failed to create video");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`p-4 rounded-2xl border shadow-sm transition-all ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
            <h3 className={`text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Thêm Video Shadowing Mới
            </h3>
            <div className="flex flex-col md:flex-row gap-3">
                {/* URL Input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Dán link Youtube..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className={`w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm outline-none transition ${isDark
                            ? "bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-teal-500/50"
                            : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500/20"
                            }`}
                    />
                </div>

                {/* Tag Select */}
                <div className="w-full md:w-40">
                    <select
                        value={tag}
                        onChange={(e) => setTag(e.target.value as VideoTag)}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition cursor-pointer appearance-none ${isDark
                            ? "bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-teal-500/50"
                            : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500/20"
                            }`}
                    >
                        {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Level Select */}
                <div className="w-full md:w-32">
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value as JLPTLevel)}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition cursor-pointer appearance-none ${isDark
                            ? "bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-teal-500/50"
                            : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500/20"
                            }`}
                    >
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>

                {/* Create Button */}
                <button
                    onClick={handleCreate}
                    disabled={isLoading || !url.trim()}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 ${isLoading || !url.trim()
                        ? "bg-gray-500 cursor-not-allowed opacity-50"
                        : "bg-teal-600 hover:bg-teal-700"
                        }`}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Video className="w-4 h-4" />
                    )}
                    Tạo video
                </button>
            </div>
        </div>
    );
}
