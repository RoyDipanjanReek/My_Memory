// Template Model - Represents reusable templates/memories with version history
// Stores user-owned templates with metadata, collections, tags, and usage tracking

import mongoose, { Model, Schema } from "mongoose";
import type {
  TemplateCategory,
  TemplateVersionRecord
} from "@/types/template.types";

/**
 * Interface for a Template document in MongoDB
 * Represents a reusable snippet of text with metadata and version history
 */
export interface TemplateDocument extends mongoose.Document {
  ownerId: string; // The user who owns this template
  title: string; // Template title/name
  content: string; // The actual template content
  category: TemplateCategory; // Type: "email", "code", or "note"
  tags: string[]; // Searchable tags for organization
  collections: string[]; // Collections this template belongs to
  usageCount: number; // Number of times this template has been used/copied
  lastUsed: Date | null; // When this template was last used
  lastCopiedAt: Date | null; // When this template was last copied to clipboard
  favorite: boolean; // Whether user marked as favorite
  pinned: boolean; // Whether template is pinned to top
  archived: boolean; // Whether template is archived (soft deleted)
  duplicateOf: mongoose.Types.ObjectId | null; // Reference to original if this is a duplicate
  contentHash: string; // Hash of content for duplicate detection
  schemaVersion: number; // Version of the schema for migrations
  versions: Array<
    // Array of historical versions
    Omit<TemplateVersionRecord, "updatedAt"> & {
      updatedAt: Date;
    }
  >;
  deletedAt: Date | null; // Soft delete timestamp
  createdAt: Date; // When template was created
  updatedAt: Date; // When template was last modified
}

/**
 * MongoDB schema for template versions
 * Each version records a point in time snapshot of the template
 */
const VersionSchema = new Schema<TemplateDocument["versions"][number]>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["email", "code", "note"],
      required: true
    },
    tags: {
      type: [String],
      default: []
    },
    collections: {
      type: [String],
      default: []
    },
    updatedAt: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      enum: ["edit", "import", "migration"],
      required: true
    }
  },
  {
    _id: false // Don't create _id field for version subdocuments
  }
);

/**
 * MongoDB schema for templates
 * Defines structure, validation, and indexes for template documents
 */
const TemplateSchema = new Schema<TemplateDocument>(
  {
    // User who owns this template
    ownerId: {
      type: String,
      required: true,
      index: true // Frequently queried - find templates by owner
    },
    // Template title
    title: {
      type: String,
      required: true,
      trim: true
    },
    // Template content (the main reusable text)
    content: {
      type: String,
      required: true,
      trim: true
    },
    // Category determines the type of template
    category: {
      type: String,
      enum: ["email", "code", "note"],
      required: true
    },
    // User-defined tags for searching and filtering
    tags: {
      type: [String],
      default: []
    },
    // Collections this template belongs to
    collections: {
      type: [String],
      default: []
    },
    // Counter for tracking how many times template is used
    usageCount: {
      type: Number,
      default: 0
    },
    // Timestamp of last usage
    lastUsed: {
      type: Date,
      default: null
    },
    // Timestamp of last copy to clipboard
    lastCopiedAt: {
      type: Date,
      default: null
    },
    // Whether template is marked as favorite
    favorite: {
      type: Boolean,
      default: false
    },
    // Whether template is pinned to top of list
    pinned: {
      type: Boolean,
      default: false
    },
    // Whether template is archived (soft deleted, not shown by default)
    archived: {
      type: Boolean,
      default: false
    },
    // If this is a duplicate, reference the original template
    duplicateOf: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      default: null
    },
    // SHA-256 hash of content for duplicate detection
    contentHash: {
      type: String,
      required: true
    },
    // Schema version for handling migrations
    schemaVersion: {
      type: Number,
      default: 2
    },
    // Array of all previous versions of this template for audit trail
    versions: {
      type: [VersionSchema],
      default: []
    },
    // Soft delete timestamp (for logical deletion without losing data)
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true
  }
);

/**
 * Indexes for template queries
 * Each index is optimized for common query patterns
 */

// Unique index ensuring one template per owner+content (soft delete aware)
TemplateSchema.index(
  { ownerId: 1, contentHash: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: null // Only enforce uniqueness on non-deleted templates
    }
  }
);

// For filtering by archive status, sorted by most recent
TemplateSchema.index({ ownerId: 1, archived: 1, updatedAt: -1 });

// For favorite templates view
TemplateSchema.index({ ownerId: 1, favorite: 1, updatedAt: -1 });

// For pinned templates view
TemplateSchema.index({ ownerId: 1, pinned: 1, updatedAt: -1 });

// For filtering by collections
TemplateSchema.index({ ownerId: 1, collections: 1 });

// For filtering by tags
TemplateSchema.index({ ownerId: 1, tags: 1 });

// For sorting by last used
TemplateSchema.index({ ownerId: 1, lastUsed: -1 });

// For sorting by last copied
TemplateSchema.index({ ownerId: 1, lastCopiedAt: -1 });

// For sorting by usage count
TemplateSchema.index({ ownerId: 1, usageCount: -1 });

// Full-text search index for searching title, content, and tags
TemplateSchema.index({ ownerId: 1, title: "text", content: "text", tags: "text" });

/**
 * Get or create the Template model
 * Using pattern to prevent duplicate models in development
 */
const TemplateModel =
  (mongoose.models.Template as Model<TemplateDocument>) ||
  mongoose.model<TemplateDocument>("Template", TemplateSchema);

export default TemplateModel;
