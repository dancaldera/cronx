import { pgTable, uuid, varchar, text, integer, json, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { cronJobs } from './cron-jobs';

export const executionLogs = pgTable('execution_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  cronJobId: uuid('cron_job_id').notNull().references(() => cronJobs.id, { onDelete: 'cascade' }),
  executionTime: timestamp('execution_time').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull(),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  responseHeaders: json('response_headers').$type<Record<string, string>>(),
  executionDuration: integer('execution_duration').notNull(), // in milliseconds
  errorMessage: text('error_message'),
  retryAttempt: integer('retry_attempt').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const executionLogsRelations = relations(executionLogs, ({ one }) => ({
  cronJob: one(cronJobs, {
    fields: [executionLogs.cronJobId],
    references: [cronJobs.id],
  }),
}));

// Zod schemas for validation
export const insertExecutionLogSchema = z.object({
  cronJobId: z.string().uuid(),
  status: z.enum(['success', 'failure', 'timeout']),
  responseStatus: z.number().optional(),
  responseBody: z.string().optional(),
  responseHeaders: z.record(z.string()).optional(),
  executionDuration: z.number().int().min(0),
  errorMessage: z.string().optional(),
  retryAttempt: z.number().int().min(0).default(0),
});

export const selectExecutionLogSchema = z.object({
  id: z.string().uuid(),
  cronJobId: z.string().uuid(),
  executionTime: z.date(),
  status: z.enum(['success', 'failure', 'timeout']),
  responseStatus: z.number().nullable(),
  responseBody: z.string().nullable(),
  responseHeaders: z.record(z.string()).nullable(),
  executionDuration: z.number(),
  errorMessage: z.string().nullable(),
  retryAttempt: z.number(),
  createdAt: z.date(),
});

// TypeScript types
export type ExecutionLog = typeof executionLogs.$inferSelect;
export type NewExecutionLog = typeof executionLogs.$inferInsert;