import CryptoJS from 'crypto-js';

// Use environment variable with fallback - 32 bytes for AES-256
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // In production, this should always come from environment
    console.warn('WARNING: Using default encryption key. Set ENCRYPTION_KEY environment variable!');
    return 'tamenny-secure-key-32-chars!!';
  }
  return key;
};

// Encrypt data using AES-256
export function encrypt(data: string): string {
  const key = getEncryptionKey();
  const encrypted = CryptoJS.AES.encrypt(data, key);
  return encrypted.toString();
}

// Decrypt data
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error('Failed to decrypt data');
  }
}

// Encrypt location data as JSON
export function encryptLocation(location: {
  lat: number;
  lng: number;
  name?: string;
  accuracy?: number;
  timestamp?: number;
}): string {
  const data = JSON.stringify({
    lat: location.lat,
    lng: location.lng,
    name: location.name || 'موقعك الحالي',
    accuracy: location.accuracy,
    timestamp: location.timestamp || Date.now(),
  });
  return encrypt(data);
}

// Decrypt location data
export function decryptLocation(encryptedData: string): {
  lat: number;
  lng: number;
  name: string;
  accuracy?: number;
  timestamp: number;
} | null {
  try {
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

// تحويل Base64 عادي → URL-safe (بدون +/=/ يكسر الـ URL)
function toUrlSafeBase64(base64: string): string {
  return base64
    .replace(/\+/g, '-')   // + → -
    .replace(/\//g, '_')   // / → _
    .replace(/=/g, '~');   // = → ~
}

// تحويل URL-safe → Base64 عادي (لفك التشفير)
function fromUrlSafeBase64(urlSafe: string): string {
  return urlSafe
    .replace(/-/g, '+')   // - → +
    .replace(/_/g, '/')   // _ → /
    .replace(/~/g, '=');  // ~ → =
}

// Generate encrypted session ID
export function generateEncryptedId(sessionId: string): string {
  const timestamp = Date.now();
  const data = `${sessionId}:${timestamp}`;
  const encrypted = encrypt(data);         // Base64 عادي
  return toUrlSafeBase64(encrypted);        // URL-safe
}

// Extract session ID from encrypted ID
export function extractSessionId(encryptedId: string): string | null {
  try {
    // المحاولة الأولى: URL-safe Base64 (الجديد)
    const standardBase64 = fromUrlSafeBase64(encryptedId);
    const decrypted = decrypt(standardBase64);
    const [sessionId] = decrypted.split(':');
    return sessionId || null;
  } catch {
    // المحاولة الثانية: Base64 عادي (للـ sessions القديمة في DB)
    try {
      const decrypted = decrypt(encryptedId);
      const [sessionId] = decrypted.split(':');
      return sessionId || null;
    } catch {
      return null;
    }
  }
}

// Generate secure token for restricted access
export function generateAccessToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Hash password (for non-auth purposes, use bcrypt for user passwords)
export function hashData(data: string): string {
  const key = getEncryptionKey();
  return CryptoJS.SHA256(data + key).toString();
}

// Verify hash
export function verifyHash(data: string, hash: string): boolean {
  return hashData(data) === hash;
}
