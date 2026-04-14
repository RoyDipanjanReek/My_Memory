"use client";

import { highlightMatch } from "@/utils/helpers";

type HighlightedTextProps = {
  text: string;
  query: string;
  className?: string;
};

export default function HighlightedText({
  text,
  query,
  className
}: HighlightedTextProps) {
  return (
    <span className={className}>
      {highlightMatch(text, query).map((part, index) => (
        <span
          className={
            part.match
              ? "rounded-sm bg-[rgba(var(--accent-rgb),0.16)] px-0.5 text-slate-950 dark:text-white"
              : undefined
          }
          key={`${part.text}-${index}`}
        >
          {part.text}
        </span>
      ))}
    </span>
  );
}
