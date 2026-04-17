// Template Manager Component
// Main client component managing the entire template management interface
// Handles template display, filtering, search, and bulk actions
"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BulkActionBar from "@/components/BulkActionBar";
import Card from "@/components/Card";
import CommandPalette from "@/components/CommandPalette";
import CopyToast from "@/components/CopyToast";
import EmptyState from "@/components/EmptyState";
import SearchBar from "@/components/SearchBar";
import Sidebar from "@/components/Sidebar";
import TemplateModal from "@/components/TemplateModal";
import TemplateSkeleton from "@/components/TemplateSkeleton";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useTemplates } from "@/hooks/useTemplates";
import { useTheme } from "@/hooks/useTheme";
import type { ApiResponseMeta, TemplateRecord } from "@/types/template.types";
import { classNames } from "@/utils/helpers";

type TemplateManagerProps = {
  initialTemplates: TemplateRecord[];
  initialMeta?: ApiResponseMeta;
  dbUnavailable: boolean;
};

type ViewMode = "grid" | "list";

type ModalState = {
  isOpen: boolean;
  mode: "view" | "create";
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export default function TemplateManager({
  initialTemplates,
  initialMeta,
  dbUnavailable
}: TemplateManagerProps) {
  const router = useRouter();
  const { theme, accent, toggleTheme, setAccent } = useTheme();
  const { isOpen: isPaletteOpen, openPalette, closePalette } = useCommandPalette();
  const {
    allTemplates,
    visibleTemplates,
    filteredTemplates,
    query,
    activeView,
    collectionFilter,
    selectedIds,
    nextCursor,
    isFetching,
    isSubmitting,
    feedback,
    toast,
    announcement,
    copiedIds,
    suggestions,
    collectionSummaries,
    valuableTemplates,
    setQuery,
    setActiveView,
    setCollectionFilter,
    setFeedback,
    setSelectedIds,
    activeTemplate,
    createMemory,
    updateMemory,
    copyMemory,
    toggleFavorite,
    togglePinned,
    toggleArchived,
    deleteMemory,
    seedSamples,
    runBulkAction,
    exportTemplates,
    importTemplates,
    normalizeSelectedTags,
    loadMore,
    toggleSelected
  } = useTemplates({
    initialTemplates,
    initialMeta,
    dbUnavailable
  });

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    initialTemplates[0]?.id ?? null
  );
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: "view"
  });
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedTemplate = useMemo(
    () => activeTemplate(activeTemplateId),
    [activeTemplate, activeTemplateId]
  );

  const selectedSearchTemplate = visibleTemplates[selectedSearchIndex] ?? null;

  useEffect(() => {
    if (activeTemplateId && !allTemplates.some((template) => template.id === activeTemplateId)) {
      setActiveTemplateId(filteredTemplates[0]?.id ?? allTemplates[0]?.id ?? null);
    }
  }, [activeTemplateId, allTemplates, filteredTemplates]);

  useEffect(() => {
    if (visibleTemplates.length === 0) {
      setSelectedSearchIndex(0);
      return;
    }

    if (selectedSearchIndex >= visibleTemplates.length) {
      setSelectedSearchIndex(0);
    }
  }, [selectedSearchIndex, visibleTemplates.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
        return;
      }

      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === "Escape") {
        if (isPaletteOpen) {
          closePalette();
          return;
        }

        if (modalState.isOpen) {
          setModalState((current) => ({ ...current, isOpen: false }));
          return;
        }

        if (isSidebarOpen) {
          setIsSidebarOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePalette, isPaletteOpen, isSidebarOpen, modalState.isOpen, openPalette]);

  const openCreateModal = useCallback(() => {
    setIsSidebarOpen(false);
    closePalette();
    setModalState({
      isOpen: true,
      mode: "create"
    });
  }, [closePalette]);

  const openViewModal = useCallback(
    (template: TemplateRecord) => {
      setActiveTemplateId(template.id);
      setIsSidebarOpen(false);
      closePalette();
      setModalState({
        isOpen: true,
        mode: "view"
      });
    },
    [closePalette]
  );

  const closeModal = useCallback(() => {
    setModalState((current) => ({
      ...current,
      isOpen: false
    }));
  }, []);

  const handleDelete = useCallback(
    async (template: TemplateRecord) => {
      await deleteMemory(template.id);

      if (activeTemplateId === template.id) {
        setActiveTemplateId(filteredTemplates[0]?.id ?? null);
      }
    },
    [activeTemplateId, deleteMemory, filteredTemplates]
  );

  const handleSearchKeyDown = useCallback(
    async (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedSearchIndex((current) =>
          visibleTemplates.length === 0 ? 0 : (current + 1) % visibleTemplates.length
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedSearchIndex((current) =>
          visibleTemplates.length === 0
            ? 0
            : (current - 1 + visibleTemplates.length) % visibleTemplates.length
        );
        return;
      }

      if (event.key === "Enter" && selectedSearchTemplate) {
        event.preventDefault();
        await copyMemory(selectedSearchTemplate);
        return;
      }

      if (event.key === "Escape") {
        if (query) {
          event.preventDefault();
          setQuery("");
        } else {
          event.currentTarget.blur();
        }
      }
    },
    [copyMemory, query, selectedSearchTemplate, setQuery, visibleTemplates.length]
  );

  const showLoadMore = Boolean(nextCursor);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-2rem)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
      <div className="hidden lg:block">
        <div className="sticky top-4 h-[calc(100vh-2rem)]">
          <Sidebar
            activeTemplateId={activeTemplateId}
            activeView={activeView}
            collectionFilter={collectionFilter}
            collections={collectionSummaries}
            onCollectionChange={setCollectionFilter}
            onCreateTemplate={openCreateModal}
            onOpenPalette={openPalette}
            onSelect={openViewModal}
            onViewChange={setActiveView}
            query={query}
            templates={allTemplates}
          />
        </div>
      </div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-900/35 dark:bg-slate-950/70"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />
          <div className="absolute inset-y-0 left-0 w-[90vw] max-w-[320px] p-3">
            <Sidebar
              activeTemplateId={activeTemplateId}
              activeView={activeView}
              collectionFilter={collectionFilter}
              collections={collectionSummaries}
              onClose={() => setIsSidebarOpen(false)}
              onCollectionChange={setCollectionFilter}
              onCreateTemplate={openCreateModal}
              onOpenPalette={openPalette}
              onSelect={openViewModal}
              onViewChange={setActiveView}
              query={query}
              templates={allTemplates}
            />
          </div>
        </div>
      ) : null}

      <section className="min-w-0 space-y-4">
        <SearchBar
          accent={accent}
          activeView={activeView}
          collectionFilter={collectionFilter}
          collections={collectionSummaries}
          isLoggingOut={isLoggingOut}
          isLoading={isFetching || isSubmitting}
          onAccentChange={setAccent}
          onActiveViewChange={setActiveView}
          onCollectionFilterChange={setCollectionFilter}
          onCreateTemplate={openCreateModal}
          onExport={() => void exportTemplates(selectedIds.length > 0 ? selectedIds : undefined)}
          onImport={(file) => void importTemplates(file)}
          onLogout={() => void handleLogout()}
          onOpenPalette={openPalette}
          onQueryChange={setQuery}
          onSearchKeyDown={handleSearchKeyDown}
          onThemeToggle={toggleTheme}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onViewModeChange={setViewMode}
          query={query}
          resultCount={filteredTemplates.length}
          searchInputRef={searchInputRef}
          theme={theme}
          viewMode={viewMode}
        />

        <BulkActionBar
          count={selectedIds.length}
          onArchive={() => void runBulkAction("archive", selectedIds)}
          onClear={() => setSelectedIds([])}
          onDelete={() => void runBulkAction("delete", selectedIds)}
          onExport={() => void exportTemplates(selectedIds)}
          onNormalizeTags={() => void normalizeSelectedTags()}
        />

        <div className="rounded-3xl border border-slate-200 bg-[#fcfcfd] p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#020817]">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Memory workspace
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Instant retrieval
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span>Paste anything, copy instantly</span>
              {suggestions.length > 0 ? (
                <span className="rounded-full bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
                  {suggestions[0]?.detail}
                </span>
              ) : null}
            </div>
          </div>

          {feedback ? (
            <div
              className={classNames(
                "mt-4 rounded-2xl border px-4 py-3 text-sm",
                dbUnavailable
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{feedback}</span>
                {!dbUnavailable ? (
                  <button
                    className="text-xs font-medium underline"
                    onClick={() => setFeedback(null)}
                    type="button"
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {isFetching && visibleTemplates.length === 0 && !dbUnavailable ? (
            <div
              className={classNames(
                "mt-6 grid gap-4",
                viewMode === "list" ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {Array.from({ length: viewMode === "list" ? 4 : 6 }).map((_, index) => (
                <TemplateSkeleton key={index} viewMode={viewMode} />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                actionLabel="Paste memory"
                description={
                  dbUnavailable
                    ? "Add MONGODB_URI in your local environment file, then refresh to start saving memories."
                    : "Paste code, an email, or a note. The app will infer title, tags, category, and keep your memory searchable."
                }
                onAction={openCreateModal}
                onSecondaryAction={!dbUnavailable ? () => void seedSamples() : undefined}
                secondaryActionLabel={!dbUnavailable ? "Load sample memories" : undefined}
                title="Your memory is empty"
              />
            </div>
          ) : (
            <>
              {valuableTemplates.length > 0 && activeView === "all" && !query ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Most valuable
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {valuableTemplates.map((template) => (
                      <button
                        className="pressable rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        key={template.id}
                        onClick={() => openViewModal(template)}
                        type="button"
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div
                className={classNames(
                  "mt-6 grid gap-4",
                  viewMode === "list" ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"
                )}
              >
                {visibleTemplates.map((template, index) => (
                  <Card
                    isActive={selectedSearchTemplate?.id === template.id}
                    isCopied={Boolean(copiedIds[template.id])}
                    isSelected={selectedIds.includes(template.id)}
                    key={template.id}
                    onArchive={(item) => void toggleArchived(item)}
                    onCopy={(item) => void copyMemory(item)}
                    onDelete={(item) => void handleDelete(item)}
                    onFavorite={(item) => void toggleFavorite(item)}
                    onHover={() => setSelectedSearchIndex(index)}
                    onPin={(item) => void togglePinned(item)}
                    onToggleSelect={(item) => toggleSelected(item.id)}
                    onView={openViewModal}
                    query={query}
                    template={template}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {showLoadMore ? (
                <div className="mt-6 flex justify-center">
                  <button
                    className="pressable rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-[rgb(var(--accent-rgb))] hover:bg-[rgba(var(--accent-rgb),0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    onClick={loadMore}
                    type="button"
                  >
                    Load more
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <TemplateModal
        isCopied={selectedTemplate ? Boolean(copiedIds[selectedTemplate.id]) : false}
        isOpen={modalState.isOpen}
        isSubmitting={isSubmitting}
        mode={modalState.mode}
        onArchive={(template) => toggleArchived(template)}
        onClose={closeModal}
        onCopy={copyMemory}
        onCreate={createMemory}
        onDelete={deleteMemory}
        onFavorite={toggleFavorite}
        onPin={togglePinned}
        onUpdate={updateMemory}
        query={query}
        template={selectedTemplate}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={closePalette}
        onCopy={copyMemory}
        onView={openViewModal}
        templates={allTemplates}
      />

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {toast ? <CopyToast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}
