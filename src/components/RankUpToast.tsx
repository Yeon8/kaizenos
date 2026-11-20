import { useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { DOMAIN_META } from './DomainBadge';

export function RankUpToast() {
  const toast = usePlannerStore((s) => s.lastCompletedToast);
  const clearCompletedToast = usePlannerStore((s) => s.clearCompletedToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      clearCompletedToast();
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [toast, clearCompletedToast]);

  if (!toast) return null;

  const meta = DOMAIN_META[toast.domainId];

  return (
    <div
      className="fixed bottom-20 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-50 sm:w-[360px] animate-stat-pop"
      role="status"
      aria-live="polite"
    >
      <div
        onClick={clearCompletedToast}
        className="persona-cut relative cursor-pointer overflow-hidden border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 shadow-2xl bg-halftone-subtle"
      >
        {/* Top sweep accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: meta.color }}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="persona-slash flex h-11 w-11 shrink-0 items-center justify-center font-display text-xl font-extrabold text-[#0A0B0F]"
              style={{ backgroundColor: meta.color }}
            >
              <span className="persona-unskew">{meta.glyph}</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-display text-lg font-extrabold italic uppercase tracking-wide"
                  style={{ color: meta.color }}
                >
                  +{toast.pointsGained} {meta.radarLabel}
                </span>
                <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[var(--text-primary)]">
                  Lv.{toast.newRank} {toast.rankLabel}
                </span>
              </div>
              <p className="text-xs font-medium text-[var(--text-secondary)] line-clamp-1">
                {toast.title} · {toast.minutes}m
                {toast.metricText ? ` · ${toast.metricText}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearCompletedToast();
            }}
            aria-label="Dismiss stat gain notification"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Rank progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-mono-tabular text-[var(--text-muted)] mb-1">
            <span>RANK PROGRESS</span>
            <span>{toast.nextRankProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(8, toast.nextRankProgress)}%`,
                backgroundColor: meta.color,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
