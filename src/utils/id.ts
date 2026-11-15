/**
 * Generates collision-resistant, Firestore-safe identifiers matching ^[a-zA-Z0-9_-]+$
 */
export function generateId(prefix: string = 'id'): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'id';

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${safePrefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }

  // Fallback with high-entropy random hex + timestamp base36
  const randBytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(randBytes);
  } else {
    for (let i = 0; i < randBytes.length; i++) {
      randBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(randBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${safePrefix}-${Date.now().toString(36)}-${hex}`;
}

/**
 * Normalizes an arbitrary string into a valid Firestore document ID
 */
export function toSafeFirestoreId(raw: string, fallbackPrefix: string = 'doc'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned.length > 0 ? cleaned : generateId(fallbackPrefix);
}
