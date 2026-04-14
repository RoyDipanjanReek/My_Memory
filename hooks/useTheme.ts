// useTheme Hook
// Manages application theme (dark/light) and accent color preferences
// Persists user preferences to localStorage for persistence across sessions
"use client";

import { useEffect, useState } from "react";
import type { ThemeAccent } from "@/types/template.types";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "template-manager-theme";
const ACCENT_STORAGE_KEY = "template-manager-accent";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [accent, setAccent] = useState<ThemeAccent>("amber");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const storedAccent = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    const nextTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    setTheme(nextTheme);

    if (storedAccent === "amber" || storedAccent === "emerald" || storedAccent === "rose") {
      setAccent(storedAccent);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.accent = accent;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }, [accent, theme]);

  return {
    theme,
    accent,
    setAccent,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark"))
  };
}
