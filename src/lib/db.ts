import "server-only";
import mongoose from "mongoose";

declare global {
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cache = (globalThis.__mongoose ??= { conn: null, promise: null });

/** Cached connection — safe for dev hot-reload and Vercel serverless. */
export async function dbConnect() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local (see README).");
  }
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
    });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
