import TemplateSkeleton from "@/components/TemplateSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="space-y-4">
        <div className="h-36 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <TemplateSkeleton key={index} viewMode="grid" />
          ))}
        </div>
      </div>
    </main>
  );
}
