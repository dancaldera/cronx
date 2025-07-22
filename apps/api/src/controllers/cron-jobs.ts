import { Request, Response } from 'express';
import { db, cronJobs, httpTemplates, insertCronJobSchema, updateCronJobSchema } from '../database';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import winston from 'winston';
import cronParser from 'cron-parser';
import { schedulerService } from '../services/scheduler';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'cronx-api', module: 'cron-jobs' },
});

// Create CRON Job
export const createCronJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate request body
    const validatedData = insertCronJobSchema.parse({
      ...req.body,
      userId,
    });

    // Validate CRON expression
    try {
      const interval = cronParser.parseExpression(validatedData.cronExpression);
      const nextExecution = interval.next().toDate();
      
      // Verify HTTP template exists and belongs to user
      const [template] = await db
        .select()
        .from(httpTemplates)
        .where(and(
          eq(httpTemplates.id, validatedData.httpTemplateId),
          eq(httpTemplates.userId, userId),
          isNull(httpTemplates.deletedAt)
        ))
        .limit(1);

      if (!template) {
        res.status(400).json({
          error: 'HTTP template not found or does not belong to user',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create CRON job
      const [cronJob] = await db
        .insert(cronJobs)
        .values({
          ...validatedData,
          nextExecution,
        })
        .returning();

      // Schedule the job if enabled
      if (cronJob.isEnabled) {
        await schedulerService.scheduleJob(cronJob);
      }

      logger.info('CRON job created', { 
        cronJobId: cronJob.id, 
        userId,
        name: cronJob.name,
        isEnabled: cronJob.isEnabled
      });

      res.status(201).json({
        success: true,
        data: cronJob,
        timestamp: new Date().toISOString(),
      });
    } catch (cronError) {
      res.status(400).json({
        error: 'Invalid CRON expression',
        details: cronError instanceof Error ? cronError.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      return;
    }
  } catch (error) {
    logger.error('Error creating CRON job:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to create CRON job',
      timestamp: new Date().toISOString(),
    });
  }
};

// Get all CRON Jobs for user
export const getCronJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const jobs = await db
      .select({
        id: cronJobs.id,
        userId: cronJobs.userId,
        name: cronJobs.name,
        description: cronJobs.description,
        cronExpression: cronJobs.cronExpression,
        timezone: cronJobs.timezone,
        httpTemplateId: cronJobs.httpTemplateId,
        isEnabled: cronJobs.isEnabled,
        retryAttempts: cronJobs.retryAttempts,
        timeoutSeconds: cronJobs.timeoutSeconds,
        lastExecution: cronJobs.lastExecution,
        nextExecution: cronJobs.nextExecution,
        executionCount: cronJobs.executionCount,
        successCount: cronJobs.successCount,
        failureCount: cronJobs.failureCount,
        createdAt: cronJobs.createdAt,
        updatedAt: cronJobs.updatedAt,
        httpTemplate: {
          id: httpTemplates.id,
          name: httpTemplates.name,
          method: httpTemplates.method,
          url: httpTemplates.url,
        }
      })
      .from(cronJobs)
      .leftJoin(httpTemplates, eq(cronJobs.httpTemplateId, httpTemplates.id))
      .where(and(
        eq(cronJobs.userId, userId),
        isNull(cronJobs.deletedAt)
      ))
      .orderBy(desc(cronJobs.createdAt));

    res.json({
      success: true,
      data: jobs,
      count: jobs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching CRON jobs:', error);
    
    res.status(500).json({
      error: 'Failed to fetch CRON jobs',
      timestamp: new Date().toISOString(),
    });
  }
};

// Get CRON Job by ID
export const getCronJobById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    
    const [job] = await db
      .select({
        id: cronJobs.id,
        userId: cronJobs.userId,
        name: cronJobs.name,
        description: cronJobs.description,
        cronExpression: cronJobs.cronExpression,
        timezone: cronJobs.timezone,
        httpTemplateId: cronJobs.httpTemplateId,
        isEnabled: cronJobs.isEnabled,
        retryAttempts: cronJobs.retryAttempts,
        timeoutSeconds: cronJobs.timeoutSeconds,
        lastExecution: cronJobs.lastExecution,
        nextExecution: cronJobs.nextExecution,
        executionCount: cronJobs.executionCount,
        successCount: cronJobs.successCount,
        failureCount: cronJobs.failureCount,
        createdAt: cronJobs.createdAt,
        updatedAt: cronJobs.updatedAt,
        httpTemplate: {
          id: httpTemplates.id,
          name: httpTemplates.name,
          method: httpTemplates.method,
          url: httpTemplates.url,
          headers: httpTemplates.headers,
          body: httpTemplates.body,
          authType: httpTemplates.authType,
          timeoutSeconds: httpTemplates.timeoutSeconds,
        }
      })
      .from(cronJobs)
      .leftJoin(httpTemplates, eq(cronJobs.httpTemplateId, httpTemplates.id))
      .where(and(
        eq(cronJobs.id, id),
        eq(cronJobs.userId, userId),
        isNull(cronJobs.deletedAt)
      ))
      .limit(1);

    if (!job) {
      res.status(404).json({
        error: 'CRON job not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: job,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching CRON job:', error);
    
    res.status(500).json({
      error: 'Failed to fetch CRON job',
      timestamp: new Date().toISOString(),
    });
  }
};

// Update CRON Job
export const updateCronJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    
    // Validate request body
    const validatedData = updateCronJobSchema.parse(req.body);

    // Check if job exists and belongs to user
    const [existingJob] = await db
      .select()
      .from(cronJobs)
      .where(and(
        eq(cronJobs.id, id),
        eq(cronJobs.userId, userId),
        isNull(cronJobs.deletedAt)
      ))
      .limit(1);

    if (!existingJob) {
      res.status(404).json({
        error: 'CRON job not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    let nextExecution = existingJob.nextExecution;

    // If CRON expression is being updated, validate and calculate next execution
    if (validatedData.cronExpression) {
      try {
        const interval = cronParser.parseExpression(validatedData.cronExpression);
        nextExecution = interval.next().toDate();
      } catch (cronError) {
        res.status(400).json({
          error: 'Invalid CRON expression',
          details: cronError instanceof Error ? cronError.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // If HTTP template is being updated, verify it exists and belongs to user
    if (validatedData.httpTemplateId) {
      const [template] = await db
        .select()
        .from(httpTemplates)
        .where(and(
          eq(httpTemplates.id, validatedData.httpTemplateId),
          eq(httpTemplates.userId, userId),
          isNull(httpTemplates.deletedAt)
        ))
        .limit(1);

      if (!template) {
        res.status(400).json({
          error: 'HTTP template not found or does not belong to user',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Update job
    const [updatedJob] = await db
      .update(cronJobs)
      .set({
        ...validatedData,
        nextExecution,
        updatedAt: new Date(),
      })
      .where(eq(cronJobs.id, id))
      .returning();

    // Update scheduled job
    await schedulerService.updateJob(updatedJob);

    logger.info('CRON job updated', { 
      cronJobId: id, 
      userId,
      name: updatedJob.name,
      isEnabled: updatedJob.isEnabled
    });

    res.json({
      success: true,
      data: updatedJob,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating CRON job:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to update CRON job',
      timestamp: new Date().toISOString(),
    });
  }
};

// Delete CRON Job (soft delete)
export const deleteCronJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;

    // Check if job exists and belongs to user
    const [existingJob] = await db
      .select()
      .from(cronJobs)
      .where(and(
        eq(cronJobs.id, id),
        eq(cronJobs.userId, userId),
        isNull(cronJobs.deletedAt)
      ))
      .limit(1);

    if (!existingJob) {
      res.status(404).json({
        error: 'CRON job not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Soft delete job
    await db
      .update(cronJobs)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        isEnabled: false,
      })
      .where(eq(cronJobs.id, id));

    // Remove from scheduler
    await schedulerService.unscheduleJob(id);

    logger.info('CRON job deleted', { 
      cronJobId: id, 
      userId,
      name: existingJob.name 
    });

    res.json({
      success: true,
      message: 'CRON job deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error deleting CRON job:', error);
    
    res.status(500).json({
      error: 'Failed to delete CRON job',
      timestamp: new Date().toISOString(),
    });
  }
};

// Enable/Disable CRON Job
export const toggleCronJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    const { isEnabled } = req.body;

    if (typeof isEnabled !== 'boolean') {
      res.status(400).json({
        error: 'isEnabled must be a boolean',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if job exists and belongs to user
    const [existingJob] = await db
      .select()
      .from(cronJobs)
      .where(and(
        eq(cronJobs.id, id),
        eq(cronJobs.userId, userId),
        isNull(cronJobs.deletedAt)
      ))
      .limit(1);

    if (!existingJob) {
      res.status(404).json({
        error: 'CRON job not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Update job status
    const [updatedJob] = await db
      .update(cronJobs)
      .set({
        isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(cronJobs.id, id))
      .returning();

    // Update scheduler
    if (isEnabled) {
      await schedulerService.scheduleJob(updatedJob);
    } else {
      await schedulerService.unscheduleJob(id);
    }

    logger.info('CRON job toggled', { 
      cronJobId: id, 
      userId,
      name: updatedJob.name,
      isEnabled
    });

    res.json({
      success: true,
      data: updatedJob,
      message: `CRON job ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error toggling CRON job:', error);
    
    res.status(500).json({
      error: 'Failed to toggle CRON job',
      timestamp: new Date().toISOString(),
    });
  }
};

// Execute CRON Job manually
export const executeCronJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;

    // Check if job exists and belongs to user
    const [job] = await db
      .select()
      .from(cronJobs)
      .where(and(
        eq(cronJobs.id, id),
        eq(cronJobs.userId, userId),
        isNull(cronJobs.deletedAt)
      ))
      .limit(1);

    if (!job) {
      res.status(404).json({
        error: 'CRON job not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Execute the job manually
    const result = await schedulerService.executeJob(job);

    logger.info('CRON job executed manually', { 
      cronJobId: id, 
      userId,
      name: job.name,
      success: result.success
    });

    res.json({
      success: true,
      data: result,
      message: 'CRON job executed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error executing CRON job:', error);
    
    res.status(500).json({
      error: 'Failed to execute CRON job',
      timestamp: new Date().toISOString(),
    });
  }
};