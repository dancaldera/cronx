import { db } from '../utils/connection';
import { users, httpTemplates, cronJobs } from '../schemas';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo user
    const [user] = await db.insert(users).values({
      email: 'demo@cronx.dev',
      username: 'demo_user',
      passwordHash: await bcrypt.hash('demo123', 10),
      firstName: 'Demo',
      lastName: 'User',
      isVerified: true,
    }).returning();

    console.log('✅ Created demo user:', user.email);

    // Create sample HTTP template
    const [httpTemplate] = await db.insert(httpTemplates).values({
      userId: user.id,
      name: 'Health Check Example',
      description: 'Simple health check endpoint',
      method: 'GET',
      url: 'https://httpbin.org/status/200',
      headers: {
        'User-Agent': 'CronX-Health-Check/1.0',
      },
      expectedStatusCodes: [200],
    }).returning();

    console.log('✅ Created sample HTTP template:', httpTemplate.name);

    // Create sample CRON job
    const [cronJob] = await db.insert(cronJobs).values({
      userId: user.id,
      name: 'Daily Health Check',
      description: 'Check service health every day at 9 AM',
      cronExpression: '0 9 * * *',
      timezone: 'UTC',
      httpTemplateId: httpTemplate.id,
      isEnabled: true,
      retryAttempts: 3,
      timeoutSeconds: 30,
    }).returning();

    console.log('✅ Created sample CRON job:', cronJob.name);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();