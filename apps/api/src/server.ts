import { config } from "dotenv";
import path from "path";

// Load environment variables FIRST before any other imports
const envPath = path.resolve(__dirname, "../.env");
config({ path: envPath });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import winston from "winston";
import { checkConnection } from "./database/utils/connection";

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "cronx-api" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan("combined"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// JSON parsing error handler - must come after express.json()
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err instanceof SyntaxError && "body" in err) {
      logger.error("JSON parsing error:", {
        error: err.message,
        url: req.url,
        method: req.method,
        ip: req.ip,
      });

      res.status(400).json({
        error: "Invalid JSON format",
        message: "Please check your request body for proper JSON formatting",
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(err);
  },
);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const dbConnected = await checkConnection();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      database: dbConnected ? "connected" : "disconnected",
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "error",
    });
  }
});

// Import routes
import authRoutes from "./routes/auth";
const httpTemplateRoutes = require("./routes/http-templates");
const cronJobRoutes = require("./routes/cron-jobs");
const executionLogRoutes = require("./routes/execution-logs");

// Route handlers
app.use("/api/auth", authRoutes);
app.use("/api/http-templates", httpTemplateRoutes);
app.use("/api/cron-jobs", cronJobRoutes);
app.use("/api/execution-logs", executionLogRoutes);

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error("Unhandled error:", {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    res.status(500).json({
      error: "Something went wrong!",
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 API Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);

  // Test database connection on startup
  try {
    const dbConnected = await checkConnection();
    if (dbConnected) {
      logger.info("✅ Database connection established");
    } else {
      logger.error("❌ Database connection failed");
    }
  } catch (error) {
    logger.error("❌ Database connection error:", error);
  }
});

// Graceful shutdown function
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close server
  server.close(async (err) => {
    if (err) {
      logger.error("Error during server shutdown:", err);
      process.exit(1);
    }

    logger.info("HTTP server closed");

    try {
      // Close database connections
      const { closeConnection } = await import("./database/utils/connection");
      await closeConnection();

      // Close Redis connections if available
      try {
        const { closeRedisConnection } = await import(
          "./database/utils/client"
        );
        await closeRedisConnection();
      } catch (redisError) {
        // Redis might not be configured, continue shutdown
        logger.warn(
          "Redis connection close warning:",
          redisError instanceof Error ? redisError.message : redisError,
        );
      }

      // Stop scheduler service
      try {
        const { schedulerService } = await import("./services/scheduler");
        await schedulerService.shutdown();
      } catch (schedulerError) {
        logger.error("Error shutting down scheduler:", schedulerError);
      }

      logger.info("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force exit after timeout
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});
