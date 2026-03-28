/**
 * E2E 테스트용 유저 정보 조회 스크립트
 * 실행: npx tsx tests/e2e/find-test-user.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../../src/db/index';
import { users, members } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      userType: users.userType,
      memberId: members.id,
      workspaceId: members.workspaceId,
      role: members.role,
      isPrimary: members.isPrimary,
    })
    .from(users)
    .leftJoin(members, eq(members.userId, users.id))
    .where(eq(members.isPrimary, true))
    .limit(10);

  console.log('\n=== E2E 테스트에 사용할 유저 목록 ===\n');
  rows.forEach((r, i) => {
    console.log(`[${i + 1}] ${r.name} (${r.email})`);
    console.log(`    TEST_USER_ID=${r.userId}`);
    console.log(`    TEST_WORKSPACE_ID=${r.workspaceId}`);
    console.log(`    TEST_MEMBER_ID=${r.memberId}`);
    console.log(`    역할: ${r.role}, userType: ${r.userType}`);
    console.log();
  });

  console.log('위 값을 .env.local에 추가하세요.');
  process.exit(0);
}

main().catch(console.error);
