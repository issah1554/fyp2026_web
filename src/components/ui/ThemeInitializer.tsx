"use client";

import { useEffect } from "react";

export const THEME_STORAGE_KEY = "theme";

export const themeOptions = [
  { value: "light", label: "Light", description: "Clean neutral workspace" },
  { value: "dark", label: "Dark", description: "Low-light workspace" },
  { value: "midnight", label: "Midnight", description: "Deep blue operational view" },
  { value: "forest", label: "Forest", description: "Green focused workspace" },
  { value: "rose", label: "Rose", description: "Warm rose workspace" },
] as const;

export type ThemeName = (typeof themeOptions)[number]["value"];

export function isThemeName(value: string | null): value is ThemeName {
  return themeOptions.some((theme) => theme.value === value);
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeInitializer() {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(isThemeName(storedTheme) ? storedTheme : "light");
  }, []);

  return null;
}
