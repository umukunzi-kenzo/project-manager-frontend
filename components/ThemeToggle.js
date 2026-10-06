"use client";

import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative group"
      aria-label="Toggle theme"
    >
      <div className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105">
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-yellow-400 transition-all duration-300" />
        ) : (
          <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-all duration-300" />
        )}
      </div>
    </button>
  );
}