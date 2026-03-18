"use client";
import React, { useState } from "react";
interface WordProps {
  word: string;
  onSave: (word: string) => void;
}
export const Word: React.FC<WordProps> = ({ word, onSave }) => {
  const [meaning, setMeaning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleHover = async () => {
    if (meaning || loading) return;
    setLoading(true);
    const res = await fetch("/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: word }),
    });
    const data = await res.json();
    setMeaning(data.translation);
    setLoading(false);
  };
  return (
    <span
      onMouseEnter={handleHover}
      onClick={() => onSave(word)}
      className="relative cursor-pointer px-1 rounded hover:bg-yellow-200"
    >
      {" "}
      {word}{" "}
      {meaning && (
        <span className="absolute top-full left-0 mt-1 bg-black text-white text-xs px-2 py-1 rounded z-50">
          {" "}
          {meaning}{" "}
        </span>
      )}{" "}
    </span>
  );
};
