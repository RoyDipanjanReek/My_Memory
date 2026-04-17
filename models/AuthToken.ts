import mongoose, { Model, Schema } from "mongoose";
import type { AuthTokenType } from "@/types/auth.types";

export interface AuthTokenDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  type: AuthTokenType;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AuthTokenSchema = new Schema<AuthTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ["email_verification", "password_reset"],
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    consumedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

AuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuthTokenSchema.index({ userId: 1, type: 1, consumedAt: 1 });

const AuthTokenModel =
  (mongoose.models.AuthToken as Model<AuthTokenDocument>) ||
  mongoose.model<AuthTokenDocument>("AuthToken", AuthTokenSchema);

export default AuthTokenModel;
