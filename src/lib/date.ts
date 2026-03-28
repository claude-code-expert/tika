const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Returns a Date representing the current moment expressed in KST.
 *
 * All application-level timestamps are stored using this function so that
 * `.toISOString().slice(0, 10)` always yields the correct Korean local date,
 * regardless of the server's system timezone.
 *
 * NOTE: createdAt / sentAt columns that use Drizzle's `defaultNow()` are set
 * by PostgreSQL's NOW() (UTC) and are not covered by this function.
 */
export function nowKST(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

/** UTC ISO string → KST "yyyy-mm-dd" */
export function toKSTDateString(iso: string): string {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC ISO string → KST "yyyy-mm-dd HH:mm" */
export function toKSTString(iso: string): string {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ');
}
