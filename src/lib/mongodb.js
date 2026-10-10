
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not configured.");
}

const globalWithMongoose = globalThis;

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

const cached = globalWithMongoose.mongoose;

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => {
        cached.conn = connection;
        return connection;
      })
      .catch((error) => {
        cached.conn = null;
        cached.promise = null;
        throw error;
      });
  }

  return cached.promise;
}