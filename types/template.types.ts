// Template type definitions
// Defines all interfaces and types for templates and related API responses

// Available template categories
export const TEMPLATE_CATEGORIES = ["email", "code", "note"] as const;

// Available views/filters for template lists
export const TEMPLATE_VIEWS = [
  "all",
  "favorites",
  "pinned",
  "recent",
  "copied",
  "valuable",
  "archived",
  "trash"
] as const;
export const TEMPLATE_THEME_ACCENTS = ["amber", "emerald", "rose"] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
export type TemplateView = (typeof TEMPLATE_VIEWS)[number];
export type ThemeAccent = (typeof TEMPLATE_THEME_ACCENTS)[number];

export interface TemplateVersionRecord {
  title: string;
  content: string;
  category: TemplateCategory;
  tags: string[];
  collections: string[];
  updatedAt: string;
  reason: "edit" | "import" | "migration";
}

export interface TemplateCreateInput {
  content: string;
  collections?: string[];
  favorite?: boolean;
  pinned?: boolean;
}

export interface TemplateUpdateInput {
  title?: string;
  content?: string;
  category?: TemplateCategory;
  tags?: string[];
  collections?: string[];
}

export interface TemplateInput extends TemplateCreateInput {
  ownerId: string;
  title: string;
  category: TemplateCategory;
  tags: string[];
  collections: string[];
  usageCount: number;
  lastUsed: string | null;
  lastCopiedAt: string | null;
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  duplicateOf: string | null;
  contentHash: string;
  schemaVersion: number;
  versions: TemplateVersionRecord[];
}

export interface TemplateRecord extends TemplateInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  versionCount: number;
}

export interface TemplateFilters {
  query?: string;
  category?: TemplateCategory | "all";
  tag?: string;
  collection?: string;
  view?: TemplateView;
  includeArchived?: boolean;
  limit?: number;
  cursor?: string | null;
}

export type TemplatePatchRequest =
  | { action: "use" }
  | { action: "favorite"; value?: boolean }
  | { action: "pin"; value?: boolean }
  | { action: "archive"; value?: boolean }
  | { action: "restore" }
  | { action: "trash" }
  | { action: "restore-trash" }
  | { action: "purge" }
  | { action: "sanitize-tags" }
  | { action: "collections"; collections: string[] }
  | { action: "update"; data: TemplateUpdateInput };

export interface TemplateBulkActionRequest {
  action:
    | "archive"
    | "restore"
    | "delete"
    | "purge"
    | "restore-trash"
    | "favorite"
    | "pin"
    | "normalize-tags";
  ids: string[];
  value?: boolean;
}

export interface TemplateImportItem {
  content: string;
  collections?: string[];
  favorite?: boolean;
  pinned?: boolean;
}

export interface TemplateImportRequest {
  templates: TemplateImportItem[];
  mode?: "append" | "dedupe";
}

export interface TemplateExportPayload {
  exportedAt: string;
  schemaVersion: number;
  templates: TemplateRecord[];
}

export interface TemplateCollectionSummary {
  name: string;
  count: number;
}

export interface TemplateSuggestion {
  id: string;
  label: string;
  detail: string;
  type: "query" | "tag" | "collection" | "recent";
}

export interface ApiResponseMeta {
  nextCursor?: string | null;
  duplicate?: boolean;
  suggestions?: TemplateSuggestion[];
  importedCount?: number;
  skippedCount?: number;
}

export interface ApiListResponse<T> {
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
