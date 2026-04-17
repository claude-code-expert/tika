import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { workspaceSettings } from '@/db/schema';
import { decryptApiKey } from '@/lib/encryptionService';

export async function getGeminiKeyMeta(
  workspaceId: number,
): Promise<{ maskedKey: string; updatedAt: string } | null> {
  const [row] = await db
    .select({
      maskedKey: workspaceSettings.maskedKey,
      updatedAt: workspaceSettings.updatedAt,
    })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.workspaceId, workspaceId))
    .limit(1);
  if (!row?.maskedKey) return null;
  return { maskedKey: row.maskedKey, updatedAt: row.updatedAt.toISOString() };
}

export async function upsertGeminiKey(
  workspaceId: number,
  data: { ciphertext: string; iv: string; tag: string; maskedKey: string },
): Promise<void> {
  await db
    .insert(workspaceSettings)
    .values({
      workspaceId,
      geminiKeyCiphertext: data.ciphertext,
      geminiKeyIv: data.iv,
      geminiKeyTag: data.tag,
      maskedKey: data.maskedKey,
    })
    .onConflictDoUpdate({
      target: workspaceSettings.workspaceId,
      set: {
        geminiKeyCiphertext: data.ciphertext,
        geminiKeyIv: data.iv,
        geminiKeyTag: data.tag,
        maskedKey: data.maskedKey,
      },
    });
}

export async function deleteGeminiKey(workspaceId: number): Promise<void> {
  await db.delete(workspaceSettings).where(eq(workspaceSettings.workspaceId, workspaceId));
}

// Phase 2 only — decrypt for AI API calls
export async function getDecryptedGeminiKey(workspaceId: number): Promise<string | null> {
  const [row] = await db
    .select({
      ciphertext: workspaceSettings.geminiKeyCiphertext,
      iv: workspaceSettings.geminiKeyIv,
      tag: workspaceSettings.geminiKeyTag,
    })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.workspaceId, workspaceId))
    .limit(1);
  if (!row?.ciphertext || !row.iv || !row.tag) return null;
  return decryptApiKey(row.ciphertext, row.iv, row.tag);
}
