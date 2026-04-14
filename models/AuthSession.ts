import mongoose, { Model, Schema } from "mongoose";

export interface AuthSessionDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuthSessionSchema = new Schema<AuthSessionDocument>(
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
    expiresAt: {
      type: Date,
      required: true
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AuthSessionModel =
  (mongoose.models.AuthSession as Model<AuthSessionDocument>) ||
  mongoose.model<AuthSessionDocument>("AuthSession", AuthSessionSchema);

export default AuthSessionModel;
