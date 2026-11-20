import type { SupabaseConfig } from '../types/planner';

export const LIVE_HOSTED_URL = 'https://yeon8.github.io/kaizenos/';
export const PAIR_HASH_PREFIX = '#kaizen-pair=';

export function getAppBaseUrl(): string {
  if (typeof window === 'undefined') return LIVE_HOSTED_URL;
  const base = import.meta.env.BASE_URL || '/';
  return new URL(base, window.location.origin).toString();
}

export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  );
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function buildPairingUrl(
  baseUrl: string,
  supabaseConfig: SupabaseConfig,
  includeSyncKeys: boolean
): string {
  const cleanBase = baseUrl.split('#')[0];
  const url = supabaseConfig.url.trim();
  const anonKey = supabaseConfig.anonKey.trim();

  if (!includeSyncKeys || !url || !anonKey) {
    return cleanBase;
  }

  const payload = toBase64Url(JSON.stringify({ u: url, k: anonKey }));
  return `${cleanBase}${PAIR_HASH_PREFIX}${payload}`;
}

export function parsePairingHash(hash: string): SupabaseConfig | null {
  if (!hash || !hash.startsWith(PAIR_HASH_PREFIX)) {
    return null;
  }
  const raw = hash.slice(PAIR_HASH_PREFIX.length).trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as {
      u?: unknown;
      k?: unknown;
    };
    if (
      typeof parsed.u === 'string' &&
      parsed.u.trim().startsWith('http') &&
      typeof parsed.k === 'string' &&
      parsed.k.trim().length >= 16
    ) {
      return {
        url: parsed.u.trim(),
        anonKey: parsed.k.trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}
