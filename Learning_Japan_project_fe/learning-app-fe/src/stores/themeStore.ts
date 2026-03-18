import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ThemeState {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDarkMode: false, // Default to light mode
            toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
            setDarkMode: (isDark: boolean) => set({ isDarkMode: isDark }),
        }),
        {
            name: "theme-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
