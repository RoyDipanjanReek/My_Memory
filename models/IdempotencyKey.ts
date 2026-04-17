import mongoose, { Model, Schema } from "mongoose";

export interface IdempotencyKeyDocument extends mongoose.Document {
  ownerId: string | null;
  key: string;
  method: string;
  path: string;
  requestHash: string;
  statusCode: number | null;
  responseBody: string | null;
  completedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IdempotencyKeySchema = new Schema<IdempotencyKeyDocument>(
  {
    ownerId: {
      type: String,
      default: null,
      index: true
    },
    key: {
      type: String,
      required: true
    },
    method: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    requestHash: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number,
      default: null
    },
    responseBody: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

IdempotencyKeySchema.index(
  { ownerId: 1, key: 1, method: 1, path: 1 },
  { unique: true }
);
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const IdempotencyKeyModel =
  (mongoose.models.IdempotencyKey as Model<IdempotencyKeyDocument>) ||
  mongoose.model<IdempotencyKeyDocument>("IdempotencyKey", IdempotencyKeySchema);

export default IdempotencyKeyModel;
