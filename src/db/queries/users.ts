import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { users } from '@/db/schema';

export async function updateUserBgcolor(userId: string, bgcolor: string): Promise<void> {
  await db.update(users).set({ bgcolor }).where(eq(users.id, userId));
}
