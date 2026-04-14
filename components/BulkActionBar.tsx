"use client";

type BulkActionBarProps = {
  count: number;
  onArchive: () => void;
  onDelete: () => void;
  onExport: () => void;
  onNormalizeTags: () => void;
  onClear: () => void;
};

export default function BulkActionBar({
  count,
  onArchive,
  onDelete,
  onExport,
  onNormalizeTags,
  onClear
}: BulkActionBarProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="sticky top-4 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <span className="mr-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        {count} selected
      </span>
      <button
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition duration-150 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:text-slate-200"
        onClick={onArchive}
        type="button"
      >
        Archive
      </button>
      <button
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition duration-150 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:text-slate-200"
        onClick={onNormalizeTags}
        type="button"
      >
        Clean tags
      </button>
      <button
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition duration-150 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:text-slate-200"
        onClick={onExport}
        type="button"
      >
        Export
      </button>
      <button
        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition duration-150 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        onClick={onDelete}
        type="button"
      >
        Delete
      </button>
      <button
        className="ml-auto rounded-lg px-2 py-2 text-xs text-slate-500 transition duration-150 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        onClick={onClear}
        type="button"
      >
        Clear
      </button>
    </div>
  );
}
