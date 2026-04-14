// Root Layout Component
// Provides HTML structure and global setup for the entire application
// Handles theme persistence and metadata

import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

// Global metadata for the application
export const metadata: Metadata = {
  title: "Developer Memory",
  description: "A frictionless developer memory system for templates, snippets, and notes."
};

/**
 * Root layout component - wraps entire application
 * Initializes theme from localStorage on page load to prevent flashing
 * @param children - Child components/pages to render
 */
export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 
          Script that runs before React hydration to apply saved theme
          This prevents the theme from flashing on page load
          Checks localStorage for saved theme preference, falls back to system preference
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var storedTheme = localStorage.getItem("template-manager-theme");
                  var storedAccent = localStorage.getItem("template-manager-accent");
                  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var shouldUseDark = storedTheme ? storedTheme === "dark" : systemDark;
                  document.documentElement.classList.toggle("dark", shouldUseDark);
                  document.documentElement.dataset.accent = storedAccent || "amber";
                } catch (error) {}
              })();
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
