"use client";

import HighlightedText from "@/components/HighlightedText";
import TagBadge from "@/components/TagBadge";
import type { TemplateRecord } from "@/types/template.types";
import {
  classNames,
  formatRelativeDate,
  formatUsageCount,
  truncateText
} from "@/utils/helpers";

type CardProps = {
  template: TemplateRecord;
  viewMode: "grid" | "list";
  query: string;
  isActive?: boolean;
  isSelected?: boolean;
  isCopied?: boolean;
  onView: (template: TemplateRecord) => void;
  onCopy: (template: TemplateRecord) => void;
  onDelete: (template: TemplateRecord) => void;
  onArchive: (template: TemplateRecord) => void;
  onFavorite: (template: TemplateRecord) => void;
  onPin: (template: TemplateRecord) => void;
  onToggleSelect: (template: TemplateRecord) => void;
  onHover?: (template: TemplateRecord) => void;
};

export default function Card({
  template,
  viewMode,
  query,
  isActive = false,
  isSelected = false,
  isCopied = false,
  onView,
  onCopy,
  onDelete,
  onArchive,
  onFavorite,
  onPin,
  onToggleSelect,
  onHover
}: CardProps) {
  return (
    <article
      className={classNames(
        "group surface-hover pressable relative rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-950",
        isActive || isSelected
          ? "border-[rgb(var(--accent-rgb))] shadow-[0_20px_42px_-30px_rgba(var(--accent-rgb),0.45)] ring-1 ring-[rgba(var(--accent-rgb),0.22)]"
          : "border-slate-200 hover:border-[rgba(var(--accent-rgb),0.5)] dark:border-slate-800",
        viewMode === "list"
          ? "grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]"
          : "flex h-full flex-col"
      )}
      onMouseEnter={() => onHover?.(template)}
    >
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <button
          aria-label={template.pinned ? "Unpin memory" : "Pin memory"}
          className={classNames(
            "pressable inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm",
            template.pinned
              ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.1)] text-[rgb(var(--accent-rgb))]"
              : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900"
          )}
          onClick={() => onPin(template)}
          type="button"
        >
          ⌘
        </button>
        <button
          aria-label={template.favorite ? "Remove favorite" : "Favorite memory"}
          className={classNames(
            "pressable inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm",
            template.favorite
              ? "border-amber-200 bg-amber-50 text-amber-500 dark:border-amber-500/30 dark:bg-amber-500/10"
              : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900"
          )}
          onClick={() => onFavorite(template)}
          type="button"
        >
          ★
        </button>
        <button
          className={classNames(
            "pressable rounded-xl border px-3 py-2 text-xs font-medium",
            isCopied
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-slate-200 bg-white text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          )}
          onClick={() => onCopy(template)}
          type="button"
        >
          {isCopied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="min-w-0 pr-32">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {template.category}
          </p>
          {template.duplicateOf ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              deduped
            </span>
          ) : null}
        </div>
        <h2 className="mt-2 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
          <HighlightedText query={query} text={template.title} />
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {template.tags.length > 0 ? (
            template.tags.slice(0, viewMode === "list" ? 6 : 5).map((tag) => (
              <TagBadge
                compact
                key={tag}
                label={tag}
                tone={query && tag.includes(query.toLowerCase()) ? "accent" : "neutral"}
              />
            ))
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">No tags</span>
          )}
        </div>

        {template.collections.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {template.collections.map((collection) => (
              <span
                className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                key={collection}
              >
                {collection}
              </span>
            ))}
          </div>
        ) : null}

        <p
          className={classNames(
            "mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400",
            "[display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical]",
            viewMode === "list" ? "[-webkit-line-clamp:2]" : "[-webkit-line-clamp:3]"
          )}
        >
          <HighlightedText
            query={query}
            text={truncateText(template.content, viewMode === "list" ? 240 : 300)}
          />
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span>{formatUsageCount(template.usageCount)}</span>
          <span>{formatRelativeDate(template.lastCopiedAt ?? template.lastUsed ?? template.updatedAt)}</span>
          <span>{template.versionCount} versions</span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 opacity-100 transition duration-150 md:opacity-0 md:group-hover:opacity-100">
        <button
          className="pressable rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:text-slate-200"
          onClick={() => onView(template)}
          type="button"
        >
          View
        </button>
        <button
          className="pressable rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:text-slate-200"
          onClick={() => onArchive(template)}
          type="button"
        >
          {template.archived ? "Restore" : "Archive"}
        </button>
        <button
          className="pressable rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          onClick={() => onDelete(template)}
          type="button"
        >
          Delete
        </button>
        <button
          aria-label={isSelected ? "Deselect memory" : "Select memory"}
          className={classNames(
            "pressable ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm",
            isSelected
              ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.1)] text-slate-900 dark:text-slate-100"
              : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900"
          )}
          onClick={() => onToggleSelect(template)}
          type="button"
        >
          ✓
        </button>
      </div>
    </article>
  );
}
