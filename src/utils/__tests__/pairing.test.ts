import { describe, expect, it } from 'vitest';
import {
  buildPairingUrl,
  LIVE_HOSTED_URL,
  parsePairingHash,
} from '../pairing';

describe('pairing utilities', () => {
  it('encodes and decodes Supabase sync credentials cleanly via URL hash', () => {
    const config = {
      url: 'https://eszjdeixhqzvnfqkbplg.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.samplekeypayload123',
    };

    const fullUrl = buildPairingUrl(LIVE_HOSTED_URL, config, true);
    expect(fullUrl.startsWith(`${LIVE_HOSTED_URL}#kaizen-pair=`)).toBe(true);

    const hash = fullUrl.slice(LIVE_HOSTED_URL.length);
    const decoded = parsePairingHash(hash);
    expect(decoded).toEqual(config);
  });

  it('omits hash when includeSyncKeys is false or keys are blank', () => {
    const config = {
      url: 'https://eszjdeixhqzvnfqkbplg.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.samplekeypayload123',
    };
    expect(buildPairingUrl(LIVE_HOSTED_URL, config, false)).toBe(
      LIVE_HOSTED_URL
    );
    expect(
      buildPairingUrl(LIVE_HOSTED_URL, { url: '', anonKey: '' }, true)
    ).toBe(LIVE_HOSTED_URL);
  });

  it('returns null for empty, malformed, or Supabase auth callback hashes', () => {
    expect(parsePairingHash('')).toBeNull();
    expect(parsePairingHash('#access_token=abc123&type=signup')).toBeNull();
    expect(parsePairingHash('#kaizen-pair=not_valid_base64!!!')).toBeNull();
    expect(parsePairingHash('#kaizen-pair=e30')).toBeNull();
  });
});
