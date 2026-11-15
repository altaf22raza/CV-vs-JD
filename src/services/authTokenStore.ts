/**
 * Lightweight client-side bridge allowing AuthContext to supply fresh Firebase ID tokens
 * to API client modules without circular imports.
 */

type TokenResolver = (forceRefresh?: boolean) => Promise<string | null>;

let activeTokenResolver: TokenResolver | null = null;

export function registerAuthTokenResolver(resolver: TokenResolver | null): void {
  activeTokenResolver = resolver;
}

export async function getActiveBearerToken(forceRefresh: boolean = false): Promise<string | null> {
  if (!activeTokenResolver) return null;
  try {
    return await activeTokenResolver(forceRefresh);
  } catch {
    return null;
  }
}

export function notifyUnauthorizedApiResponse(message?: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cvvsjd:unauthorized', {
        detail: { message: message || 'Your session expired. Please sign in again.' },
      })
    );
  }
}
