"use client";
import React, { useState, useEffect } from "react";
import { X, Video, Star, Tag, Sparkles, Loader2 } from "lucide-react";
import { youtubeService } from "@/services/videoService";
import LoadingCat from "@/components/LoadingCat";
import { JLPTLevel, VideoTag } from "@/types/video";

export interface VideoUploadData {
  youtubeUrl: string;
  level: JLPTLevel;
  tag: VideoTag;
}

export interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isDark?: boolean;
}

const UploadVideoModal: React.FC<UploadVideoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isDark = false,
}) => {
  const [formData, setFormData] = useState<VideoUploadData>({
    youtubeUrl: "",
    level: "" as JLPTLevel,
    tag: "" as VideoTag,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setFormData({
        youtubeUrl: "",
        level: "" as JLPTLevel,
        tag: "" as VideoTag,
      });
      setError("");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const levelOptions = [
    { display: "N5 - Beginner", value: "N5" as JLPTLevel },
    { display: "N4 - Elementary", value: "N4" as JLPTLevel },
    { display: "N3 - Intermediate", value: "N3" as JLPTLevel },
    { display: "N2 - Upper Intermediate", value: "N2" as JLPTLevel },
    { display: "N1 - Advanced", value: "N1" as JLPTLevel },
  ];

  const tagOptions = [
    { display: "⏰ Tin tức", value: "NEWS" as VideoTag },
    { display: "🔥 Mới bắt đầu", value: "BEGINNER" as VideoTag },
    { display: "🎙️ Podcast", value: "PODCAST" as VideoTag },
    { display: "💻 Công nghệ", value: "TECHNOLOGY" as VideoTag },
    { display: "💼 Kinh doanh", value: "BUSINESS" as VideoTag },
    { display: "🎯 TED", value: "TED" as VideoTag },
    { display: "⚖️ Ngữ pháp", value: "GRAMMAR" as VideoTag },
    { display: "🎬 Hoạt hình", value: "ANIME" as VideoTag },
    { display: "🧠 Video ngắn", value: "SHORT_VIDEO" as VideoTag },
    { display: "🎭 Phim", value: "MOVIE" as VideoTag },
    { display: "🏫 Du lịch", value: "TRAVEL" as VideoTag },
    { display: "🎵 Văn hóa", value: "CULTURE" as VideoTag },
    { display: "🍱 Ẩm thực", value: "FOOD" as VideoTag },
    { display: "😊 Kids", value: "KIDS" as VideoTag },
  ];

  const handleSubmit = async () => {
    if (!formData.youtubeUrl || !formData.level || !formData.tag) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await youtubeService.uploadVideo({
        url: formData.youtubeUrl,
        videoTag: formData.tag,
        level: formData.level,
      });

      setFormData({
        youtubeUrl: "",
        level: "" as JLPTLevel,
        tag: "" as VideoTag,
      });

      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi upload video";
      setError(errorMessage);
      console.error("Upload failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`${
          isDark
            ? "bg-gray-800 border border-gray-700"
            : "bg-gradient-to-br from-cyan-50 to-blue-50"
        } rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all my-8 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Overlay with LoadingCat Component */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl z-50 flex items-center justify-center">
            <LoadingCat
              size="md"
              isDark={true}
              message="Đang xử lý video"
              subMessage="Video sẽ được xử lý trong khoảng 5 phút ⏱️"
            />
          </div>
        )}

        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? "border-gray-700" : "border-cyan-200"
          }`}
        >
          <h2
            className={`text-2xl font-bold ${
              isDark
                ? "text-gray-100"
                : "bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent"
            }`}
          >
            DÁN LINK YOUTUBE ĐỂ BẮT ĐẦU HỌC
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`p-2 rounded-lg transition ${
              isDark ? "hover:bg-gray-700" : "hover:bg-cyan-100"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <X
              className={`w-6 h-6 ${
                isDark ? "text-gray-300" : "text-cyan-600"
              }`}
            />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div
              className={`${
                isDark
                  ? "bg-red-900/30 border-red-700"
                  : "bg-red-50 border-red-200"
              } border px-4 py-3 rounded-xl flex items-start gap-2`}
            >
              <span className="text-red-600 font-bold">⚠️</span>
              <p
                className={`text-sm ${
                  isDark ? "text-red-300" : "text-red-800"
                }`}
              >
                {error}
              </p>
            </div>
          )}

          {/* YouTube Link */}
          <div>
            <label
              className={`flex items-center gap-2 mb-2 font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <Video
                className={`w-5 h-5 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              />
              Youtube link
            </label>
            <input
              type="url"
              placeholder="Dán link Youtube để bắt đầu"
              value={formData.youtubeUrl}
              onChange={(e) =>
                setFormData({ ...formData, youtubeUrl: e.target.value })
              }
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>

          {/* Level */}
          <div>
            <label
              className={`flex items-center gap-2 mb-2 font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <Star
                className={`w-5 h-5 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              />
              Cấp độ
            </label>
            <select
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value as JLPTLevel })
              }
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-200 text-gray-800"
              } focus:outline-none focus:ring-2 focus:ring-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">Chọn cấp độ</option>
              {levelOptions.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.display}
                </option>
              ))}
            </select>
          </div>

          {/* Tag */}
          <div>
            <label
              className={`flex items-center gap-2 mb-2 font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <Tag
                className={`w-5 h-5 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              />
              Nhãn
            </label>
            <select
              value={formData.tag}
              onChange={(e) =>
                setFormData({ ...formData, tag: e.target.value as VideoTag })
              }
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-200 text-gray-800"
              } focus:outline-none focus:ring-2 focus:ring-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">Chọn nhãn</option>
              {tagOptions.map((tag) => (
                <option key={tag.value} value={tag.value}>
                  {tag.display}
                </option>
              ))}
            </select>
          </div>

          {/* Info Message */}
          <div
            className={`${
              isDark
                ? "bg-blue-900/30 border-blue-700"
                : "bg-blue-50 border-blue-200"
            } border px-4 py-3 rounded-xl flex items-start gap-2`}
          >
            <span className="text-blue-600 font-bold">ℹ️</span>
            <p
              className={`text-sm ${
                isDark ? "text-blue-300" : "text-blue-800"
              }`}
            >
              Video sẽ được xử lý trong khoảng <strong>5 phút</strong> sau khi
              upload ⏱️
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={
              !formData.youtubeUrl ||
              !formData.level ||
              !formData.tag ||
              isLoading
            }
            className={`w-full py-4 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${
              !formData.youtubeUrl ||
              !formData.level ||
              !formData.tag ||
              isLoading
                ? "opacity-50 cursor-not-allowed hover:scale-100"
                : ""
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Tạo video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadVideoModal;
