"use client";
import { vocabService, VocabResponse } from "@/services/vocabService";

import React, { useState, useEffect } from "react";
import { Volume2, Copy, Edit, Trash2, ChevronLeft } from "lucide-react";

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  translation: string;
}

interface VocabularySidebarProps {
  videoId: string;
  isVisible?: boolean;
  onToggle?: () => void;
  onAddFromSelection?: (word: string) => void;
  isDarkMode?: boolean;
  refreshTrigger?: number;
}

export default function VocabularySidebar({
  videoId,
  isVisible = true,
  onToggle,
  onAddFromSelection,
  isDarkMode = false,
  refreshTrigger = 0,
}: VocabularySidebarProps) {
  const mapApiToUI = (v: VocabResponse): VocabularyItem => ({
    id: v.id,
    word: v.surface,
    reading: v.reading || v.romaji || "",
    translation: v.translated,
  });

  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVocab, setEditingVocab] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    word: "",
    reading: "",
    translation: "",
  });

  // Fetch vocabs function
  const fetchVocabs = async () => {
    try {
      setLoading(true);
      const res = await vocabService.getMyVocabsByVideo(videoId);
      setVocabularyList(res.map(mapApiToUI));
    } catch (err) {
      console.error("Fetch vocab failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!isVisible) return;
    fetchVocabs();
  }, [videoId, isVisible]);

  // Refresh khi có refreshTrigger thay đổi
  useEffect(() => {
    if (refreshTrigger > 0 && isVisible) {
      fetchVocabs();
    }
  }, [refreshTrigger, isVisible]);

  const handlePlayAudio = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "ja-JP";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyWord = (word: string) => {
    navigator.clipboard.writeText(word);
  };

  const handleDeleteVocab = async (id: string) => {
    const vocab = vocabularyList.find((v) => v.id === id);
    if (!vocab) return;

    try {
      await vocabService.remove(vocab.word);
      setVocabularyList((prev) => prev.filter((v) => v.id !== id));
    } catch (e) {
      console.error("Delete vocab failed", e);
    }
  };

  const handleStartEdit = (vocab: VocabularyItem) => {
    setEditingVocab(vocab.id);
    setEditForm({
      word: vocab.word,
      reading: vocab.reading,
      translation: vocab.translation,
    });
  };

  const handleSaveEdit = async (id: string) => {
    const vocab = vocabularyList.find((v) => v.id === id);
    if (!vocab) return;

    try {
      await vocabService.updateMeaning({
        surface: vocab.word,
        translated: editForm.translation,
      });

      setVocabularyList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...editForm } : v))
      );
      setEditingVocab(null);
    } catch (e) {
      console.error("Update vocab failed", e);
    }
  };

  const handleCancelEdit = () => {
    setEditingVocab(null);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`relative w-80 h-full border-r flex flex-col transition-colors duration-300 ${
        isDarkMode
          ? "bg-gray-800/90 border-gray-700"
          : "bg-white/90 backdrop-blur-sm border-cyan-100"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b flex-shrink-0 transition-colors duration-300 ${
          isDarkMode ? "border-gray-700" : "border-cyan-100"
        }`}
      >
        <div className="flex items-center justify-between w-full px-1">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`p-1.5 rounded transition-colors duration-300 ${
                isDarkMode ? "bg-gray-700" : "bg-cyan-50"
              }`}
            >
              <span className="text-lg">📖</span>
            </div>
            <h2
              className={`text-lg font-bold transition-colors duration-300 ${
                isDarkMode
                  ? "text-gray-100"
                  : "bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent"
              }`}
            >
              Từ vựng
            </h2>
          </div>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              isDarkMode
                ? "text-gray-400 hover:bg-gray-700"
                : "text-cyan-500 hover:bg-cyan-50"
            }`}
            title="Đóng từ vựng"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-header with count */}
      <div
        className={`px-4 py-3 border-b flex-shrink-0 flex items-center justify-between transition-colors duration-300 ${
          isDarkMode ? "border-gray-700" : "border-cyan-100"
        }`}
      >
        <span
          className={`text-sm transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {vocabularyList.length} từ vựng
        </span>
        {loading && (
          <div className="flex items-center gap-2">
            <svg
              className={`animate-spin h-4 w-4 ${
                isDarkMode ? "text-cyan-400" : "text-cyan-500"
              }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span
              className={`text-xs ${
                isDarkMode ? "text-cyan-400" : "text-cyan-500"
              }`}
            >
              Đang tải...
            </span>
          </div>
        )}
      </div>

      {/* Vocabulary List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {vocabularyList.map((vocab) => (
          <div
            key={vocab.id}
            className={`group border rounded-lg p-3 transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-700/50 border-gray-600 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
                : "bg-white border-cyan-100 hover:border-cyan-300 hover:shadow-sm"
            }`}
          >
            {editingVocab === vocab.id ? (
              // Edit Mode
              <div className="space-y-2">
                <input
                  type="text"
                  value={editForm.word}
                  onChange={(e) =>
                    setEditForm({ ...editForm, word: e.target.value })
                  }
                  className={`w-full px-2 py-1 text-lg font-bold border rounded focus:outline-none focus:ring-2 transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-gray-100 focus:ring-cyan-400 focus:border-cyan-400"
                      : "bg-white border-cyan-300 text-gray-900 focus:ring-cyan-400"
                  }`}
                  placeholder="Từ"
                />
                <input
                  type="text"
                  value={editForm.reading}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reading: e.target.value })
                  }
                  className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-gray-100 focus:ring-cyan-400 focus:border-cyan-400"
                      : "bg-white border-cyan-300 text-gray-900 focus:ring-cyan-400"
                  }`}
                  placeholder="Phiên âm"
                />
                <input
                  type="text"
                  value={editForm.translation}
                  onChange={(e) =>
                    setEditForm({ ...editForm, translation: e.target.value })
                  }
                  className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-gray-100 focus:ring-cyan-400 focus:border-cyan-400"
                      : "bg-white border-cyan-300 text-gray-900 focus:ring-cyan-400"
                  }`}
                  placeholder="Nghĩa tiếng Việt"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(vocab.id)}
                    className="flex-1 px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white text-sm rounded transition-all"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${
                      isDarkMode
                        ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-bold mb-1 transition-colors duration-300 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {vocab.word}
                    </h3>
                    <p
                      className={`text-sm mb-1 transition-colors duration-300 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {vocab.reading}
                    </p>
                    <p
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? "text-cyan-400" : "text-cyan-700"
                      }`}
                    >
                      {vocab.translation}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className={`flex items-center gap-2 mt-3 pt-3 border-t transition-colors duration-300 ${
                    isDarkMode ? "border-gray-600" : "border-cyan-100"
                  }`}
                >
                  <button
                    onClick={() => handlePlayAudio(vocab.word)}
                    className={`p-2 rounded transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/30"
                        : "text-gray-600 hover:text-cyan-600 hover:bg-cyan-50"
                    }`}
                    title="Phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyWord(vocab.word)}
                    className={`p-2 rounded transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-blue-400 hover:bg-blue-900/30"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="Sao chép"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(vocab)}
                    className={`p-2 rounded transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-amber-400 hover:bg-amber-900/30"
                        : "text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                    }`}
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVocab(vocab.id)}
                    className={`p-2 rounded transition-colors ml-auto ${
                      isDarkMode
                        ? "text-gray-400 hover:text-red-400 hover:bg-red-900/30"
                        : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                    }`}
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {vocabularyList.length === 0 && !loading && (
          <div className="text-center py-12 px-4">
            <div className="mb-4 flex justify-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? "bg-cyan-900/30" : "bg-cyan-100"
                }`}
              >
                <span className="text-3xl">💡</span>
              </div>
            </div>
            <p
              className={`mb-4 text-sm leading-relaxed transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Tips! Bôi đen văn bản để dịch và thêm vào phần từ vựng
            </p>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode
            ? "rgba(55, 65, 81, 0.5)"
            : "rgba(207, 250, 254, 0.3)"};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode
            ? "#4b5563"
            : "linear-gradient(to bottom, #22d3ee, #06b6d4)"};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode
            ? "#6b7280"
            : "linear-gradient(to bottom, #06b6d4, #0891b2)"};
        }
      `}</style>
    </div>
  );
}
