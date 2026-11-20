import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import type { DayMode, ScheduledBlock } from '../types/planner';
import {
  addDays,
  formatDurationCompact,
  formatMinutes,
  getLocalDateKey,
  getNowMinutes,
  getWeekday,
  parseDateKey,
} from '../utils/date';
import { BlockCard } from './BlockCard';
import { BlockInspector } from './BlockInspector';
import { CheckInDrawer } from './CheckInDrawer';
import { DOMAIN_META, DomainIcon } from './DomainBadge';
import { TimeGridView } from './TimeGridView';

interface TodayViewProps {
  onStartSession: (block: ScheduledBlock) => void;
}

function getPhaseLabel(nowMin: number): string {
  if (nowMin < 12 * 60) return 'MORNING PEAK';
  if (nowMin < 17 * 60) return 'DAYTIME FLOW';
  if (nowMin < 20 * 60 + 30) return 'AFTERNOON / DUSK';
  return 'EVENING RECOVERY';
}

export function TodayView({ onStartSession }: TodayViewProps) {
  const selectedDateKey = usePlannerStore((s) => s.selectedDateKey);
  const daysByDate = usePlannerStore((s) => s.daysByDate);
  const weeklyTemplate = usePlannerStore((s) => s.weeklyTemplate);
  const ensureDayPlan = usePlannerStore((s) => s.ensureDayPlan);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);
  const updateCheckIn = usePlannerStore((s) => s.updateCheckIn);
  const optimizeDay = usePlannerStore((s) => s.optimizeDay);
  const removeCommitment = usePlannerStore((s) => s.removeCommitment);

  const todayKey = getLocalDateKey();
  const day = daysByDate[selectedDateKey] || ensureDayPlan(selectedDateKey);
  const { checkIn, blocks, summaryNotes } = day;

  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const nextPending = useMemo(
    () => blocks.find((b) => b.status === 'pending') || null,
    [blocks]
  );

  // Keep selectedBlockId valid as day changes
  useEffect(() => {
    if (!selectedBlockId || !blocks.some((b) => b.id === selectedBlockId)) {
      setSelectedBlockId(nextPending?.id || blocks[0]?.id || null);
    }
  }, [blocks, nextPending, selectedBlockId]);

  const selectedBlock =
    blocks.find((b) => b.id === selectedBlockId) || nextPending || blocks[0] || null;
  const selectedIdx = selectedBlock
    ? blocks.findIndex((b) => b.id === selectedBlock.id)
    : -1;

  // J / K / ArrowUp / ArrowDown step through blocks on desktop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        drawerOpen ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName || ''
        )
      ) {
        return;
      }
      if (e.key === 'j' || e.key === 'ArrowDown') {
        if (blocks.length === 0) return;
        e.preventDefault();
        const nextIdx = Math.min(blocks.length - 1, Math.max(0, selectedIdx + 1));
        setSelectedBlockId(blocks[nextIdx].id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        if (blocks.length === 0) return;
        e.preventDefault();
        const prevIdx = Math.max(0, selectedIdx - 1);
        setSelectedBlockId(blocks[prevIdx].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [blocks, selectedIdx, drawerOpen]);

  // Build 7-day Monday..Sunday strip containing selectedDateKey
  const weekDays = useMemo(() => {
    const wd = getWeekday(selectedDateKey); // 0=Sun..6=Sat
    const mondayOffset = wd === 0 ? -6 : 1 - wd;
    const mondayKey = addDays(selectedDateKey, mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const dk = addDays(mondayKey, i);
      const d = parseDateKey(dk);
      const existing = daysByDate[dk];
      const tpl = weeklyTemplate.find((w) => w.weekday === getWeekday(dk));
      const isClimb = existing
        ? existing.checkIn.isBoulderingDay
        : Boolean(tpl?.isBoulderingDay);
      const done = existing
        ? existing.blocks.filter((b) => b.status === 'completed').length
        : 0;
      const total = existing ? existing.blocks.length : 0;
      return {
        dateKey: dk,
        dayNum: d.getDate(),
        shortDay: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        isClimb,
        done,
        total,
      };
    });
  }, [selectedDateKey, daysByDate, weeklyTemplate]);

  const parsedSel = parseDateKey(selectedDateKey);
  const bigDayNum = String(parsedSel.getDate());
  const monthShort = parsedSel
    .toLocaleDateString(undefined, { month: 'short' })
    .toUpperCase();
  const weekdayLong = parsedSel
    .toLocaleDateString(undefined, { weekday: 'long' })
    .toUpperCase();
  const phaseLabel = getPhaseLabel(getNowMinutes());

  const totalPlannedMin = blocks.reduce((acc, b) => acc + (b.endMin - b.startMin), 0);
  const completedCount = blocks.filter((b) => b.status === 'completed').length;
  const activeCount = blocks.filter((b) => b.status !== 'skipped').length;
  const progressPct =
    activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0;

  const cycleMode = () => {
    const order: DayMode[] = ['normal', 'peak', 'med'];
    const next = order[(order.indexOf(checkIn.mode) + 1) % order.length];
    updateCheckIn(selectedDateKey, { mode: next });
  };

  // Combine blocks + commitments chronologically and group by circadian phase
  const groupedTimeline = useMemo(() => {
    type TimelineEntry =
      | { kind: 'block'; startMin: number; block: ScheduledBlock }
      | {
          kind: 'commitment';
          startMin: number;
          commitment: (typeof checkIn.commitments)[number];
        };

    const all: TimelineEntry[] = [
      ...blocks.map((block) => ({
        kind: 'block' as const,
        startMin: block.startMin,
        block,
      })),
      ...checkIn.commitments.map((commitment) => ({
        kind: 'commitment' as const,
        startMin: commitment.startMin,
        commitment,
      })),
    ].sort((a, b) => a.startMin - b.startMin);

    const sections: Array<{
      id: string;
      title: string;
      entries: TimelineEntry[];
    }> = [
      { id: 'morning', title: 'Morning // Grounding & Fine Motor Peak', entries: [] },
      { id: 'midday', title: 'Midday // Physical Prime & Deep Craft', entries: [] },
      { id: 'evening', title: 'Evening // Immersion & Down-Regulation', entries: [] },
    ];

    for (const entry of all) {
      if (entry.startMin < 12 * 60) {
        sections[0].entries.push(entry);
      } else if (entry.startMin < 18 * 60) {
        sections[1].entries.push(entry);
      } else {
        sections[2].entries.push(entry);
      }
    }
    return sections.filter((s) => s.entries.length > 0);
  }, [blocks, checkIn.commitments]);

  const handleSelectBlock = (blockId: string, openMobileSheet = true) => {
    setSelectedBlockId(blockId);
    if (openMobileSheet && window.innerWidth < 1280) {
      setMobileInspectorOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Persona Date & Phase Header */}
      <header className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5 sm:px-6 sm:py-4 bg-halftone-subtle">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Oversized Date HUD */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-5xl sm:text-6xl font-extrabold italic leading-none tracking-tight text-[var(--text-primary)]">
                {bigDayNum}
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="persona-slash bg-[var(--accent-primary)] px-2 py-0.5 text-[var(--accent-ink)]">
                    <span className="persona-unskew font-display text-xs font-extrabold uppercase tracking-wider">
                      {monthShort} · {weekdayLong}
                    </span>
                  </span>
                  {selectedDateKey === todayKey && (
                    <span className="rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 font-mono-tabular text-[10px] font-bold text-[var(--text-secondary)]">
                      {phaseLabel}
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  Skills & physical priority · {formatDurationCompact(totalPlannedMin)} planned
                </span>
              </div>
            </div>
          </div>

          {/* Compact Interactive Quick-Status Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 font-mono-tabular text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              Energy {checkIn.energy}/5
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 font-mono-tabular text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              Fingers {checkIn.fingerReadiness}/5
            </button>

            <button
              type="button"
              onClick={() =>
                updateCheckIn(selectedDateKey, {
                  isBoulderingDay: !checkIn.isBoulderingDay,
                })
              }
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                checkIn.isBoulderingDay
                  ? 'border-[#2EC4B6]/50 bg-[#2EC4B6]/16 text-[#2EC4B6]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
              }`}
            >
              {checkIn.isBoulderingDay ? 'Climb Day' : 'Rest Day'}
            </button>

            <button
              type="button"
              onClick={cycleMode}
              title="Click to cycle Normal / Peak / MED"
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold uppercase transition-colors ${
                checkIn.mode === 'med'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/18 text-[var(--accent-primary)]'
                  : checkIn.mode === 'peak'
                    ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/18 text-[var(--accent-secondary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
              }`}
            >
              {checkIn.mode === 'med' ? 'MED Mode' : `${checkIn.mode}`}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              <SlidersHorizontal size={13} className="text-[var(--accent-primary)]" />
              <span>Tune Day</span>
            </button>
          </div>
        </div>

        {/* Fantastical 7-Day Horizontal Strip */}
        <div className="mt-3.5 flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-3">
          <button
            type="button"
            onClick={() => setSelectedDate(addDays(selectedDateKey, -7))}
            aria-label="Previous week"
            className="hidden sm:flex h-9 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="grid flex-1 grid-cols-7 gap-1">
            {weekDays.map((wd) => {
              const isSelected = wd.dateKey === selectedDateKey;
              const isTodayChip = wd.dateKey === todayKey;
              return (
                <button
                  key={wd.dateKey}
                  type="button"
                  onClick={() => setSelectedDate(wd.dateKey)}
                  className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all border ${
                    isSelected
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/14 text-[var(--text-primary)]'
                      : 'border-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)]">
                    {wd.shortDay}
                  </span>
                  <span
                    className={`font-display text-base font-extrabold leading-tight ${
                      isTodayChip && !isSelected ? 'text-[var(--accent-primary)]' : ''
                    }`}
                  >
                    {wd.dayNum}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1 h-1.5">
                    {wd.isClimb && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#2EC4B6]"
                        title="Climbing Day"
                      />
                    )}
                    {wd.total > 0 && wd.done === wd.total && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#68D391]"
                        title="Day Cleared"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(addDays(selectedDateKey, 7))}
            aria-label="Next week"
            className="hidden sm:flex h-9 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </header>

      {/* Main 2-Pane Workspace */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* Left: Spotlight + Timeline / Grid */}
        <div className="w-full flex-1 min-w-0 space-y-4">
          {/* Next Objective Hero Spotlight */}
          {nextPending ? (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: DOMAIN_META[nextPending.domainId].color }}
              />
              <div className="pl-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="persona-slash bg-[var(--accent-primary)] px-2 py-0.5 text-[var(--accent-ink)]">
                    <span className="persona-unskew text-[10px] font-extrabold uppercase tracking-wider">
                      Next Objective
                    </span>
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                    style={{ color: DOMAIN_META[nextPending.domainId].color }}
                  >
                    <DomainIcon domainId={nextPending.domainId} size={13} />
                    {DOMAIN_META[nextPending.domainId].label}
                  </span>
                  <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                    {formatMinutes(nextPending.startMin)}–
                    {formatMinutes(nextPending.endMin)} (
                    {nextPending.endMin - nextPending.startMin}m)
                  </span>
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
                  {nextPending.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onStartSession(nextPending)}
                className="persona-cut shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#0A0B0F] transition-transform active:scale-95 hover:brightness-110"
                style={{ backgroundColor: DOMAIN_META[nextPending.domainId].color }}
              >
                <Play size={14} fill="currentColor" />
                <span>Start Now</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#68D391]/40 bg-[#68D391]/10 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={22} className="text-[#68D391]" />
                <div>
                  <h2 className="font-display text-lg font-extrabold uppercase tracking-wider text-[#68D391]">
                    Day Cleared
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    All planned blocks completed. Enjoy guilt-free rest.
                  </p>
                </div>
              </div>
              <span className="font-mono-tabular text-sm font-bold text-[#68D391]">
                {completedCount}/{activeCount}
              </span>
            </div>
          )}

          {/* Toolbar: View Switcher + Re-optimize + Progress */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <LayoutList size={13} /> Timeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <CalendarDays size={13} /> Schedule Grid
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs font-mono-tabular text-[var(--text-secondary)]">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                  <div
                    className="h-full rounded-full bg-[#68D391] transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span>
                  {completedCount}/{activeCount}
                </span>
              </div>

              {selectedDateKey === todayKey && (
                <button
                  type="button"
                  onClick={() => optimizeDay(selectedDateKey, true)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  <RefreshCw size={12} /> Re-optimize Now
                </button>
              )}
            </div>
          </div>

          {/* Timeline OR Schedule Grid */}
          {viewMode === 'grid' ? (
            <TimeGridView
              dateKey={selectedDateKey}
              wakeMin={checkIn.wakeMin}
              sleepMin={checkIn.sleepMin}
              blocks={blocks}
              commitments={checkIn.commitments}
              selectedBlockId={selectedBlock?.id || null}
              onSelectBlock={(id) => handleSelectBlock(id, true)}
              onStartSession={onStartSession}
            />
          ) : groupedTimeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No blocks scheduled in the remaining window.
              </p>
              <button
                type="button"
                onClick={() => optimizeDay(selectedDateKey, false)}
                className="mt-3 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-bold text-[var(--accent-ink)]"
              >
                Generate Full Day Plan
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedTimeline.map((group) => (
                <section key={group.id} className="space-y-2">
                  <div className="flex items-center gap-2.5 px-1">
                    <span className="h-2 w-2 rotate-45 bg-[var(--accent-primary)]" />
                    <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                      {group.title}
                    </h3>
                    <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                  </div>

                  <div className="space-y-2">
                    {group.entries.map((entry) => {
                      if (entry.kind === 'commitment') {
                        const c = entry.commitment;
                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]/45 px-4 py-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar size={14} className="text-[var(--text-muted)]" />
                              <span className="font-mono-tabular text-xs font-bold text-[var(--text-secondary)]">
                                {formatMinutes(c.startMin)}–{formatMinutes(c.endMin)}
                              </span>
                              <span className="text-xs font-semibold text-[var(--text-primary)]">
                                {c.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCommitment(selectedDateKey, c.id)}
                              aria-label={`Remove commitment ${c.title}`}
                              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[#E56B6F]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <BlockCard
                          key={entry.block.id}
                          block={entry.block}
                          selected={selectedBlock?.id === entry.block.id}
                          onSelect={() => handleSelectBlock(entry.block.id, true)}
                          onStartSession={onStartSession}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Right Context Inspector (Desktop sticky + Mobile bottom sheet) */}
        <BlockInspector
          dateKey={selectedDateKey}
          block={selectedBlock}
          summaryNotes={summaryNotes}
          isFirst={selectedIdx <= 0}
          isLast={selectedIdx === -1 || selectedIdx >= blocks.length - 1}
          onStartSession={onStartSession}
          mobileOpen={mobileInspectorOpen}
          onCloseMobile={() => setMobileInspectorOpen(false)}
        />
      </div>

      {/* Tune Day Slide-over Drawer */}
      <CheckInDrawer
        open={drawerOpen}
        dateKey={selectedDateKey}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
