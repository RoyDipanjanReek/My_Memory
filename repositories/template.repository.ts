// Template Repository - Data access layer for template operations
// Handles all database queries for storing, retrieving, and manipulating templates

import { connectToDatabase } from "@/lib/mongodb";
import TemplateModel from "@/models/Template";
import type { TemplateFilters, TemplateInput, TemplateRecord } from "@/types/template.types";
import { escapeRegExp } from "@/utils/helpers";

type SearchOptions = TemplateFilters;
type PaginatedResult = {
  data: TemplateRecord[];
  nextCursor: string | null;
};

type LeanTemplate = {
  _id: { toString(): string };
  ownerId: string;
  title: string;
  content: string;
  category: TemplateRecord["category"];
  tags: string[];
  collections: string[];
  usageCount: number;
  lastUsed: Date | null;
  lastCopiedAt: Date | null;
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  duplicateOf: { toString(): string } | null;
  contentHash: string;
  schemaVersion: number;
  versions: Array<{
    title: string;
    content: string;
    category: TemplateRecord["category"];
    tags: string[];
    collections: string[];
    updatedAt: Date;
    reason: "edit" | "import" | "migration";
  }>;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toTemplateRecord(template: LeanTemplate | null): TemplateRecord | null {
  if (!template) {
    return null;
  }

  return {
    id: template._id.toString(),
    ownerId: template.ownerId,
    title: template.title,
    content: template.content,
    category: template.category,
    tags: template.tags ?? [],
    collections: template.collections ?? [],
    usageCount: template.usageCount ?? 0,
    lastUsed: template.lastUsed ? template.lastUsed.toISOString() : null,
    lastCopiedAt: template.lastCopiedAt ? template.lastCopiedAt.toISOString() : null,
    favorite: template.favorite ?? false,
    pinned: template.pinned ?? false,
    archived: template.archived ?? false,
    duplicateOf: template.duplicateOf ? template.duplicateOf.toString() : null,
    contentHash: template.contentHash,
    schemaVersion: template.schemaVersion ?? 2,
    versions:
      template.versions?.map((version) => ({
        ...version,
        updatedAt: version.updatedAt.toISOString()
      })) ?? [],
    deletedAt: template.deletedAt ? template.deletedAt.toISOString() : null,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    versionCount: template.versions?.length ?? 0
  };
}

function toTemplateList(templates: LeanTemplate[]) {
  return templates
    .map((template) => toTemplateRecord(template))
    .filter((template): template is TemplateRecord => Boolean(template));
}

function getPaginationValues(options: SearchOptions) {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);
  const offset = options.cursor ? Number(options.cursor) || 0 : 0;
  return { limit, offset };
}

function toPaginatedResult(templates: LeanTemplate[], limit: number, offset: number): PaginatedResult {
  const hasMore = templates.length > limit;
  const data = toTemplateList(hasMore ? templates.slice(0, limit) : templates);

  return {
    data,
    nextCursor: hasMore ? String(offset + limit) : null
  };
}

function buildFilter(ownerId: string, options: SearchOptions = {}) {
  const filter: Record<string, unknown> = {
    ownerId
  };

  if (options.view === "trash") {
    filter.deletedAt = { $ne: null };
  } else {
    filter.deletedAt = null;
  }

  if (!options.includeArchived && options.view !== "archived") {
    filter.archived = false;
  }

  if (options.category && options.category !== "all") {
    filter.category = options.category;
  }

  if (options.tag && options.tag !== "all") {
    filter.tags = options.tag;
  }

  if (options.collection && options.collection !== "all") {
    filter.collections = options.collection;
  }

  if (options.view === "favorites") {
    filter.favorite = true;
  }

  if (options.view === "pinned") {
    filter.pinned = true;
  }

  if (options.view === "archived") {
    filter.archived = true;
  }

  return filter;
}

export async function purgeExpiredTrashedTemplates(retentionDays = 30) {
  await connectToDatabase();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  await TemplateModel.deleteMany({
    deletedAt: {
      $lt: cutoff
    }
  });
}

export async function createTemplate(data: TemplateInput) {
  await connectToDatabase();
  const created = await TemplateModel.create(data);
  const record = toTemplateRecord(created.toObject<LeanTemplate>());

  if (!record) {
    throw new Error("Failed to serialize created template.");
  }

  return record;
}

export async function findDuplicateTemplate(ownerId: string, contentHash: string, excludeId?: string) {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    ownerId,
    contentHash,
    deletedAt: null
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const template = await TemplateModel.findOne(filter).lean<LeanTemplate | null>();
  return toTemplateRecord(template);
}

export async function getAllTemplates(ownerId: string, options: SearchOptions = {}) {
  await purgeExpiredTrashedTemplates();
  await connectToDatabase();
  const { limit, offset } = getPaginationValues(options);
  const templates = await TemplateModel.find(buildFilter(ownerId, options))
    .sort({
      deletedAt: -1,
      pinned: -1,
      favorite: -1,
      lastCopiedAt: -1,
      lastUsed: -1,
      updatedAt: -1
    })
    .skip(offset)
    .limit(limit + 1)
    .lean<LeanTemplate[]>();

  return toPaginatedResult(templates, limit, offset);
}

export async function searchTemplates(ownerId: string, query = "", options: SearchOptions = {}) {
  await purgeExpiredTrashedTemplates();
  await connectToDatabase();

  const trimmedQuery = query.trim();
  const filter = buildFilter(ownerId, options);
  const { limit, offset } = getPaginationValues(options);

  if (trimmedQuery) {
    const regex = new RegExp(escapeRegExp(trimmedQuery), "i");
    filter.$or = [
      { title: { $regex: regex } },
      { content: { $regex: regex } },
      { tags: { $elemMatch: { $regex: regex } } },
      { collections: { $elemMatch: { $regex: regex } } }
    ];
  }

  const templates = await TemplateModel.find(filter)
    .sort({
      deletedAt: -1,
      pinned: -1,
      favorite: -1,
      lastCopiedAt: -1,
      lastUsed: -1,
      updatedAt: -1
    })
    .skip(offset)
    .limit(limit + 1)
    .lean<LeanTemplate[]>();

  return toPaginatedResult(templates, limit, offset);
}

export async function getTemplateById(ownerId: string, id: string, includeTrashed = false) {
  await connectToDatabase();
  const template = await TemplateModel.findOne({
    _id: id,
    ownerId,
    ...(includeTrashed ? {} : { deletedAt: null })
  }).lean<LeanTemplate | null>();

  return toTemplateRecord(template);
}

export async function getTemplatesByIds(ownerId: string, ids: string[], includeTrashed = false) {
  await connectToDatabase();
  const templates = await TemplateModel.find({
    _id: { $in: ids },
    ownerId,
    ...(includeTrashed ? {} : { deletedAt: null })
  }).lean<LeanTemplate[]>();

  return toTemplateList(templates);
}

export async function updateTemplate(id: string, ownerId: string, update: Record<string, unknown>, includeTrashed = false) {
  await connectToDatabase();
  const updated = await TemplateModel.findOneAndUpdate(
    {
      _id: id,
      ownerId,
      ...(includeTrashed ? {} : { deletedAt: null })
    },
    update,
    {
      new: true
    }
  ).lean<LeanTemplate | null>();

  return toTemplateRecord(updated);
}

export async function trashTemplate(id: string, ownerId: string) {
  await connectToDatabase();
  const trashed = await TemplateModel.findOneAndUpdate(
    {
      _id: id,
      ownerId,
      deletedAt: null
    },
    {
      $set: {
        deletedAt: new Date(),
        archived: true
      }
    },
    {
      new: true
    }
  ).lean<LeanTemplate | null>();

  return toTemplateRecord(trashed);
}

export async function restoreTemplateFromTrash(id: string, ownerId: string) {
  await connectToDatabase();
  const restored = await TemplateModel.findOneAndUpdate(
    {
      _id: id,
      ownerId,
      deletedAt: { $ne: null }
    },
    {
      $set: {
        deletedAt: null
      }
    },
    {
      new: true
    }
  ).lean<LeanTemplate | null>();

  return toTemplateRecord(restored);
}

export async function purgeTemplate(id: string, ownerId: string) {
  await connectToDatabase();
  const deleted = await TemplateModel.findOneAndDelete({
    _id: id,
    ownerId,
    deletedAt: { $ne: null }
  }).lean<LeanTemplate | null>();

  return toTemplateRecord(deleted);
}

export async function markTemplateUsed(id: string, ownerId: string) {
  await connectToDatabase();
  const timestamp = new Date();
  const updated = await TemplateModel.findOneAndUpdate(
    {
      _id: id,
      ownerId,
      deletedAt: null
    },
    {
      $inc: { usageCount: 1 },
      $set: { lastUsed: timestamp, lastCopiedAt: timestamp }
    },
    {
      new: true
    }
  ).lean<LeanTemplate | null>();

  return toTemplateRecord(updated);
}

export async function bulkUpdateTemplates(
  ownerId: string,
  ids: string[],
  update: Record<string, unknown>,
  includeTrashed = false
) {
  await connectToDatabase();
  await TemplateModel.updateMany(
    {
      _id: { $in: ids },
      ownerId,
      ...(includeTrashed ? {} : { deletedAt: null })
    },
    update
  );

  return getTemplatesByIds(ownerId, ids, includeTrashed);
}
