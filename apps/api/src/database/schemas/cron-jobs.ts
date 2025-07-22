import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { users } from './users';
import { httpTemplates } from './http-templates';

export const cronJobs = pgTable('cron_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  cronExpression: varchar('cron_expression', { length: 100 }).notNull(),
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  httpTemplateId: uuid('http_template_id').notNull().references(() => httpTemplates.id),
  isEnabled: boolean('is_enabled').notNull().default(true),
  retryAttempts: integer('retry_attempts').notNull().default(3),
  timeoutSeconds: integer('timeout_seconds').notNull().default(30),
  lastExecution: timestamp('last_execution'),
  nextExecution: timestamp('next_execution'),
  executionCount: integer('execution_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Relations
export const cronJobsRelations = relations(cronJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [cronJobs.userId],
    references: [users.id],
  }),
  httpTemplate: one(httpTemplates, {
    fields: [cronJobs.httpTemplateId],
    references: [httpTemplates.id],
  }),
  // executionLogs: many(executionLogs), // Defined in execution-logs.ts
}));

// Note: executionLogs relation will be defined in execution-logs.ts to avoid circular imports

// Zod schemas for validation
export const insertCronJobSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  cronExpression: z.string().min(1),
  timezone: z.string().default('UTC'),
  httpTemplateId: z.string().uuid(),
  isEnabled: z.boolean().default(true),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  timeoutSeconds: z.number().int().min(1).max(300).default(30),
});

export const selectCronJobSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  cronExpression: z.string(),
  timezone: z.string(),
  httpTemplateId: z.string().uuid(),
  isEnabled: z.boolean(),
  retryAttempts: z.number(),
  timeoutSeconds: z.number(),
  lastExecution: z.date().nullable(),
  nextExecution: z.date().nullable(),
  executionCount: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateCronJobSchema = insertCronJobSchema.omit({
  userId: true,
}).partial();

// TypeScript types
export type CronJob = typeof cronJobs.$inferSelect;
export type NewCronJob = typeof cronJobs.$inferInsert;
export type UpdateCronJob = z.infer<typeof updateCronJobSchema>;