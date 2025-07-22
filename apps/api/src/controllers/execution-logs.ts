import { Request, Response } from 'express';
import { db, executionLogs, cronJobs } from '../database';
import { eq, and, desc, lte, gte, count } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'cronx-api', module: 'execution-logs' },
});

// Get execution logs for a CRON job
export const getExecutionLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { cronJobId } = req.params;
    const { limit = 50, offset = 0, status, startDate, endDate } = req.query;

    // Verify CRON job belongs to user
    const [cronJob] = await db
      .select()
      .from(cronJobs)
      .where(and(
        eq(cronJobs.id, cronJobId),
        eq(cronJobs.userId, userId)
      ))
      .limit(1);

    if (!cronJob) {
      res.status(404).json({
        error: 'CRON job not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Build query conditions
    const conditions = [eq(executionLogs.cronJobId, cronJobId)];

    if (status && typeof status === 'string') {
      conditions.push(eq(executionLogs.status, status));
    }

    if (startDate && typeof startDate === 'string') {
      conditions.push(gte(executionLogs.executionTime, new Date(startDate)));
    }

    if (endDate && typeof endDate === 'string') {
      conditions.push(lte(executionLogs.executionTime, new Date(endDate)));
    }

    // Get execution logs
    const logs = await db
      .select()
      .from(executionLogs)
      .where(and(...conditions))
      .orderBy(desc(executionLogs.executionTime))
      .limit(Math.min(Number(limit), 100))
      .offset(Number(offset));

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(executionLogs)
      .where(and(...conditions));

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: Number(totalCount),
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + logs.length < Number(totalCount),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching execution logs:', error);
    
    res.status(500).json({
      error: 'Failed to fetch execution logs',
      timestamp: new Date().toISOString(),
    });
  }
};

// Get all execution logs for user's CRON jobs
export const getAllExecutionLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { limit = 50, offset = 0, status, startDate, endDate } = req.query;

    // Build query conditions
    const conditions = [eq(cronJobs.userId, userId)];

    if (status && typeof status === 'string') {
      conditions.push(eq(executionLogs.status, status));
    }

    if (startDate && typeof startDate === 'string') {
      conditions.push(gte(executionLogs.executionTime, new Date(startDate)));
    }

    if (endDate && typeof endDate === 'string') {
      conditions.push(lte(executionLogs.executionTime, new Date(endDate)));
    }

    // Get execution logs with CRON job details
    const logs = await db
      .select({
        id: executionLogs.id,
        cronJobId: executionLogs.cronJobId,
        executionTime: executionLogs.executionTime,
        status: executionLogs.status,
        responseStatus: executionLogs.responseStatus,
        responseBody: executionLogs.responseBody,
        responseHeaders: executionLogs.responseHeaders,
        executionDuration: executionLogs.executionDuration,
        errorMessage: executionLogs.errorMessage,
        retryAttempt: executionLogs.retryAttempt,
        createdAt: executionLogs.createdAt,
        cronJob: {
          id: cronJobs.id,
          name: cronJobs.name,
          cronExpression: cronJobs.cronExpression,
        }
      })
      .from(executionLogs)
      .leftJoin(cronJobs, eq(executionLogs.cronJobId, cronJobs.id))
      .where(and(...conditions))
      .orderBy(desc(executionLogs.executionTime))
      .limit(Math.min(Number(limit), 100))
      .offset(Number(offset));

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(executionLogs)
      .leftJoin(cronJobs, eq(executionLogs.cronJobId, cronJobs.id))
      .where(and(...conditions));

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: Number(totalCount),
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + logs.length < Number(totalCount),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching all execution logs:', error);
    
    res.status(500).json({
      error: 'Failed to fetch execution logs',
      timestamp: new Date().toISOString(),
    });
  }
};

// Get execution statistics
export const getExecutionStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { cronJobId, period = '7d' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build base conditions
    const baseConditions = [
      eq(cronJobs.userId, userId),
      gte(executionLogs.executionTime, startDate)
    ];

    if (cronJobId && typeof cronJobId === 'string') {
      baseConditions.push(eq(executionLogs.cronJobId, cronJobId));
    }

    // Get success/failure counts
    const stats = await db
      .select({
        status: executionLogs.status,
        count: executionLogs.id,
      })
      .from(executionLogs)
      .leftJoin(cronJobs, eq(executionLogs.cronJobId, cronJobs.id))
      .where(and(...baseConditions));

    // Calculate totals
    const totalExecutions = stats.length;
    const successCount = stats.filter(s => s.status === 'success').length;
    const failureCount = stats.filter(s => s.status === 'failure').length;
    const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

    // Get average execution time
    const [avgTime] = await db
      .select({ avgDuration: executionLogs.executionDuration })
      .from(executionLogs)
      .leftJoin(cronJobs, eq(executionLogs.cronJobId, cronJobs.id))
      .where(and(...baseConditions, eq(executionLogs.status, 'success')));

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        totalExecutions,
        successCount,
        failureCount,
        successRate: Math.round(successRate * 100) / 100,
        averageExecutionTime: avgTime?.avgDuration || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching execution statistics:', error);
    
    res.status(500).json({
      error: 'Failed to fetch execution statistics',
      timestamp: new Date().toISOString(),
    });
  }
};