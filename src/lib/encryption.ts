import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'tamenny-default-key-32-char';

// Encrypt data
export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

// Decrypt data
export function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Generate encrypted session ID
export function generateEncryptedId(sessionId: string): string {
  const timestamp = Date.now();
  const data = `${sessionId}:${timestamp}`;
  return encrypt(data);
}

// Extract session ID from encrypted ID
export function extractSessionId(encryptedId: string): string | null {
  try {
    const decrypted = decrypt(encryptedId);
    const [sessionId] = decrypted.split(':');
    return sessionId;
  } catch {
    return null;
  }
}

// Generate secure token for restricted access
export function generateAccessToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Hash password
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + ENCRYPTION_KEY).toString();
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
