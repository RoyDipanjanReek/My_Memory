import { z } from "zod";
import { TEMPLATE_CATEGORIES } from "@/types/template.types";

export const categorySchema = z.enum(TEMPLATE_CATEGORIES);

export const templateCreateSchema = z.object({
  content: z.string().trim().min(1, "Content is required."),
  collections: z.array(z.string().trim().min(1)).max(6).optional(),
  favorite: z.boolean().optional(),
  pinned: z.boolean().optional()
});

export const templateUpdateSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  content: z.string().trim().min(1).optional(),
  category: categorySchema.optional(),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
  collections: z.array(z.string().trim().min(1)).max(6).optional()
});

export const templatePatchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("use") }),
  z.object({ action: z.literal("favorite"), value: z.boolean().optional() }),
  z.object({ action: z.literal("pin"), value: z.boolean().optional() }),
  z.object({ action: z.literal("archive"), value: z.boolean().optional() }),
  z.object({ action: z.literal("restore") }),
  z.object({ action: z.literal("sanitize-tags") }),
  z.object({
    action: z.literal("collections"),
    collections: z.array(z.string().trim().min(1)).max(6)
  }),
  z.object({
    action: z.literal("update"),
    data: templateUpdateSchema.refine(
      (value) => Object.keys(value).length > 0,
      "Provide at least one field to update."
    )
  })
]);

export const templateBulkSchema = z.object({
  action: z.enum(["archive", "restore", "delete", "favorite", "pin", "normalize-tags"]),
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
  value: z.boolean().optional()
});

export const templateImportSchema = z.object({
  mode: z.enum(["append", "dedupe"]).optional(),
  templates: z
    .array(templateCreateSchema)
    .min(1, "Import must include at least one template.")
    .max(200, "Import is limited to 200 templates at a time.")
});
