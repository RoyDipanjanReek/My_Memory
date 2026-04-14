import mongoose, { Model, Schema } from "mongoose";
import type { UserRole } from "@/types/auth.types";

export interface UserDocument extends mongoose.Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member"
    }
  },
  {
    timestamps: true
  }
);

const UserModel =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", UserSchema);

export default UserModel;
