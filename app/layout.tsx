import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Developer Memory",
  description: "A frictionless developer memory system for templates, snippets, and notes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
