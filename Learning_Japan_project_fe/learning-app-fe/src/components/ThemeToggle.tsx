"use client";
import React from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
  className?: string;
}

export default function ThemeToggle({
  isDarkMode,
  onToggle,
  className = "",
}: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative p-2 rounded-lg transition-all duration-300 ${
        isDarkMode
          ? "hover:bg-gray-700 bg-gray-800"
          : "hover:bg-gray-100 bg-white"
      } ${className}`}
      aria-label={
        isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"
      }
      title={isDarkMode ? "Chế độ sáng" : "Chế độ tối"}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun
          className={`absolute inset-0 w-5 h-5 text-yellow-400 transition-all duration-300 ${
            isDarkMode
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100"
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-300 ${
            isDarkMode
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}
