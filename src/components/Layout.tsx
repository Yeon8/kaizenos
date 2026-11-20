import {
  BarChart3,
  CalendarClock,
  Check,
  Cloud,
  CloudOff,
  Compass,
  Download,
  Palette,
  Play,
  QrCode,
  RefreshCw,
  Search,
  Settings,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { computeTendonLoad } from '../engine/fatigue';
import { normalizeTheme } from '../engine/masteryStats';
import { usePlannerStore } from '../store/usePlannerStore';
import { getLocalDateKey, parseDateKey } from '../utils/date';

export type NavTab = 'today' | 'domains' | 'insights' | 'settings';

interface LayoutProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenPalette: () => void;
  onOpenPairPhone: () => void;
  onStartNextSession: () => void;
  hasNextPendingSession: boolean;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  children: ReactNode;
}

export function Layout({
  activeTab,
  onSelectTab,
  onOpenPalette,
  onOpenPairPhone,
  onStartNextSession,
  hasNextPendingSession,
  canInstallPwa,
  onInstallPwa,
  children,
}: LayoutProps) {
  const selectedDateKey = usePlannerStore((s) => s.selectedDateKey);
  const daysByDate = usePlannerStore((s) => s.daysByDate);
  const sessionLogs = usePlannerStore((s) => s.sessionLogs);
  const syncStatus = usePlannerStore((s) => s.syncStatus);
  const cloudUserEmail = usePlannerStore((s) => s.cloudUserEmail);
  const theme = usePlannerStore((s) => s.settings.theme);
  const updateSettings = usePlannerStore((s) => s.updateSettings);
  const triggerCloudSync = usePlannerStore((s) => s.triggerCloudSync);

  const todayKey = getLocalDateKey();
  const todayRecord = daysByDate[selectedDateKey] || daysByDate[todayKey];
  const fingerReadiness = todayRecord?.checkIn.fingerReadiness ?? 4;
  const fatigue = computeTendonLoad(sessionLogs, todayKey, fingerReadiness);

  const parsedSel = parseDateKey(selectedDateKey);
  const dayNum = String(parsedSel.getDate());
  const weekdayShort = parsedSel
    .toLocaleDateString(undefined, { weekday: 'short' })
    .toUpperCase();

  const currentTheme = normalizeTheme(theme);
  const cycleTheme = () => {
    const next =
      currentTheme === 'noir'
        ? 'reload'
        : currentTheme === 'reload'
          ? 'washi'
          : 'noir';
    updateSettings({ theme: next });
  };

  const navItems: Array<{
    id: NavTab;
    num: string;
    label: string;
    mobileLabel: string;
    hotkey: string;
    icon: ReactNode;
  }> = [
    {
      id: 'today',
      num: '01',
      label: 'Today',
      mobileLabel: 'Today',
      hotkey: '1',
      icon: <CalendarClock size={16} />,
    },
    {
      id: 'domains',
      num: '02',
      label: 'Mastery',
      mobileLabel: 'Mastery',
      hotkey: '2',
      icon: <Compass size={16} />,
    },
    {
      id: 'insights',
      num: '03',
      label: 'Stats',
      mobileLabel: 'Stats',
      hotkey: '3',
      icon: <BarChart3 size={16} />,
    },
    {
      id: 'settings',
      num: '04',
      label: 'System',
      mobileLabel: 'System',
      hotkey: '4',
      icon: <Settings size={16} />,
    },
  ];

  const syncMeta = (() => {
    switch (syncStatus) {
      case 'synced':
        return { label: 'Synced', color: 'text-[#68D391]', icon: <Cloud size={13} /> };
      case 'syncing':
        return {
          label: 'Syncing',
          color: 'text-[#6B8EFE]',
          icon: <RefreshCw size={13} className="animate-spin" />,
        };
      case 'offline':
        return {
          label: 'Offline',
          color: 'text-[#F4A261]',
          icon: <CloudOff size={13} />,
        };
      case 'error':
        return {
          label: 'Error',
          color: 'text-[#E56B6F]',
          icon: <CloudOff size={13} />,
        };
      default:
        return {
          label: cloudUserEmail ? 'Ready' : 'Local',
          color: 'text-[var(--text-secondary)]',
          icon: <Cloud size={13} />,
        };
    }
  })();

  const themeLabel =
    currentTheme === 'noir'
      ? 'Noir'
      : currentTheme === 'reload'
        ? 'Reload'
        : 'Washi';

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col lg:flex-row">
      {/* Desktop Left Navigation Rail (224px) */}
      <aside className="hidden lg:flex lg:w-[224px] lg:shrink-0 lg:flex-col lg:justify-between lg:border-r lg:border-[var(--border-subtle)] lg:bg-[var(--bg-surface)] lg:px-4 lg:py-5 lg:sticky lg:top-0 lg:h-screen">
        <div>
          {/* Brand + Theme Cycler */}
          <div className="flex items-center justify-between gap-2 mb-5 px-1">
            <div className="flex items-center gap-2.5">
              <img
                src={`${import.meta.env.BASE_URL}favicon.svg`}
                alt="KaizenOS"
                className="h-8 w-8 rounded-lg border border-[var(--border-strong)]"
              />
              <div>
                <h1 className="font-display text-lg font-extrabold italic tracking-wide leading-none">
                  KAIZEN<span className="text-[var(--accent-primary)]">OS</span>
                </h1>
                <p className="text-[10px] font-mono-tabular uppercase text-[var(--text-muted)]">
                  Deliberate Engine
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cycleTheme}
              title={`Theme: ${themeLabel} (click to switch)`}
              aria-label={`Switch theme (current: ${themeLabel})`}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            >
              <Palette size={11} className="text-[var(--accent-primary)]" />
              <span>{themeLabel}</span>
            </button>
          </div>

          {/* Linear-style Command Search Button */}
          <button
            type="button"
            onClick={onOpenPalette}
            className="mb-5 flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Search size={13} className="text-[var(--accent-primary)]" />
              <span>Command...</span>
            </span>
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono-tabular text-[10px]">
              ⌘K
            </kbd>
          </button>

          {/* Numbered Navigation with Skewed Active Slash */}
          <nav className="space-y-1.5" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                    active
                      ? 'text-[var(--accent-ink)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="persona-slash absolute inset-0 rounded-lg bg-[var(--accent-primary)] shadow-md"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <span
                      className={`font-display text-sm font-extrabold italic ${
                        active
                          ? 'text-[var(--accent-ink)]/85'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {item.num}
                    </span>
                    {item.icon}
                    <span className="text-xs font-bold tracking-wide uppercase">
                      {item.label}
                    </span>
                  </span>
                  <span
                    className={`relative z-10 font-mono-tabular text-[10px] ${
                      active ? 'text-[var(--accent-ink)]/75' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {item.hotkey}
                  </span>
                </button>
              );
            })}
          </nav>

          {canInstallPwa && (
            <button
              type="button"
              onClick={onInstallPwa}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#2EC4B6]/45 bg-[#2EC4B6]/12 px-3 py-2 text-xs font-semibold text-[#2EC4B6] hover:bg-[#2EC4B6]/20"
            >
              <Download size={13} /> Install App
            </button>
          )}
        </div>

        {/* Bottom Telemetry Footer */}
        <div className="space-y-2.5 border-t border-[var(--border-subtle)] pt-3.5">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Tendon Guard
              </span>
              <span
                className={`font-mono-tabular font-bold ${
                  fatigue.level === 'high'
                    ? 'text-[#E56B6F]'
                    : fatigue.level === 'moderate'
                      ? 'text-[#F4A261]'
                      : 'text-[#68D391]'
                }`}
              >
                {fatigue.score}/100
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(6, fatigue.score)}%`,
                  backgroundColor:
                    fatigue.level === 'high'
                      ? '#E56B6F'
                      : fatigue.level === 'moderate'
                        ? '#F4A261'
                        : '#68D391',
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPairPhone}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
          >
            <span className="inline-flex items-center gap-1.5">
              <QrCode size={13} className="text-[var(--accent-primary)]" />
              <span>Pair Phone</span>
            </span>
            <span className="font-mono-tabular text-[10px] text-[var(--text-muted)]">
              QR
            </span>
          </button>

          <button
            type="button"
            onClick={() => void triggerCloudSync()}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs hover:bg-[var(--bg-elevated)]"
          >
            <span className={`inline-flex items-center gap-1.5 font-medium ${syncMeta.color}`}>
              {syncMeta.icon}
              <span>{syncMeta.label}</span>
            </span>
            <span className="font-mono-tabular text-[10px] text-[var(--text-muted)]">
              {cloudUserEmail ? 'Sync' : 'Local'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Minimal Sticky Top Header */}
      <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md px-3.5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt="KaizenOS"
            className="h-7 w-7 rounded-lg"
          />
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base font-extrabold italic tracking-wide">
              KAIZEN<span className="text-[var(--accent-primary)]">OS</span>
            </span>
            <span className="persona-slash bg-[var(--bg-elevated)] px-1.5 py-0.5 border border-[var(--border-subtle)]">
              <span className="persona-unskew font-display text-xs font-bold text-[var(--text-secondary)]">
                {dayNum} {weekdayShort}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPairPhone}
            aria-label="Pair phone QR"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
          >
            <QrCode size={15} />
          </button>
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Open command palette"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
          >
            <Search size={15} />
          </button>
          <button
            type="button"
            onClick={cycleTheme}
            aria-label="Cycle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]"
          >
            <Palette size={15} />
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            aria-label="Sync status"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] ${syncMeta.color}`}
          >
            {syncMeta.icon}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-8">
        <div className="mx-auto max-w-[1360px] px-3.5 py-4 sm:px-6 lg:px-7 lg:py-6">
          {children}
        </div>
      </main>

      {/* Mobile Fixed 5-Slot Bottom Dock with Center Skewed Quick-Start FAB */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="grid grid-cols-5 items-center">
          {navItems.slice(0, 2).map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {item.icon}
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}

          {/* Center Quick-Start Action FAB */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onStartNextSession}
              aria-label={
                hasNextPendingSession
                  ? 'Quick-start next session'
                  : 'All sessions complete'
              }
              className={`persona-slash -mt-3 flex h-12 w-14 items-center justify-center rounded-xl shadow-lg transition-transform active:scale-95 ${
                hasNextPendingSession
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                  : 'bg-[#68D391] text-[#0A0B0F]'
              }`}
            >
              <span className="persona-unskew">
                {hasNextPendingSession ? (
                  <Play size={18} fill="currentColor" />
                ) : (
                  <Check size={18} strokeWidth={3} />
                )}
              </span>
            </button>
          </div>

          {navItems.slice(2).map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {item.icon}
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
