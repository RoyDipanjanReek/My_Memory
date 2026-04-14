"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HighlightedText from "@/components/HighlightedText";
import TagBadge from "@/components/TagBadge";
import type { TemplateRecord } from "@/types/template.types";
import {
  classNames,
  formatUsageCount,
  rankTemplates,
  truncateText
} from "@/utils/helpers";

type CommandPaletteProps = {
  isOpen: boolean;
  templates: TemplateRecord[];
  onClose: () => void;
  onCopy: (template: TemplateRecord) => Promise<void>;
  onView: (template: TemplateRecord) => void;
};

export default function CommandPalette({
  isOpen,
  templates,
  onClose,
  onCopy,
  onView
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(
    () => rankTemplates(templates.filter((template) => !template.archived), query).slice(0, 8),
    [query, templates]
  );

  const activeTemplate = results[activeIndex] ?? null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setQuery("");
    setActiveIndex(0);

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 20);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, results.length]);

  if (!isOpen) {
    return null;
  }

  const handleCopy = async (template: TemplateRecord) => {
    await onCopy(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm sm:p-6">
      <button
        aria-label="Close command palette"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />

      <div className="relative flex min-h-full items-center justify-center py-8 sm:py-10">
        <div
          aria-label="Command palette"
          aria-modal="true"
          className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 lg:h-[min(760px,calc(100vh-5rem))] lg:grid-cols-[minmax(0,1fr)_380px]"
          role="dialog"
        >
          <div className="min-h-0 border-b border-slate-200 p-4 dark:border-slate-800 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-200 ease-out focus-within:border-[rgb(var(--accent-rgb))] focus-within:ring-2 focus-within:ring-[rgba(var(--accent-rgb),0.18)] dark:border-slate-700 dark:bg-slate-900">
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                aria-autocomplete="list"
                aria-controls="command-palette-results"
                aria-label="Search memories"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={async (event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((current) =>
                      results.length === 0 ? 0 : (current + 1) % results.length
                    );
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((current) =>
                      results.length === 0
                        ? 0
                        : (current - 1 + results.length) % results.length
                    );
                  }

                  if (event.key === "Enter" && activeTemplate) {
                    event.preventDefault();
                    await handleCopy(activeTemplate);
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    onClose();
                  }
                }}
                placeholder="Search or type to copy instantly..."
                ref={inputRef}
                value={query}
              />
              <kbd className="hidden rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 sm:block">
                Enter
              </kbd>
            </div>

            <div
              className="mt-4 overflow-y-auto lg:max-h-full"
              id="command-palette-results"
              role="listbox"
            >
              {results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No memory matches that query.
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((template, index) => {
                    const isActive = index === activeIndex;

                    return (
                      <button
                        aria-selected={isActive}
                        className={classNames(
                          "pressable w-full rounded-2xl border px-4 py-3 text-left",
                          isActive
                            ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.08)] shadow-[0_10px_24px_-20px_rgba(var(--accent-rgb),0.5)]"
                            : "border-transparent hover:border-[rgba(var(--accent-rgb),0.35)] hover:bg-slate-50 dark:hover:bg-slate-900"
                        )}
                        id={`command-result-${template.id}`}
                        key={template.id}
                        onClick={() => setActiveIndex(index)}
                        onDoubleClick={() => onView(template)}
                        role="option"
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              <HighlightedText query={query} text={template.title} />
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              <HighlightedText
                                query={query}
                                text={truncateText(template.content, 76)}
                              />
                            </p>
                          </div>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {template.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="relative hidden min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-[#020817] lg:block">
            {activeTemplate ? (
              <>
                <button
                  className="pressable absolute right-5 top-5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  onClick={() => void handleCopy(activeTemplate)}
                  type="button"
                >
                  Copy
                </button>

                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Preview
                </p>
                <h3 className="mt-2 pr-20 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  <HighlightedText query={query} text={activeTemplate.title} />
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {activeTemplate.tags.map((tag) => (
                    <TagBadge compact key={tag} label={tag} />
                  ))}
                </div>

                <div
                  className={classNames(
                    "mt-5 rounded-3xl border p-5",
                    activeTemplate.category === "code"
                      ? "border-slate-200 bg-slate-950 dark:border-slate-700 dark:bg-black"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                  )}
                >
                  <pre
                    className={classNames(
                      "text-[15px] leading-relaxed",
                      activeTemplate.category === "code"
                        ? "font-mono text-slate-100"
                        : "text-slate-700 dark:text-slate-200"
                    )}
                  >
                    <HighlightedText query={query} text={activeTemplate.content} />
                  </pre>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatUsageCount(activeTemplate.usageCount)}</span>
                  <button
                    className="font-medium text-[rgb(var(--accent-rgb))]"
                    onClick={() => {
                      onView(activeTemplate);
                      onClose();
                    }}
                    type="button"
                  >
                    Open details
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
