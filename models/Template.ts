import mongoose, { Model, Schema } from "mongoose";
import type {
  TemplateCategory,
  TemplateVersionRecord
} from "@/types/template.types";

export interface TemplateDocument extends mongoose.Document {
  ownerId: string;
  title: string;
  content: string;
  category: TemplateCategory;
  tags: string[];
  collections: string[];
  usageCount: number;
  lastUsed: Date | null;
  lastCopiedAt: Date | null;
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  duplicateOf: mongoose.Types.ObjectId | null;
  contentHash: string;
  schemaVersion: number;
  versions: Array<
    Omit<TemplateVersionRecord, "updatedAt"> & {
      updatedAt: Date;
    }
  >;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

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
    _id: false
  }
);

const TemplateSchema = new Schema<TemplateDocument>(
  {
    ownerId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
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
    usageCount: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: null
    },
    lastCopiedAt: {
      type: Date,
      default: null
    },
    favorite: {
      type: Boolean,
      default: false
    },
    pinned: {
      type: Boolean,
      default: false
    },
    archived: {
      type: Boolean,
      default: false
    },
    duplicateOf: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      default: null
    },
    contentHash: {
      type: String,
      required: true
    },
    schemaVersion: {
      type: Number,
      default: 2
    },
    versions: {
      type: [VersionSchema],
      default: []
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

TemplateSchema.index(
  { ownerId: 1, contentHash: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: null
    }
  }
);
TemplateSchema.index({ ownerId: 1, archived: 1, updatedAt: -1 });
TemplateSchema.index({ ownerId: 1, favorite: 1, updatedAt: -1 });
TemplateSchema.index({ ownerId: 1, pinned: 1, updatedAt: -1 });
TemplateSchema.index({ ownerId: 1, collections: 1 });
TemplateSchema.index({ ownerId: 1, tags: 1 });
TemplateSchema.index({ ownerId: 1, lastUsed: -1 });
TemplateSchema.index({ ownerId: 1, lastCopiedAt: -1 });
TemplateSchema.index({ ownerId: 1, usageCount: -1 });
TemplateSchema.index({ ownerId: 1, title: "text", content: "text", tags: "text" });

const TemplateModel =
  (mongoose.models.Template as Model<TemplateDocument>) ||
  mongoose.model<TemplateDocument>("Template", TemplateSchema);

export default TemplateModel;
