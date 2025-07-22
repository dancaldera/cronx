const bcrypt = require('bcryptjs');
const { db, users } = require('./apps/api/src/database');
const { eq } = require('drizzle-orm');

async function updatePassword() {
  try {
    const passwordHash = await bcrypt.hash('admin123!', 12);
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.email, 'dancaldera@proton.me'));
    console.log('Password updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePassword();