import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { SESSION_TEMPLATES } from '../data/methodology';
import { getLastSessionCarryover } from '../engine/progression';
import { usePlannerStore } from '../store/usePlannerStore';
import type { ChallengeRating, ScheduledBlock } from '../types/planner';
import {
  ensureAudioContext,
  playMeditationBell,
  playTransitionChime,
  triggerHaptic,
} from '../utils/audio';
import { DomainBadge } from './DomainBadge';
import { FocusSprintTool } from './tools/FocusSprintTool';
import { MeditationBellTool } from './tools/MeditationBellTool';
import { MetronomeTool } from './tools/MetronomeTool';
import { RestTimerTool } from './tools/RestTimerTool';
import { StretchGuideTool } from './tools/StretchGuideTool';

interface SessionRunnerProps {
  block: ScheduledBlock;
  dateKey: string;
  onClose: () => void;
}

export function SessionRunner({ block, dateKey, onClose }: SessionRunnerProps) {
  const sessionLogs = usePlannerStore((s) => s.sessionLogs);
  const completeSession = usePlannerStore((s) => s.completeSession);

  const carryover = getLastSessionCarryover(block.domainId, sessionLogs);
  const phases = block.phases;

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseSecLeft, setPhaseSecLeft] = useState((phases[0]?.minutes ?? 5) * 60);
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showLogStep, setShowLogStep] = useState(false);

  // Domain tool states
  const [peakBpm, setPeakBpm] = useState<number>(carryover?.bpm || 88);
  const [climbMetrics, setClimbMetrics] = useState({
    attempts: 0,
    sends: 0,
    maxGrade: carryover?.maxGrade || 'V4',
  });
  const [minedCards, setMinedCards] = useState(0);

  // Completion form states
  const plannedMinutes = Math.max(1, block.endMin - block.startMin);
  const [actualMinutes, setActualMinutes] = useState(plannedMinutes);
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [challenge, setChallenge] = useState<ChallengeRating>('optimal');
  const [fingerFatigue, setFingerFatigue] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [deliverable, setDeliverable] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [nextFocus, setNextFocus] = useState('');

  const currentPhase = phases[phaseIdx];

  const handleClimbMetrics = useCallback(
    (m: { attempts: number; sends: number; maxGrade: string }) => {
      setClimbMetrics(m);
    },
    []
  );

  // Update countdown when switching phase manually
  const selectPhase = (idx: number) => {
    setPhaseIdx(idx);
    setPhaseSecLeft((phases[idx]?.minutes ?? 5) * 60);
    setRunning(false);
  };

  useEffect(() => {
    if (!running || showLogStep) return;

    const timer = window.setInterval(() => {
      setElapsedSec((e) => e + 1);
      setPhaseSecLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Phase finished
        if (block.domainId === 'meditation') {
          playMeditationBell();
        } else {
          playTransitionChime();
        }
        triggerHaptic([60, 40, 60]);

        if (phaseIdx < phases.length - 1) {
          const next = phaseIdx + 1;
          setPhaseIdx(next);
          return (phases[next]?.minutes ?? 5) * 60;
        }
        setRunning(false);
        setShowLogStep(true);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, showLogStep, phaseIdx, phases, block.domainId]);

  // Sync actualMinutes default when opening finish step
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const openLogStep = () => {
    setRunning(false);
    const computedMins =
      elapsedSec >= 60 ? Math.max(1, Math.round(elapsedSec / 60)) : plannedMinutes;
    setActualMinutes(computedMins);
    setShowLogStep(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const metrics =
      block.domainId === 'guitar'
        ? { bpm: peakBpm }
        : block.domainId === 'bouldering'
          ? {
              maxGrade: climbMetrics.maxGrade,
              attempts: climbMetrics.attempts,
              sends: climbMetrics.sends,
            }
          : block.domainId === 'japanese'
            ? { minedCards, immersionMin: actualMinutes }
            : block.domainId === 'entrepreneurship' && deliverable.trim()
              ? { deliverable: deliverable.trim() }
              : undefined;

    completeSession(dateKey, block.id, {
      actualMinutes,
      quality,
      challenge,
      fingerFatigue:
        block.domainId === 'bouldering' || block.domainId === 'guitar'
          ? fingerFatigue
          : undefined,
      metrics,
      takeaway,
      nextFocus,
    });
    onClose();
  };

  const minsLeft = Math.floor(phaseSecLeft / 60);
  const secsLeft = phaseSecLeft % 60;
  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedRemSec = elapsedSec % 60;

  // Fallback poses if a custom stretch block has no stretchPoses attached
  const fallbackPoses =
    SESSION_TEMPLATES.find((t) => t.id === 'stretch-hips')?.phases[0]?.stretchPoses ||
    [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Session Runner: ${block.title}`}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg-surface)] md:h-auto md:max-h-[92vh] md:max-w-2xl md:rounded-2xl md:border md:border-[var(--border-subtle)] md:shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5 md:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DomainBadge domainId={block.domainId} />
              <span className="inline-flex items-center gap-1 font-mono-tabular text-xs text-[var(--text-muted)]">
                <Clock size={12} />
                {String(elapsedMin).padStart(2, '0')}:
                {String(elapsedRemSec).padStart(2, '0')} elapsed
              </span>
            </div>
            <h2 className="truncate text-base font-bold text-[var(--text-primary)] md:text-lg">
              {block.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close session runner"
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Phase progress track */}
        <div className="h-1 w-full bg-[var(--bg-elevated)]">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-300"
            style={{
              width: `${Math.round(((phaseIdx + (showLogStep ? 1 : 0.4)) / Math.max(1, phases.length)) * 100)}%`,
            }}
          />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 md:p-6">
          {!showLogStep ? (
            <>
              {/* Carryover banner */}
              {carryover && (
                <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)] mb-0.5">
                    Pick Up From Last Time ({carryover.dateKey})
                  </p>
                  <p className="text-xs text-[var(--text-primary)]">
                    {carryover.nextFocus}
                  </p>
                  {carryover.takeaway && (
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      Note: {carryover.takeaway}
                    </p>
                  )}
                </div>
              )}

              {/* Phase Stepper */}
              <div className="flex flex-wrap gap-1.5">
                {phases.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPhase(idx)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      idx === phaseIdx
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)] font-semibold'
                        : idx < phaseIdx
                          ? 'bg-[#68D391]/15 text-[#68D391] border border-[#68D391]/30'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {idx + 1}. {p.title.split(':')[0]} ({p.minutes}m)
                  </button>
                ))}
              </div>

              {/* Active Phase Card */}
              {currentPhase && (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 md:p-5 bg-halftone-subtle">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <span className="font-display text-xs font-extrabold uppercase tracking-widest text-[var(--accent-primary)]">
                        Phase {phaseIdx + 1} / {phases.length}
                      </span>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        {currentPhase.title}
                      </h3>
                    </div>
                    <div className="font-display text-4xl sm:text-5xl font-extrabold italic tracking-tight text-[var(--text-primary)]">
                      {String(minsLeft).padStart(2, '0')}:
                      {String(secsLeft).padStart(2, '0')}
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {currentPhase.instruction}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        ensureAudioContext();
                        if (!running && block.domainId === 'meditation' && elapsedSec === 0) {
                          playMeditationBell();
                        }
                        setRunning((r) => !r);
                      }}
                      className="persona-cut inline-flex items-center gap-1.5 bg-[var(--accent-primary)] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-ink)] hover:brightness-110"
                    >
                      {running ? <Pause size={15} /> : <Play size={15} />}
                      <span>{running ? 'Pause Timer' : 'Start Phase'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPhase(phaseIdx)}
                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <RotateCcw size={14} /> Reset
                    </button>

                    {phaseIdx < phases.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => selectPhase(phaseIdx + 1)}
                        className="ml-auto inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      >
                        Next Phase <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openLogStep}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[#68D391] px-4 py-2.5 text-xs font-bold text-[#0E1013] hover:brightness-110"
                      >
                        <CheckCircle2 size={15} /> Finish & Calibrate
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Embedded Interactive Tool */}
              {currentPhase?.toolHint === 'metronome' && (
                <MetronomeTool
                  initialBpm={carryover?.bpm || 88}
                  onPeakBpmChange={setPeakBpm}
                />
              )}

              {currentPhase?.toolHint === 'rest_timer' && (
                <RestTimerTool onMetricsChange={handleClimbMetrics} />
              )}

              {currentPhase?.toolHint === 'meditation_bell' && (
                <MeditationBellTool isTimerRunning={running} />
              )}

              {currentPhase?.toolHint === 'stretch_guide' && (
                <StretchGuideTool
                  poses={
                    currentPhase.stretchPoses && currentPhase.stretchPoses.length > 0
                      ? currentPhase.stretchPoses
                      : fallbackPoses
                  }
                />
              )}

              {currentPhase?.toolHint === 'focus_sprint' && (
                <FocusSprintTool
                  domainId={block.domainId}
                  minedCards={minedCards}
                  onMinedCardsChange={setMinedCards}
                />
              )}

              {/* Methodology footnote */}
              <div className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5 text-xs text-[var(--text-muted)]">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" />
                <span>{block.methodologyNote}</span>
              </div>
            </>
          ) : (
            /* 10-Second Finish & Calibrate Form */
            <form onSubmit={handleSaveLog} className="space-y-4">
              <div className="rounded-xl border border-[#68D391]/30 bg-[#68D391]/10 px-4 py-3">
                <h3 className="text-sm font-bold text-[#68D391]">
                  Session Complete — 10s Calibration Log
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Logging challenge edge & next starting cue tunes tomorrow’s optimization.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Actual Minutes Practiced
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={actualMinutes}
                    onChange={(e) => setActualMinutes(Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-sm text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Focus Quality (1–5)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuality(q)}
                        className={`rounded-lg py-2 font-mono-tabular text-xs font-bold border ${
                          quality === q
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Challenge Zone (Ericsson ~85% Sweet Spot)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'too_easy', label: 'Too Easy' },
                      { id: 'optimal', label: 'Optimal Edge' },
                      { id: 'too_hard', label: 'Too Hard' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setChallenge(opt.id)}
                      className={`rounded-xl py-2.5 text-xs font-semibold border transition-colors ${
                        challenge === opt.id
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/18 text-[var(--accent-primary)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {(block.domainId === 'bouldering' || block.domainId === 'guitar') && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Post-Session Finger / Tendon Fatigue (1 = fresh, 5 = pumped/tweaky)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFingerFatigue(f)}
                        className={`rounded-lg py-2 font-mono-tabular text-xs font-bold border ${
                          fingerFatigue === f
                            ? 'border-[#2EC4B6] bg-[#2EC4B6]/20 text-[#2EC4B6]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Domain-specific metric */}
              {block.domainId === 'guitar' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Clean Peak BPM Achieved
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={240}
                    value={peakBpm}
                    onChange={(e) => setPeakBpm(Number(e.target.value) || 80)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-sm"
                  />
                </div>
              )}

              {block.domainId === 'bouldering' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Peak Grade Sent / Worked
                    </label>
                    <input
                      type="text"
                      value={climbMetrics.maxGrade}
                      onChange={(e) =>
                        setClimbMetrics({ ...climbMetrics, maxGrade: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Problems Sent
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={climbMetrics.sends}
                      onChange={(e) =>
                        setClimbMetrics({
                          ...climbMetrics,
                          sends: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-sm"
                    />
                  </div>
                </div>
              )}

              {block.domainId === 'japanese' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    i+1 Cards Mined / Reviewed
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minedCards}
                    onChange={(e) => setMinedCards(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-sm"
                  />
                </div>
              )}

              {block.domainId === 'entrepreneurship' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Concrete Deliverable Shipped
                  </label>
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => setDeliverable(e.target.value)}
                    placeholder="e.g., Shipped onboarding flow & sent 5 demos"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Key Takeaway
                </label>
                <input
                  type="text"
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  placeholder="What clicked or broke down?"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Next Session Starting Point (Shown next time you start)
                </label>
                <input
                  type="text"
                  value={nextFocus}
                  onChange={(e) => setNextFocus(e.target.value)}
                  placeholder="e.g., Start at 92 BPM or revisit bar 12 transition"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogStep(false)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Back to Session
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#68D391] px-5 py-2.5 text-sm font-bold text-[#0E1013] hover:brightness-110"
                >
                  <CheckCircle2 size={16} /> Save & Complete
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer action if still in practice view */}
        {!showLogStep && (
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-3 md:px-6">
            <span className="text-xs text-[var(--text-muted)]">
              Planned: {plannedMinutes} min
            </span>
            <button
              type="button"
              onClick={openLogStep}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#68D391]/40 bg-[#68D391]/15 px-3.5 py-2 text-xs font-semibold text-[#68D391] hover:bg-[#68D391]/25"
            >
              <CheckCircle2 size={14} /> Complete & Log Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
