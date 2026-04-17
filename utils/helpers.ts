// Utility helper functions for template/memory operations
// Includes text processing, clipboard operations, search ranking, and data formatting

import type {
  ApiErrorResponse,
  TemplateCategory,
  TemplateCollectionSummary,
  TemplateFilters,
  TemplateInput,
  TemplateRecord,
  TemplateSuggestion,
  TemplateVersionRecord,
  TemplateView
} from "@/types/template.types";

// Words to filter out from text processing (common words with low information value)
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "this",
  "to",
  "we",
  "with",
  "you",
  "your"
]);

const CODE_HINTS = [
  "const ",
  "let ",
  "function ",
  "class ",
  "return ",
  "import ",
  "export ",
  "interface ",
  "type ",
  "=>",
  "</",
  "{",
  "};",
  "npm ",
  "pnpm ",
  "SELECT ",
  "INSERT ",
  "UPDATE "
];

const EMAIL_HINTS = [
  "dear ",
  "hello ",
  "hi ",
  "regards",
  "best,",
  "sincerely",
  "thank you",
  "subject:"
];

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function truncateText(value: string, maxLength = 140) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

export function sanitizePlainText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[^\S\n]+\n/g, "\n").trim();
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeKeyword(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\-_/ ]+/gi, " ").replace(/\s+/g, " ").trim();
}

export function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => normalizeKeyword(tag).replace(/\s+/g, "-"))
        .filter(
          (tag) =>
            tag.length >= 2 &&
            tag.length <= 28 &&
            !STOP_WORDS.has(tag) &&
            !/^\d+$/.test(tag)
        )
    )
  ).slice(0, 8);
}

export function normalizeCollections(collections: string[]) {
  return Array.from(
    new Set(
      collections
        .map((collection) => collection.trim())
        .filter(Boolean)
        .map((collection) =>
          collection
            .split(/\s+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")
        )
        .filter((collection) => collection.length <= 32)
    )
  ).slice(0, 6);
}

export function hashContent(content: string) {
  let hash = 5381;

  for (let index = 0; index < content.length; index += 1) {
    hash = (hash * 33) ^ content.charCodeAt(index);
  }

  return `tmpl_${(hash >>> 0).toString(16)}`;
}

export function isTemplateCategory(value: string): value is TemplateCategory {
  return ["email", "code", "note"].includes(value);
}

export function isTemplateView(value: string): value is TemplateView {
  return [
    "all",
    "favorites",
    "pinned",
    "recent",
    "copied",
    "valuable",
    "archived",
    "trash"
  ].includes(value);
}

export function copyToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }

  return Promise.reject(new Error("Clipboard is not available."));
}

export function formatRelativeDate(value: string) {
  const target = new Date(value).getTime();
  const diff = Date.now() - target;
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function formatUsageCount(value: number) {
  if (value <= 0) {
    return "Never copied";
  }

  return `${value} ${value === 1 ? "copy" : "copies"}`;
}

export function tokenize(value: string) {
  return normalizeKeyword(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));
}

function looksLikeEmail(content: string) {
  const normalized = content.toLowerCase();
  const hasGreeting = EMAIL_HINTS.some((hint) => normalized.includes(hint));
  const hasParagraphs = normalized.split("\n").filter((line) => line.trim()).length >= 3;
  const formalTone = /\b(thank you|regards|sincerely|opportunity|application)\b/i.test(content);

  return (hasGreeting && hasParagraphs) || formalTone;
}

function looksLikeCode(content: string) {
  const normalized = content.toLowerCase();
  const hintCount = CODE_HINTS.filter((hint) => normalized.includes(hint.toLowerCase())).length;

  return hintCount >= 2 || /```|[\w$]+\([^)]*\)\s*\{|<[A-Za-z][^>]*>/.test(content);
}

export function detectTemplateCategory(content: string): TemplateCategory {
  if (looksLikeCode(content)) {
    return "code";
  }

  if (looksLikeEmail(content)) {
    return "email";
  }

  return "note";
}

function titleFromCode(content: string) {
  const match =
    content.match(/(?:function|class|interface|type)\s+([A-Za-z0-9_]+)/) ??
    content.match(/const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/) ??
    content.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);

  if (!match) {
    return null;
  }

  return `${match[1]} snippet`;
}

export function inferTemplateTitle(content: string) {
  const cleaned = sanitizePlainText(content);
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "Untitled memory";
  }

  const codeTitle = titleFromCode(cleaned);
  if (codeTitle) {
    return codeTitle;
  }

  const subjectLine = lines.find((line) => /^subject:/i.test(line));
  if (subjectLine) {
    return truncateText(subjectLine.replace(/^subject:\s*/i, ""), 56);
  }

  const meaningfulLine =
    lines.find((line) => line.length >= 8 && !/^[-_*#`]+$/.test(line)) ?? lines[0];

  return truncateText(meaningfulLine.replace(/^dear\s+/i, "").trim(), 56);
}

export function extractTemplateTags(content: string, category?: TemplateCategory) {
  const tokens = tokenize(content);
  const keywordCounts = new Map<string, number>();

  tokens.forEach((token) => {
    keywordCounts.set(token, (keywordCounts.get(token) ?? 0) + 1);
  });

  const sortedTokens = Array.from(keywordCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([token]) => token);

  const inferredCategory = category ?? detectTemplateCategory(content);
  const categoryTags =
    inferredCategory === "code"
      ? ["snippet", "developer"]
      : inferredCategory === "email"
        ? ["email", "outreach"]
        : ["note"];

  return normalizeTags([...categoryTags, ...sortedTokens.slice(0, 8)]);
}

export function inferTemplateMetadata(content: string) {
  const category = detectTemplateCategory(content);
  const title = inferTemplateTitle(content);
  const tags = extractTemplateTags(content, category);

  return { title, category, tags };
}

function getRecencyWeight(dateValue: string | null) {
  if (!dateValue) {
    return 0;
  }

  const hours = Math.max(1, (Date.now() - new Date(dateValue).getTime()) / 3_600_000);
  return 42 / Math.sqrt(hours);
}

function subsequenceScore(query: string, target: string) {
  if (!query || !target) {
    return 0;
  }

  let cursor = 0;
  let matched = 0;

  for (const char of query) {
    const nextIndex = target.indexOf(char, cursor);
    if (nextIndex === -1) {
      return 0;
    }

    matched += 1;
    cursor = nextIndex + 1;
  }

  return matched / Math.max(target.length, 1);
}

export function getTemplateSearchScore(template: TemplateRecord, rawQuery = "") {
  const query = normalizeKeyword(rawQuery);
  const title = normalizeKeyword(template.title);
  const content = normalizeKeyword(template.content);
  const tagText = normalizeKeyword(template.tags.join(" "));
  const collectionText = normalizeKeyword(template.collections.join(" "));

  let score = 0;

  if (!template.archived) {
    score += 6;
  }

  if (template.favorite) {
    score += 18;
  }

  if (template.pinned) {
    score += 24;
  }

  score += Math.min(template.usageCount * 2.8, 40);
  score += getRecencyWeight(template.lastCopiedAt);
  score += getRecencyWeight(template.lastUsed);
  score += getRecencyWeight(template.updatedAt) * 0.45;

  if (!query) {
    return score;
  }

  if (title === query) {
    score += 180;
  }

  if (title.startsWith(query)) {
    score += 120;
  }

  if (title.includes(query)) {
    score += 80;
  }

  if (tagText.includes(query)) {
    score += 56;
  }

  if (collectionText.includes(query)) {
    score += 44;
  }

  if (content.includes(query)) {
    score += 18;
  }

  score += subsequenceScore(query, title) * 90;
  score += subsequenceScore(query, tagText) * 48;
  score += subsequenceScore(query, collectionText) * 36;

  return score;
}

function applyViewFilter(templates: TemplateRecord[], view: TemplateView) {
  switch (view) {
    case "favorites":
      return templates.filter((template) => template.favorite);
    case "pinned":
      return templates.filter((template) => template.pinned);
    case "recent":
      return [...templates].sort(
        (left, right) =>
          new Date(right.lastUsed ?? right.updatedAt).getTime() -
          new Date(left.lastUsed ?? left.updatedAt).getTime()
      );
    case "copied":
      return [...templates].sort(
        (left, right) =>
          new Date(right.lastCopiedAt ?? right.updatedAt).getTime() -
          new Date(left.lastCopiedAt ?? left.updatedAt).getTime()
      );
    case "valuable":
      return [...templates].sort(
        (left, right) => getTemplateSearchScore(right) - getTemplateSearchScore(left)
      );
    case "archived":
      return templates.filter((template) => template.archived);
    case "trash":
      return templates.filter((template) => Boolean(template.deletedAt));
    default:
      return templates.filter((template) => !template.archived);
  }
}

export function rankTemplates(
  templates: TemplateRecord[],
  query = "",
  view: TemplateView = "all"
) {
  const filtered = applyViewFilter(templates, view);

  return [...filtered].sort((left, right) => {
    const scoreDifference =
      getTemplateSearchScore(right, query) - getTemplateSearchScore(left, query);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

export function getRecentTemplates(templates: TemplateRecord[], limit = 5) {
  return [...templates]
    .sort(
      (left, right) =>
        new Date(right.lastUsed ?? right.updatedAt).getTime() -
        new Date(left.lastUsed ?? left.updatedAt).getTime()
    )
    .slice(0, limit);
}

export function getFrequentTemplates(templates: TemplateRecord[], limit = 5) {
  return [...templates]
    .sort((left, right) => right.usageCount - left.usageCount)
    .slice(0, limit);
}

export function getRecentlyCopiedTemplates(templates: TemplateRecord[], limit = 5) {
  return [...templates]
    .filter((template) => Boolean(template.lastCopiedAt))
    .sort(
      (left, right) =>
        new Date(right.lastCopiedAt ?? right.updatedAt).getTime() -
        new Date(left.lastCopiedAt ?? left.updatedAt).getTime()
    )
    .slice(0, limit);
}

export function getValuableTemplates(templates: TemplateRecord[], limit = 5) {
  return [...templates]
    .sort((left, right) => getTemplateSearchScore(right) - getTemplateSearchScore(left))
    .slice(0, limit);
}

export function getCollectionSummaries(templates: TemplateRecord[]): TemplateCollectionSummary[] {
  const counts = new Map<string, number>();

  templates.forEach((template) => {
    template.collections.forEach((collection) => {
      counts.set(collection, (counts.get(collection) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 8);
}

export function getSearchSuggestions(
  templates: TemplateRecord[],
  query: string
): TemplateSuggestion[] {
  const normalizedQuery = normalizeKeyword(query);

  if (!normalizedQuery) {
    return getRecentTemplates(templates, 4).map((template) => ({
      id: `recent-${template.id}`,
      label: template.title,
      detail: "Continue where you left off",
      type: "recent"
    }));
  }

  const tagMatches = Array.from(
    new Set(
      templates
        .flatMap((template) => template.tags)
        .filter((tag) => normalizeKeyword(tag).includes(normalizedQuery))
    )
  )
    .slice(0, 2)
    .map((tag) => ({
      id: `tag-${tag}`,
      label: `#${tag}`,
      detail: "Likely tag match",
      type: "tag" as const
    }));

  const collectionMatches = Array.from(
    new Set(
      templates
        .flatMap((template) => template.collections)
        .filter((collection) => normalizeKeyword(collection).includes(normalizedQuery))
    )
  )
    .slice(0, 2)
    .map((collection) => ({
      id: `collection-${collection}`,
      label: collection,
      detail: "Jump into a collection",
      type: "collection" as const
    }));

  const queryMatches = rankTemplates(templates, normalizedQuery)
    .slice(0, 2)
    .map((template) => ({
      id: `query-${template.id}`,
      label: template.title,
      detail: "Likely what you meant",
      type: "query" as const
    }));

  return [...queryMatches, ...tagMatches, ...collectionMatches].slice(0, 5);
}

export function buildSearchParams(filters: TemplateFilters) {
  const params = new URLSearchParams();

  if (filters.query?.trim()) {
    params.set("q", filters.query.trim());
  }

  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }

  if (filters.tag && filters.tag !== "all") {
    params.set("tag", filters.tag);
  }

  if (filters.collection && filters.collection !== "all") {
    params.set("collection", filters.collection);
  }

  if (filters.view && filters.view !== "all") {
    params.set("view", filters.view);
  }

  if (filters.includeArchived) {
    params.set("archived", "true");
  }

  if (typeof filters.limit === "number") {
    params.set("limit", String(filters.limit));
  }

  if (filters.cursor) {
    params.set("cursor", filters.cursor);
  }

  return params;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function toErrorResponse(
  error: unknown,
  fallback = "Something went wrong."
): ApiErrorResponse {
  return {
    error: getErrorMessage(error, fallback)
  };
}

export function createTemplateVersion(
  template: Pick<
    TemplateRecord,
    "title" | "content" | "category" | "tags" | "collections" | "updatedAt"
  >,
  reason: TemplateVersionRecord["reason"]
): TemplateVersionRecord {
  return {
    title: template.title,
    content: template.content,
    category: template.category,
    tags: [...template.tags],
    collections: [...template.collections],
    updatedAt: template.updatedAt,
    reason
  };
}

export function buildTemplateDraft(
  input: Pick<TemplateInput, "ownerId" | "content"> &
    Partial<
      Pick<
        TemplateInput,
        "collections" | "favorite" | "pinned" | "tags" | "title" | "category"
      >
    >
): TemplateInput {
  const content = sanitizePlainText(input.content);
  const inferred = inferTemplateMetadata(content);
  const title = input.title?.trim() || inferred.title;
  const category = input.category ?? inferred.category;
  const tags = normalizeTags(input.tags ?? inferred.tags);

  return {
    ownerId: input.ownerId,
    title,
    content,
    category,
    tags,
    collections: normalizeCollections(input.collections ?? []),
    favorite: input.favorite ?? false,
    pinned: input.pinned ?? false,
    archived: false,
    usageCount: 0,
    lastUsed: null,
    lastCopiedAt: null,
    duplicateOf: null,
    contentHash: hashContent(content),
    schemaVersion: 2,
    versions: []
  };
}

export function highlightMatch(text: string, query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [{ text, match: false }];
  }

  const regex = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig");
  const parts = text.split(regex);

  return parts.filter(Boolean).map((part) => ({
    text: part,
    match: part.toLowerCase() === normalizedQuery.toLowerCase()
  }));
}
