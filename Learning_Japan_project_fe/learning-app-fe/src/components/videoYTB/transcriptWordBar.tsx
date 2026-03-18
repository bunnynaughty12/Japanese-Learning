"use client";

import React from "react";
import HoverTranslateWord from "./HoverTranslateWord";
import { TranscriptDTO } from "@/services/transcriptService";

interface TranscriptWordBarProps {
  transcripts: TranscriptDTO[];
  currentTimeMs: number;
  videoId?: string;
  onVocabSaved?: () => void;
  isDarkMode?: boolean;
}

export default function TranscriptWordBar({
  transcripts,
  currentTimeMs,
  videoId,
  onVocabSaved,
  isDarkMode = false,
}: TranscriptWordBarProps) {
  // Tìm transcript hiện tại
  const currentTranscript = transcripts.find(
    (t) => currentTimeMs >= t.startOffset && currentTimeMs < t.endOffset
  );

  // Hàm tách từ - tách theo khoảng trắng và giữ lại dấu câu
  const tokenizeText = (text: string) => {
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    return words;
  };

  // Tính toán từ nào đang được highlight (dựa trên thời gian)
  const getHighlightedWordIndex = () => {
    if (!currentTranscript) return -1;

    const words = tokenizeText(currentTranscript.text);
    const duration =
      currentTranscript.endOffset - currentTranscript.startOffset;
    const durationPerWord = duration / words.length;
    const elapsed = currentTimeMs - currentTranscript.startOffset;

    const wordIndex = Math.floor(elapsed / durationPerWord);
    return Math.min(wordIndex, words.length - 1);
  };

  const highlightedIndex = getHighlightedWordIndex();

  return (
    <div
      className={`rounded-2xl shadow-lg p-6 min-h-[120px] flex items-center justify-center ${isDarkMode
          ? "bg-gradient-to-r from-gray-800 to-gray-900"
          : "bg-gradient-to-r from-slate-800 to-slate-900"
        }`}
    >
      {currentTranscript ? (
        /* Text with word-by-word highlight - Large size with cyan/blue theme */
        <div className="text-2xl leading-relaxed font-medium w-full">
          {tokenizeText(currentTranscript.text).map((word, idx) => {
            const isHighlighted = idx === highlightedIndex;

            return (
              <React.Fragment key={idx}>
                <span
                  className={`inline-block transition-all duration-300 ${isHighlighted
                      ? isDarkMode
                        ? "text-cyan-300 font-bold scale-110 underline decoration-cyan-300 decoration-2 underline-offset-4"
                        : "text-cyan-400 font-bold scale-110 underline decoration-cyan-400 decoration-2 underline-offset-4"
                      : "text-white"
                    }`}
                >
                  <HoverTranslateWord
                    word={word}
                    sourceLang="ja"
                    targetLang="vi"
                    videoId={videoId}
                    onVocabSaved={onVocabSaved}
                    isDarkMode={isDarkMode}
                  />
                </span>
                {idx < tokenizeText(currentTranscript.text).length - 1 && " "}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        /* Placeholder khi chưa có transcript */
        <div className="text-gray-400 text-lg italic text-center">
          Phụ đề sẽ hiển thị tại đây...
        </div>
      )}
    </div>
  );
}
