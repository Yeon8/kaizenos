import { useState } from 'react';
import { Bell, Wind } from 'lucide-react';
import { ensureAudioContext, playMeditationBell } from '../../utils/audio';

export function MeditationBellTool({
  isTimerRunning,
}: {
  isTimerRunning: boolean;
}) {
  const [showBreathingRing, setShowBreathingRing] = useState(true);

  const strikeBell = () => {
    ensureAudioContext();
    playMeditationBell();
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Contemplative Sit Anchor
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Gently returning from distraction is the rep. Keep jaw & hands soft.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBreathingRing((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
          >
            <Wind size={13} />
            <span>{showBreathingRing ? 'Hide Breath Cue' : 'Show Breath Cue'}</span>
          </button>
          <button
            type="button"
            onClick={strikeBell}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#68D391]/20 border border-[#68D391]/40 px-3 py-1.5 text-xs font-semibold text-[#68D391] hover:bg-[#68D391]/30"
          >
            <Bell size={13} />
            <span>Chime Bowl</span>
          </button>
        </div>
      </div>

      {showBreathingRing && (
        <div className="flex flex-col items-center justify-center py-4">
          <div
            className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#68D391]/50 bg-[#68D391]/10 ${
              isTimerRunning ? 'animate-breathe' : ''
            }`}
          >
            <div className="h-14 w-14 rounded-full bg-[#68D391]/25 blur-[1px]" />
            <span className="absolute text-xs font-medium text-[#68D391]">
              {isTimerRunning ? '4s In · 6s Out' : 'Ready'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Optional visual pacer — close eyes anytime and rely on the singing-bowl bell.
          </p>
        </div>
      )}
    </div>
  );
}
