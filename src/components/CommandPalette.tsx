import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  Compass,
  Moon,
  Play,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import type { ScheduledBlock } from '../types/planner';
import { formatMinutes, getLocalDateKey } from '../utils/date';
import { DOMAIN_META, DomainIcon } from './DomainBadge';
import type { NavTab } from './Layout';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onStartBlock: (block: ScheduledBlock) => void;
  onOpenPairPhone: () => void;
}

interface CommandItem {
  id: string;
  section: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onStartBlock,
  onOpenPairPhone,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const selectedDateKey = usePlannerStore((s) => s.selectedDateKey);
  const daysByDate = usePlannerStore((s) => s.daysByDate);
  const ensureDayPlan = usePlannerStore((s) => s.ensureDayPlan);
  const updateCheckIn = usePlannerStore((s) => s.updateCheckIn);
  const optimizeDay = usePlannerStore((s) => s.optimizeDay);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);
  const updateSettings = usePlannerStore((s) => s.updateSettings);

  const todayKey = getLocalDateKey();
  const day = daysByDate[selectedDateKey] || ensureDayPlan(selectedDateKey);

  const commands = useMemo<CommandItem[]>(() => {
    const pendingBlocks = day.blocks.filter((b) => b.status === 'pending');
    const items: CommandItem[] = [
      ...pendingBlocks.map((blk) => ({
        id: `start-${blk.id}`,
        section: 'Launch Session',
        label: `Start ${DOMAIN_META[blk.domainId].shortLabel}: ${blk.title}`,
        hint: `${formatMinutes(blk.startMin)} (${blk.endMin - blk.startMin}m)`,
        icon: (
          <span style={{ color: DOMAIN_META[blk.domainId].color }}>
            <DomainIcon domainId={blk.domainId} size={15} />
          </span>
        ),
        run: () => onStartBlock(blk),
      })),
      {
        id: 'act-toggle-climb',
        section: 'Schedule Controls',
        label: day.checkIn.isBoulderingDay
          ? 'Switch to Climb Rest Day'
          : 'Switch to Bouldering Day',
        hint: 'Re-optimizes schedule',
        icon: <Zap size={15} className="text-[#2EC4B6]" />,
        run: () =>
          updateCheckIn(selectedDateKey, {
            isBoulderingDay: !day.checkIn.isBoulderingDay,
          }),
      },
      {
        id: 'act-med',
        section: 'Schedule Controls',
        label:
          day.checkIn.mode === 'med'
            ? 'Switch to Normal Mode'
            : 'Activate MED Mode (Minimum Effective Dose)',
        hint: 'Compact streaks',
        icon: <Sparkles size={15} className="text-[var(--accent-primary)]" />,
        run: () =>
          updateCheckIn(selectedDateKey, {
            mode: day.checkIn.mode === 'med' ? 'normal' : 'med',
          }),
      },
      {
        id: 'act-reopt-now',
        section: 'Schedule Controls',
        label: 'Re-optimize Schedule From Now',
        hint: 'Preserves completed & locked',
        icon: <RefreshCw size={15} className="text-[var(--text-secondary)]" />,
        run: () => optimizeDay(selectedDateKey, true),
      },
      {
        id: 'act-jump-today',
        section: 'Schedule Controls',
        label: 'Jump to Today',
        hint: todayKey,
        icon: <CalendarClock size={15} className="text-[var(--text-secondary)]" />,
        run: () => {
          setSelectedDate(todayKey);
          onNavigate('today');
        },
      },
      {
        id: 'nav-today',
        section: 'Navigate',
        label: '01 / Today Workspace',
        hint: 'Key 1',
        icon: <CalendarClock size={15} />,
        run: () => onNavigate('today'),
      },
      {
        id: 'nav-domains',
        section: 'Navigate',
        label: '02 / Mastery Curricula & Venture Domino',
        hint: 'Key 2',
        icon: <Compass size={15} />,
        run: () => onNavigate('domains'),
      },
      {
        id: 'nav-stats',
        section: 'Navigate',
        label: '03 / Mastery Star & Stats',
        hint: 'Key 3',
        icon: <BarChart3 size={15} />,
        run: () => onNavigate('insights'),
      },
      {
        id: 'nav-settings',
        section: 'Navigate',
        label: '04 / System, Cloud Sync & Themes',
        hint: 'Key 4',
        icon: <Settings size={15} />,
        run: () => onNavigate('settings'),
      },
      {
        id: 'act-pair-phone',
        section: 'Devices',
        label: 'Pair Phone / Show QR Code',
        hint: '1-scan setup',
        icon: <QrCode size={15} className="text-[var(--accent-primary)]" />,
        run: () => onOpenPairPhone(),
      },
      {
        id: 'theme-noir',
        section: 'Theme',
        label: 'Theme: Phantom Noir (Crimson / Dark)',
        hint: 'P5R × Linear',
        icon: <Moon size={15} className="text-[#E62E43]" />,
        run: () => updateSettings({ theme: 'noir' }),
      },
      {
        id: 'theme-reload',
        section: 'Theme',
        label: 'Theme: Tartarus Cyan (Electric / Midnight)',
        hint: 'P3R × Cron',
        icon: <Moon size={15} className="text-[#22D3EE]" />,
        run: () => updateSettings({ theme: 'reload' }),
      },
      {
        id: 'theme-washi',
        section: 'Theme',
        label: 'Theme: Washi Studio (Warm Paper / Light)',
        hint: 'Zine × Things 3',
        icon: <Sun size={15} className="text-[#D92638]" />,
        run: () => updateSettings({ theme: 'washi' }),
      },
    ];
    return items;
  }, [
    day.blocks,
    day.checkIn.isBoulderingDay,
    day.checkIn.mode,
    selectedDateKey,
    todayKey,
    onStartBlock,
    onOpenPairPhone,
    updateCheckIn,
    optimizeDay,
    setSelectedDate,
    onNavigate,
    updateSettings,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        (c.hint && c.hint.toLowerCase().includes(q))
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && filtered[selectedIdx]) {
        e.preventDefault();
        filtered[selectedIdx].run();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, selectedIdx, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm px-3 pt-16 sm:pt-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-4 py-3">
          <Search size={16} className="text-[var(--accent-primary)] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            placeholder="Start a session, toggle climb/MED mode, jump view, switch theme..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono-tabular text-[10px] text-[var(--text-muted)]">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              No matching commands.
            </p>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === selectedIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                    active
                      ? 'bg-[var(--accent-primary)]/16 text-[var(--text-primary)] border border-[var(--accent-primary)]/35'
                      : 'text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                        {item.section}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)] truncate block">
                        {item.label}
                      </span>
                    </div>
                  </div>
                  {item.hint && (
                    <span className="font-mono-tabular shrink-0 text-[11px] text-[var(--text-muted)]">
                      {item.hint}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-2 text-[11px] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1">
            <Play size={10} className="text-[var(--accent-primary)]" /> Select with ↑↓ and Enter
          </span>
          <span className="font-mono-tabular">Ctrl+K / ⌘K</span>
        </div>
      </div>
    </div>
  );
}
