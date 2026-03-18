"use client";
import { PlayCircle } from "lucide-react";

export const YT_REGEX =
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)|https?:\/\/youtu\.be\/([\w-]+)/g;

export function extractYoutubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return m ? m[1] : null;
}

interface MessageContentProps {
    text: string;
    isMe: boolean;
    isDarkMode: boolean;
    onNavigate: (path: string) => void;
}

export default function MessageContent({
    text,
    isMe,
    isDarkMode: dark,
    onNavigate,
}: MessageContentProps) {
    const ytMatches = Array.from(new Set(text.match(YT_REGEX) || []));

    if (ytMatches.length === 0) {
        return (
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{text}</p>
        );
    }

    // Regex to detect internal video routes
    const ROUTE_REGEX = /\/video\/[\w-]+/g;

    let plainText = text.replace(YT_REGEX, "").replace(ROUTE_REGEX, "").trim();
    // Detect if plainText is just a video title (started with 🎬)
    const displayTitle = plainText.startsWith("🎬") ? plainText : null;
    const bodyText = displayTitle ? null : plainText;

    return (
        <div className="space-y-2.5">
            {bodyText && (
                <p className="text-xs leading-relaxed whitespace-pre-wrap opacity-90 px-1">
                    {bodyText}
                </p>
            )}
            {ytMatches.map((url) => {
                const videoId = extractYoutubeId(url);
                if (!videoId) return null;
                const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                return (
                    <button
                        key={url}
                        onClick={() => onNavigate(`/video/${videoId}`)}
                        className={`w-full max-w-[220px] mx-auto block text-left rounded-xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group active:scale-95 shadow-md ${isMe
                            ? dark
                                ? "border-white/10 bg-gray-950"
                                : "border-cyan-200 bg-cyan-50/50"
                            : dark
                                ? "border-white/5 bg-gray-900"
                                : "border-gray-100 bg-gray-50/50"
                            }`}
                    >
                        {/* Title bar with dark background */}
                        {displayTitle && (
                            <div className={`px-2.5 py-1.5 border-b text-[10px] font-bold truncate flex items-center gap-1.5 ${dark
                                ? "border-white/5 bg-white/5 text-gray-100"
                                : "border-cyan-100 bg-cyan-100/30 text-cyan-800"
                                }`}>
                                <div className="w-4 h-4 rounded bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                                    <div className="w-0 h-0 border-t-[2px] border-t-transparent border-l-[4px] border-l-current border-b-[2px] border-b-transparent ml-0.5" />
                                </div>
                                <span className="truncate">{displayTitle.replace("🎬", "").trim()}</span>
                            </div>
                        )}

                        <div className="relative aspect-video bg-black/20">
                            <img
                                src={thumb}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                                }}
                                alt="video"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Overlay with central play button */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-all duration-300">
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 shadow-lg ring-2 ring-white/20">
                                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                                </div>
                            </div>

                            {/* Internal Route Tag */}
                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[7px] font-bold text-cyan-400 uppercase tracking-widest shadow-lg">
                                Video
                            </div>
                        </div>

                        <div className="px-2.5 py-1.5 flex items-center justify-between">
                            <span className={`text-[8px] font-medium truncate max-w-[120px] opacity-60 ${isMe ? "text-gray-400" : "text-gray-500"}`}>
                                {url}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                                <div className="w-1 h-1 rounded-full bg-green-500" />
                                <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter opacity-70">HD READY</span>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
