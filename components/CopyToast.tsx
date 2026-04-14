// Copy Toast Notification Component
// Displays success notification when content is copied to clipboard
// Auto-dismisses after a few seconds
"use client";

import { classNames } from "@/utils/helpers";

type CopyToastProps = {
  message: string;
  tone?: "success" | "error";
};

export default function CopyToast({
  message,
  tone = "success"
}: CopyToastProps) {
  return (
    <div
      className={classNames(
        "fixed bottom-5 right-5 z-[70] rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur motion-safe:animate-toast-pop",
        tone === "success"
          ? "border-emerald-200 bg-white/95 text-slate-900 dark:border-emerald-500/30 dark:bg-slate-950/95 dark:text-slate-100"
          : "border-rose-200 bg-white/95 text-slate-900 dark:border-rose-500/30 dark:bg-slate-950/95 dark:text-slate-100"
      )}
    >
      {message}
    </div>
  );
}
