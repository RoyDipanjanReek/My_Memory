// MongoDB Connection Management
// Handles connection pooling, caching, and error handling for the MongoDB database
import mongoose from "mongoose";
import { logEvent } from "@/lib/logger";

/**
 * Global mongoose connection cache stored on global namespace
 * This prevents multiple connections in serverless environments (Next.js API routes)
 */
declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null; // Active MongoDB connection
        promise: Promise<typeof mongoose> | null; // Promise for pending connection
      }
    | undefined;
}

// Initialize or retrieve the cached connection object
const cached = global.mongooseCache ?? {
  conn: null,
  promise: null
};

global.mongooseCache = cached;

// Track whether connection event listeners have been attached
let listenersAttached = false;

/**
 * Attaches event listeners to mongoose connection for monitoring and logging
 * Listens for connection, disconnection, and error events
 */
function attachConnectionListeners() {
  // Only attach listeners once to avoid duplicates
  if (listenersAttached) {
    return;
  }

  listenersAttached = true;

  // Log when MongoDB successfully connects
  mongoose.connection.on("connected", () => {
    logEvent("info", "MongoDB connected");
  });

  // Log and clear cache when MongoDB disconnects
  mongoose.connection.on("disconnected", () => {
    logEvent("warn", "MongoDB disconnected");
    cached.conn = null;
  });

  // Log and clear cache on connection errors
  mongoose.connection.on("error", (error) => {
    logEvent("error", "MongoDB connection error", {
      error: error instanceof Error ? error.message : String(error)
    });
    cached.promise = null;
  });
}

/**
 * Checks if MongoDB URI is properly configured in environment variables
 * @returns true if MONGODB_URI is set and not empty
 */
export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI?.trim());
}

/**
 * Connects to MongoDB with connection pooling and caching
 * Uses global cache to prevent multiple connections in serverless environments
 * @returns Mongoose connection instance
 * @throws Error if MONGODB_URI is not configured
 */
export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  // Ensure MongoDB URI is configured
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  // Attach event listeners for monitoring
  attachConnectionListeners();

  // Return cached connection if it already exists and is ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If no connection promise exists, create a new connection
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri, {
        bufferCommands: false, // Don't queue commands while connecting
        maxPoolSize: 10, // Maximum number of connections in the pool
        serverSelectionTimeoutMS: 2000, // Fail fast - reduced from 5000ms
        socketTimeoutMS: 10000, // Individual socket timeout
        connectTimeoutMS: 2000 // Initial connection timeout
      })
      .then((connection) => connection)
      .catch((error) => {
        // Clear cache on connection error
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  // Wait for connection promise to resolve and cache the connection
  cached.conn = await cached.promise;
  return cached.conn;
}
