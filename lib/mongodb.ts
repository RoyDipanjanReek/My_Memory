import mongoose from "mongoose";
import { logEvent } from "@/lib/logger";

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseCache ?? {
  conn: null,
  promise: null
};

global.mongooseCache = cached;

let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) {
    return;
  }

  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    logEvent("info", "MongoDB connected");
  });

  mongoose.connection.on("disconnected", () => {
    logEvent("warn", "MongoDB disconnected");
    cached.conn = null;
  });

  mongoose.connection.on("error", (error) => {
    logEvent("error", "MongoDB connection error", {
      error: error instanceof Error ? error.message : String(error)
    });
    cached.promise = null;
  });
}

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  attachConnectionListeners();

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      })
      .then((connection) => connection)
      .catch((error) => {
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
