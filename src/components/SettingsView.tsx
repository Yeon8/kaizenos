import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  Database,
  Download,
  LogOut,
  QrCode,
  RefreshCw,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import { normalizeTheme } from '../engine/masteryStats';
import { usePlannerStore } from '../store/usePlannerStore';
import {
  isSupabaseConfigured,
  signInWithMagicLink,
  signInWithPassword,
  signOutFromCloud,
  signUpWithPassword,
} from '../sync/supabaseSync';
import type { PriorityPreset } from '../types/planner';
import { formatMinutes, getLocalDateKey, parseTimeToMinutes } from '../utils/date';
import { LIVE_HOSTED_URL } from '../utils/pairing';

interface SettingsViewProps {
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  onOpenPairPhone: () => void;
  pairedBanner?: string | null;
  onDismissPairedBanner?: () => void;
}

const THEME_CARDS = [
  {
    id: 'noir' as const,
    name: 'Phantom Noir',
    subtitle: 'Persona 5 Royal × Linear',
    swatches: ['#0A0B0F', '#191C26', '#E62E43', '#F5B73B'],
  },
  {
    id: 'reload' as const,
    name: 'Tartarus Cyan',
    subtitle: 'Persona 3 Reload × Cron',
    swatches: ['#080D18', '#162238', '#22D3EE', '#3B82F6'],
  },
  {
    id: 'washi' as const,
    name: 'Washi Studio',
    subtitle: 'Persona Zine × Things 3',
    swatches: ['#F4EFE4', '#FFFDF8', '#D92638', '#C47F17'],
  },
];

export function SettingsView({
  canInstallPwa,
  onInstallPwa,
  onOpenPairPhone,
  pairedBanner,
  onDismissPairedBanner,
}: SettingsViewProps) {
  const settings = usePlannerStore((s) => s.settings);
  const syncStatus = usePlannerStore((s) => s.syncStatus);
  const syncError = usePlannerStore((s) => s.syncError);
  const lastSyncedAt = usePlannerStore((s) => s.lastSyncedAt);
  const cloudUserEmail = usePlannerStore((s) => s.cloudUserEmail);
  const updateSettings = usePlannerStore((s) => s.updateSettings);
  const optimizeDay = usePlannerStore((s) => s.optimizeDay);
  const setCloudUserEmail = usePlannerStore((s) => s.setCloudUserEmail);
  const triggerCloudSync = usePlannerStore((s) => s.triggerCloudSync);
  const exportBackupJson = usePlannerStore((s) => s.exportBackupJson);
  const importBackupJson = usePlannerStore((s) => s.importBackupJson);
  const seedDemoHistory = usePlannerStore((s) => s.seedDemoHistory);
  const resetAllData = usePlannerStore((s) => s.resetAllData);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const handleCopyRedirectUrl = async () => {
    try {
      await navigator.clipboard.writeText(LIVE_HOSTED_URL);
      setCopiedRedirect(true);
      window.setTimeout(() => setCopiedRedirect(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const envUrlConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const configured = isSupabaseConfigured(settings.supabaseConfig);
  const activeTheme = normalizeTheme(settings.theme);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthMsg(null);
    const res = await signInWithPassword(settings.supabaseConfig, email, password);
    setAuthBusy(false);
    if (res.error) {
      setAuthMsg(res.error);
    } else {
      setCloudUserEmail(res.email);
      setAuthMsg('Signed in! Syncing data...');
      await triggerCloudSync();
    }
  };

  const handleSignUp = async () => {
    setAuthBusy(true);
    setAuthMsg(null);
    const res = await signUpWithPassword(settings.supabaseConfig, email, password);
    setAuthBusy(false);
    if (res.error) {
      setAuthMsg(res.error);
    } else if (res.needsConfirmation) {
      setAuthMsg('Check your inbox to confirm your email, then sign in.');
    } else {
      setCloudUserEmail(res.email);
      await triggerCloudSync();
    }
  };

  const handleMagicLink = async () => {
    setAuthBusy(true);
    setAuthMsg(null);
    const res = await signInWithMagicLink(settings.supabaseConfig, email);
    setAuthBusy(false);
    setAuthMsg(
      res.error
        ? res.error
        : 'Magic login link sent! Open it on this device to sign in.'
    );
  };

  const handleSignOut = async () => {
    await signOutFromCloud(settings.supabaseConfig);
    setCloudUserEmail(null);
    setAuthMsg('Signed out.');
  };

  const handleDownloadBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaizenos-backup-${getLocalDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackupJson(String(reader.result || ''));
      setImportMsg(res.ok ? 'Backup restored successfully!' : res.error || 'Failed');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="font-display text-xs font-extrabold uppercase tracking-widest text-[var(--accent-primary)]">
          04 // System Preferences & Cloud Sync
        </span>
        <h2 className="font-display text-3xl font-extrabold italic uppercase tracking-tight">
          Themes, Sync & Backup
        </h2>
      </div>

      {pairedBanner && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#68D391]/45 bg-[#68D391]/12 px-4 py-3 text-xs text-[#68D391]">
          <span className="font-semibold">{pairedBanner}</span>
          {onDismissPairedBanner && (
            <button
              type="button"
              onClick={onDismissPairedBanner}
              aria-label="Dismiss pairing notice"
              className="p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Phone & Laptop Quick Access */}
      <section className="rounded-2xl border border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <QrCode size={18} className="text-[var(--accent-primary)]" />
            <div>
              <h3 className="text-sm font-bold">Phone & Laptop Quick Access</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Open on any device at{' '}
                <a
                  href={LIVE_HOSTED_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono-tabular underline text-[var(--accent-primary)]"
                >
                  {LIVE_HOSTED_URL}
                </a>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPairPhone}
            className="persona-cut inline-flex items-center gap-1.5 bg-[var(--accent-primary)] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-ink)]"
          >
            <QrCode size={14} /> Show Phone Pairing QR
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5 text-xs">
          <span className="text-[var(--text-secondary)]">
            For email confirmation & magic links, set Supabase{' '}
            <strong>Authentication → URL Configuration → Site URL</strong> to:
            <code className="ml-1.5 font-mono-tabular text-[var(--text-primary)]">
              {LIVE_HOSTED_URL}
            </code>
          </span>
          <button
            type="button"
            onClick={() => void handleCopyRedirectUrl()}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-semibold"
          >
            {copiedRedirect ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedRedirect ? 'Copied' : 'Copy Redirect URL'}</span>
          </button>
        </div>
      </section>

      {/* 3-Theme Selector */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Interface Theme</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Switch between three Persona-crafted studio palettes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEME_CARDS.map((card) => {
            const selected = activeTheme === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => updateSettings({ theme: card.id })}
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  selected
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] ring-1 ring-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50 hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-base font-extrabold uppercase tracking-wide">
                    {card.name}
                  </span>
                  {selected && (
                    <span className="rounded bg-[var(--accent-primary)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--accent-ink)]">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mb-3">
                  {card.subtitle}
                </p>
                <div className="flex items-center gap-1.5">
                  {card.swatches.map((hex) => (
                    <span
                      key={hex}
                      className="h-4 flex-1 rounded border border-white/15"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Schedule Defaults */}
        <div className="grid grid-cols-1 gap-3 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Priority Preset
            </label>
            <select
              value={settings.priorityPreset}
              onChange={(e) => {
                updateSettings({
                  priorityPreset: e.target.value as PriorityPreset,
                });
                optimizeDay(getLocalDateKey(), false);
              }}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium"
            >
              <option value="skills_first">Skills & Physical First (Default)</option>
              <option value="balanced">Balanced Progression</option>
              <option value="entrepreneurship_first">Entrepreneurship Prime First</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Default Wake Time
            </label>
            <input
              type="time"
              value={formatMinutes(settings.defaultWakeMin)}
              onChange={(e) =>
                updateSettings({
                  defaultWakeMin: parseTimeToMinutes(e.target.value),
                })
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Default Wind-Down Cutoff
            </label>
            <input
              type="time"
              value={formatMinutes(settings.defaultSleepMin)}
              onChange={(e) =>
                updateSettings({
                  defaultSleepMin: parseTimeToMinutes(e.target.value),
                })
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-xs"
            />
          </div>
        </div>
      </section>

      {/* Supabase Cloud Sync */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cloud size={18} className="text-[#6B8EFE]" />
            <div>
              <h3 className="text-sm font-bold">Phone & Laptop Cloud Sync (Supabase)</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Timestamped per-day and per-session merge — works offline and syncs automatically online.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold">
            Status: {syncStatus}
          </span>
        </div>

        {!envUrlConfigured && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={settings.supabaseConfig.url}
                onChange={(e) =>
                  updateSettings({
                    supabaseConfig: {
                      ...settings.supabaseConfig,
                      url: e.target.value,
                    },
                  })
                }
                placeholder="https://xxxxx.supabase.co"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Supabase Anon Public Key
              </label>
              <input
                type="password"
                value={settings.supabaseConfig.anonKey}
                onChange={(e) =>
                  updateSettings({
                    supabaseConfig: {
                      ...settings.supabaseConfig,
                      anonKey: e.target.value,
                    },
                  })
                }
                placeholder="eyJhbGciOi..."
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-xs"
              />
            </div>
          </div>
        )}

        {configured && !cloudUserEmail && (
          <form onSubmit={handleSignIn} className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (or use Magic Link)"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={authBusy}
                className="rounded-xl bg-[#6B8EFE] px-4 py-2 text-xs font-bold text-white"
              >
                Sign In
              </button>
              <button
                type="button"
                disabled={authBusy || !password}
                onClick={handleSignUp}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold"
              >
                Create Account
              </button>
              <button
                type="button"
                disabled={authBusy || !email}
                onClick={handleMagicLink}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold"
              >
                Send Magic Link
              </button>
            </div>
          </form>
        )}

        {cloudUserEmail && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#68D391]/35 bg-[#68D391]/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={15} className="text-[#68D391]" />
              <span>
                Signed in as <strong>{cloudUserEmail}</strong>
                {lastSyncedAt && ` · Last sync ${new Date(lastSyncedAt).toLocaleTimeString()}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void triggerCloudSync()}
                className="inline-flex items-center gap-1 rounded-xl bg-[#68D391] px-3 py-1.5 text-xs font-bold text-[#0A0B0F]"
              >
                <RefreshCw size={12} /> Sync Now
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {authMsg && <p className="text-xs text-[var(--accent-primary)]">{authMsg}</p>}
        {syncError && <p className="text-xs text-[#E56B6F]">{syncError}</p>}

        <details className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 px-3.5 py-2.5 text-xs">
          <summary className="cursor-pointer font-semibold text-[var(--text-secondary)]">
            3-Step Free Supabase Setup Guide
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[var(--text-muted)]">
            <li>Create a free project at supabase.com.</li>
            <li>
              Open <strong>SQL Editor</strong> and run the schema in{' '}
              <code>supabase/schema.sql</code>.
            </li>
            <li>
              Copy your Project URL and <code>anon</code> public key from{' '}
              <strong>Project Settings → API</strong> and paste them above (or set{' '}
              <code>VITE_SUPABASE_URL</code> & <code>VITE_SUPABASE_ANON_KEY</code> in{' '}
              <code>.env</code>).
            </li>
          </ol>
        </details>
      </section>

      {/* Install on Phone & Laptop (PWA) */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-[#2EC4B6]" />
            <h3 className="text-sm font-bold">Install on Phone & Laptop</h3>
          </div>
          {canInstallPwa && (
            <button
              type="button"
              onClick={onInstallPwa}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2EC4B6] px-4 py-2 text-xs font-bold text-[#0A0B0F]"
            >
              <Download size={14} /> Install KaizenOS App
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-[var(--text-secondary)]">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 p-3">
            <p className="font-bold text-[var(--text-primary)] mb-1">
              iPhone / iPad (Safari)
            </p>
            <p>
              Open the deployed URL in Safari, tap <strong>Share</strong>, and choose{' '}
              <strong>Add to Home Screen</strong>. Runs full-screen offline.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 p-3">
            <p className="font-bold text-[var(--text-primary)] mb-1">
              Android & Laptop (Chrome / Edge)
            </p>
            <p>
              Tap the browser’s <strong>Install App</strong> icon in the address bar or menu.
            </p>
          </div>
        </div>
      </section>

      {/* Data Backup & Preview Tools */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-[var(--accent-primary)]" />
          <h3 className="text-sm font-bold">Backup, Sample History & Reset</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-semibold hover:bg-[var(--bg-hover)]"
          >
            <Download size={14} /> Export JSON Backup
          </button>

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-semibold hover:bg-[var(--bg-hover)]">
            <Upload size={14} /> Import JSON Backup
            <input
              type="file"
              accept="application/json"
              onChange={handleUploadBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              seedDemoHistory();
              setImportMsg('Loaded 14 days of realistic practice history! Check 03 Stats.');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6A84C]/40 bg-[#E6A84C]/12 px-3.5 py-2 text-xs font-semibold text-[#E6A84C] hover:bg-[#E6A84C]/20"
          >
            Load 14-Day Sample History
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Reset all local planner schedules, logs, and curricula back to defaults?'
                )
              ) {
                resetAllData();
                setImportMsg('Planner reset to default baseline.');
              }
            }}
            className="ml-auto rounded-xl border border-[#E56B6F]/40 bg-[#E56B6F]/10 px-3.5 py-2 text-xs font-semibold text-[#E56B6F] hover:bg-[#E56B6F]/20"
          >
            Reset All Data
          </button>
        </div>

        {importMsg && (
          <p className="text-xs text-[#68D391] font-medium">{importMsg}</p>
        )}
      </section>
    </div>
  );
}
