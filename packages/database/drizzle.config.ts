import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schemas/*.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/cronx_dev',
  },
  verbose: true,
  strict: true,
});