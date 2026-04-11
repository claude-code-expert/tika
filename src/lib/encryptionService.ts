import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Module-load validation — no fallback (D-10)
const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!RAW_KEY || !/^[0-9a-fA-F]{64}$/.test(RAW_KEY)) {
  throw new Error(
    `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got length: ${RAW_KEY?.length ?? 0}`,
  );
}
const MASTER_KEY = Buffer.from(RAW_KEY, 'hex');

export function encryptApiKey(plaintext: string): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(12); // D-11: new IV every call, INSIDE function body
  const cipher = createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decryptApiKey(ciphertext: string, iv: string, tag: string): string {
  const decipher = createDecipheriv('aes-256-gcm', MASTER_KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

export function maskApiKey(key: string): string {
  // D-08: prefix 5 + '*' x (length - 10) + suffix 5
  if (key.length <= 10) return '*'.repeat(key.length);
  return key.slice(0, 5) + '*'.repeat(key.length - 10) + key.slice(-5);
}
