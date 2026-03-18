import React, { useState, useEffect } from "react";
import {
  Volume2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { vocabService, VocabResponse } from "@/services/vocabService";
import { LearningStatus } from "@/enums/LearningStatus";

interface FlashcardProps {
  isDark: boolean;
}

const Flashcard: React.FC<FlashcardProps> = ({ isDark }) => {
  const [vocabs, setVocabs] = useState<VocabResponse[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái học tập hiện tại (load từ backend)
  const [currentStatus, setCurrentStatus] = useState<LearningStatus | null>(
    null
  );
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isMarkingVocab, setIsMarkingVocab] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "KNOWN" | "UNLEARNED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Load danh sách vocabs khi component mount
  useEffect(() => {
    loadVocabs();
  }, []);

  // ── FILTERING LOGIC ──────────────────────────────────────────────────
  const filteredVocabs = vocabs.filter((v) => {
    // Filter by status
    const matchesStatus =
      filter === "ALL" ||
      (filter === "KNOWN" && v.status === LearningStatus.KNOWN) ||
      (filter === "UNLEARNED" && v.status !== LearningStatus.KNOWN);

    // Filter by search query
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      v.surface.toLowerCase().includes(query) ||
      v.translated.toLowerCase().includes(query) ||
      (v.reading && v.reading.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const card = filteredVocabs[currentCard];

  // Load status của vocab hiện tại từ backend
  useEffect(() => {
    const loadStatus = async () => {
      if (!card) return;

      try {
        setIsLoadingStatus(true);
        const res = await vocabService.getStatus(card.id);
        setCurrentStatus(res.status);
      } catch (err) {
        console.error("Load vocab status failed", err);
        setCurrentStatus(null);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    loadStatus();
  }, [card]);

  // Reset current card when filter changes
  useEffect(() => {
    setCurrentCard(0);
    setIsFlipped(false);
  }, [filter, searchQuery]);

  // Custom scrollbar styles
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      ::-webkit-scrollbar {
        width: 12px;
      }
      ::-webkit-scrollbar-track {
        background: ${isDark ? "#1f2937" : "#f3f4f6"};
      }
      ::-webkit-scrollbar-thumb {
        background: ${isDark ? "#4b5563" : "#d1d5db"};
        border-radius: 6px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${isDark ? "#6b7280" : "#9ca3af"};
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [isDark]);

  const loadVocabs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vocabService.getMyVocabs();

      if (data.length === 0) {
        setError("Bạn chưa có từ vựng nào. Hãy thêm từ vựng mới!");
      } else {
        setVocabs(data);
      }
    } catch (err) {
      console.error("Error loading vocabs:", err);
      setError("Không thể tải từ vựng. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đánh dấu vocab (Đã thuộc / Đã quên)
   * @param remembered - true: đã thuộc, false: đã quên
   */
  const markVocab = async (remembered: boolean) => {
    const card = vocabs[currentCard];
    if (!card) return;

    try {
      setIsMarkingVocab(true);

      // Gọi API
      await vocabService.markVocab({
        vocabId: card.id,
        remembered,
      });

      // Load lại status từ backend để đảm bảo đồng bộ
      const res = await vocabService.getStatus(card.id);
      setCurrentStatus(res.status);
    } catch (err) {
      console.error("Mark vocab failed:", err);
      alert("Có lỗi xảy ra khi đánh dấu từ vựng. Vui lòng thử lại.");
    } finally {
      setIsMarkingVocab(false);
    }
  };

  const handleNext = () => {
    if (currentCard < filteredVocabs.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShuffle = () => {
    const shuffled = [...vocabs].sort(() => Math.random() - 0.5);
    setVocabs(shuffled);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const playSound = () => {
    if (soundEnabled && card) {
      if (card.audioUrl) {
        const audio = new Audio(card.audioUrl);
        audio.play().catch((err) => console.error("Error playing audio:", err));
      } else {
        const utterance = new SpeechSynthesisUtterance(card.surface);
        utterance.lang = "ja-JP";
        speechSynthesis.speak(utterance);
      }
    }
  };

  const copyWord = () => {
    if (card) {
      navigator.clipboard.writeText(card.surface);
    }
  };

  /**
   * Lấy thông tin hiển thị theo trạng thái học tập
   */
  const getStatusInfo = () => {
    if (isLoadingStatus || currentStatus === null) {
      return {
        label: "Đang tải...",
        icon: "⏳",
        bgClass: "bg-gray-300/20 text-gray-400",
        isKnown: false,
      };
    }

    switch (currentStatus) {
      case LearningStatus.NEW:
        return {
          label: "Từ mới",
          icon: "🆕",
          bgClass: "bg-blue-400/20 text-blue-400",
          isKnown: false,
        };

      case LearningStatus.LEARNING:
        return {
          label: "Đang học",
          icon: "📖",
          bgClass: "bg-amber-400/20 text-amber-400",
          isKnown: false,
        };

      case LearningStatus.KNOWN:
        return {
          label: "Đã thuộc",
          icon: "✓",
          bgClass: "bg-emerald-400/20 text-emerald-400",
          isKnown: true,
        };

      case LearningStatus.FORGOTTEN:
        return {
          label: "Đã quên",
          icon: "⚠",
          bgClass: "bg-red-400/20 text-red-400",
          isKnown: false,
        };

      default:
        return {
          label: "Chưa xác định",
          icon: "❓",
          bgClass: "bg-gray-300/20 text-gray-400",
          isKnown: false,
        };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-1 pb-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <Loader2
            className={`w-12 h-12 animate-spin ${isDark ? "text-cyan-400" : "text-cyan-600"
              }`}
          />
          <p
            className={`mt-4 text-lg ${isDark ? "text-gray-400" : "text-gray-600"
              }`}
          >
            Đang tải từ vựng...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-1 pb-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <div className={`text-6xl mb-4`}>😿</div>
          <p
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {error}
          </p>
          <button
            onClick={loadVocabs}
            className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (vocabs.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-1 pb-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <div className={`text-6xl mb-4`}>📚</div>
          <p
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Bạn chưa có từ vựng nào
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="w-full max-w-4xl mx-auto pt-1 pb-8 px-4 space-y-12">
      <div className="max-w-md mx-auto">
        {/* Filter Tabs */}
        <div className={`flex p-1 mb-6 rounded-2xl border transition-all duration-300 ${isDark ? "bg-gray-800/60 border-gray-700" : "bg-gray-100/50 border-gray-200"
          }`}>
          {[
            { id: "ALL", label: "Tất cả", icon: "📚" },
            { id: "UNLEARNED", label: "Chưa thuộc", icon: "🌱" },
            { id: "KNOWN", label: "Đã thuộc", icon: "🏆" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 ${filter === tab.id
                ? isDark
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-white text-cyan-600 shadow-sm"
                : isDark
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main card */}
        <div className="relative" style={{ perspective: "1000px" }}>
          <div
            onClick={handleFlip}
            className="relative cursor-pointer"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: isFlipped ? "rotateX(180deg)" : "rotateX(0deg)",
              minHeight: "480px",
            }}
          >
            {card ? (
              <>
                {/* Front Side */}
                <div
                  className={`absolute inset-0 rounded-3xl border-4 border-cyan-400 p-6 shadow-xl flex flex-col ${isDark
                    ? "bg-gradient-to-br from-gray-800 to-gray-900"
                    : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
                    }`}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  {/* Status indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.bgClass}`}
                    >
                      <span className="text-lg">{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound();
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${isDark
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-white/80 hover:bg-white"
                          }`}
                      >
                        <Volume2
                          className={`w-4 h-4 ${isDark ? "text-gray-300" : "text-cyan-600"
                            }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyWord();
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${isDark
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-white/80 hover:bg-white"
                          }`}
                      >
                        <Copy
                          className={`w-4 h-4 ${isDark ? "text-gray-300" : "text-cyan-600"
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Front Card content */}
                  <div className="flex-1 flex flex-col items-center justify-center py-8">
                    <div className="mb-6">
                      <img
                        src="/cat-front.png"
                        alt="Cat Front"
                        className="w-28 h-28 object-contain"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112'%3E%3Ctext x='50%25' y='50%25' font-size='64' text-anchor='middle' dy='.3em'%3E😺%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <div
                      className={`px-10 py-8 rounded-2xl ${isDark
                        ? "bg-gradient-to-br from-cyan-900/60 to-blue-900/60"
                        : "bg-gradient-to-br from-cyan-100 to-blue-100"
                        }`}
                    >
                      <div
                        className={`text-4xl font-bold text-center ${isDark ? "text-cyan-300" : "text-gray-800"
                          }`}
                      >
                        {card.surface}
                      </div>
                    </div>
                  </div>

                  {/* Hint text */}
                  <div
                    className={`text-center text-sm mt-4 ${isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    Nhấn để xem nghĩa
                  </div>
                </div>

                {/* Back Side */}
                <div
                  className={`absolute inset-0 rounded-3xl border-4 border-cyan-400 p-6 shadow-xl flex flex-col ${isDark
                    ? "bg-gradient-to-br from-gray-800 to-gray-900"
                    : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
                    }`}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateX(180deg)",
                  }}
                >
                  {/* Status indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.bgClass}`}
                    >
                      <span className="text-lg">{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound();
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${isDark
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-white/80 hover:bg-white"
                          }`}
                      >
                        <Volume2
                          className={`w-4 h-4 ${isDark ? "text-gray-300" : "text-cyan-600"
                            }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyWord();
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${isDark
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-white/80 hover:bg-white"
                          }`}
                      >
                        <Copy
                          className={`w-4 h-4 ${isDark ? "text-gray-300" : "text-cyan-600"
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Back Card content */}
                  <div className="flex-1 flex flex-col items-center justify-center py-8">
                    <div className="mb-6">
                      <img
                        src="/cat-back.png"
                        alt="Cat Back"
                        className="w-28 h-28 object-contain"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112'%3E%3Ctext x='50%25' y='50%25' font-size='64' text-anchor='middle' dy='.3em'%3E😸%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <div className="text-center space-y-4 px-4">
                      <div
                        className={`text-4xl font-bold ${isDark ? "text-cyan-400" : "text-cyan-600"
                          }`}
                      >
                        {card.translated}
                      </div>

                      {card.reading && (
                        <div
                          className={`text-base mt-4 p-4 rounded-lg ${isDark
                            ? "bg-gray-700/80 text-gray-300"
                            : "bg-white/80 text-gray-600"
                            }`}
                        >
                          <div>({card.reading})</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div
                className={`absolute inset-0 rounded-3xl border-4 border-dashed flex flex-col items-center justify-center ${isDark ? "bg-gray-800/30 border-gray-700" : "bg-gray-50 border-gray-200"
                  }`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-6xl mb-4">😿</div>
                <p className="text-lg font-bold opacity-50 text-center px-4">
                  Không tìm thấy từ vựng nào khớp với bộ lọc
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        {card && (
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handlePrev}
              disabled={currentCard === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition text-sm font-medium ${currentCard === 0
                ? isDark
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-300 cursor-not-allowed"
                : isDark
                  ? "text-cyan-400 hover:bg-gray-700"
                  : "text-cyan-600 hover:bg-cyan-50"
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </button>

            <div
              className={`px-4 py-2 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                }`}
            >
              {currentCard + 1} / {filteredVocabs.length}
            </div>

            <button
              onClick={handleNext}
              disabled={currentCard === filteredVocabs.length - 1}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition text-sm font-medium ${currentCard === filteredVocabs.length - 1
                ? isDark
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-300 cursor-not-allowed"
                : isDark
                  ? "text-cyan-400 hover:bg-gray-700"
                  : "text-cyan-600 hover:bg-cyan-50"
                }`}
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action buttons */}
        {card && (
          <div className="mt-6 space-y-4">
            {/* Nút "Đã thuộc" và "Đã quên" */}
            <div className="flex gap-3">
              {/* Nút Đã thuộc */}
              <button
                onClick={() => markVocab(true)}
                disabled={statusInfo.isKnown || isMarkingVocab}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl transition-all duration-200 text-sm font-semibold tracking-wide ${statusInfo.isKnown
                  ? isDark
                    ? "bg-gray-700/60 text-gray-500 cursor-not-allowed border border-gray-600/40"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : isDark
                    ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 active:scale-95"
                    : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 active:scale-95"
                  }`}
              >
                {isMarkingVocab ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Đã thuộc</span>
              </button>

              {/* Nút Đã quên */}
              <button
                onClick={() => markVocab(false)}
                disabled={isMarkingVocab}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl transition-all duration-200 text-sm font-semibold tracking-wide border-2 ${isDark
                  ? "border-red-500/70 text-red-400 hover:bg-red-500/15 hover:border-red-400 active:scale-95"
                  : "border-red-400 text-red-500 hover:bg-red-50 hover:border-red-500 active:scale-95"
                  }`}
              >
                {isMarkingVocab ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Đã quên</span>
              </button>
            </div>

            {/* Các nút phụ */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={handleShuffle}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 text-xs font-medium border ${isDark
                  ? "border-cyan-500/30 text-cyan-400/80 hover:bg-cyan-500/10 hover:border-cyan-400/50 hover:text-cyan-300"
                  : "border-cyan-300/60 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400"
                  }`}
              >
                <span className="text-sm">🔀</span>
                <span>Xáo trộn</span>
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 text-xs font-medium border ${soundEnabled
                  ? isDark
                    ? "border-cyan-500/30 text-cyan-400/80 hover:bg-cyan-500/10 hover:border-cyan-400/50 hover:text-cyan-300"
                    : "border-cyan-300/60 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400"
                  : isDark
                    ? "border-gray-600/50 text-gray-500 hover:bg-gray-700/50 hover:text-gray-400"
                    : "border-gray-300 text-gray-400 hover:bg-gray-50"
                  }`}
              >
                <span className="text-sm">{soundEnabled ? "🔊" : "🔇"}</span>
                <span>{soundEnabled ? "Âm thanh" : "Tắt tiếng"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── VOCABULARY LIST SECTION ───────────────────────────────────── */}
      <div className={`mt-16 pt-12 border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-800"}`}>
              Danh sách từ vựng
            </h2>
            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Đang hiển thị {filteredVocabs.length} từ vựng
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Tìm kiếm từ vựng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-4 pr-10 py-2.5 rounded-2xl text-sm border outline-none transition-all ${isDark
                ? "bg-gray-800 border-gray-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                : "bg-white border-gray-200 text-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40">
              🔍
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
          {filteredVocabs.map((v, index) => {
            const isCurrent = card?.id === v.id;
            const statusStyle = v.status === LearningStatus.KNOWN
              ? isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200"
              : isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200";

            return (
              <div
                key={v.id}
                onClick={() => {
                  setCurrentCard(index);
                  setIsFlipped(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-xl ${isCurrent
                  ? isDark
                    ? "bg-cyan-500/10 border-cyan-500 shadow-lg shadow-cyan-500/10"
                    : "bg-cyan-50 border-cyan-400 shadow-lg shadow-cyan-500/5"
                  : isDark
                    ? "bg-gray-800/40 border-gray-700 hover:border-gray-600 hover:bg-gray-800"
                    : "bg-white border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/10"
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                    {v.surface}
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusStyle}`}>
                    {v.status === LearningStatus.KNOWN ? "ĐÃ THUỘC" : "ĐANG HỌC"}
                  </div>
                </div>
                <div className={`text-sm mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  {v.translated}
                </div>
                {v.reading && (
                  <div className={`text-[11px] opacity-60 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {v.reading}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
