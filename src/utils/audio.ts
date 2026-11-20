/**
 * Offline Web Audio synthesizer + safe haptic feedback.
 * AudioContext is created/resumed lazily on user interaction (iOS Safari safe).
 */

let sharedCtx: AudioContext | null = null;

export function ensureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;

  if (!sharedCtx) {
    sharedCtx = new Ctx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {
      // Ignore autoplay blocks outside gestures
    });
  }
  return sharedCtx;
}

export function playMetronomeClick(accent: boolean): void {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = accent ? 'triangle' : 'sine';
  osc.frequency.setValueAtTime(accent ? 1180 : 780, now);
  osc.frequency.exponentialRampToValueAtTime(accent ? 520 : 380, now + 0.032);

  gain.gain.setValueAtTime(accent ? 0.32 : 0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.045);
}

export function playMeditationBell(): void {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const partials = [
    { freq: 220, amp: 0.22, dur: 2.6 },
    { freq: 440, amp: 0.12, dur: 2.1 },
    { freq: 659.25, amp: 0.07, dur: 1.6 },
    { freq: 882, amp: 0.04, dur: 1.2 },
  ];

  for (const p of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(p.amp, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + p.dur + 0.05);
  }
}

export function playTransitionChime(): void {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, offset: 0, dur: 0.38 },
    { freq: 783.99, offset: 0.14, dur: 0.52 },
  ];

  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(n.freq, now + n.offset);

    gain.gain.setValueAtTime(0.0001, now + n.offset);
    gain.gain.linearRampToValueAtTime(0.18, now + n.offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.offset + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + n.offset);
    osc.stop(now + n.offset + n.dur + 0.05);
  }
}

export function triggerHaptic(pattern: number | number[] = 40): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore on unsupported devices
    }
  }
}
