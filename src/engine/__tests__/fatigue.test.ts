import { describe, expect, it } from 'vitest';
import { computeTendonLoad, shouldProtectFingers } from '../fatigue';
import type { SessionLog } from '../../types/planner';

function makeLog(overrides: Partial<SessionLog>): SessionLog {
  return {
    id: 'log-1',
    dateKey: '2026-11-20',
    domainId: 'bouldering',
    templateId: 'boulder-limit',
    title: 'Limit Projecting',
    track: 'limit',
    plannedMinutes: 90,
    actualMinutes: 90,
    quality: 4,
    challenge: 'optimal',
    fingerLoad: 3,
    takeaway: '',
    nextFocus: '',
    completedAt: '2026-11-20T15:00:00Z',
    updatedAt: '2026-11-20T15:00:00Z',
    ...overrides,
  };
}

describe('fatigue engine', () => {
  it('returns low load when there are no recent logs and finger readiness is 5', () => {
    const report = computeTendonLoad([], '2026-11-20', 5);
    expect(report.score).toBe(0);
    expect(report.level).toBe('low');
    expect(report.climbedYesterday).toBe(false);
    expect(shouldProtectFingers(report)).toBe(false);
  });

  it('detects climbing yesterday and accumulates exponentially decayed load', () => {
    const logs = [
      makeLog({ id: 'l1', dateKey: '2026-11-19', fingerLoad: 3, actualMinutes: 90 }),
      makeLog({ id: 'l2', dateKey: '2026-11-17', fingerLoad: 3, actualMinutes: 90 }),
      makeLog({ id: 'l3', dateKey: '2026-11-15', fingerLoad: 2, actualMinutes: 80 }),
    ];
    const report = computeTendonLoad(logs, '2026-11-20', 3);
    expect(report.climbedYesterday).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(65);
    expect(report.level).toBe('high');
    expect(shouldProtectFingers(report)).toBe(true);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it('triggers high protection when daily finger readiness is <= 2 even without logs', () => {
    const report = computeTendonLoad([], '2026-11-20', 2);
    expect(report.level).toBe('high');
    expect(shouldProtectFingers(report)).toBe(true);
  });
});
