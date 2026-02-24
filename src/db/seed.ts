import { db } from './index';
import { labels } from './schema';
import { DEFAULT_LABELS } from '@/lib/constants';

export async function seedDefaultLabels(workspaceId: number): Promise<void> {
  const existing = await db
    .select({ id: labels.id })
    .from(labels)
    .where(
      // Import eq at runtime to avoid circular dependency issues
      (await import('drizzle-orm')).eq(labels.workspaceId, workspaceId),
    );

  if (existing.length > 0) return; // already seeded

  await db.insert(labels).values(
    DEFAULT_LABELS.map((l) => ({
      workspaceId,
      name: l.name,
      color: l.color,
    })),
  );
}

// Standalone script entry point
if (process.argv[1] === import.meta.url || process.argv[1]?.endsWith('seed.ts')) {
  const workspaceId = parseInt(process.argv[2] ?? '1', 10);
  seedDefaultLabels(workspaceId)
    .then(() => {
      console.log(`Seeded default labels for workspace ${workspaceId}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
