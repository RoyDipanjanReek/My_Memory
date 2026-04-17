// Search Bar Component
// Provides main search input for filtering and finding templates
// Handles real-time search query updates and submission
"use client";

import type { KeyboardEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  TemplateCollectionSummary,
  ThemeAccent,
  TemplateView
} from "@/types/template.types";
import { classNames } from "@/utils/helpers";

type SearchBarProps = {
  query: string;
  isLoading: boolean;
  isLoggingOut: boolean;
  resultCount: number;
  theme: "light" | "dark";
  accent: ThemeAccent;
  viewMode: "grid" | "list";
  activeView: TemplateView;
  collectionFilter: string;
  collections: TemplateCollectionSummary[];
  searchInputRef: RefObject<HTMLInputElement>;
  onQueryChange: (value: string) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onThemeToggle: () => void;
  onAccentChange: (accent: ThemeAccent) => void;
  onToggleSidebar: () => void;
  onViewModeChange: (value: "grid" | "list") => void;
  onOpenPalette: () => void;
  onCreateTemplate: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onActiveViewChange: (view: TemplateView) => void;
  onCollectionFilterChange: (value: string) => void;
  onLogout: () => void;
};

const VIEW_OPTIONS: Array<{ value: TemplateView; label: string }> = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  { value: "pinned", label: "Pinned" },
  { value: "copied", label: "Recently copied" },
  { value: "valuable", label: "Most valuable" },
  { value: "archived", label: "Archived" }
];

const ACCENTS: ThemeAccent[] = ["amber", "emerald", "rose"];

export default function SearchBar({
  query,
  isLoading,
  isLoggingOut,
  resultCount,
  theme,
  accent,
  viewMode,
  activeView,
  collectionFilter,
  collections,
  searchInputRef,
  onQueryChange,
  onSearchKeyDown,
  onThemeToggle,
  onAccentChange,
  onToggleSidebar,
  onViewModeChange,
  onOpenPalette,
  onCreateTemplate,
  onExport,
  onImport,
  onActiveViewChange,
  onCollectionFilterChange,
  onLogout
}: SearchBarProps) {
  const [draftQuery, setDraftQuery] = useState(query);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onQueryChange(draftQuery);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [draftQuery, onQueryChange]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
          <div className="flex flex-1 items-center gap-2">
            <button
              className="pressable inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={onToggleSidebar}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>

            <div className="group relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                aria-label="Search memories"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 ease-out placeholder:text-slate-400 focus:border-[rgb(var(--accent-rgb))] focus:bg-white focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.18)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
                onChange={(event) => setDraftQuery(event.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search or type to copy instantly..."
                ref={searchInputRef}
                value={draftQuery}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="pressable inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              onClick={onOpenPalette}
              type="button"
            >
              <span>Command</span>
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                Ctrl K
              </kbd>
            </button>

            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:flex dark:border-slate-700 dark:bg-slate-900">
              <button
                className={classNames(
                  "rounded-xl px-3 py-2 text-xs font-medium transition duration-150",
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => onViewModeChange("grid")}
                type="button"
              >
                Grid
              </button>
              <button
                className={classNames(
                  "rounded-xl px-3 py-2 text-xs font-medium transition duration-150",
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => onViewModeChange("list")}
                type="button"
              >
                List
              </button>
            </div>

            <div className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 md:flex dark:border-slate-700 dark:bg-slate-900">
              {ACCENTS.map((value) => (
                <button
                  aria-label={`Use ${value} accent`}
                  className={classNames(
                    "h-8 w-8 rounded-xl border transition duration-150",
                    accent === value
                      ? "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                      : "border-transparent bg-transparent"
                  )}
                  key={value}
                  onClick={() => onAccentChange(value)}
                  style={{
                    backgroundColor:
                      value === "amber"
                        ? "rgba(223,139,61,0.22)"
                        : value === "emerald"
                          ? "rgba(52,168,111,0.2)"
                          : "rgba(224,111,138,0.2)"
                  }}
                  type="button"
                />
              ))}
            </div>

            <button
              aria-label="Toggle theme"
              className="pressable inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              onClick={onThemeToggle}
              type="button"
            >
              {theme === "dark" ? (
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <button
              className="pressable inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              onClick={onExport}
              type="button"
            >
              Backup
            </button>

            <input
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onImport(file);
                  event.currentTarget.value = "";
                }
              }}
              ref={fileInputRef}
              type="file"
            />
            <button
              className="pressable inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Import
            </button>

            <button
              className="pressable inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white hover:-translate-y-0.5 dark:bg-[rgb(var(--accent-rgb))]"
              onClick={onCreateTemplate}
              type="button"
            >
              Paste memory
            </button>

            <button
              className="pressable inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
              disabled={isLoggingOut}
              onClick={onLogout}
              type="button"
            >
              {isLoggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              className={classNames(
                "pressable rounded-full border px-3 py-2 text-xs font-medium",
                activeView === option.value
                  ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.1)] text-slate-900 dark:text-slate-100"
                  : "border-slate-200 bg-white text-slate-500 hover:border-[rgb(var(--accent-rgb))] hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              )}
              key={option.value}
              onClick={() => onActiveViewChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {collections.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={classNames(
                "pressable rounded-full border px-3 py-1.5 text-xs font-medium",
                !collectionFilter
                  ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.1)] text-slate-900 dark:text-slate-100"
                  : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              )}
              onClick={() => onCollectionFilterChange("")}
              type="button"
            >
              All collections
            </button>
            {collections.map((collection) => (
              <button
                className={classNames(
                  "pressable rounded-full border px-3 py-1.5 text-xs font-medium",
                  collectionFilter === collection.name
                    ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.1)] text-slate-900 dark:text-slate-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-[rgb(var(--accent-rgb))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                )}
                key={collection.name}
                onClick={() => onCollectionFilterChange(collection.name)}
                type="button"
              >
                {collection.name}
                <span className="ml-1 text-slate-400">({collection.count})</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>{resultCount} results</span>
            <span>Arrow keys navigate</span>
            <span>Enter copies</span>
            <span>/ focuses search</span>
          </div>
          <span
            className={classNames(
              "rounded-full px-2.5 py-1 transition duration-150",
              isLoading
                ? "bg-[rgba(var(--accent-rgb),0.1)] text-slate-700 dark:text-slate-200"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            {isLoading ? "Syncing" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
