import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Lock, Play } from 'lucide-react';
import type { FixedCommitment, ScheduledBlock } from '../types/planner';
import { formatMinutes, getLocalDateKey, getNowMinutes } from '../utils/date';
import { DOMAIN_META, DomainIcon } from './DomainBadge';

interface TimeGridViewProps {
  dateKey: string;
  wakeMin: number;
  sleepMin: number;
  blocks: ScheduledBlock[];
  commitments: FixedCommitment[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onStartSession: (block: ScheduledBlock) => void;
}

const PX_PER_MIN = 1.65; // ~99px per hour so 8m+10m gap cleanly clears min block height

export function TimeGridView({
  dateKey,
  wakeMin,
  sleepMin,
  blocks,
  commitments,
  selectedBlockId,
  onSelectBlock,
  onStartSession,
}: TimeGridViewProps) {
  const [nowMin, setNowMin] = useState(() => getNowMinutes());
  const isToday = dateKey === getLocalDateKey();

  useEffect(() => {
    if (!isToday) return;
    const t = window.setInterval(() => setNowMin(getNowMinutes()), 60000);
    return () => window.clearInterval(t);
  }, [isToday]);

  const startHour = Math.max(0, Math.floor(wakeMin / 60));
  const endHour = Math.min(24, Math.ceil(sleepMin / 60));
  const gridStartMin = startHour * 60;
  const gridEndMin = Math.max(gridStartMin + 120, endHour * 60);
  const totalHeight = (gridEndMin - gridStartMin) * PX_PER_MIN;

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }

  const showNowLine = isToday && nowMin >= gridStartMin && nowMin <= gridEndMin;
  const nowTop = (nowMin - gridStartMin) * PX_PER_MIN;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)]">
        <span>PROPORTIONAL DAY GRID</span>
        <span className="font-mono-tabular">
          {formatMinutes(wakeMin)} – {formatMinutes(sleepMin)}
        </span>
      </div>

      <div className="relative overflow-y-auto max-h-[680px] p-3">
        <div
          className="relative ml-12"
          style={{ height: `${totalHeight}px` }}
        >
          {/* Hour grid lines */}
          {hours.map((h) => {
            const top = (h * 60 - gridStartMin) * PX_PER_MIN;
            return (
              <div
                key={h}
                style={{ top: `${top}px` }}
                className="absolute left-0 right-0 border-t border-[var(--border-subtle)]/75"
              >
                <span className="absolute -left-12 -top-2 w-10 text-right font-mono-tabular text-[10px] text-[var(--text-muted)]">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            );
          })}

          {/* Fixed commitments */}
          {commitments.map((c) => {
            const top = Math.max(0, (c.startMin - gridStartMin) * PX_PER_MIN);
            const height = Math.max(22, (c.endMin - c.startMin) * PX_PER_MIN);
            return (
              <div
                key={c.id}
                style={{ top: `${top}px`, height: `${height}px` }}
                className="absolute left-1 right-1 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]/85 px-3 py-1.5 flex items-center justify-between text-xs"
              >
                <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-secondary)] truncate">
                  <Calendar size={12} /> {c.title}
                </span>
                <span className="font-mono-tabular text-[10px] text-[var(--text-muted)]">
                  {formatMinutes(c.startMin)}–{formatMinutes(c.endMin)}
                </span>
              </div>
            );
          })}

          {/* Scheduled Practice Blocks */}
          {blocks.map((blk, idx) => {
            const meta = DOMAIN_META[blk.domainId];
            const top = Math.max(0, (blk.startMin - gridStartMin) * PX_PER_MIN);
            const dur = blk.endMin - blk.startMin;
            const nextBlk = blocks[idx + 1];
            const maxAllowedHeight = nextBlk
              ? Math.max(20, (nextBlk.startMin - blk.startMin) * PX_PER_MIN - 2)
              : Infinity;
            const height = Math.min(maxAllowedHeight, Math.max(24, dur * PX_PER_MIN));
            const selected = blk.id === selectedBlockId;
            const isCompleted = blk.status === 'completed';
            const isSkipped = blk.status === 'skipped';
            const compact = height < 44;

            return (
              <div
                key={blk.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectBlock(blk.id)}
                onDoubleClick={() => {
                  if (blk.status === 'pending') onStartSession(blk);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectBlock(blk.id);
                }}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  borderLeftColor: isCompleted ? '#68D391' : meta.color,
                  backgroundColor: selected ? `${meta.color}22` : `${meta.color}12`,
                }}
                className={`absolute left-1 right-1 cursor-pointer overflow-hidden rounded-xl border border-l-4 px-3 py-1 transition-all ${
                  selected
                    ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)] z-10 shadow-md'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                } ${isSkipped ? 'opacity-45' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 h-full">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: meta.color }}>
                        <DomainIcon domainId={blk.domainId} size={12} />
                      </span>
                      <span
                        className={`text-xs font-bold truncate ${
                          isCompleted ? 'line-through opacity-75' : ''
                        }`}
                      >
                        {blk.title}
                      </span>
                      {blk.locked && (
                        <Lock size={10} className="text-[var(--accent-primary)] shrink-0" />
                      )}
                      {isCompleted && (
                        <CheckCircle2 size={12} className="text-[#68D391] shrink-0" />
                      )}
                    </div>
                    {!compact && (
                      <p className="text-[11px] font-mono-tabular text-[var(--text-muted)] truncate">
                        {formatMinutes(blk.startMin)}–{formatMinutes(blk.endMin)} ({dur}m) ·{' '}
                        {blk.energyWindow}
                      </p>
                    )}
                  </div>

                  {blk.status === 'pending' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartSession(blk);
                      }}
                      aria-label={`Start ${blk.title}`}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#0A0B0F] hover:brightness-110"
                      style={{ backgroundColor: meta.color }}
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live NOW marker */}
          {showNowLine && (
            <div
              style={{ top: `${nowTop}px` }}
              className="pointer-events-none absolute -left-2 right-0 z-20 flex items-center"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" />
              <div className="h-[2px] flex-1 bg-[var(--accent-primary)]" />
              <span className="ml-1 rounded bg-[var(--accent-primary)] px-1 py-0.5 font-mono-tabular text-[9px] font-bold text-[var(--accent-ink)]">
                NOW
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
