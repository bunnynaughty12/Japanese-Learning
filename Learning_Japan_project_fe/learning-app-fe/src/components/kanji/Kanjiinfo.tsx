"use client";

import { KanjiResponse } from "@/services/kanjiService";

interface Props {
  kanji: KanjiResponse;
  isDarkMode?: boolean;
}

export default function KanjiInfo({ kanji, isDarkMode = false }: Props) {
  return (
    <div
      className={`mb-8 p-6 rounded-xl shadow-lg ${
        isDarkMode
          ? "bg-gray-800 border border-gray-700"
          : "bg-white border border-cyan-100"
      }`}
    >
      <div className="flex items-center justify-center mb-4">
        <h1
          className={`text-8xl font-bold ${
            isDarkMode ? "text-gray-100" : "text-gray-800"
          }`}
        >
          {kanji.character}
        </h1>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? "bg-gray-700/50" : "bg-cyan-50"
          }`}
        >
          <p
            className={`text-xs font-semibold mb-1 ${
              isDarkMode ? "text-gray-400" : "text-cyan-600"
            }`}
          >
            MEANING
          </p>
          <p className="text-lg font-medium">{kanji.meaning}</p>
        </div>

        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? "bg-gray-700/50" : "bg-blue-50"
          }`}
        >
          <p
            className={`text-xs font-semibold mb-1 ${
              isDarkMode ? "text-gray-400" : "text-blue-600"
            }`}
          >
            ONYOMI
          </p>
          <p className="text-lg font-medium">{kanji.onyomi || "-"}</p>
        </div>

        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? "bg-gray-700/50" : "bg-indigo-50"
          }`}
        >
          <p
            className={`text-xs font-semibold mb-1 ${
              isDarkMode ? "text-gray-400" : "text-indigo-600"
            }`}
          >
            KUNYOMI
          </p>
          <p className="text-lg font-medium">{kanji.kunyomi || "-"}</p>
        </div>
      </div>

      {/* ✅ đổi strokes → svgStrokes */}
      {kanji.svgStrokes && (
        <div
          className={`mt-4 text-center text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Expected strokes: {kanji.svgStrokes.length}
        </div>
      )}
    </div>
  );
}
