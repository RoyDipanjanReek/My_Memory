// Sidebar Component
// Displays navigation, filters, and collections for template management
// Provides quick access to template views and filtering options
"use client";

import { useMemo, useState } from "react";
import HighlightedText from "@/components/HighlightedText";
import type {
  TemplateCollectionSummary,
  TemplateRecord,
  TemplateView
} from "@/types/template.types";
import {
  classNames,
  formatRelativeDate,
  formatUsageCount,
  getFrequentTemplates,
  getRecentTemplates,
  getRecentlyCopiedTemplates
} from "@/utils/helpers";

type SidebarProps = {
  templates: TemplateRecord[];
  collections: TemplateCollectionSummary[];
  activeTemplateId: string | null;
  activeView: TemplateView;
  query: string;
  collectionFilter: string;
  onSelect: (template: TemplateRecord) => void;
  onCreateTemplate: () => void;
  onOpenPalette: () => void;
  onViewChange: (view: TemplateView) => void;
  onCollectionChange: (value: string) => void;
  onClose?: () => void;
};

type SectionProps = {
  title: string;
  templates: TemplateRecord[];
  activeTemplateId: string | null;
  query: string;
  onSelect: (template: TemplateRecord) => void;
};

function Section({
  title,
  templates,
  activeTemplateId,
  query,
  onSelect
}: SectionProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="px-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {templates.map((template) => {
          const isActive = activeTemplateId === template.id;

          return (
            <button
              className={classNames(
                "surface-hover w-full rounded-2xl border-l-[3px] px-3 py-3 text-left pressable",
                isActive
                  ? "border-l-[rgb(var(--accent-rgb))] border-r-slate-200 border-y-slate-200 bg-white shadow-[0_16px_28px_-24px_rgba(15,23,42,0.4)] dark:border-r-slate-800 dark:border-y-slate-800 dark:bg-slate-900"
                  : "border-l-transparent border-r-transparent border-y-transparent hover:border-r-white hover:border-y-white hover:bg-white/80 dark:hover:border-r-slate-800 dark:hover:border-y-slate-800 dark:hover:bg-slate-900/80"
              )}
              key={`${title}-${template.id}`}
              onClick={() => onSelect(template)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className={classNames(
                    "truncate text-sm text-slate-900 dark:text-slate-100",
                    isActive ? "font-semibold" : "font-medium"
                  )}
                >
                  <HighlightedText query={query} text={template.title} />
                </p>
                <div className="flex items-center gap-1">
                  {template.favorite ? (
                    <span className="text-amber-500" aria-hidden="true">
                      ★
                    </span>
                  ) : null}
                  {template.pinned ? (
                    <span className="text-[rgb(var(--accent-rgb))]" aria-hidden="true">
                      ⌘
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatUsageCount(template.usageCount)}
              </p>
              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                {formatRelativeDate(template.lastCopiedAt ?? template.lastUsed ?? template.updatedAt)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const VIEW_BUTTONS: Array<{ value: TemplateView; label: string }> = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  { value: "pinned", label: "Pinned" },
  { value: "copied", label: "Copied" },
  { value: "valuable", label: "Valuable" }
];

export default function Sidebar({
  templates,
  collections,
  activeTemplateId,
  activeView,
  query,
  collectionFilter,
  onSelect,
  onCreateTemplate,
  onOpenPalette,
  onViewChange,
  onCollectionChange,
  onClose
}: SidebarProps) {
  const [sidebarQuery, setSidebarQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    const value = sidebarQuery.trim().toLowerCase();

    if (!value) {
      return templates;
    }

    return templates.filter((template) =>
      `${template.title} ${template.tags.join(" ")} ${template.collections.join(" ")} ${template.content}`
        .toLowerCase()
        .includes(value)
    );
  }, [sidebarQuery, templates]);

  const recentTemplates = useMemo(
    () => getRecentTemplates(filteredTemplates.filter((template) => !template.archived), 5),
    [filteredTemplates]
  );

  const copiedTemplates = useMemo(
    () => getRecentlyCopiedTemplates(filteredTemplates.filter((template) => !template.archived), 5),
    [filteredTemplates]
  );

  const quickAccessTemplates = useMemo(
    () =>
      getFrequentTemplates(
        filteredTemplates.filter((template) => template.usageCount > 0 && !template.archived),
        5
      ),
    [filteredTemplates]
  );

  const timelineTemplates = useMemo(
    () =>
      filteredTemplates.filter(
        (template) =>
          !template.archived &&
          !recentTemplates.some((item) => item.id === template.id) &&
          !copiedTemplates.some((item) => item.id === template.id) &&
          !quickAccessTemplates.some((item) => item.id === template.id)
      ),
    [copiedTemplates, filteredTemplates, quickAccessTemplates, recentTemplates]
  );

  return (
    <aside className="flex h-full flex-col rounded-3xl border border-slate-200 bg-[#f3f5f8] p-3 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="mb-3 flex items-center justify-between gap-3 px-2 pt-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Developer Memory
          </p>
          <h1 className="mt-1 text-base font-semibold">Timeline</h1>
        </div>

        <div className="flex items-center gap-2">
          {onClose ? (
            <button
              className="pressable inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              onClick={onClose}
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
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
          <button
            className="pressable rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={onCreateTemplate}
            type="button"
          >
            Paste
          </button>
        </div>
      </div>

      <div className="mb-3 space-y-2 px-2">
        <div className="relative">
          <input
            className="h-10 w-full rounded-2xl border border-transparent bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition duration-150 placeholder:text-slate-400 focus:border-[rgb(var(--accent-rgb))] focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.16)] dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            onChange={(event) => setSidebarQuery(event.target.value)}
            placeholder="Search timeline"
            value={sidebarQuery}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 dark:text-slate-500">
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
        </div>

        <button
          className="pressable flex w-full items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-white/80 px-3 py-2 text-left text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
          onClick={onOpenPalette}
          type="button"
        >
          <span>Open command palette</span>
          <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-950">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 px-2">
        {VIEW_BUTTONS.map((view) => (
          <button
            className={classNames(
              "pressable rounded-full border px-3 py-1.5 text-[11px] font-medium",
              activeView === view.value
                ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.1)] text-slate-900 dark:text-slate-100"
                : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            )}
            key={view.value}
            onClick={() => onViewChange(view.value)}
            type="button"
          >
            {view.label}
          </button>
        ))}
      </div>

      {collections.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2 px-2">
          <button
            className={classNames(
              "pressable rounded-full border px-3 py-1.5 text-[11px] font-medium",
              !collectionFilter
                ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.1)] text-slate-900 dark:text-slate-100"
                : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            )}
            onClick={() => onCollectionChange("")}
            type="button"
          >
            All
          </button>
          {collections.slice(0, 6).map((collection) => (
            <button
              className={classNames(
                "pressable rounded-full border px-3 py-1.5 text-[11px] font-medium",
                collectionFilter === collection.name
                  ? "border-[rgb(var(--accent-rgb))] bg-[rgba(var(--accent-rgb),0.1)] text-slate-900 dark:text-slate-100"
                  : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              )}
              key={collection.name}
              onClick={() => onCollectionChange(collection.name)}
              type="button"
            >
              {collection.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mb-3 rounded-2xl border border-white bg-white/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {filteredTemplates.length} memories indexed
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <Section
          activeTemplateId={activeTemplateId}
          onSelect={onSelect}
          query={query || sidebarQuery}
          templates={recentTemplates}
          title="Recent"
        />
        <Section
          activeTemplateId={activeTemplateId}
          onSelect={onSelect}
          query={query || sidebarQuery}
          templates={copiedTemplates}
          title="Recently Copied"
        />
        <Section
          activeTemplateId={activeTemplateId}
          onSelect={onSelect}
          query={query || sidebarQuery}
          templates={quickAccessTemplates}
          title="Quick Access"
        />
        <Section
          activeTemplateId={activeTemplateId}
          onSelect={onSelect}
          query={query || sidebarQuery}
          templates={timelineTemplates.slice(0, 18)}
          title="Timeline"
        />

        {filteredTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-500">
            Paste something once and it becomes part of your memory timeline.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
