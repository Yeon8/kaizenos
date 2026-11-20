import { CheckCircle2, Lock, Play } from 'lucide-react';
import type { ScheduledBlock } from '../types/planner';
import { formatMinutes } from '../utils/date';
import { DOMAIN_META, DomainIcon } from './DomainBadge';

interface BlockCardProps {
  block: ScheduledBlock;
  selected: boolean;
  onSelect: () => void;
  onStartSession: (block: ScheduledBlock) => void;
}

export function BlockCard({
  block,
  selected,
  onSelect,
  onStartSession,
}: BlockCardProps) {
  const meta = DOMAIN_META[block.domainId];
  const duration = block.endMin - block.startMin;
  const isCompleted = block.status === 'completed';
  const isSkipped = block.status === 'skipped';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 transition-all cursor-pointer ${
        selected
          ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] shadow-md'
          : isCompleted
            ? 'border-[#68D391]/30 bg-[var(--bg-surface)]/75'
            : isSkipped
              ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 opacity-55'
              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]/55'
      }`}
    >
      {/* Left accent dot/stripe */}
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: isCompleted ? '#68D391' : meta.color }}
      />

      {/* Time Column */}
      <div className="w-[70px] sm:w-[82px] shrink-0">
        <div className="font-mono-tabular text-xs font-bold text-[var(--text-primary)]">
          {formatMinutes(block.startMin)}
        </div>
        <div className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
          {duration}m
        </div>
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: meta.color }}
          >
            <DomainIcon domainId={block.domainId} size={12} />
            {meta.shortLabel}
          </span>
          {block.locked && (
            <Lock size={10} className="text-[var(--accent-primary)]" />
          )}
          <span className="hidden sm:inline text-[11px] text-[var(--text-muted)] truncate">
            · {block.energyWindow}
          </span>
        </div>

        <h3
          className={`text-sm font-bold text-[var(--text-primary)] truncate ${
            isCompleted || isSkipped ? 'line-through opacity-70' : ''
          }`}
        >
          {block.title}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] truncate">
          {block.subtitle}
        </p>
      </div>

      {/* Right Status / Quick-Start Play */}
      <div className="flex items-center gap-2 shrink-0">
        {block.status === 'pending' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartSession(block);
            }}
            aria-label={`Start ${block.title}`}
            className="inline-flex min-h-[44px] min-w-[44px] sm:min-h-[34px] sm:min-w-[34px] sm:px-3 items-center justify-center gap-1.5 rounded-xl font-bold text-xs text-[#0A0B0F] transition-transform active:scale-95 hover:brightness-110"
            style={{ backgroundColor: meta.color }}
          >
            <Play size={13} fill="currentColor" />
            <span className="hidden sm:inline">Start</span>
          </button>
        ) : isCompleted ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#68D391]/18 text-[#68D391]">
            <CheckCircle2 size={16} />
          </span>
        ) : (
          <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-1 text-[10px] font-semibold uppercase text-[var(--text-muted)]">
            Skipped
          </span>
        )}
      </div>
    </div>
  );
}
