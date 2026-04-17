// AuthSession Model - Represents an active user session/authentication token
// Stores session information and token hashes for authentication

import mongoose, { Model, Schema } from "mongoose";

/**
 * Interface for an AuthSession document in MongoDB
 * Represents a logged-in user's session
 */
export interface AuthSessionDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId; // Reference to the User document
  tokenHash: string; // Hash of the authentication token
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string | null;
  expiresAt: Date; // When this session expires
  lastUsedAt: Date; // When this session was last used
  lastRotatedAt: Date;
  revokedAt: Date | null;
  rotatedFromId: mongoose.Types.ObjectId | null;
  createdAt: Date; // When the session was created
  updatedAt: Date; // When the session was last modified
}

/**
 * MongoDB schema for authentication sessions
 * Defines structure and validation rules for session documents
 */
const AuthSessionSchema = new Schema<AuthSessionDocument>(
  {
    // Reference to the user who owns this session
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true // Frequently queried by user ID
    },
    // Hash of the session token (never store tokens in plaintext)
    tokenHash: {
      type: String,
      required: true,
      unique: true // Each token should be unique
    },
    userAgent: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    deviceLabel: {
      type: String,
      default: null
    },
    // When this session should automatically expire
    expiresAt: {
      type: Date,
      required: true
    },
    // Track when session was last used for activity monitoring
    lastUsedAt: {
      type: Date,
      default: Date.now
    },
    lastRotatedAt: {
      type: Date,
      default: Date.now
    },
    revokedAt: {
      type: Date,
      default: null
    },
    rotatedFromId: {
      type: Schema.Types.ObjectId,
      ref: "AuthSession",
      default: null
    }
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true
  }
);

// TTL index - MongoDB automatically deletes expired documents
// expireAfterSeconds: 0 means delete when expiresAt time is reached
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuthSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

/**
 * Get or create the AuthSession model
 * Using pattern to prevent duplicate models in development
 */
const AuthSessionModel =
  (mongoose.models.AuthSession as Model<AuthSessionDocument>) ||
  mongoose.model<AuthSessionDocument>("AuthSession", AuthSessionSchema);

export default AuthSessionModel;
