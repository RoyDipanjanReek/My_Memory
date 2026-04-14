// Template Modal Component
// Modal dialog for viewing/editing template details
// Provides full template editing interface with version history
"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import HighlightedText from "@/components/HighlightedText";
import TagBadge from "@/components/TagBadge";
import type {
  TemplateCreateInput,
  TemplateRecord,
  TemplateUpdateInput
} from "@/types/template.types";
import {
  formatRelativeDate,
  formatUsageCount,
  inferTemplateMetadata,
  normalizeCollections,
  normalizeTags
} from "@/utils/helpers";

type TemplateModalProps = {
  isOpen: boolean;
  mode: "view" | "create";
  template: TemplateRecord | null;
  query: string;
  isSubmitting: boolean;
  isCopied?: boolean;
  onClose: () => void;
  onCreate: (template: TemplateCreateInput) => Promise<TemplateRecord | null>;
  onUpdate: (id: string, template: TemplateUpdateInput) => Promise<TemplateRecord | null>;
  onDelete: (id: string) => Promise<void>;
  onCopy: (template: TemplateRecord) => Promise<void>;
  onFavorite: (template: TemplateRecord) => Promise<void>;
  onPin: (template: TemplateRecord) => Promise<void>;
  onArchive: (template: TemplateRecord) => Promise<void>;
};

export default function TemplateModal({
  isOpen,
  mode,
  template,
  query,
  isSubmitting,
  isCopied = false,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onCopy,
  onFavorite,
  onPin,
  onArchive
}: TemplateModalProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [collections, setCollections] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const draftMetadata = useMemo(() => inferTemplateMetadata(content), [content]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "create") {
      setContent("");
      setTitle("");
      setTags("");
      setCollections("");
      setIsEditing(false);
      return;
    }

    if (template) {
      setContent(template.content);
      setTitle(template.title);
      setTags(template.tags.join(", "));
      setCollections(template.collections.join(", "));
      setIsEditing(false);
    }
  }, [isOpen, mode, template]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = await onCreate({
      content,
      collections: normalizeCollections(collections.split(",")),
      favorite: false,
      pinned: false
    });

    if (created) {
      onClose();
    }
  };

  const handleUpdate = async () => {
    if (!template) {
      return;
    }

    const updated = await onUpdate(template.id, {
      title,
      content,
      tags: normalizeTags(tags.split(",")),
      collections: normalizeCollections(collections.split(","))
    });

    if (updated) {
      setIsEditing(false);
    }
  };

  const confirmDelete = async () => {
    if (!template) {
      return;
    }

    if (!window.confirm(`Delete "${template.title}"? This cannot be undone.`)) {
      return;
    }

    await onDelete(template.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px] dark:bg-slate-950/70">
      <button
        aria-label="Close panel"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        type="button"
      />

      <div
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        role="dialog"
      >
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {mode === "create" ? "Paste once" : "Memory detail"}
              </p>
              <h2 className="mt-1 pr-28 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {mode === "create" ? "Store something useful" : template?.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {mode === "view" && template ? (
                <>
                  <button
                    className="pressable rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    onClick={() => void onPin(template)}
                    type="button"
                  >
                    {template.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    className="pressable rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    onClick={() => void onFavorite(template)}
                    type="button"
                  >
                    {template.favorite ? "Favorited" : "Favorite"}
                  </button>
                  <button
                    className="pressable rounded-xl border px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-900"
                    onClick={() => void onCopy(template)}
                    type="button"
                  >
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </>
              ) : null}
              <button
                className="pressable inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
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
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {mode === "create" ? (
            <form className="space-y-5" onSubmit={handleCreate}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Paste content
                </label>
                <textarea
                  className="min-h-[320px] w-full resize-y rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition duration-150 placeholder:text-slate-400 focus:border-[rgb(var(--accent-rgb))] focus:bg-white focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.16)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Paste code, an email draft, or any note. Metadata is generated automatically."
                  value={content}
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Auto-detected
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {content.trim()
                    ? draftMetadata.title
                    : "Start pasting and the system will generate a title"}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {draftMetadata.category}
                  </span>
                  {draftMetadata.tags.map((tag) => (
                    <TagBadge compact key={tag} label={tag} />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                  No manual metadata required. Save once, then reuse it everywhere.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[rgb(var(--accent-rgb))] focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.16)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  onChange={(event) => setCollections(event.target.value)}
                  placeholder="Collections, comma separated"
                  value={collections}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  className="pressable rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="pressable rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--accent-rgb))]"
                  disabled={isSubmitting || !content.trim()}
                  type="submit"
                >
                  {isSubmitting ? "Saving..." : "Save memory"}
                </button>
              </div>
            </form>
          ) : template ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {template.category}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatUsageCount(template.usageCount)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Last used {formatRelativeDate(template.lastCopiedAt ?? template.lastUsed ?? template.updatedAt)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {template.tags.length > 0 ? (
                  template.tags.map((tag) => (
                    <TagBadge
                      key={tag}
                      label={tag}
                      tone={query && tag.includes(query.toLowerCase()) ? "accent" : "neutral"}
                    />
                  ))
                ) : (
                  <span className="text-sm text-slate-400 dark:text-slate-500">No tags added</span>
                )}
              </div>

              {template.collections.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {template.collections.map((collection) => (
                    <span
                      className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      key={collection}
                    >
                      {collection}
                    </span>
                  ))}
                </div>
              ) : null}

              {isEditing ? (
                <div className="mt-5 space-y-4">
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[rgb(var(--accent-rgb))] focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.16)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Title"
                    value={title}
                  />
                  <textarea
                    className="min-h-[280px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none focus:border-[rgb(var(--accent-rgb))] focus:bg-white focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.16)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
                    onChange={(event) => setContent(event.target.value)}
                    value={content}
                  />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[rgb(var(--accent-rgb))] focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.16)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="Tags, comma separated"
                    value={tags}
                  />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[rgb(var(--accent-rgb))] focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.16)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    onChange={(event) => setCollections(event.target.value)}
                    placeholder="Collections, comma separated"
                    value={collections}
                  />
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <pre
                    className={
                      template.category === "code"
                        ? "overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-[14px] leading-8 text-slate-100 dark:bg-black"
                        : "text-[15px] leading-relaxed text-slate-700 dark:text-slate-200"
                    }
                  >
                    <HighlightedText query={query} text={content} />
                  </pre>
                </div>
              )}

              {template.versions.length > 0 ? (
                <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    Version history
                  </p>
                  <div className="mt-3 space-y-3">
                    {template.versions.slice(0, 4).map((version, index) => (
                      <div
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                        key={`${version.updatedAt}-${index}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {version.title}
                          </p>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatRelativeDate(version.updatedAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                          {version.content.slice(0, 140)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      className="pressable rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      onClick={() => setIsEditing(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="pressable rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--accent-rgb))]"
                      disabled={isSubmitting}
                      onClick={() => void handleUpdate()}
                      type="button"
                    >
                      {isSubmitting ? "Saving..." : "Save changes"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="pressable rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      onClick={() => setIsEditing(true)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="pressable rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      onClick={() => void onArchive(template)}
                      type="button"
                    >
                      {template.archived ? "Restore" : "Archive"}
                    </button>
                    <button
                      className="pressable rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                      disabled={isSubmitting}
                      onClick={() => void confirmDelete()}
                      type="button"
                    >
                      {isSubmitting ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
