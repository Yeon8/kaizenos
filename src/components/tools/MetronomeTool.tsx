import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ensureAudioContext, playMetronomeClick } from '../../utils/audio';

interface MetronomeToolProps {
  initialBpm?: number;
  onPeakBpmChange?: (bpm: number) => void;
}

export function MetronomeTool({
  initialBpm = 88,
  onPeakBpmChange,
}: MetronomeToolProps) {
  const [bpm, setBpm] = useState(initialBpm);
  const [peakBpm, setPeakBpm] = useState(initialBpm);
  const [beatsPerBar, setBeatsPerBar] = useState<3 | 4 | 6>(4);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(0);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!running) {
      setCurrentBeat(0);
      return;
    }

    const intervalMs = Math.round((60 / bpm) * 1000);
    let beatIdx = 0;

    const tick = () => {
      const isAccent = beatIdx % beatsPerBar === 0;
      setCurrentBeat(beatIdx % beatsPerBar);
      if (soundEnabled) {
        playMetronomeClick(isAccent);
      }
      beatIdx = (beatIdx + 1) % beatsPerBar;
    };

    tick();
    const timer = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(timer);
  }, [running, bpm, beatsPerBar, soundEnabled]);

  const updateBpm = (next: number, recordPeak = false) => {
    const clamped = Math.max(40, Math.min(220, Math.round(next)));
    setBpm(clamped);
    if (recordPeak || clamped > peakBpm) {
      const nextPeak = Math.max(peakBpm, clamped);
      setPeakBpm(nextPeak);
      onPeakBpmChange?.(nextPeak);
    }
  };

  const handleToggleRun = () => {
    ensureAudioContext();
    setRunning((r) => !r);
  };

  const handleTapTempo = () => {
    ensureAudioContext();
    const now = performance.now();
    const recent = tapTimesRef.current.filter((t) => now - t < 2200);
    recent.push(now);
    tapTimesRef.current = recent;

    if (recent.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < recent.length; i++) {
        intervals.push(recent[i] - recent[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgMs > 200) {
        updateBpm(60000 / avgMs);
      }
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Precision Metronome
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Peak clean rep logged: <span className="font-mono-tabular font-semibold text-[#E6A84C]">{peakBpm} BPM</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span>{soundEnabled ? 'Click On' : 'Visual Only'}</span>
        </button>
      </div>

      {/* Beat indicators */}
      <div className="flex items-center justify-center gap-2.5 my-3">
        {Array.from({ length: beatsPerBar }).map((_, idx) => {
          const active = running && currentBeat === idx;
          return (
            <div
              key={idx}
              className={`h-3.5 w-3.5 rounded-full transition-all duration-75 ${
                active
                  ? idx === 0
                    ? 'scale-125 bg-[#E6A84C] shadow-[0_0_12px_#E6A84C]'
                    : 'scale-110 bg-[var(--text-primary)]'
                  : 'bg-[var(--border-strong)]'
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 my-3">
        <div className="text-center min-w-[92px]">
          <span className="font-mono-tabular text-3xl font-bold text-[var(--text-primary)]">
            {bpm}
          </span>
          <span className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            BPM
          </span>
        </div>

        <input
          type="range"
          min={40}
          max={220}
          value={bpm}
          onChange={(e) => updateBpm(Number(e.target.value))}
          className="flex-1 accent-[#E6A84C] cursor-pointer"
          aria-label="Tempo BPM"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => updateBpm(bpm - 4)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono-tabular text-xs font-medium hover:bg-[var(--bg-hover)]"
        >
          -4
        </button>
        <button
          type="button"
          onClick={() => updateBpm(bpm - 2)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono-tabular text-xs font-medium hover:bg-[var(--bg-hover)]"
        >
          -2
        </button>
        <button
          type="button"
          onClick={() => updateBpm(bpm + 2, true)}
          className="rounded-lg border border-[#E6A84C]/40 bg-[#E6A84C]/12 px-2.5 py-1.5 font-mono-tabular text-xs font-semibold text-[#E6A84C] hover:bg-[#E6A84C]/20"
        >
          +2 Clean
        </button>
        <button
          type="button"
          onClick={() => updateBpm(bpm + 4, true)}
          className="rounded-lg border border-[#E6A84C]/40 bg-[#E6A84C]/12 px-2.5 py-1.5 font-mono-tabular text-xs font-semibold text-[#E6A84C] hover:bg-[#E6A84C]/20"
        >
          +4 Burst
        </button>
        <button
          type="button"
          onClick={handleTapTempo}
          className="ml-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-hover)]"
        >
          Tap Tempo
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-surface)] p-1 border border-[var(--border-subtle)]">
          {([4, 3, 6] as const).map((sig) => (
            <button
              key={sig}
              type="button"
              onClick={() => setBeatsPerBar(sig)}
              className={`rounded-md px-2 py-1 text-xs font-mono-tabular font-medium ${
                beatsPerBar === sig
                  ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {sig === 6 ? '6/8' : `${sig}/4`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleToggleRun}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
            running
              ? 'bg-[#E56B6F] text-white'
              : 'bg-[#E6A84C] text-[#111317] hover:brightness-110'
          }`}
        >
          {running ? 'Stop Click' : 'Start Metronome'}
        </button>
      </div>
    </div>
  );
}
