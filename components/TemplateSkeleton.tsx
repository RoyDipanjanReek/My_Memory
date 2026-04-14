"use client";

import { classNames } from "@/utils/helpers";

type TemplateSkeletonProps = {
  viewMode: "grid" | "list";
};

export default function TemplateSkeleton({
  viewMode
}: TemplateSkeletonProps) {
  return (
    <div
      className={classNames(
        "animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950",
        viewMode === "list" ? "flex items-start gap-5" : "space-y-4"
      )}
    >
      <div className={classNames("space-y-4", viewMode === "list" ? "flex-1" : "")}>
        <div className="h-4 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="h-5 w-2/3 rounded-md bg-slate-200 dark:bg-slate-700" />
        <div className="flex gap-2">
          <div className="h-6 w-14 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      {viewMode === "list" ? (
        <div className="hidden w-28 space-y-2 md:block">
          <div className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : null}
    </div>
  );
}
