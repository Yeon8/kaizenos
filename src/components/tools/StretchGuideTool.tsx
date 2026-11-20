import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { StretchPose } from '../../types/planner';
import {
  ensureAudioContext,
  playTransitionChime,
  triggerHaptic,
} from '../../utils/audio';

interface StretchStep {
  pose: StretchPose;
  sideLabel: string | null;
}

export function StretchGuideTool({ poses }: { poses: StretchPose[] }) {
  const steps = useMemo<StretchStep[]>(() => {
    const expanded: StretchStep[] = [];
    for (const p of poses) {
      if (p.bilateral) {
        expanded.push({ pose: p, sideLabel: 'Left Side' });
        expanded.push({ pose: p, sideLabel: 'Right Side' });
      } else {
        expanded.push({ pose: p, sideLabel: null });
      }
    }
    return expanded;
  }, [poses]);

  const [stepIdx, setStepIdx] = useState(0);
  const [inTransition, setInTransition] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    steps[0]?.pose.holdSeconds ?? 50
  );
  const [running, setRunning] = useState(false);

  const currentStep = steps[stepIdx];

  useEffect(() => {
    if (!currentStep) return;
    setInTransition(false);
    setSecondsLeft(currentStep.pose.holdSeconds);
  }, [stepIdx, currentStep]);

  useEffect(() => {
    if (!running || !currentStep) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Timer hit 0
        if (!inTransition && stepIdx < steps.length - 1) {
          playTransitionChime();
          triggerHaptic(50);
          setInTransition(true);
          return 6; // 6s gentle setup transition before next pose/side
        }

        if (inTransition && stepIdx < steps.length - 1) {
          playTransitionChime();
          setInTransition(false);
          setStepIdx((i) => i + 1);
          return steps[stepIdx + 1]?.pose.holdSeconds ?? 50;
        }

        // Completed final pose
        playTransitionChime();
        triggerHaptic([60, 50, 60]);
        setRunning(false);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, inTransition, stepIdx, steps, currentStep]);

  if (!currentStep) {
    return null;
  }

  const nextStep = steps[stepIdx + 1];

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#F4A261]">
          Pose {stepIdx + 1} of {steps.length}
          {currentStep.sideLabel ? ` · ${currentStep.sideLabel}` : ''}
        </span>
        <span className="font-mono-tabular text-2xl font-bold text-[var(--text-primary)]">
          {inTransition ? `Switch: ${secondsLeft}s` : `${secondsLeft}s`}
        </span>
      </div>

      <h4 className="text-base font-bold text-[var(--text-primary)]">
        {inTransition && nextStep ? `Next: ${nextStep.pose.name}` : currentStep.pose.name}
      </h4>
      <p className="text-xs font-medium text-[#F4A261] mb-2">
        Target: {inTransition && nextStep ? nextStep.pose.target : currentStep.pose.target}
      </p>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
        {inTransition && nextStep
          ? `Set up smoothly (${nextStep.sideLabel || 'Center'}) — breathe slowly.`
          : currentStep.pose.cue}
      </p>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={stepIdx === 0}
          onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Prev
        </button>

        <button
          type="button"
          onClick={() => {
            ensureAudioContext();
            setRunning((r) => !r);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4A261] px-4 py-2 text-xs font-semibold text-[#111317]"
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          <span>{running ? 'Pause Pose' : 'Start Guided Flow'}</span>
        </button>

        <button
          type="button"
          disabled={stepIdx >= steps.length - 1}
          onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
