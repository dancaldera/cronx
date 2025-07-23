import { config } from "dotenv";
import path from "path";

// Load environment variables if not already loaded
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, "../../../.env");
  config({ path: envPath });
  console.log("Loaded environment variables from:", envPath);
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schemas";

// Connection configuration
const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5433"), // Changed default to match .env
  database: process.env.DB_NAME || "cronx_dev",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 10, // Reduced connection pool size
  idle_timeout: 30,
  connect_timeout: 15,
};

// Create connection string with better logging
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${connectionConfig.username}${connectionConfig.password ? ":" + connectionConfig.password : ""}@${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}`;

// Create postgres client with better error handling
export const client = postgres(connectionString, {
  max: connectionConfig.max,
  idle_timeout: connectionConfig.idle_timeout,
  connect_timeout: connectionConfig.connect_timeout,
  ssl: connectionConfig.ssl,
  onnotice: () => {}, // Suppress NOTICE messages
  debug: process.env.NODE_ENV === "development",
});

// Create drizzle instance
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

// Add connection event listeners
client.listen("error", (err) => {
  console.error("PostgreSQL client error:", err);
});

client.listen("connect", () => {
  console.log("PostgreSQL client connected");
});

client.listen("disconnect", () => {
  console.log("PostgreSQL client disconnected");
});

// Connection health check with better error handling
export async function checkConnection(): Promise<boolean> {
  try {
    console.log("Testing database connection...");
    const result =
      await client`SELECT 1 as test, current_timestamp as timestamp`;
    console.log("Database connection successful:", result[0]);
    return true;
  } catch (error: any) {
    console.error("Database connection failed:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
    });
    return false;
  }
}

// Graceful shutdown with timeout
export async function closeConnection(): Promise<void> {
  try {
    console.log("Closing database connections...");

    // Set a timeout for closing connections
    const closePromise = client.end();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection close timeout")), 5000),
    );

    await Promise.race([closePromise, timeoutPromise]);
    console.log("Database connection closed successfully");
  } catch (error) {
    console.error("Error closing database connection:", error);
    // Force close if needed
    try {
      client.end({ timeout: 1 });
    } catch (forceError) {
      console.error("Error force closing connection:", forceError);
    }
  }
}
