"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { kanjiService, KanjiResponse } from "@/services/kanjiService";
import Sidebar from "@/components/Sidebar";
import { useDarkMode } from "@/hooks/useDarkMode";
import Header from "@/components/Header";
import LoadingCat from "@/components/LoadingCat";
import { Search, Book, AlertCircle, Layers } from "lucide-react";

// Types
interface KanjiCardProps {
  kanji: KanjiResponse;
  isDark: boolean;
  onClick: () => void;
}

// Kanji Card Component
const KanjiCard: React.FC<KanjiCardProps> = ({ kanji, isDark, onClick }) => {
  const getKanjiGradient = (character: string) => {
    const gradients = [
      "from-cyan-400 to-cyan-500",
      "from-blue-400 to-blue-500",
      "from-indigo-400 to-indigo-500",
      "from-purple-400 to-purple-500",
      "from-pink-400 to-pink-500",
      "from-teal-400 to-teal-500",
    ];
    let hash = 0;
    for (let i = 0; i < character.length; i++) {
      hash = character.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  return (
    <div
      onClick={onClick}
      className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border relative`}
    >
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getKanjiGradient(
          kanji.character
        )} opacity-5 group-hover:opacity-10 transition-opacity`}
      />

      {/* Content */}
      <div className="relative p-8 flex flex-col items-center justify-center min-h-[200px]">
        {/* Kanji Character */}
        <div
          className={`text-7xl font-bold mb-4 ${isDark ? "text-gray-100" : "text-gray-800"
            } group-hover:scale-110 transition-transform`}
        >
          {kanji.character}
        </div>

        {/* Meaning */}
        <div
          className={`text-center text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"
            }`}
        >
          {kanji.meaning}
        </div>

        {/* Stroke Count Badge */}
        <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white text-xs font-bold rounded-full">
          <Layers className="w-3 h-3" />
          <span>{kanji.svgStrokes?.length || 0} nét</span>
          {/* ✅ đổi strokes → svgStrokes */}
        </div>

        {/* Readings (if available) */}
        {(kanji.onyomi || kanji.kunyomi) && (
          <div
            className={`mt-4 text-xs ${isDark ? "text-gray-400" : "text-gray-500"
              }`}
          >
            {kanji.onyomi && <div>音: {kanji.onyomi}</div>}
            {kanji.kunyomi && <div>訓: {kanji.kunyomi}</div>}
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 border-2 border-cyan-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

// Main Component
export default function KanjiListPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();
  const [kanjis, setKanjis] = useState<KanjiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadKanjis();
  }, []);

  const loadKanjis = async () => {
    try {
      setLoading(true);
      const data = await kanjiService.getAll();
      setKanjis(data);
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách kanji. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKanjiClick = (id: string) => {
    router.push(`/kanji/${id}`);
  };

  // Filter kanjis by search query
  const filteredKanjis = kanjis.filter((kanji) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      kanji.character.includes(searchQuery) ||
      kanji.meaning.toLowerCase().includes(searchLower) ||
      kanji.onyomi?.toLowerCase().includes(searchLower) ||
      kanji.kunyomi?.toLowerCase().includes(searchLower)
    );
  });

  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <LoadingCat
            size="xl"
            isDark={true}
            message="Đang tải"
            subMessage="Vui lòng đợi trong giây lát"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 5px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 5px;
          transition: background 0.2s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 10px;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 5px;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 5px;
          transition: background 0.2s;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <div
        className={`flex h-screen ${isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
          }`}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative z-0">
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          {/* Banner Section */}
          <div
            className={`${isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
              } border-b px-6 py-6`}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl">
                  <Book className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
                      }`}
                  >
                    Luyện tập Kanji
                  </h1>
                  <p
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    Chọn một chữ Kanji để bắt đầu luyện tập viết
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm kanji theo chữ, nghĩa, âm đọc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                    } focus:outline-none focus:ring-2 focus:ring-cyan-400 transition`}
                />
              </div>

              {/* Stats */}
              <div className="mt-4 flex gap-4">
                <div
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                >
                  <span
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    Tổng số:{" "}
                  </span>
                  <span
                    className={`font-bold ${isDarkMode ? "text-cyan-400" : "text-cyan-600"
                      }`}
                  >
                    {kanjis.length}
                  </span>
                </div>
                {searchQuery && (
                  <div
                    className={`px-4 py-2 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                  >
                    <span
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                      Kết quả:{" "}
                    </span>
                    <span
                      className={`font-bold ${isDarkMode ? "text-cyan-400" : "text-cyan-600"
                        }`}
                    >
                      {filteredKanjis.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kanji Content */}
          <div
            className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar"
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingCat
                  size="lg"
                  isDark={isDarkMode}
                  message="Đang tải kanji"
                  subMessage="Vui lòng đợi trong giây lát"
                />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle
                    className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-cyan-400" : "text-cyan-500"
                      }`}
                  />
                  <p
                    className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                  >
                    Không thể tải danh sách kanji
                  </p>
                  <p
                    className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    {error}
                  </p>
                  <button
                    onClick={loadKanjis}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:shadow-lg transition"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : filteredKanjis.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Book
                    className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-cyan-400"
                      }`}
                  />
                  <p
                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    {searchQuery
                      ? "Không tìm thấy kanji nào"
                      : "Chưa có kanji nào"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredKanjis.map((kanji) => (
                  <KanjiCard
                    key={kanji.id}
                    kanji={kanji}
                    isDark={isDarkMode}
                    onClick={() => handleKanjiClick(kanji.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
