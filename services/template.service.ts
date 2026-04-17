// Template Service
// Business logic for template management including CRUD, search, filtering, RBAC, and audit logging

import { isValidObjectId } from "mongoose";
import { ZodError } from "zod";
import { recordAuditEvent } from "@/lib/audit";
import {
  bulkUpdateTemplates as bulkUpdateTemplateRecords,
  createTemplate as createTemplateRecord,
  findDuplicateTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplatesByIds,
  markTemplateUsed as markTemplateUsedRecord,
  purgeTemplate as purgeTemplateRecord,
  restoreTemplateFromTrash as restoreTemplateFromTrashRecord,
  searchTemplates,
  trashTemplate as trashTemplateRecord,
  updateTemplate as updateTemplateRecord
} from "@/repositories/template.repository";
import { assertCanAccessOwner, AuthorizationError } from "@/services/auth.service";
import type { AuthUserRecord } from "@/types/auth.types";
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
import type { RequestContext } from "@/types/observability.types";
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

function resolveOwner(actor: AuthUserRecord, explicitOwnerId?: string) {
  const ownerId = explicitOwnerId ?? actor.id;
  assertCanAccessOwner(actor, ownerId);
  return ownerId;
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

function buildTemplateFromInput(ownerId: string, input: TemplateCreateInput): TemplateInput {
  return buildTemplateDraft({
    ownerId,
    content: input.content,
    collections: input.collections,
    favorite: input.favorite,
    pinned: input.pinned
  });
}

export async function createTemplate(
  actor: AuthUserRecord,
  data: Partial<TemplateCreateInput>,
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
  const parsed = parseWithSchema(templateCreateSchema, data);
  const payload = buildTemplateFromInput(ownerId, parsed);
  const duplicate = await findDuplicateTemplate(ownerId, payload.contentHash);

  if (duplicate) {
    await recordAuditEvent({
      actorId: actor.id,
      ownerId,
      action: "template.create",
      entityType: "template",
      entityId: duplicate.id,
      status: "success",
      metadata: {
        duplicate: true
      },
      context
    });

    return {
      template: duplicate,
      duplicate: true
    };
  }

  const template = await createTemplateRecord(payload);

  await recordAuditEvent({
    actorId: actor.id,
    ownerId,
    action: "template.create",
    entityType: "template",
    entityId: template.id,
    status: "success",
    context
  });

  return {
    template,
    duplicate: false
  };
}

export async function getTemplates(
  actor: AuthUserRecord,
  filters: TemplateFilters = {},
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
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

  if (context) {
    await recordAuditEvent({
      actorId: actor.id,
      ownerId,
      action: "template.list",
      entityType: "template",
      status: "success",
      metadata: {
        view: filters.view ?? "all"
      },
      context
    });
  }

  return {
    data: ranked,
    meta: {
      nextCursor: result.nextCursor,
      suggestions: getSearchSuggestions(result.data, filters.query ?? "")
    }
  };
}

export async function searchTemplateCatalog(
  actor: AuthUserRecord,
  filters: TemplateFilters,
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
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

  await recordAuditEvent({
    actorId: actor.id,
    ownerId,
    action: "template.search",
    entityType: "template",
    status: "success",
    metadata: {
      query,
      resultCount: ranked.length
    },
    context
  });

  return {
    data: ranked,
    meta: {
      nextCursor: result.nextCursor,
      suggestions: getSearchSuggestions(result.data, query)
    }
  };
}

export async function getTemplate(
  actor: AuthUserRecord,
  id: string,
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
  validateId(id);

  const template = await getTemplateById(ownerId, id, true);

  if (!template) {
    throw new NotFoundError("Template not found.");
  }

  if (context) {
    await recordAuditEvent({
      actorId: actor.id,
      ownerId,
      action: "template.view",
      entityType: "template",
      entityId: template.id,
      status: "success",
      context
    });
  }

  return template;
}

export async function deleteTemplate(
  actor: AuthUserRecord,
  id: string,
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
  validateId(id);

  const deleted = await trashTemplateRecord(id, ownerId);

  if (!deleted) {
    throw new NotFoundError("Template not found.");
  }

  await recordAuditEvent({
    actorId: actor.id,
    ownerId,
    action: "template.trash",
    entityType: "template",
    entityId: deleted.id,
    status: "success",
    context
  });

  return deleted;
}

async function updateBooleanField(
  actor: AuthUserRecord,
  id: string,
  field: "favorite" | "pinned",
  value?: boolean,
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
  const current = await getTemplate(actor, id);
  const template = await updateTemplateRecord(id, ownerId, {
    $set: {
      [field]: value ?? !current[field]
    }
  });

  if (!template) {
    throw new NotFoundError("Template not found.");
  }

  await recordAuditEvent({
    actorId: actor.id,
    ownerId,
    action: `template.${field}`,
    entityType: "template",
    entityId: template.id,
    status: "success",
    metadata: {
      value: template[field]
    },
    context
  });

  return template;
}

export async function updateTemplate(
  actor: AuthUserRecord,
  id: string,
  payload: unknown,
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
  validateId(id);
  const patch = parseWithSchema(templatePatchSchema, payload) as TemplatePatchRequest;

  switch (patch.action) {
    case "use": {
      const template = await markTemplateUsedRecord(id, ownerId);

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      await recordAuditEvent({
        actorId: actor.id,
        ownerId,
        action: "template.copy",
        entityType: "template",
        entityId: template.id,
        status: "success",
        context
      });

      return template;
    }

    case "favorite":
      return updateBooleanField(actor, id, "favorite", patch.value, context);

    case "pin":
      return updateBooleanField(actor, id, "pinned", patch.value, context);

    case "archive": {
      const template = await updateTemplateRecord(id, ownerId, {
        $set: {
          archived: patch.value ?? true
        }
      });

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      await recordAuditEvent({
        actorId: actor.id,
        ownerId,
        action: "template.archive",
        entityType: "template",
        entityId: template.id,
        status: "success",
        metadata: {
          value: template.archived
        },
        context
      });

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

      await recordAuditEvent({
        actorId: actor.id,
        ownerId,
        action: "template.restore_archive",
        entityType: "template",
        entityId: template.id,
        status: "success",
        context
      });

      return template;
    }

    case "trash":
      return deleteTemplate(actor, id, context);

    case "restore-trash": {
      const template = await restoreTemplateFromTrashRecord(id, ownerId);

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      await recordAuditEvent({
        actorId: actor.id,
        ownerId,
        action: "template.restore_trash",
        entityType: "template",
        entityId: template.id,
        status: "success",
        context
      });

      return template;
    }

    case "purge": {
      const template = await purgeTemplateRecord(id, ownerId);

      if (!template) {
        throw new NotFoundError("Template not found.");
      }

      await recordAuditEvent({
        actorId: actor.id,
        ownerId,
        action: "template.purge",
        entityType: "template",
        entityId: template.id,
        status: "success",
        context
      });

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

      await recordAuditEvent({
        actorId: actor.id,
        ownerId,
        action: "template.collections_update",
        entityType: "template",
        entityId: template.id,
        status: "success",
        context
      });

      return template;
    }

    case "sanitize-tags": {
      const current = await getTemplate(actor, id);
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

      await recordAuditEvent({
        actorId: actor.id,
        ownerId,
        action: "template.normalize_tags",
        entityType: "template",
        entityId: template.id,
        status: "success",
        context
      });

      return template;
    }

    case "update": {
      const current = await getTemplate(actor, id);
      const nextContent =
        typeof patch.data.content === "string"
          ? sanitizePlainText(patch.data.content)
          : current.content;
      const inferred = nextContent !== current.content ? inferTemplateMetadata(nextContent) : null;
      const nextTitle = patch.data.title?.trim() ?? (inferred ? inferred.title : current.title);
      const nextCategory = patch.data.category ?? (inferred ? inferred.category : current.category);
      const nextTags = patch.data.tags
        ? normalizeTags(patch.data.tags)
        : inferred
          ? normalizeTags(inferred.tags)
          : current.tags;
      const nextCollections = normalizeCollections(patch.data.collections ?? current.collections);
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

      await recordAuditEvent({
        actorId: actor.id,
        ownerId,
        action: "template.update",
        entityType: "template",
        entityId: template.id,
        status: "success",
        metadata: {
          duplicateOf: duplicate?.id ?? null
        },
        context
      });

      return template;
    }
  }
}

export async function runBulkTemplateAction(
  actor: AuthUserRecord,
  payload: unknown,
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
  const parsed = parseWithSchema(templateBulkSchema, payload) as TemplateBulkActionRequest;
  validateIds(parsed.ids);

  switch (parsed.action) {
    case "delete":
      await Promise.all(parsed.ids.map((id) => deleteTemplate(actor, id, context)));
      return [];
    case "purge":
      await Promise.all(
        parsed.ids.map((id) =>
          updateTemplate(actor, id, { action: "purge" } satisfies TemplatePatchRequest, context)
        )
      );
      return [];
    case "restore-trash":
      await Promise.all(
        parsed.ids.map((id) =>
          updateTemplate(
            actor,
            id,
            { action: "restore-trash" } satisfies TemplatePatchRequest,
            context
          )
        )
      );
      return getTemplatesByIds(ownerId, parsed.ids, true);
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

export async function importTemplateCatalog(
  actor: AuthUserRecord,
  payload: unknown,
  context?: RequestContext
) {
  const ownerId = resolveOwner(actor);
  const parsed = parseWithSchema(templateImportSchema, payload) as TemplateImportRequest;
  const imported: TemplateRecord[] = [];
  let skippedCount = 0;

  for (const item of parsed.templates) {
    const created = await createTemplate(actor, item, context);

    if (created.duplicate && parsed.mode !== "append") {
      skippedCount += 1;
      continue;
    }

    imported.push(created.template);
  }

  await recordAuditEvent({
    actorId: actor.id,
    ownerId,
    action: "template.import",
    entityType: "template",
    status: "success",
    metadata: {
      importedCount: imported.length,
      skippedCount
    },
    context
  });

  return {
    data: imported,
    meta: {
      importedCount: imported.length,
      skippedCount
    }
  };
}

export async function exportTemplateCatalog(
  actor: AuthUserRecord,
  context?: RequestContext
): Promise<TemplateExportPayload> {
  const ownerId = resolveOwner(actor);
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

  await recordAuditEvent({
    actorId: actor.id,
    ownerId,
    action: "template.export",
    entityType: "template",
    status: "success",
    metadata: {
      count: templates.length
    },
    context
  });

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 2,
    templates
  };
}
