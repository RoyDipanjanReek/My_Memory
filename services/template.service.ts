// Template Service
// Business logic for template management including CRUD, search, filtering, and bulk operations
// Acts as intermediary between API routes and template repository

import { ZodError } from "zod";
import { isValidObjectId } from "mongoose";
import {
  bulkUpdateTemplates as bulkUpdateTemplateRecords,
  createTemplate as createTemplateRecord,
  deleteTemplate as deleteTemplateRecord,
  findDuplicateTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplatesByIds,
  markTemplateUsed as markTemplateUsedRecord,
  searchTemplates,
  updateTemplate as updateTemplateRecord
} from "@/repositories/template.repository";
import type {
  TemplateBulkActionRequest,
  TemplateCreateInput,
  TemplateExportPayload,
  TemplateFilters,
  TemplateImportRequest,
  TemplateInput,
  TemplatePatchRequest,
  TemplateRecord
} from "@/types/template.types";
import {
  buildTemplateDraft,
  createTemplateVersion,
  getSearchSuggestions,
  hashContent,
  inferTemplateMetadata,
  isTemplateCategory,
  isTemplateView,
  normalizeCollections,
  normalizeTags,
  rankTemplates,
  sanitizePlainText
} from "@/utils/helpers";
import {
  templateBulkSchema,
  templateCreateSchema,
  templateImportSchema,
  templatePatchSchema
} from "@/lib/validation";

export class ValidationError extends Error {
  statusCode = 400;
}

export class NotFoundError extends Error {
  statusCode = 404;
}

function validateId(id: string) {
  if (!isValidObjectId(id)) {
    throw new ValidationError("Invalid template id.");
  }
}

function validateIds(ids: string[]) {
  ids.forEach((id) => validateId(id));
}

function parseWithSchema<T>(parser: { parse(input: unknown): T }, input: unknown) {
  try {
    return parser.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.issues[0]?.message ?? "Invalid input.");
    }

    throw error;
  }
}

function applyFilterRanking(templates: TemplateRecord[], filters: TemplateFilters) {
  const category = filters.category;
  const tag = filters.tag?.trim();
  const collection = filters.collection?.trim();
  const view = filters.view && isTemplateView(filters.view) ? filters.view : "all";

  const filtered = templates.filter((template) => {
    if (category && category !== "all" && template.category !== category) {
      return false;
    }

    if (tag && tag !== "all" && !template.tags.includes(tag)) {
      return false;
    }

    if (collection && collection !== "all" && !template.collections.includes(collection)) {
      return false;
    }

    return true;
  });

  return rankTemplates(filtered, filters.query ?? "", view);
}

function buildTemplateFromInput(
  ownerId: string,
  input: TemplateCreateInput
): TemplateInput {
  return buildTemplateDraft({
    ownerId,
    content: input.content,
    collections: input.collections,
    favorite: input.favorite,
    pinned: input.pinned
  });
}

export async function createTemplate(ownerId: string, data: Partial<TemplateCreateInput>) {
  const parsed = parseWithSchema(templateCreateSchema, data);
  const payload = buildTemplateFromInput(ownerId, parsed);
  const duplicate = await findDuplicateTemplate(ownerId, payload.contentHash);

  if (duplicate) {
    return {
      template: duplicate,
      duplicate: true
    };
  }

  const template = await createTemplateRecord(payload);

  return {
    template,
    duplicate: false
  };
}

export async function getTemplates(ownerId: string, filters: TemplateFilters = {}) {
  const result = await getAllTemplates(ownerId, {
    category: filters.category,
    tag: filters.tag,
    collection: filters.collection,
    includeArchived: filters.includeArchived,
    view: filters.view,
    limit: filters.limit,
    cursor: filters.cursor
  });
  const ranked = applyFilterRanking(result.data, filters);

  return {
    data: ranked,
    meta: {
      nextCursor: result.nextCursor,
      suggestions: getSearchSuggestions(result.data, filters.query ?? "")
    }
  };
}

export async function searchTemplateCatalog(
  ownerId: string,
  filters: TemplateFilters
) {
  const query = filters.query?.trim() ?? "";
  const category = filters.category;

  if (category && category !== "all" && !isTemplateCategory(category)) {
    throw new ValidationError("Invalid category filter.");
  }

  if (filters.view && !isTemplateView(filters.view)) {
    throw new ValidationError("Invalid view filter.");
  }

  const result = query
    ? await searchTemplates(ownerId, query, {
        category,
        tag: filters.tag,
        collection: filters.collection,
        includeArchived: filters.includeArchived,
        view: filters.view,
        limit: filters.limit,
        cursor: filters.cursor
      })
    : await getAllTemplates(ownerId, {
        category,
        tag: filters.tag,
        collection: filters.collection,
        includeArchived: filters.includeArchived,
        view: filters.view,
        limit: filters.limit,
        cursor: filters.cursor
      });

  const ranked = applyFilterRanking(result.data, filters);

  return {
    data: ranked,
    meta: {
      nextCursor: result.nextCursor,
      suggestions: getSearchSuggestions(result.data, query)
    }
  };
}

export async function getTemplate(ownerId: string, id: string) {
  validateId(id);

  const template = await getTemplateById(ownerId, id);

  if (!template) {
    throw new NotFoundError("Template not found.");
  }

  return template;
}

export async function deleteTemplate(ownerId: string, id: string) {
  validateId(id);

  const deleted = await deleteTemplateRecord(id, ownerId);

  if (!deleted) {
    throw new NotFoundError("Template not found.");
  }

  return deleted;
}

async function updateBooleanField(
  ownerId: string,
  id: string,
  field: "favorite" | "pinned",
  value?: boolean
) {
  const current = await getTemplate(ownerId, id);
  const template = await updateTemplateRecord(id, ownerId, {
    $set: {
      [field]: value ?? !current[field]
    }
  });

  if (!template) {
    throw new NotFoundError("Template not found.");
  }

  return template;
}

export async function updateTemplate(ownerId: string, id: string, payload: unknown) {
  validateId(id);
  const patch = parseWithSchema(templatePatchSchema, payload) as TemplatePatchRequest;

  switch (patch.action) {
    case "use": {
      const template = await markTemplateUsedRecord(id, ownerId);

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      return template;
    }

    case "favorite":
      return updateBooleanField(ownerId, id, "favorite", patch.value);

    case "pin":
      return updateBooleanField(ownerId, id, "pinned", patch.value);

    case "archive": {
      const template = await updateTemplateRecord(id, ownerId, {
        $set: {
          archived: patch.value ?? true
        }
      });

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      return template;
    }

    case "restore": {
      const template = await updateTemplateRecord(id, ownerId, {
        $set: {
          archived: false
        }
      });

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      return template;
    }

    case "collections": {
      const template = await updateTemplateRecord(id, ownerId, {
        $set: {
          collections: normalizeCollections(patch.collections)
        }
      });

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      return template;
    }

    case "sanitize-tags": {
      const current = await getTemplate(ownerId, id);
      const nextTags = normalizeTags(
        current.tags.length > 0 ? current.tags : inferTemplateMetadata(current.content).tags
      );
      const template = await updateTemplateRecord(id, ownerId, {
        $set: {
          tags: nextTags
        }
      });

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      return template;
    }

    case "update": {
      const current = await getTemplate(ownerId, id);
      const nextContent =
        typeof patch.data.content === "string"
          ? sanitizePlainText(patch.data.content)
          : current.content;
      const inferred = nextContent !== current.content ? inferTemplateMetadata(nextContent) : null;
      const nextTitle =
        patch.data.title?.trim() ?? (inferred ? inferred.title : current.title);
      const nextCategory =
        patch.data.category ?? (inferred ? inferred.category : current.category);
      const nextTags = patch.data.tags
        ? normalizeTags(patch.data.tags)
        : inferred
          ? normalizeTags(inferred.tags)
          : current.tags;
      const nextCollections = normalizeCollections(
        patch.data.collections ?? current.collections
      );
      const nextHash = hashContent(nextContent);
      const duplicate = await findDuplicateTemplate(ownerId, nextHash, id);

      const template = await updateTemplateRecord(id, ownerId, {
        $set: {
          title: nextTitle,
          content: nextContent,
          category: nextCategory,
          tags: nextTags,
          collections: nextCollections,
          contentHash: nextHash,
          duplicateOf: duplicate?.id ?? null,
          schemaVersion: 2
        },
        $push: {
          versions: {
            $each: [createTemplateVersion(current, "edit")],
            $position: 0,
            $slice: 12
          }
        }
      });

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      return template;
    }
  }
}

export async function runBulkTemplateAction(ownerId: string, payload: unknown) {
  const parsed = parseWithSchema(templateBulkSchema, payload) as TemplateBulkActionRequest;
  validateIds(parsed.ids);

  switch (parsed.action) {
    case "delete":
      await Promise.all(parsed.ids.map((id) => deleteTemplate(ownerId, id)));
      return [];
    case "archive":
      return bulkUpdateTemplateRecords(ownerId, parsed.ids, {
        $set: { archived: parsed.value ?? true }
      });
    case "restore":
      return bulkUpdateTemplateRecords(ownerId, parsed.ids, {
        $set: { archived: false }
      });
    case "favorite":
      return bulkUpdateTemplateRecords(ownerId, parsed.ids, {
        $set: { favorite: parsed.value ?? true }
      });
    case "pin":
      return bulkUpdateTemplateRecords(ownerId, parsed.ids, {
        $set: { pinned: parsed.value ?? true }
      });
    case "normalize-tags": {
      const templates = await getTemplatesByIds(ownerId, parsed.ids);

      await Promise.all(
        templates.map((template) =>
          updateTemplateRecord(template.id, ownerId, {
            $set: {
              tags: normalizeTags(
                template.tags.length > 0
                  ? template.tags
                  : inferTemplateMetadata(template.content).tags
              )
            }
          })
        )
      );

      return getTemplatesByIds(ownerId, parsed.ids);
    }
  }
}

export async function importTemplateCatalog(ownerId: string, payload: unknown) {
  const parsed = parseWithSchema(templateImportSchema, payload) as TemplateImportRequest;
  const imported: TemplateRecord[] = [];
  let skippedCount = 0;

  for (const item of parsed.templates) {
    const created = await createTemplate(ownerId, item);

    if (created.duplicate && parsed.mode !== "append") {
      skippedCount += 1;
      continue;
    }

    imported.push(created.template);
  }

  return {
    data: imported,
    meta: {
      importedCount: imported.length,
      skippedCount
    }
  };
}

export async function exportTemplateCatalog(ownerId: string): Promise<TemplateExportPayload> {
  const templates: TemplateRecord[] = [];
  let cursor: string | null = null;

  do {
    const page = await getAllTemplates(ownerId, {
      includeArchived: true,
      limit: 100,
      cursor
    });

    templates.push(...page.data);
    cursor = page.nextCursor;
  } while (cursor);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 2,
    templates
  };
}
