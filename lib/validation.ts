// Input validation schemas using Zod
// Ensures all data sent to the application follows expected structure and constraints

import { z } from "zod";
import { TEMPLATE_CATEGORIES, TEMPLATE_VIEWS } from "@/types/template.types";
import { USER_ROLES } from "@/types/auth.types";

/**
 * Validates template category enum
 * Ensures category is one of: "email", "code", "note"
 */
export const categorySchema = z.enum(TEMPLATE_CATEGORIES);

/**
 * Schema for creating a new template
 * Validates required content and optional metadata
 */
export const templateCreateSchema = z.object({
  // Template content is required and must not be empty after trimming
  content: z.string().trim().min(1, "Content is required."),
  // Optional collections array, max 6 items
  collections: z.array(z.string().trim().min(1)).max(6).optional(),
  // Optional favorite flag
  favorite: z.boolean().optional(),
  // Optional pinned flag
  pinned: z.boolean().optional()
});

/**
 * Schema for updating template fields
 * All fields are optional to support partial updates
 */
export const templateUpdateSchema = z.object({
  // Title is optional, max 80 characters
  title: z.string().trim().min(1).max(80).optional(),
  // Content is optional, required when provided
  content: z.string().trim().min(1).optional(),
  // Category must be valid if provided
  category: categorySchema.optional(),
  // Tags array, max 8 items
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
  // Collections array, max 6 items
  collections: z.array(z.string().trim().min(1)).max(6).optional()
});

/**
 * Schema for patch operations on templates
 * Uses discriminated union to validate different action types
 * Each action has its own specific validation rules
 */
export const templatePatchSchema = z.discriminatedUnion("action", [
  // Mark template as used
  z.object({ action: z.literal("use") }),
  // Toggle favorite status
  z.object({ action: z.literal("favorite"), value: z.boolean().optional() }),
  // Toggle pinned status
  z.object({ action: z.literal("pin"), value: z.boolean().optional() }),
  // Toggle archived status
  z.object({ action: z.literal("archive"), value: z.boolean().optional() }),
  // Restore archived template
  z.object({ action: z.literal("restore") }),
  // Move template to trash
  z.object({ action: z.literal("trash") }),
  // Restore template from trash
  z.object({ action: z.literal("restore-trash") }),
  // Permanently delete a trashed template
  z.object({ action: z.literal("purge") }),
  // Sanitize tags (remove invalid characters)
  z.object({ action: z.literal("sanitize-tags") }),
  // Update collections
  z.object({
    action: z.literal("collections"),
    collections: z.array(z.string().trim().min(1)).max(6)
  }),
  // Full update with data validation
  z.object({
    action: z.literal("update"),
    data: templateUpdateSchema.refine(
      (value) => Object.keys(value).length > 0,
      "Provide at least one field to update."
    )
  })
]);

/**
 * Schema for bulk operations on multiple templates
 */
export const templateBulkSchema = z.object({
  // Type of bulk action to perform
  action: z.enum([
    "archive",
    "restore",
    "delete",
    "purge",
    "restore-trash",
    "favorite",
    "pin",
    "normalize-tags"
  ]),
  // IDs of templates to operate on (1-100 max)
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
  // Optional value for toggle actions
  value: z.boolean().optional()
});

/**
 * Schema for importing templates from external source
 * Supports append and deduplication modes
 */
export const templateImportSchema = z.object({
  // Import mode: append adds all, dedupe removes duplicates
  mode: z.enum(["append", "dedupe"]).optional(),
  // Array of templates to import (1-200 max)
  templates: z
    .array(templateCreateSchema)
    .min(1, "Import must include at least one template.")
    .max(200, "Import is limited to 200 templates at a time.")
});

export const authRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(60),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const authLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Password is required.")
});

export const emailTokenSchema = z.object({
  token: z.string().trim().min(16, "Invalid token.")
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email.")
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().trim().min(16, "Invalid reset token."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const roleSchema = z.enum(USER_ROLES);

export const templateQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum([...TEMPLATE_CATEGORIES, "all"]).optional(),
  tag: z.string().optional(),
  collection: z.string().optional(),
  view: z.enum(TEMPLATE_VIEWS).or(z.literal("all")).optional(),
  archived: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional()
});
