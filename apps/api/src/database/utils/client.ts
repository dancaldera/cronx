import { createClient, RedisClientType } from "redis";

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
};

// Create Redis client with retry configuration
export const redis: RedisClientType = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.log("Redis connection failed after 3 retries, disabling Redis");
        return false; // Stop trying to reconnect
      }
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 5000,
  },
  password: redisConfig.password,
  database: redisConfig.db,
});

// Redis connection state
let redisConnected = false;

// Redis connection event handlers
redis.on("connect", () => {
  console.log("Redis client connected");
  redisConnected = true;
});

redis.on("error", (err: Error) => {
  console.warn("Redis client error (Redis may not be available):", err.message);
  redisConnected = false;
});

redis.on("ready", () => {
  console.log("Redis client ready");
  redisConnected = true;
});

redis.on("end", () => {
  console.log("Redis client disconnected");
  redisConnected = false;
});

// Try to connect to Redis, but don't fail if it's not available
redis.connect().catch((err) => {
  console.warn(
    "Redis connection failed, continuing without Redis:",
    err.message,
  );
  redisConnected = false;
});

// Cache utility functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisConnected) {
      console.warn("Redis not available for cache get");
      return null;
    }
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    if (!redisConnected) {
      console.warn("Redis not available for cache set");
      return false;
    }
    try {
      await redis.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (!redisConnected) {
      console.warn("Redis not available for cache delete");
      return false;
    }
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redisConnected) {
      console.warn("Redis not available for cache exists check");
      return false;
    }
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  },
};

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  if (!redisConnected) {
    console.log("Redis was not connected, skipping close");
    return;
  }

  try {
    await Promise.race([
      redis.quit(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis close timeout")), 2000),
      ),
    ]);
    console.log("Redis connection closed");
  } catch (error: any) {
    console.warn("Redis connection close warning:", error.message);
    // Force disconnect if quit fails
    try {
      redis.disconnect();
    } catch (disconnectError) {
      console.warn("Redis force disconnect warning:", disconnectError);
    }
  }
}
