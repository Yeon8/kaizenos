import { useEffect, useState } from 'react';
import { CheckCircle2, Flame, RotateCcw } from 'lucide-react';
import {
  ensureAudioContext,
  playTransitionChime,
  triggerHaptic,
} from '../../utils/audio';

const GRADES = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];

interface RestTimerToolProps {
  onMetricsChange?: (metrics: {
    attempts: number;
    sends: number;
    maxGrade: string;
  }) => void;
}

export function RestTimerTool({ onMetricsChange }: RestTimerToolProps) {
  const [presetSec, setPresetSec] = useState(180); // 3:00 default for recruitment
  const [remainingSec, setRemainingSec] = useState(180);
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [sends, setSends] = useState(0);
  const [maxGrade, setMaxGrade] = useState('V4');

  useEffect(() => {
    onMetricsChange?.({ attempts, sends, maxGrade });
  }, [attempts, sends, maxGrade, onMetricsChange]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setRunning(false);
          playTransitionChime();
          triggerHaptic([80, 60, 80]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const startRest = (seconds: number) => {
    ensureAudioContext();
    setPresetSec(seconds);
    setRemainingSec(seconds);
    setRunning(true);
  };

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Bouldering Rest & Attempt Tracker
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Rest 3–4m between limit burns. Stop if power drops ~15%.
          </p>
        </div>
        <div className="font-mono-tabular text-2xl font-bold text-[#2EC4B6]">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[
          { label: '2:00 Volume', sec: 120 },
          { label: '3:00 Limit', sec: 180 },
          { label: '4:00 Max Burn', sec: 240 },
        ].map((p) => (
          <button
            key={p.sec}
            type="button"
            onClick={() => startRest(p.sec)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
              presetSec === p.sec && running
                ? 'border-[#2EC4B6] bg-[#2EC4B6]/20 text-[#2EC4B6]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            ensureAudioContext();
            if (remainingSec === 0) setRemainingSec(presetSec);
            setRunning((r) => !r);
          }}
          className="ml-auto rounded-lg bg-[#2EC4B6] px-3 py-1.5 text-xs font-semibold text-[#0E1013]"
        >
          {running ? 'Pause' : remainingSec === 0 ? 'Restart' : 'Start Rest'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemainingSec(presetSec);
          }}
          aria-label="Reset rest timer"
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setAttempts((a) => a + 1);
            startRest(presetSec);
          }}
          className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 hover:bg-[var(--bg-hover)]"
        >
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Flame size={12} className="text-[#F4A261]" /> Attempts
          </span>
          <span className="font-mono-tabular text-lg font-bold">{attempts}</span>
          <span className="text-[10px] text-[#2EC4B6]">Tap +1 & Rest</span>
        </button>

        <button
          type="button"
          onClick={() => setSends((s) => s + 1)}
          className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 hover:bg-[var(--bg-hover)]"
        >
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <CheckCircle2 size={12} className="text-[#68D391]" /> Sends
          </span>
          <span className="font-mono-tabular text-lg font-bold">{sends}</span>
          <span className="text-[10px] text-[#68D391]">Tap +1 Send</span>
        </button>

        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5">
          <label
            htmlFor="boulder-max-grade"
            className="text-xs text-[var(--text-muted)] mb-1"
          >
            Session Peak
          </label>
          <select
            id="boulder-max-grade"
            value={maxGrade}
            onChange={(e) => setMaxGrade(e.target.value)}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 font-mono-tabular text-sm font-semibold text-[var(--text-primary)]"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
