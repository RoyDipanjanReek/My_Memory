"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Something broke
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          The memory workspace hit an unexpected error.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {error.message || "Try again. If the issue continues, refresh the page."}
        </p>
        <button
          className="mt-6 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition duration-150 hover:opacity-90 dark:bg-[rgb(var(--accent-rgb))]"
          onClick={reset}
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
