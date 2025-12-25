import crypto from 'node:crypto';
import { env } from '../config/env.js';

function getKey() {
  const raw = Buffer.from(env.TOKENS_ENCRYPTION_KEY_BASE64, 'base64');
  if (raw.length !== 32) {
    const err = new Error('TOKENS_ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
    err.statusCode = 500;
    err.code = 'TOKENS_ENCRYPTION_KEY_INVALID';
    throw err;
  }
  return raw;
}

export function encryptString(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: v1.<ivB64>.<tagB64>.<ctB64>
  return `v1.${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
}

export function decryptString(payload) {
  const value = String(payload || '');
  const parts = value.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    const err = new Error('Encrypted value format is invalid');
    err.statusCode = 500;
    err.code = 'TOKENS_ENCRYPTED_FORMAT_INVALID';
    throw err;
  }

  const key = getKey();
  const iv = Buffer.from(parts[1], 'base64');
  const tag = Buffer.from(parts[2], 'base64');
  const ciphertext = Buffer.from(parts[3], 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
