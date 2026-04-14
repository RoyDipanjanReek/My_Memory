// useCommandPalette Hook
// Manages command palette visibility state and keyboard shortcuts
// Handles opening/closing the command palette UI
"use client";

import { useCallback, useState } from "react";

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    openPalette: useCallback(() => setIsOpen(true), []),
    closePalette: useCallback(() => setIsOpen(false), []),
    togglePalette: useCallback(() => setIsOpen((current) => !current), [])
  };
}
