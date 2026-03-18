import React, { useState } from "react";
import { Video, Upload, Loader2 } from "lucide-react";
import { youtubeService } from "@/services/videoService";
import { JLPTLevel, VideoTag } from "@/types/video";
import LoadingCat from "@/components/LoadingCat";

type JLPTLevelType = "N1" | "N2" | "N3" | "N4" | "N5";

interface VideoBannerProps {
  isDarkMode: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeLevel?: JLPTLevelType | "ALL";
  onLevelChange?: (level: JLPTLevelType | "ALL") => void;
}

const VideoBanner: React.FC<VideoBannerProps> = ({
  isDarkMode,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  activeLevel = "ALL",
  onLevelChange,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "">("");
  const [selectedTag, setSelectedTag] = useState<VideoTag | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const jlptLevels: Array<JLPTLevelType | "ALL"> = [
    "ALL",
    "N5",
    "N4",
    "N3",
    "N2",
    "N1",
  ];

  const levelOptions = [
    { display: "N5", value: "N5" as JLPTLevel },
    { display: "N4", value: "N4" as JLPTLevel },
    { display: "N3", value: "N3" as JLPTLevel },
    { display: "N2", value: "N2" as JLPTLevel },
    { display: "N1", value: "N1" as JLPTLevel },
  ];

  const tagOptions = [
    { display: "📰 Tin tức", value: "NEWS" as VideoTag },
    { display: "🔥 Mới bắt đầu", value: "BEGINNER" as VideoTag },
    { display: "🎙️ Podcast", value: "PODCAST" as VideoTag },
    { display: "💻 Công nghệ", value: "TECHNOLOGY" as VideoTag },
    { display: "💼 Kinh doanh", value: "BUSINESS" as VideoTag },
    { display: "🎯 TED", value: "TED" as VideoTag },
    { display: "📖 Ngữ pháp", value: "GRAMMAR" as VideoTag },
    { display: "🎬 Hoạt hình", value: "ANIME" as VideoTag },
    { display: "⚡ Video ngắn", value: "SHORT_VIDEO" as VideoTag },
    { display: "🎭 Phim", value: "MOVIE" as VideoTag },
    { display: "✈️ Du lịch", value: "TRAVEL" as VideoTag },
    { display: "🎵 Văn hóa", value: "CULTURE" as VideoTag },
    { display: "🍱 Ẩm thực", value: "FOOD" as VideoTag },
    { display: "👶 Kids", value: "KIDS" as VideoTag },
  ];

  const handleUpload = async () => {
    if (!youtubeUrl || !selectedLevel || !selectedTag) return;

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await youtubeService.uploadVideo({
        url: youtubeUrl,
        videoTag: selectedTag,
        level: selectedLevel,
      });

      setSuccess(true);
      setYoutubeUrl("");
      setSelectedLevel("");
      setSelectedTag("");

      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <LoadingCat
            size="md"
            isDark={true}
            message="Đang xử lý video"
            subMessage="Video sẽ được xử lý trong khoảng 5 phút ⏱️"
          />
        </div>
      )}

      {/* Title and Actions Bar */}
      <div
        className={`${isDarkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          } border-b px-6 py-4 shadow-sm transition-colors duration-300`}
      >
        <div className="mb-4">
          <h1
            className={`text-2xl font-bold ${isDarkMode
              ? "text-gray-100"
              : "bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent"
              }`}
          >
            Luyện Shadowing để dễ dàng thông qua bất kỳ video nào bạn yêu thích
          </h1>
        </div>

        {/* Compact Upload Form */}
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="Dán link Youtube..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition ${isDarkMode
              ? "bg-gray-700 border-gray-600 text-gray-100 border"
              : "bg-gray-50 border-gray-200 text-gray-700 border"
              } disabled:opacity-50`}
          />
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value as VideoTag)}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 transition ${isDarkMode
              ? "bg-gray-700 border-gray-600 text-gray-100 border"
              : "bg-gray-50 border-gray-200 text-gray-700 border"
              } disabled:opacity-50 min-w-[150px]`}
          >
            <option value="">Thể loại</option>
            {tagOptions.map((tag) => (
              <option key={tag.value} value={tag.value}>
                {tag.display}
              </option>
            ))}
          </select>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as JLPTLevel)}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 transition ${isDarkMode
              ? "bg-gray-700 border-gray-600 text-gray-100 border"
              : "bg-gray-50 border-gray-200 text-gray-700 border"
              } disabled:opacity-50 min-w-[120px]`}
          >
            <option value="">Cấp độ</option>
            {levelOptions.map((level) => (
              <option key={level.value} value={level.value}>
                {level.display}
              </option>
            ))}
          </select>
          <button
            onClick={handleUpload}
            disabled={
              !youtubeUrl || !selectedLevel || !selectedTag || isLoading
            }
            className={`px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap ${!youtubeUrl || !selectedLevel || !selectedTag || isLoading
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-105"
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Tạo video</span>
              </>
            )}
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 text-red-800 rounded-lg text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-3 p-2 bg-green-100 border border-green-300 text-green-800 rounded-lg text-xs flex items-center gap-2">
            <span>✅</span>
            <span>Upload thành công!</span>
          </div>
        )}
      </div>

      {/* Categories/Tabs Section */}
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"
          } px-6 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"
          } transition-colors duration-300`}
      >
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => onTabChange(tab.label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${activeTab === tab.label
                ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-md"
                : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div >

      {/* JLPT Level Filter Section */}
      {
        onLevelChange && (
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"
              } px-6 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"
              } transition-colors duration-300`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                JLPT Level:
              </span>
              <div className="flex gap-2">
                {jlptLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => onLevelChange(level)}
                    className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${activeLevel === level
                      ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-md"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                  >
                    {level === "ALL" ? "Toàn bộ" : level}
                  </button>
                ))}
              </div>
            </div>
          </div >
        )}
    </>
  );
};

export default VideoBanner;
