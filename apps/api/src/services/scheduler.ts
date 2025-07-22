import cron from 'node-cron';
import cronParser from 'cron-parser';
import axios from 'axios';
import winston from 'winston';
import { db, cronJobs, httpTemplates, executionLogs } from '../database';
import { eq, and, isNull } from 'drizzle-orm';
import type { CronJob } from '../database';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'cronx-api', module: 'scheduler' },
});

interface ExecutionResult {
  success: boolean;
  status?: number;
  statusText?: string;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  executionTime: number;
  error?: string;
}

interface ScheduledJob {
  task: cron.ScheduledTask;
  cronJob: CronJob;
}

class SchedulerService {
  private scheduledJobs: Map<string, ScheduledJob> = new Map();

  constructor() {
    logger.info('Scheduler service initialized');
    this.initializeExistingJobs();
  }

  // Initialize existing enabled jobs on startup
  private async initializeExistingJobs(): Promise<void> {
    try {
      const enabledJobs = await db
        .select()
        .from(cronJobs)
        .where(and(
          eq(cronJobs.isEnabled, true),
          isNull(cronJobs.deletedAt)
        ));

      for (const job of enabledJobs) {
        await this.scheduleJob(job);
      }

      logger.info(`Initialized ${enabledJobs.length} existing CRON jobs`);
    } catch (error) {
      logger.error('Error initializing existing jobs:', error);
    }
  }

  // Schedule a CRON job
  async scheduleJob(cronJob: CronJob): Promise<void> {
    try {
      // Unschedule existing job if it exists
      if (this.scheduledJobs.has(cronJob.id)) {
        this.unscheduleJob(cronJob.id);
      }

      // Validate CRON expression
      if (!cron.validate(cronJob.cronExpression)) {
        throw new Error(`Invalid CRON expression: ${cronJob.cronExpression}`);
      }

      // Create scheduled task
      const task = cron.schedule(
        cronJob.cronExpression,
        async () => {
          await this.executeJob(cronJob);
        },
        {
          scheduled: true,
          timezone: cronJob.timezone || 'UTC',
        }
      );

      // Store the scheduled job
      this.scheduledJobs.set(cronJob.id, {
        task,
        cronJob,
      });

      // Update next execution time
      await this.updateNextExecution(cronJob.id, cronJob.cronExpression, cronJob.timezone);

      logger.info('CRON job scheduled', {
        cronJobId: cronJob.id,
        name: cronJob.name,
        expression: cronJob.cronExpression,
        timezone: cronJob.timezone,
      });
    } catch (error) {
      logger.error('Error scheduling CRON job:', error);
      throw error;
    }
  }

  // Unschedule a CRON job
  async unscheduleJob(cronJobId: string): Promise<void> {
    try {
      const scheduledJob = this.scheduledJobs.get(cronJobId);
      if (scheduledJob) {
        scheduledJob.task.stop();
        this.scheduledJobs.delete(cronJobId);

        logger.info('CRON job unscheduled', {
          cronJobId,
          name: scheduledJob.cronJob.name,
        });
      }
    } catch (error) {
      logger.error('Error unscheduling CRON job:', error);
      throw error;
    }
  }

  // Update an existing scheduled job
  async updateJob(updatedCronJob: CronJob): Promise<void> {
    try {
      if (updatedCronJob.isEnabled) {
        await this.scheduleJob(updatedCronJob);
      } else {
        await this.unscheduleJob(updatedCronJob.id);
      }
    } catch (error) {
      logger.error('Error updating scheduled CRON job:', error);
      throw error;
    }
  }

  // Execute a CRON job
  async executeJob(cronJob: CronJob): Promise<ExecutionResult> {
    const startTime = Date.now();
    let result: ExecutionResult;

    try {
      // Get the HTTP template
      const [template] = await db
        .select()
        .from(httpTemplates)
        .where(and(
          eq(httpTemplates.id, cronJob.httpTemplateId),
          isNull(httpTemplates.deletedAt)
        ))
        .limit(1);

      if (!template) {
        throw new Error('HTTP template not found');
      }

      // Execute HTTP request with retry logic
      result = await this.executeHttpRequest(template, cronJob.retryAttempts || 3);

      // Update execution statistics
      await this.updateExecutionStats(cronJob.id, result.success);

      // Update next execution time
      await this.updateNextExecution(cronJob.id, cronJob.cronExpression, cronJob.timezone);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      result = {
        success: false,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Update failure statistics
      await this.updateExecutionStats(cronJob.id, false);
    }

    // Log execution result
    await this.logExecution(cronJob.id, result, 0);

    return result;
  }

  // Execute HTTP request with retry logic
  private async executeHttpRequest(
    template: any,
    maxRetries: number,
    retryAttempt: number = 0
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Prepare request config
      const requestConfig: any = {
        method: template.method.toLowerCase(),
        url: template.url,
        headers: template.headers || {},
        timeout: (template.timeoutSeconds || 30) * 1000,
        validateStatus: () => true, // Accept all status codes
        maxRedirects: template.followRedirects ? 5 : 0,
      };

      // Add body for non-GET requests
      if (template.body && !['GET', 'HEAD'].includes(template.method.toUpperCase())) {
        requestConfig.data = template.body;
      }

      // Add authentication
      if (template.authType && template.authConfig) {
        switch (template.authType) {
          case 'bearer':
            requestConfig.headers['Authorization'] = `Bearer ${template.authConfig.token}`;
            break;
          case 'basic':
            requestConfig.auth = {
              username: template.authConfig.username,
              password: template.authConfig.password,
            };
            break;
          case 'api_key':
            if (template.authConfig.location === 'header') {
              requestConfig.headers[template.authConfig.key] = template.authConfig.value;
            } else if (template.authConfig.location === 'query') {
              requestConfig.params = {
                ...requestConfig.params,
                [template.authConfig.key]: template.authConfig.value,
              };
            }
            break;
        }
      }

      const response = await axios(requestConfig);
      const executionTime = Date.now() - startTime;

      // Check if status code is expected
      const expectedCodes = template.expectedStatusCodes || [200];
      const isSuccess = expectedCodes.includes(response.status);

      const result: ExecutionResult = {
        success: isSuccess,
        status: response.status,
        statusText: response.statusText,
        responseBody: JSON.stringify(response.data),
        responseHeaders: response.headers as Record<string, string>,
        executionTime,
      };

      // If not successful and retries available, retry
      if (!isSuccess && retryAttempt < maxRetries) {
        logger.warn('HTTP request failed, retrying', {
          templateId: template.id,
          status: response.status,
          retryAttempt: retryAttempt + 1,
          maxRetries,
        });

        // Wait before retry (exponential backoff)
        await this.sleep(Math.pow(2, retryAttempt) * 1000);
        return await this.executeHttpRequest(template, maxRetries, retryAttempt + 1);
      }

      return result;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // If retries available, retry
      if (retryAttempt < maxRetries) {
        logger.warn('HTTP request error, retrying', {
          templateId: template.id,
          error: error.message,
          retryAttempt: retryAttempt + 1,
          maxRetries,
        });

        // Wait before retry (exponential backoff)
        await this.sleep(Math.pow(2, retryAttempt) * 1000);
        return await this.executeHttpRequest(template, maxRetries, retryAttempt + 1);
      }

      return {
        success: false,
        executionTime,
        error: error.message || 'HTTP request failed',
      };
    }
  }

  // Update execution statistics
  private async updateExecutionStats(cronJobId: string, success: boolean): Promise<void> {
    try {
      await db
        .update(cronJobs)
        .set({
          executionCount: success ? 
            (await this.getExecutionCount(cronJobId)) + 1 : 
            await this.getExecutionCount(cronJobId),
          successCount: success ? 
            (await this.getSuccessCount(cronJobId)) + 1 : 
            await this.getSuccessCount(cronJobId),
          failureCount: !success ? 
            (await this.getFailureCount(cronJobId)) + 1 : 
            await this.getFailureCount(cronJobId),
          lastExecution: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(cronJobs.id, cronJobId));
    } catch (error) {
      logger.error('Error updating execution stats:', error);
    }
  }

  // Update next execution time
  private async updateNextExecution(
    cronJobId: string,
    cronExpression: string,
    timezone: string = 'UTC'
  ): Promise<void> {
    try {
      const interval = cronParser.parseExpression(cronExpression, {
        tz: timezone,
      });
      const nextExecution = interval.next().toDate();

      await db
        .update(cronJobs)
        .set({
          nextExecution,
          updatedAt: new Date(),
        })
        .where(eq(cronJobs.id, cronJobId));
    } catch (error) {
      logger.error('Error updating next execution time:', error);
    }
  }

  // Log execution result
  private async logExecution(
    cronJobId: string,
    result: ExecutionResult,
    retryAttempt: number
  ): Promise<void> {
    try {
      await db.insert(executionLogs).values({
        cronJobId,
        executionTime: new Date(Date.now() - result.executionTime),
        status: result.success ? 'success' : 'failure',
        responseStatus: result.status,
        responseBody: result.responseBody,
        responseHeaders: result.responseHeaders,
        executionDuration: result.executionTime,
        errorMessage: result.error,
        retryAttempt,
      });
    } catch (error) {
      logger.error('Error logging execution result:', error);
    }
  }

  // Helper methods to get current counts
  private async getExecutionCount(cronJobId: string): Promise<number> {
    const [job] = await db
      .select({ executionCount: cronJobs.executionCount })
      .from(cronJobs)
      .where(eq(cronJobs.id, cronJobId))
      .limit(1);
    return job?.executionCount || 0;
  }

  private async getSuccessCount(cronJobId: string): Promise<number> {
    const [job] = await db
      .select({ successCount: cronJobs.successCount })
      .from(cronJobs)
      .where(eq(cronJobs.id, cronJobId))
      .limit(1);
    return job?.successCount || 0;
  }

  private async getFailureCount(cronJobId: string): Promise<number> {
    const [job] = await db
      .select({ failureCount: cronJobs.failureCount })
      .from(cronJobs)
      .where(eq(cronJobs.id, cronJobId))
      .limit(1);
    return job?.failureCount || 0;
  }

  // Utility function for delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get scheduled jobs status
  getScheduledJobsStatus(): Array<{
    cronJobId: string;
    name: string;
    isScheduled: boolean;
    nextExecution?: Date;
  }> {
    return Array.from(this.scheduledJobs.entries()).map(([id, scheduledJob]) => ({
      cronJobId: id,
      name: scheduledJob.cronJob.name,
      isScheduled: true,
      nextExecution: scheduledJob.cronJob.nextExecution || undefined,
    }));
  }

  // Shutdown gracefully
  async shutdown(): Promise<void> {
    logger.info('Shutting down scheduler service...');
    
    for (const [id, scheduledJob] of this.scheduledJobs.entries()) {
      scheduledJob.task.stop();
      this.scheduledJobs.delete(id);
    }
    
    logger.info('Scheduler service shut down completed');
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await schedulerService.shutdown();
});

process.on('SIGINT', async () => {
  await schedulerService.shutdown();
});