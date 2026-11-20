import { useState } from 'react';
import { Calendar, Plus, RefreshCw, SlidersHorizontal, Trash2, X, Zap } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import type { DayMode } from '../types/planner';
import { formatMinutes, getLocalDateKey, parseTimeToMinutes } from '../utils/date';

interface CheckInDrawerProps {
  open: boolean;
  dateKey: string;
  onClose: () => void;
}

export function CheckInDrawer({ open, dateKey, onClose }: CheckInDrawerProps) {
  const daysByDate = usePlannerStore((s) => s.daysByDate);
  const ensureDayPlan = usePlannerStore((s) => s.ensureDayPlan);
  const updateCheckIn = usePlannerStore((s) => s.updateCheckIn);
  const optimizeDay = usePlannerStore((s) => s.optimizeDay);
  const addCommitment = usePlannerStore((s) => s.addCommitment);
  const removeCommitment = usePlannerStore((s) => s.removeCommitment);

  const [commTitle, setCommTitle] = useState('');
  const [commStart, setCommStart] = useState('12:00');
  const [commEnd, setCommEnd] = useState('13:00');

  if (!open) return null;

  const day = daysByDate[dateKey] || ensureDayPlan(dateKey);
  const { checkIn } = day;
  const isToday = dateKey === getLocalDateKey();

  const handleAddCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    const sMin = parseTimeToMinutes(commStart);
    const eMin = parseTimeToMinutes(commEnd);
    if (!commTitle.trim() || eMin <= sMin) return;
    addCommitment(dateKey, {
      title: commTitle.trim(),
      startMin: sMin,
      endMin: eMin,
    });
    setCommTitle('');
  };

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/65 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Tune Day Constraints"
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[var(--accent-primary)]" />
            <h3 className="font-display text-lg font-extrabold uppercase tracking-wider">
              Tune Day Constraints
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Tune Day drawer"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Energy */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Mental & Physical Energy ({checkIn.energy}/5)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {([1, 2, 3, 4, 5] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateCheckIn(dateKey, { energy: val })}
                  className={`rounded-xl py-2.5 font-mono-tabular text-xs font-bold border transition-colors ${
                    checkIn.energy === val
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Finger Readiness */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Finger & Tendon Readiness ({checkIn.fingerReadiness}/5)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {([1, 2, 3, 4, 5] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateCheckIn(dateKey, { fingerReadiness: val })}
                  className={`rounded-xl py-2.5 font-mono-tabular text-xs font-bold border transition-colors ${
                    checkIn.fingerReadiness === val
                      ? 'border-[#2EC4B6] bg-[#2EC4B6] text-[#0A0B0F]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Climbing + Day Intensity Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Climbing
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateCheckIn(dateKey, { isBoulderingDay: true })}
                  className={`rounded-xl py-2 text-xs font-semibold border ${
                    checkIn.isBoulderingDay
                      ? 'border-[#2EC4B6] bg-[#2EC4B6]/20 text-[#2EC4B6]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  Climb
                </button>
                <button
                  type="button"
                  onClick={() => updateCheckIn(dateKey, { isBoulderingDay: false })}
                  className={`rounded-xl py-2 text-xs font-semibold border ${
                    !checkIn.isBoulderingDay
                      ? 'border-[var(--border-strong)] bg-[var(--bg-hover)] text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  Rest
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Day Mode
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'normal', label: 'Norm' },
                    { id: 'peak', label: 'Peak' },
                    { id: 'med', label: 'MED' },
                  ] as Array<{ id: DayMode; label: string }>
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateCheckIn(dateKey, { mode: m.id })}
                    className={`rounded-xl py-2 text-xs font-semibold border ${
                      checkIn.mode === m.id
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Wake / Sleep */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="drawer-wake"
                className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5"
              >
                Start Day
              </label>
              <input
                id="drawer-wake"
                type="time"
                value={formatMinutes(checkIn.wakeMin)}
                onChange={(e) =>
                  updateCheckIn(dateKey, {
                    wakeMin: parseTimeToMinutes(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="drawer-sleep"
                className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5"
              >
                Wind-Down Cutoff
              </label>
              <input
                id="drawer-sleep"
                type="time"
                value={formatMinutes(checkIn.sleepMin)}
                onChange={(e) =>
                  updateCheckIn(dateKey, {
                    sleepMin: parseTimeToMinutes(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-xs"
              />
            </div>
          </div>

          {/* Fixed Commitments */}
          <div className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Block Fixed Events / Meetings
            </label>
            <form onSubmit={handleAddCommitment} className="space-y-2">
              <input
                type="text"
                value={commTitle}
                onChange={(e) => setCommTitle(e.target.value)}
                placeholder="Event title (e.g., Founder Call, Errands)"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
              />
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={commStart}
                  onChange={(e) => setCommStart(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 font-mono-tabular text-xs"
                />
                <span className="text-xs text-[var(--text-muted)]">to</span>
                <input
                  type="time"
                  value={commEnd}
                  onChange={(e) => setCommEnd(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 font-mono-tabular text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </form>

            {checkIn.commitments.length > 0 && (
              <div className="space-y-1.5">
                {checkIn.commitments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-[var(--text-muted)]" />
                      <span className="font-semibold">{c.title}</span>
                      <span className="font-mono-tabular text-[var(--text-muted)]">
                        {formatMinutes(c.startMin)}–{formatMinutes(c.endMin)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCommitment(dateKey, c.id)}
                      aria-label={`Remove ${c.title}`}
                      className="text-[var(--text-muted)] hover:text-[#E56B6F]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] p-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              optimizeDay(dateKey, false);
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-bold text-[var(--accent-ink)]"
          >
            <Zap size={14} /> Optimize Full Day
          </button>
          {isToday && (
            <button
              type="button"
              onClick={() => {
                optimizeDay(dateKey, true);
                onClose();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-xs font-semibold"
            >
              <RefreshCw size={13} /> From Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
