// useTemplates Hook
// Custom React hook for managing template state and API interactions
// Handles fetching, caching, filtering, and CRUD operations on templates
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "@/lib/api-client";
import type {
  ApiListResponse,
  ApiResponseMeta,
  TemplateBulkActionRequest,
  TemplateCreateInput,
  TemplateExportPayload,
  TemplatePatchRequest,
  TemplateRecord,
  TemplateSuggestion,
  TemplateUpdateInput,
  TemplateView
} from "@/types/template.types";
import {
  buildSearchParams,
  copyToClipboard,
  getCollectionSummaries,
  getValuableTemplates,
  normalizeTags
} from "@/utils/helpers";
import { SAMPLE_MEMORIES } from "@/utils/sample-memories";

type ToastTone = "success" | "error";

type ToastState = {
  message: string;
  tone: ToastTone;
} | null;

type CachedPage = {
  data: TemplateRecord[];
  meta?: ApiResponseMeta;
};

type UseTemplatesOptions = {
  initialTemplates: TemplateRecord[];
  initialMeta?: ApiResponseMeta;
  dbUnavailable: boolean;
};

const DEFAULT_MESSAGE = "Set MONGODB_URI to load and save templates.";

function replaceTemplate(
  templates: TemplateRecord[],
  updated: TemplateRecord
) {
  const existing = templates.some((template) => template.id === updated.id);

  if (!existing) {
    return [updated, ...templates];
  }

  return templates.map((template) => (template.id === updated.id ? updated : template));
}

export function useTemplates({
  initialTemplates,
  initialMeta,
  dbUnavailable
}: UseTemplatesOptions) {
  const [allTemplates, setAllTemplates] = useState(initialTemplates);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<TemplateView>("all");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialMeta?.nextCursor ?? null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(
    dbUnavailable ? DEFAULT_MESSAGE : null
  );
  const [toast, setToast] = useState<ToastState>(null);
  const [announcement, setAnnouncement] = useState("");
  const [copiedIds, setCopiedIds] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>(
    initialMeta?.suggestions ?? []
  );
  const cacheRef = useRef(new Map<string, CachedPage>());

  const filterKey = useMemo(
    () =>
      buildSearchParams({
        query,
        collection: collectionFilter,
        view: activeView,
        includeArchived: activeView === "archived",
        limit: 24
      }).toString(),
    [activeView, collectionFilter, query]
  );

  const buildEndpoint = useCallback(
    (cursor?: string | null) => {
      const params = buildSearchParams({
        query,
        collection: collectionFilter,
        view: activeView,
        includeArchived: activeView === "archived",
        limit: 24,
        cursor: cursor ?? null
      });

      const target = query.trim().length > 0 ? "/api/search" : "/api/templates";
      return `${target}?${params.toString()}`;
    },
    [activeView, collectionFilter, query]
  );

  useEffect(() => {
    cacheRef.current.set("", {
      data: initialTemplates,
      meta: initialMeta
    });
  }, [initialMeta, initialTemplates]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!feedback || (dbUnavailable && feedback === DEFAULT_MESSAGE)) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [dbUnavailable, feedback]);

  const syncFromCache = useCallback(
    (key: string) => {
      const cached = cacheRef.current.get(key);

      if (!cached) {
        return false;
      }

      setAllTemplates(cached.data);
      setNextCursor(cached.meta?.nextCursor ?? null);
      setSuggestions(cached.meta?.suggestions ?? []);
      return true;
    },
    []
  );

  const refreshTemplates = useCallback(async () => {
    if (dbUnavailable) {
      return;
    }

    const key = filterKey;
    setIsFetching(true);

    try {
      const result = await fetchJson<ApiListResponse<TemplateRecord[]>>(buildEndpoint());
      cacheRef.current.set(key, {
        data: result.data,
        meta: result.meta
      });
      setAllTemplates(result.data);
      setNextCursor(result.meta?.nextCursor ?? null);
      setSuggestions(result.meta?.suggestions ?? []);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to refresh memories.");
    } finally {
      setIsFetching(false);
    }
  }, [buildEndpoint, dbUnavailable, filterKey]);

  useEffect(() => {
    if (dbUnavailable) {
      return;
    }

    if (syncFromCache(filterKey)) {
      return;
    }

    void refreshTemplates();
  }, [dbUnavailable, filterKey, refreshTemplates, syncFromCache]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || dbUnavailable) {
      return;
    }

    setIsFetching(true);

    try {
      const result = await fetchJson<ApiListResponse<TemplateRecord[]>>(buildEndpoint(nextCursor));
      const merged = [...allTemplates, ...result.data];

      cacheRef.current.set(filterKey, {
        data: merged,
        meta: {
          ...result.meta,
          suggestions
        }
      });

      setAllTemplates(merged);
      setNextCursor(result.meta?.nextCursor ?? null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to load more memories.");
    } finally {
      setIsFetching(false);
    }
  }, [allTemplates, buildEndpoint, dbUnavailable, filterKey, nextCursor, suggestions]);

  const activeTemplate = useCallback(
    (id: string | null) => allTemplates.find((template) => template.id === id) ?? null,
    [allTemplates]
  );

  const collectionSummaries = useMemo(
    () => getCollectionSummaries(allTemplates.filter((template) => !template.archived)),
    [allTemplates]
  );

  const valuableTemplates = useMemo(
    () => getValuableTemplates(allTemplates.filter((template) => !template.archived), 6),
    [allTemplates]
  );

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ message, tone });
    setAnnouncement(message);
  }, []);

  const applyLocalTemplate = useCallback((updated: TemplateRecord) => {
    setAllTemplates((current) => replaceTemplate(current, updated));
    cacheRef.current.delete(filterKey);
  }, [filterKey]);

  const removeLocalTemplate = useCallback((id: string) => {
    setAllTemplates((current) => current.filter((template) => template.id !== id));
    setSelectedIds((current) => current.filter((value) => value !== id));
    cacheRef.current.delete(filterKey);
  }, [filterKey]);

  const markCopied = useCallback((id: string) => {
    setCopiedIds((current) => ({ ...current, [id]: true }));

    window.setTimeout(() => {
      setCopiedIds((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }, 1500);
  }, []);

  const createMemory = useCallback(
    async (input: TemplateCreateInput) => {
      if (dbUnavailable) {
        setFeedback(DEFAULT_MESSAGE);
        return null;
      }

      setIsSubmitting(true);

      try {
        const result = await fetchJson<ApiListResponse<TemplateRecord>>("/api/templates", {
          method: "POST",
          body: JSON.stringify(input)
        });

        applyLocalTemplate(result.data);
        showToast(result.meta?.duplicate ? "Memory already existed" : "Memory saved");
        return result.data;
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Could not save memory.");
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyLocalTemplate, dbUnavailable, showToast]
  );

  const updateMemory = useCallback(
    async (id: string, data: TemplateUpdateInput) => {
      setIsSubmitting(true);

      try {
        const result = await fetchJson<ApiListResponse<TemplateRecord>>(`/api/templates/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            action: "update",
            data
          } satisfies TemplatePatchRequest)
        });

        applyLocalTemplate(result.data);
        showToast("Memory updated");
        return result.data;
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Could not update memory.");
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyLocalTemplate, showToast]
  );

  const patchMemory = useCallback(
    async (
      id: string,
      payload: TemplatePatchRequest,
      optimistic?: (current: TemplateRecord) => TemplateRecord
    ) => {
      const snapshot = activeTemplate(id);

      if (snapshot && optimistic) {
        applyLocalTemplate(optimistic(snapshot));
      }

      try {
        const result = await fetchJson<ApiListResponse<TemplateRecord>>(`/api/templates/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });

        applyLocalTemplate(result.data);
        return result.data;
      } catch (error) {
        if (snapshot) {
          applyLocalTemplate(snapshot);
        }

        throw error;
      }
    },
    [activeTemplate, applyLocalTemplate]
  );

  const copyMemory = useCallback(
    async (template: TemplateRecord) => {
      try {
        const optimisticTimestamp = new Date().toISOString();
        await copyToClipboard(template.content);
        markCopied(template.id);

        await patchMemory(template.id, { action: "use" }, (current) => ({
          ...current,
          usageCount: current.usageCount + 1,
          lastCopiedAt: optimisticTimestamp,
          lastUsed: optimisticTimestamp
        }));

        showToast("Copied!");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Copy failed unexpectedly.";
        setFeedback(message);
        showToast(message, "error");
      }
    },
    [markCopied, patchMemory, showToast]
  );

  const toggleFavorite = useCallback(
    async (template: TemplateRecord) => {
      try {
        await patchMemory(
          template.id,
          { action: "favorite" },
          (current) => ({ ...current, favorite: !current.favorite })
        );
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Failed to update favorite.");
      }
    },
    [patchMemory]
  );

  const togglePinned = useCallback(
    async (template: TemplateRecord) => {
      try {
        await patchMemory(
          template.id,
          { action: "pin" },
          (current) => ({ ...current, pinned: !current.pinned })
        );
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Failed to update pin.");
      }
    },
    [patchMemory]
  );

  const toggleArchived = useCallback(
    async (template: TemplateRecord) => {
      try {
        await patchMemory(
          template.id,
          { action: template.archived ? "restore" : "archive" },
          (current) => ({ ...current, archived: !current.archived })
        );

        showToast(template.archived ? "Memory restored" : "Memory archived");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Failed to archive memory.");
      }
    },
    [patchMemory, showToast]
  );

  const deleteMemory = useCallback(
    async (id: string) => {
      const snapshot = activeTemplate(id);

      if (!snapshot) {
        return;
      }

      removeLocalTemplate(id);
      setIsSubmitting(true);

      try {
        await fetchJson<ApiListResponse<TemplateRecord>>(`/api/templates/${id}`, {
          method: "DELETE"
        });
        showToast(`Deleted "${snapshot.title}"`);
      } catch (error) {
        applyLocalTemplate(snapshot);
        setFeedback(error instanceof Error ? error.message : "Could not delete memory.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeTemplate, applyLocalTemplate, removeLocalTemplate, showToast]
  );

  const seedSamples = useCallback(async () => {
    for (const memory of SAMPLE_MEMORIES) {
      await createMemory(memory);
    }
  }, [createMemory]);

  const runBulkAction = useCallback(
    async (action: TemplateBulkActionRequest["action"], ids: string[], value?: boolean) => {
      if (ids.length === 0) {
        return;
      }

      setIsSubmitting(true);

      try {
        await fetchJson<ApiListResponse<TemplateRecord[]>>("/api/templates", {
          method: "PATCH",
          body: JSON.stringify({
            action,
            ids,
            value
          } satisfies TemplateBulkActionRequest)
        });

        setSelectedIds([]);
        cacheRef.current.delete(filterKey);
        await refreshTemplates();
        showToast("Bulk action complete");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Bulk action failed.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [filterKey, refreshTemplates, showToast]
  );

  const exportTemplates = useCallback(async (ids?: string[]) => {
    try {
      const payload = await fetchJson<TemplateExportPayload>("/api/templates/export");
      const templates = ids?.length
        ? payload.templates.filter((template) => ids.includes(template.id))
        : payload.templates;
      const blob = new Blob(
        [
          JSON.stringify(
            {
              ...payload,
              templates
            },
            null,
            2
          )
        ],
        {
          type: "application/json"
        }
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "developer-memory-backup.json";
      anchor.click();
      URL.revokeObjectURL(url);
      showToast("Backup exported");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Export failed.");
    }
  }, [showToast]);

  const importTemplates = useCallback(async (file: File) => {
    setIsSubmitting(true);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as TemplateExportPayload | { templates?: TemplateCreateInput[] };
      const templates =
        "templates" in parsed && Array.isArray(parsed.templates) ? parsed.templates : [];
      const result = await fetchJson<ApiListResponse<TemplateRecord[]>>("/api/templates/import", {
        method: "POST",
        body: JSON.stringify({
          mode: "dedupe",
          templates: templates.map((template) => ({
            content: template.content,
            collections: "collections" in template ? template.collections : [],
            favorite: "favorite" in template ? template.favorite : false,
            pinned: "pinned" in template ? template.pinned : false
          }))
        })
      });

      cacheRef.current.delete(filterKey);
      await refreshTemplates();
      showToast(`Imported ${result.meta?.importedCount ?? result.data.length} memories`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsSubmitting(false);
    }
  }, [filterKey, refreshTemplates, showToast]);

  const normalizeSelectedTags = useCallback(async () => {
    await runBulkAction("normalize-tags", selectedIds);
  }, [runBulkAction, selectedIds]);

  const cleanupLowSignalTags = useCallback(() => {
    setAllTemplates((current) =>
      current.map((template) => ({
        ...template,
        tags: normalizeTags(template.tags)
      }))
    );
    cacheRef.current.delete(filterKey);
    showToast("Low-signal tags cleaned locally");
  }, [filterKey, showToast]);

  return {
    allTemplates,
    visibleTemplates: allTemplates,
    filteredTemplates: allTemplates,
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
    refreshTemplates,
    seedSamples,
    runBulkAction,
    exportTemplates,
    importTemplates,
    normalizeSelectedTags,
    cleanupLowSignalTags,
    loadMore,
    resetVisibleCount: () => undefined,
    toggleSelected: (id: string) =>
      setSelectedIds((current) =>
        current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
      )
  };
}
