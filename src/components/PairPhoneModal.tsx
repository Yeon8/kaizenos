import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, QrCode, Smartphone, X } from 'lucide-react';
import QRCode from 'qrcode';
import { usePlannerStore } from '../store/usePlannerStore';
import { resolveSupabaseConfig } from '../sync/supabaseSync';
import {
  buildPairingUrl,
  getAppBaseUrl,
  isLocalHostname,
  LIVE_HOSTED_URL,
} from '../utils/pairing';

interface PairPhoneModalProps {
  open: boolean;
  onClose: () => void;
}

export function PairPhoneModal({ open, onClose }: PairPhoneModalProps) {
  const supabaseConfig = usePlannerStore((s) => s.settings.supabaseConfig);
  const resolved = resolveSupabaseConfig(supabaseConfig);
  const hasSyncKeys = Boolean(resolved.url && resolved.anonKey);

  const isLocal =
    typeof window !== 'undefined' && isLocalHostname(window.location.hostname);

  const [urlSource, setUrlSource] = useState<'live' | 'local'>(
    isLocal ? 'live' : 'local'
  );
  const [includeKeys, setIncludeKeys] = useState(hasSyncKeys);
  const [qrSvg, setQrSvg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIncludeKeys(hasSyncKeys);
  }, [hasSyncKeys, open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  const targetBaseUrl = useMemo(() => {
    if (isLocal && urlSource === 'live') {
      return LIVE_HOSTED_URL;
    }
    return getAppBaseUrl();
  }, [isLocal, urlSource]);

  const pairingUrl = useMemo(
    () => buildPairingUrl(targetBaseUrl, resolved, includeKeys && hasSyncKeys),
    [targetBaseUrl, resolved, includeKeys, hasSyncKeys]
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    QRCode.toString(pairingUrl, {
      type: 'svg',
      margin: 2,
      width: 220,
      color: { dark: '#0A0B0F', light: '#FFFFFF' },
    })
      .then((svg) => {
        if (active) setQrSvg(svg);
      })
      .catch(() => {
        if (active) setQrSvg('');
      });
    return () => {
      active = false;
    };
  }, [open, pairingUrl]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pairingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pair phone via QR code"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <QrCode size={17} className="text-[var(--accent-primary)]" />
            <h3 className="font-display text-lg font-extrabold uppercase tracking-wider">
              Pair Phone in 1 Scan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pairing modal"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {isLocal && (
            <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1">
              <button
                type="button"
                onClick={() => setUrlSource('live')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${
                  urlSource === 'live'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                Live HTTPS URL
              </button>
              <button
                type="button"
                onClick={() => setUrlSource('local')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${
                  urlSource === 'local'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                Current Local URL
              </button>
            </div>
          )}

          {/* Crisp QR code frame */}
          <div className="flex flex-col items-center">
            <div
              className="rounded-2xl bg-white p-3 shadow-lg border-4 border-[var(--border-strong)]"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-2.5 text-center text-xs text-[var(--text-secondary)]">
              Point your phone camera at this QR code to open KaizenOS directly.
            </p>
          </div>

          {hasSyncKeys ? (
            <label className="flex items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-3 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={includeKeys}
                onChange={(e) => setIncludeKeys(e.target.checked)}
                className="mt-0.5 accent-[var(--accent-primary)]"
              />
              <div>
                <span className="font-bold text-[var(--text-primary)] block">
                  Include Cloud Sync keys in QR / Link
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Auto-configures your Supabase URL & public anon key on your phone so you only need to sign in.
                </span>
              </div>
            </label>
          ) : (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 p-3 text-[11px] text-[var(--text-muted)]">
              Tip: Add your Supabase URL & Anon Key in <strong>04 System</strong> first if you want this QR to auto-pair cloud sync onto your phone.
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={pairingUrl}
              aria-label="Pairing link"
              className="flex-1 truncate rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 font-mono-tabular text-[11px] text-[var(--text-secondary)]"
            />
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-bold text-[var(--accent-ink)]"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-3 text-[11px] text-[var(--text-secondary)] space-y-1">
            <p className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
              <Smartphone size={13} className="text-[#2EC4B6]" /> Install on Home Screen
            </p>
            <p>
              <strong>iPhone Safari:</strong> Share icon → <em>Add to Home Screen</em>
            </p>
            <p>
              <strong>Android Chrome:</strong> Menu (⋮) → <em>Install app</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
