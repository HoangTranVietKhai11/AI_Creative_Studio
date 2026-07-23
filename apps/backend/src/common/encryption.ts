// ============================================
// ContentPilot AI — Encryption Utility
// ============================================

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Encrypt sensitive data (e.g., user API keys).
 * Uses AES-256-GCM with a unique salt and IV per encryption.
 */
export function encrypt(text: string, encryptionKey: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(encryptionKey, salt, KEY_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Format: salt:iv:tag:ciphertext (all hex)
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted,
  ].join(':');
}

/**
 * Decrypt data encrypted with the encrypt() function.
 */
export function decrypt(encryptedText: string, encryptionKey: string): string {
  const [saltHex, ivHex, tagHex, ciphertext] = encryptedText.split(':');

  if (!saltHex || !ivHex || !tagHex || !ciphertext) {
    throw new Error('Invalid encrypted text format');
  }

  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = scryptSync(encryptionKey, salt, KEY_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
