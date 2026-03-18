"use client";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";

export function useDarkMode() {
  const [mounted, setMounted] = useState(false);
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  useEffect(() => {
    // Set mounted để tránh hydration error
    setMounted(true);

    // Áp dụng class dark vào html element
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode, mounted };
}
