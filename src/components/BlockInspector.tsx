import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Unlock,
  X,
} from 'lucide-react';
import { getTemplatesForDomain } from '../data/methodology';
import { computeTendonLoad } from '../engine/fatigue';
import { computeMasteryStats } from '../engine/masteryStats';
import { getLastSessionCarryover } from '../engine/progression';
import { usePlannerStore } from '../store/usePlannerStore';
import type { ScheduledBlock } from '../types/planner';
import { formatMinutes } from '../utils/date';
import { DOMAIN_META, DomainBadge } from './DomainBadge';
import { MasteryStarRadar } from './MasteryStarRadar';

interface BlockInspectorProps {
  dateKey: string;
  block: ScheduledBlock | null;
  summaryNotes: string[];
  isFirst: boolean;
  isLast: boolean;
  onStartSession: (block: ScheduledBlock) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function BlockInspector({
  dateKey,
  block,
  summaryNotes,
  isFirst,
  isLast,
  onStartSession,
  mobileOpen = false,
  onCloseMobile,
}: BlockInspectorProps) {
  const [tab, setTab] = useState<'briefing' | 'hud'>('briefing');
  const [newDomino, setNewDomino] = useState('');

  const domains = usePlannerStore((s) => s.domains);
  const sessionLogs = usePlannerStore((s) => s.sessionLogs);
  const daysByDate = usePlannerStore((s) => s.daysByDate);
  const entrepreneurTasks = usePlannerStore((s) => s.entrepreneurTasks);
  const toggleLockBlock = usePlannerStore((s) => s.toggleLockBlock);
  const swapBlockTemplate = usePlannerStore((s) => s.swapBlockTemplate);
  const adjustBlockDuration = usePlannerStore((s) => s.adjustBlockDuration);
  const moveBlock = usePlannerStore((s) => s.moveBlock);
  const skipBlock = usePlannerStore((s) => s.skipBlock);
  const reopenBlock = usePlannerStore((s) => s.reopenBlock);
  const toggleEntrepreneurTask = usePlannerStore((s) => s.toggleEntrepreneurTask);
  const addEntrepreneurTask = usePlannerStore((s) => s.addEntrepreneurTask);

  const fingerReadiness = daysByDate[dateKey]?.checkIn.fingerReadiness ?? 4;
  const fatigue = useMemo(
    () => computeTendonLoad(sessionLogs, dateKey, fingerReadiness),
    [sessionLogs, dateKey, fingerReadiness]
  );
  const masteryStats = useMemo(
    () => computeMasteryStats(domains, sessionLogs, dateKey),
    [domains, sessionLogs, dateKey]
  );

  const todayDomino =
    entrepreneurTasks.find((t) => t.isDominoToday) || entrepreneurTasks[0];

  const handlePinDomino = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomino.trim()) return;
    addEntrepreneurTask({
      title: newDomino.trim(),
      category: 'build',
      venture: 'Primary Venture',
    });
    setNewDomino('');
  };

  const renderBody = () => {
    if (tab === 'hud' || !block) {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 p-3">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] text-center mb-1">
              7-Domain Mastery Star
            </p>
            <MasteryStarRadar stats={masteryStats} compact />
          </div>

          {/* Single Domino */}
          <div className="rounded-xl border border-[#A78BFA]/35 bg-[#A78BFA]/8 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#A78BFA]">
              <span>Today’s Venture Domino</span>
              <Sparkles size={13} />
            </div>
            {todayDomino ? (
              <button
                type="button"
                onClick={() => toggleEntrepreneurTask(todayDomino.id)}
                className="flex w-full items-start gap-2 text-left"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    todayDomino.done
                      ? 'border-[#68D391] bg-[#68D391] text-[#0A0B0F]'
                      : 'border-[#A78BFA]'
                  }`}
                >
                  {todayDomino.done && <Check size={11} />}
                </span>
                <span
                  className={`text-xs font-medium leading-snug ${
                    todayDomino.done
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {todayDomino.title}
                </span>
              </button>
            ) : (
              <form onSubmit={handlePinDomino} className="flex gap-1.5">
                <input
                  type="text"
                  value={newDomino}
                  onChange={(e) => setNewDomino(e.target.value)}
                  placeholder="Pin today’s #1 outcome..."
                  className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#A78BFA] px-2.5 py-1.5 text-xs font-bold text-[#0A0B0F]"
                >
                  Pin
                </button>
              </form>
            )}
          </div>

          {/* Tendon Guard + Optimizer Rationale */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[var(--text-muted)] text-[11px]">
                Tendon Load (7d)
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
                {fatigue.score}/100 · {fatigue.level.toUpperCase()}
              </span>
            </div>
            {summaryNotes.length > 0 && (
              <div className="space-y-1 border-t border-[var(--border-subtle)] pt-2">
                {summaryNotes.map((n, i) => (
                  <p key={i} className="text-[11px] text-[var(--text-secondary)] leading-snug">
                    • {n}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    const meta = DOMAIN_META[block.domainId];
    const duration = block.endMin - block.startMin;
    const templates = getTemplatesForDomain(
      block.domainId,
      domains[block.domainId]?.customDrills || []
    );
    const carryover = getLastSessionCarryover(block.domainId, sessionLogs);
    const log = block.sessionLogId
      ? sessionLogs.find((l) => l.id === block.sessionLogId)
      : undefined;

    return (
      <div className="space-y-4">
        {/* Title & Time */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <DomainBadge domainId={block.domainId} />
            <span className="font-mono-tabular text-xs font-semibold text-[var(--text-secondary)]">
              {formatMinutes(block.startMin)}–{formatMinutes(block.endMin)} ({duration}m)
            </span>
          </div>
          <h3 className="text-base font-bold leading-snug text-[var(--text-primary)]">
            {block.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Window: <strong className="text-[var(--text-secondary)]">{block.energyWindow}</strong>
          </p>
        </div>

        {/* Hero Launch CTA */}
        {block.status === 'pending' ? (
          <button
            type="button"
            onClick={() => onStartSession(block)}
            className="persona-cut flex w-full items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase tracking-wider text-[#0A0B0F] shadow-lg transition-transform active:scale-[0.98] hover:brightness-110"
            style={{ backgroundColor: meta.color }}
          >
            <Play size={14} fill="currentColor" />
            <span>Launch Session</span>
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-[#68D391]/40 bg-[#68D391]/12 px-3.5 py-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#68D391]">
              <CheckCircle2 size={14} />
              {block.status === 'completed'
                ? `Completed (${log?.actualMinutes ?? duration}m)`
                : 'Skipped'}
            </span>
            <button
              type="button"
              onClick={() => reopenBlock(dateKey, block.id)}
              className="inline-flex items-center gap-1 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <RotateCcw size={12} /> Restore
            </button>
          </div>
        )}

        {/* Why Now Rationale */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/65 p-3 text-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-1">
            Why Scheduled Here
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {block.rationale}
          </p>
        </div>

        {/* Carryover */}
        {carryover && (
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)]/70 p-3 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Carryover From {carryover.dateKey}
            </p>
            <p className="text-[var(--text-primary)] font-medium">
              {carryover.nextFocus}
            </p>
          </div>
        )}

        {/* Phases */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Deliberate Practice Protocol
          </p>
          {block.phases.map((p, idx) => (
            <div
              key={p.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50 p-2.5 text-xs"
            >
              <div className="flex items-center justify-between font-semibold mb-0.5">
                <span className="text-[var(--text-primary)]">
                  {idx + 1}. {p.title}
                </span>
                <span className="font-mono-tabular text-[var(--text-muted)]">
                  {p.minutes}m
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                {p.instruction}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Controls */}
        {block.status === 'pending' && (
          <div className="space-y-2.5 border-t border-[var(--border-subtle)] pt-3">
            {templates.length > 1 && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Swap Drill Template
                </label>
                <select
                  aria-label="Swap drill template"
                  value={block.templateId}
                  onChange={(e) =>
                    swapBlockTemplate(dateKey, block.id, e.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => adjustBlockDuration(dateKey, block.id, -10)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 font-mono-tabular text-xs hover:bg-[var(--bg-hover)]"
              >
                -10m
              </button>
              <button
                type="button"
                onClick={() => adjustBlockDuration(dateKey, block.id, 10)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 font-mono-tabular text-xs hover:bg-[var(--bg-hover)]"
              >
                +10m
              </button>
              <button
                type="button"
                onClick={() => toggleLockBlock(dateKey, block.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs hover:bg-[var(--bg-hover)]"
              >
                {block.locked ? <Unlock size={12} /> : <Lock size={12} />}
                <span>{block.locked ? 'Unlock' : 'Lock'}</span>
              </button>
              <button
                type="button"
                disabled={isFirst}
                onClick={() => moveBlock(dateKey, block.id, 'up')}
                aria-label="Move earlier"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5 disabled:opacity-40"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={() => moveBlock(dateKey, block.id, 'down')}
                aria-label="Move later"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5 disabled:opacity-40"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => skipBlock(dateKey, block.id)}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[#E56B6F]"
              >
                <SkipForward size={12} /> Skip
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabSwitcher = (
    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-2.5">
      <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-canvas)] p-0.5 border border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setTab('briefing')}
          className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === 'briefing'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Briefing
        </button>
        <button
          type="button"
          onClick={() => setTab('hud')}
          className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === 'hud'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Daily HUD
        </button>
      </div>
      {onCloseMobile && (
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close inspector"
          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Inspector */}
      <aside className="hidden xl:flex xl:w-[356px] xl:shrink-0 xl:flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] overflow-hidden">
        {tabSwitcher}
        <div className="flex-1 overflow-y-auto p-4">{renderBody()}</div>
      </aside>

      {/* Mobile / Tablet Slide-Up Sheet when tapped */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/65 backdrop-blur-xs xl:hidden"
          onClick={onCloseMobile}
          role="dialog"
          aria-modal="true"
          aria-label="Session briefing inspector"
        >
          <div
            className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-t-2xl border-t border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {tabSwitcher}
            <div className="flex-1 overflow-y-auto p-4 pb-8">{renderBody()}</div>
          </div>
        </div>
      )}
    </>
  );
}
