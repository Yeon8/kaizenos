import { describe, expect, it } from 'vitest';
import { DEFAULT_DOMAINS, DEFAULT_WEEKLY_TEMPLATE } from '../../data/methodology';
import type { DailyCheckIn, ScheduledBlock } from '../../types/planner';
import { getLocalDateKey } from '../../utils/date';
import { generateDailyPlan } from '../optimizer';

function baseCheckIn(overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    energy: 4,
    fingerReadiness: 4,
    bodySoreness: 2,
    wakeMin: 7 * 60, // 07:00
    sleepMin: 23 * 60, // 23:00
    isBoulderingDay: true,
    mode: 'normal',
    commitments: [],
    ...overrides,
  };
}

function assertNoOverlaps(blocks: ScheduledBlock[], commitments: DailyCheckIn['commitments']) {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  for (let i = 1; i < sorted.length; i++) {
    expect(sorted[i].startMin).toBeGreaterThanOrEqual(sorted[i - 1].endMin);
  }
  for (const b of sorted) {
    for (const c of commitments) {
      const collides = b.startMin < c.endMin && c.startMin < b.endMin;
      expect(collides).toBe(false);
    }
  }
}

describe('optimizer engine', () => {
  it('places Guitar strictly before Bouldering and Stretching strictly after Bouldering on climbing days', () => {
    const checkIn = baseCheckIn({ isBoulderingDay: true });
    const res = generateDailyPlan({
      dateKey: '2026-11-20',
      checkIn,
      domains: DEFAULT_DOMAINS,
      logs: [],
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
      priorityPreset: 'skills_first',
    });

    const guitar = res.blocks.find((b) => b.domainId === 'guitar');
    const boulder = res.blocks.find((b) => b.domainId === 'bouldering');
    const stretch = res.blocks.find((b) => b.domainId === 'stretching');

    expect(guitar).toBeDefined();
    expect(boulder).toBeDefined();
    expect(stretch).toBeDefined();
    expect(guitar!.endMin).toBeLessThanOrEqual(boulder!.startMin);
    expect(boulder!.endMin).toBeLessThanOrEqual(stretch!.startMin);
    assertNoOverlaps(res.blocks, checkIn.commitments);
  });

  it('respects fixed commitments with zero overlaps and keeps all blocks within wake/sleep bounds', () => {
    const checkIn = baseCheckIn({
      isBoulderingDay: true,
      commitments: [
        { id: 'c1', title: 'Dentist', startMin: 9 * 60, endMin: 10 * 60 + 30 },
        { id: 'c2', title: 'Dinner', startMin: 18 * 60 + 30, endMin: 20 * 60 },
      ],
    });

    const res = generateDailyPlan({
      dateKey: '2026-11-20',
      checkIn,
      domains: DEFAULT_DOMAINS,
      logs: [],
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
    });

    assertNoOverlaps(res.blocks, checkIn.commitments);
    for (const b of res.blocks) {
      expect(b.startMin).toBeGreaterThanOrEqual(checkIn.wakeMin);
      expect(b.endMin).toBeLessThanOrEqual(checkIn.sleepMin);
    }
  });

  it('compresses durations in MED mode while preserving daily anchor structure', () => {
    const normalRes = generateDailyPlan({
      dateKey: '2026-11-20',
      checkIn: baseCheckIn({ mode: 'normal', isBoulderingDay: false }),
      domains: DEFAULT_DOMAINS,
      logs: [],
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
    });

    const medRes = generateDailyPlan({
      dateKey: '2026-11-20',
      checkIn: baseCheckIn({ mode: 'med', isBoulderingDay: false }),
      domains: DEFAULT_DOMAINS,
      logs: [],
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
    });

    const normalMins = normalRes.blocks.reduce((a, b) => a + (b.endMin - b.startMin), 0);
    const medMins = medRes.blocks.reduce((a, b) => a + (b.endMin - b.startMin), 0);

    expect(medRes.blocks.length).toBeGreaterThanOrEqual(6);
    expect(medMins).toBeLessThan(normalMins);
  });

  it('re-optimizes from nowMin while keeping completed/locked blocks intact', () => {
    const initial = generateDailyPlan({
      dateKey: '2026-11-20',
      checkIn: baseCheckIn({ isBoulderingDay: false }),
      domains: DEFAULT_DOMAINS,
      logs: [],
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
    });

    const completedMed = { ...initial.blocks[0], status: 'completed' as const };
    const nowMin = 14 * 60; // 14:00

    const reopt = generateDailyPlan({
      dateKey: '2026-11-20',
      checkIn: baseCheckIn({ isBoulderingDay: false }),
      domains: DEFAULT_DOMAINS,
      logs: [],
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
      existingBlocks: [completedMed, ...initial.blocks.slice(1)],
      nowMin,
    });

    const keptMed = reopt.blocks.find((b) => b.id === completedMed.id);
    expect(keptMed?.status).toBe('completed');
    expect(keptMed?.startMin).toBe(completedMed.startMin);

    for (const b of reopt.blocks) {
      if (b.id !== completedMed.id) {
        expect(b.startMin).toBeGreaterThanOrEqual(nowMin);
      }
    }
  });

  it('formats local date keys from local calendar date rather than UTC', () => {
    // Construct a local late-night date (23:45 local)
    const lateLocal = new Date(2026, 10, 20, 23, 45, 0);
    expect(getLocalDateKey(lateLocal)).toBe('2026-11-20');
  });
});
