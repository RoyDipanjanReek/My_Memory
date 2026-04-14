"use client";

import { classNames } from "@/utils/helpers";

type TagBadgeProps = {
  label: string;
  tone?: "neutral" | "accent";
  compact?: boolean;
};

export default function TagBadge({
  label,
  tone = "neutral",
  compact = false
}: TagBadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border text-xs font-medium",
        compact ? "px-2 py-0.5" : "px-2.5 py-1",
        tone === "accent"
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      )}
    >
      #{label}
    </span>
  );
}
