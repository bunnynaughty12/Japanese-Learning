"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { kanjiService, KanjiResponse } from "@/services/kanjiService";
import KanjiCanvas from "@/components/kanji/Kanjicanvas";
import KanjiInfo from "@/components/kanji/Kanjiinfo";
import Sidebar from "@/components/Sidebar";
import { useDarkMode } from "@/hooks/useDarkMode";
import Header from "@/components/Header";
import LoadingCat from "@/components/LoadingCat";
import MaziAIChat from "@/components/NiboChatAI";
import { ArrowLeft, AlertCircle, PenTool } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function KanjiPractice({ params }: PageProps) {
  const router = useRouter();
  const [kanjiId, setKanjiId] = useState<string | null>(null);
  const [kanji, setKanji] = useState<KanjiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    params.then(({ id }) => setKanjiId(id));
  }, [params]);

  const loadKanji = useCallback(async () => {
    if (!kanjiId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await kanjiService.getById(kanjiId);
      setKanji(data);
    } catch (err) {
      setError("Không thể tải kanji. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [kanjiId]);

  useEffect(() => {
    if (!kanjiId) return;
    loadKanji();
  }, [kanjiId, loadKanji]);

  // onCheck now receives user-drawn SVG path strings
  const handleCheck = useCallback((userPaths: string[]) => {
    console.log("User strokes submitted:", userPaths);
    // TODO: send to API for comparison
  }, []);

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
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <div
        className={`flex h-screen ${
          isDarkMode
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

          <div
            className={`flex-1 overflow-y-auto ${
              isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar"
            }`}
          >
            <div className="max-w-5xl mx-auto px-6 py-8">
              {loading ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <LoadingCat
                    size="lg"
                    isDark={isDarkMode}
                    message="Đang tải kanji"
                    subMessage="Vui lòng đợi trong giây lát"
                  />
                </div>
              ) : error || !kanji ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="text-center">
                    <AlertCircle
                      className={`w-12 h-12 mx-auto mb-4 ${
                        isDarkMode ? "text-cyan-400" : "text-cyan-500"
                      }`}
                    />
                    <p
                      className={`text-lg font-medium mb-2 ${
                        isDarkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {error || "Không tìm thấy kanji"}
                    </p>
                    <button
                      onClick={() => router.push("/kanji")}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:shadow-lg transition"
                    >
                      Quay lại danh sách
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <button
                      onClick={() => router.push("/kanji")}
                      className={`flex items-center gap-2 mb-6 group ${
                        isDarkMode
                          ? "text-cyan-400 hover:text-cyan-300"
                          : "text-cyan-600 hover:text-cyan-700"
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition" />
                      <span className="font-medium">
                        Quay lại danh sách Kanji
                      </span>
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl">
                        <PenTool className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1
                          className={`text-3xl font-bold ${
                            isDarkMode ? "text-gray-100" : "text-gray-800"
                          }`}
                        >
                          Luyện viết Kanji
                        </h1>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Xem hướng dẫn từng nét, sau đó tự vẽ bên dưới
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <KanjiInfo kanji={kanji} isDarkMode={isDarkMode} />
                  </div>

                  <div
                    className={`${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    } rounded-2xl shadow-lg p-8 mb-6 border`}
                  >
                    <div className="mb-6 text-center">
                      <h2
                        className={`text-2xl font-bold mb-1 ${
                          isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}
                      >
                        Hướng dẫn & Luyện viết
                      </h2>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Nhấn{" "}
                        <span className="font-semibold text-cyan-500">
                          Xem hướng dẫn
                        </span>{" "}
                        để xem animation từng nét, rồi tự vẽ theo
                      </p>
                    </div>

                    {/* Pass svgStrokes (string[]) directly — no more PointDTO */}
                    <KanjiCanvas
                      isDarkMode={isDarkMode}
                      svgStrokes={kanji.svgStrokes}
                      onCheck={handleCheck}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <MaziAIChat isDarkMode={isDarkMode} />
    </>
  );
}
