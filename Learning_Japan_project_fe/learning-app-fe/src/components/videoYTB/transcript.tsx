"use client";
import React from "react";
import { tokenizeJapanese } from "@/utils/japaneseTokenizer";
import { Word } from "./word";

interface TranscriptProps {
  text: string;
  onSaveWord: (word: string) => void;
}

export const Transcript: React.FC<TranscriptProps> = ({ text, onSaveWord }) => {
  const words = tokenizeJapanese(text);

  return (
    <div className="bg-black text-white p-3 flex flex-wrap gap-1">
      {words.map((word, idx) => (
        <Word key={idx} word={word} onSave={onSaveWord} />
      ))}
    </div>
  );
};
