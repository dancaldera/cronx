import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from '../utils/connection';

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './src/migrations' });
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();