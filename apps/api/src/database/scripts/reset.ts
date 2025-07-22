import { sql } from 'drizzle-orm';
import { db, client } from '../utils/connection';

async function resetDatabase() {
  console.log('🔄 Resetting database...');
  
  try {
    // Drop all tables in reverse dependency order
    await db.execute(sql`DROP TABLE IF EXISTS dashboard_analytics CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS execution_logs CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS cron_jobs CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS http_templates CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    
    console.log('✅ All tables dropped');
    
    // Run migrations to recreate tables
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    await migrate(db, { migrationsFolder: './src/migrations' });
    
    console.log('✅ Database reset completed successfully');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();