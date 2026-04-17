import mongoose, { Model, Schema } from "mongoose";

export interface AuditEventDocument extends mongoose.Document {
  actorId: string | null;
  ownerId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  requestId: string | null;
  status: "success" | "failure";
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AuditEventSchema = new Schema<AuditEventDocument>(
  {
    actorId: {
      type: String,
      default: null,
      index: true
    },
    ownerId: {
      type: String,
      default: null,
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    entityType: {
      type: String,
      required: true,
      trim: true
    },
    entityId: {
      type: String,
      default: null
    },
    requestId: {
      type: String,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

AuditEventSchema.index({ ownerId: 1, createdAt: -1 });
AuditEventSchema.index({ actorId: 1, createdAt: -1 });
AuditEventSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AuditEventModel =
  (mongoose.models.AuditEvent as Model<AuditEventDocument>) ||
  mongoose.model<AuditEventDocument>("AuditEvent", AuditEventSchema);

export default AuditEventModel;
