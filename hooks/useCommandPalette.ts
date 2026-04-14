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
