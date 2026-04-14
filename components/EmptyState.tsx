"use client";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[rgba(var(--accent-rgb),0.1)] text-[rgb(var(--accent-rgb))]">
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M7 7h10M7 12h7m-7 5h10" strokeLinecap="round" />
          <rect height="16" rx="3" width="16" x="4" y="4" />
        </svg>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          className="pressable inline-flex items-center rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white dark:border-slate-700 dark:bg-[rgb(var(--accent-rgb))]"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction ? (
          <button
            className="pressable inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={onSecondaryAction}
            type="button"
          >
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
