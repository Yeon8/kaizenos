import { describe, expect, it } from 'vitest';
import { DEFAULT_DOMAINS } from '../../data/methodology';
import type { SessionLog } from '../../types/planner';
import { computeMasteryStats, normalizeTheme } from '../masteryStats';

function makeLog(overrides: Partial<SessionLog>): SessionLog {
  return {
    id: 'l-1',
    dateKey: '2026-11-20',
    domainId: 'drawing',
    templateId: 'drawing-stage-1',
    title: 'Line Confidence',
    track: 'fundamentals',
    plannedMinutes: 45,
    actualMinutes: 45,
    quality: 4,
    challenge: 'optimal',
    fingerLoad: 0,
    takeaway: '',
    nextFocus: '',
    completedAt: '2026-11-20T10:00:00Z',
    updatedAt: '2026-11-20T10:00:00Z',
    ...overrides,
  };
}

describe('masteryStats engine', () => {
  it('reflects starting skill asymmetry between intermediate and beginner domains', () => {
    const stats = computeMasteryStats(DEFAULT_DOMAINS, [], '2026-11-20');
    expect(stats.guitar.score).toBeGreaterThan(stats.drawing.score);
    expect(stats.guitar.rank).toBe(2);
    expect(stats.drawing.rank).toBe(1);
    expect(stats.drawing.rankLabel).toBe('Novice');
  });

  it('increases mastery score, streak, and rank as sessions are logged', () => {
    const logs: SessionLog[] = Array.from({ length: 5 }, (_, idx) =>
      makeLog({
        id: `d-${idx}`,
        dateKey: `2026-11-${16 + idx}`,
        actualMinutes: 45,
        quality: 5,
      })
    );
    const stats = computeMasteryStats(DEFAULT_DOMAINS, logs, '2026-11-20');
    expect(stats.drawing.sessionsCount).toBe(5);
    expect(stats.drawing.totalMinutes).toBe(225);
    expect(stats.drawing.currentStreak).toBe(5);
    expect(stats.drawing.score).toBeGreaterThanOrEqual(20);
    expect(stats.drawing.rank).toBeGreaterThanOrEqual(2);
  });

  it('normalizes legacy dark and light theme modes cleanly', () => {
    expect(normalizeTheme('dark')).toBe('noir');
    expect(normalizeTheme('light')).toBe('washi');
    expect(normalizeTheme('reload')).toBe('reload');
    expect(normalizeTheme(undefined)).toBe('noir');
  });
});
