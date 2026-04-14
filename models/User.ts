// User Model - Represents a user account in the application
// Stores user information and authentication credentials

import mongoose, { Model, Schema } from "mongoose";
import type { UserRole } from "@/types/auth.types";

/**
 * Interface for a User document in MongoDB
 * Represents the shape of user data stored in the database
 */
export interface UserDocument extends mongoose.Document {
  name: string; // User's display name
  email: string; // Unique email address
  passwordHash: string; // Bcrypt hash of the password
  role: UserRole; // User's role: "admin" or "member"
  createdAt: Date; // When the account was created
  updatedAt: Date; // When the account was last modified
}

/**
 * MongoDB schema for users
 * Defines structure and validation rules for user documents
 */
const UserSchema = new Schema<UserDocument>(
  {
    // User's display name
    name: {
      type: String,
      required: true,
      trim: true
    },
    // Email address - must be unique across all users
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true, // Store emails in lowercase for case-insensitive lookups
      unique: true // Ensure no duplicate emails
    },
    // Hashed password (never store plaintext passwords)
    passwordHash: {
      type: String,
      required: true
    },
    // User's role for authorization (admin has more permissions)
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member"
    }
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true
  }
);

/**
 * Get or create the User model
 * Using pattern to prevent duplicate models in development
 */
const UserModel =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", UserSchema);

export default UserModel;
