import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schemas';

// Connection configuration
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cronx_dev',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
};

// Create connection
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${connectionConfig.username}:${connectionConfig.password}@${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}`;

// Create postgres client
export const client = postgres(connectionString, {
  max: connectionConfig.max,
  idle_timeout: connectionConfig.idle_timeout,
  connect_timeout: connectionConfig.connect_timeout,
  ssl: connectionConfig.ssl,
});

// Create drizzle instance
export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Connection health check
export async function checkConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  try {
    await client.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}