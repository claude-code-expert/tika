import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let _db: NodePgDatabase<typeof schema> | null = null;

function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    _db = drizzle(pool, { schema, logger: process.env.NODE_ENV === 'development' });
  }
  return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
