import { describe, expect, it } from 'vitest';
import { DEFAULT_DOMAINS, DEFAULT_WEEKLY_TEMPLATE } from '../../data/methodology';
import type { SessionLog, TendonFatigueReport } from '../../types/planner';
import { computeProgressionSuggestions, selectNextTemplate } from '../progression';

const lowFatigue: TendonFatigueReport = {
  score: 12,
  level: 'low',
  climbedYesterday: false,
  recentHighLoadCount: 0,
  warnings: [],
};

const highFatigue: TendonFatigueReport = {
  score: 78,
  level: 'high',
  climbedYesterday: true,
  recentHighLoadCount: 3,
  warnings: ['High load'],
};

function makeLog(overrides: Partial<SessionLog>): SessionLog {
  return {
    id: 'l-1',
    dateKey: '2026-11-19',
    domainId: 'guitar',
    templateId: 'guitar-tech',
    title: 'Tech',
    track: 'technical',
    plannedMinutes: 45,
    actualMinutes: 45,
    quality: 4,
    challenge: 'optimal',
    fingerLoad: 2,
    takeaway: 'Good',
    nextFocus: '92 BPM',
    completedAt: '2026-11-19T10:00:00Z',
    updatedAt: '2026-11-19T10:00:00Z',
    ...overrides,
  };
}

describe('progression engine', () => {
  it('rotates guitar tracks toward least-recently-trained track', () => {
    const logs = [
      makeLog({ dateKey: '2026-11-19', track: 'technical' }),
      makeLog({ id: 'l-2', dateKey: '2026-11-18', track: 'ear_training' }),
    ];
    const tpl = selectNextTemplate({
      domain: DEFAULT_DOMAINS.guitar,
      logs,
      fatigue: lowFatigue,
      dateKey: '2026-11-20',
      mode: 'normal',
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
    });
    expect(tpl.track).toBe('fretboard');
  });

  it('swaps guitar to low-tension ear/visualization recovery template when tendon load is high', () => {
    const tpl = selectNextTemplate({
      domain: DEFAULT_DOMAINS.guitar,
      logs: [],
      fatigue: highFatigue,
      dateKey: '2026-11-20',
      mode: 'normal',
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
    });
    expect(tpl.id).toBe('guitar-recovery');
    expect(tpl.fingerLoad).toBe(0);
  });

  it('swaps bouldering to recovery when tendon load is high', () => {
    const tpl = selectNextTemplate({
      domain: DEFAULT_DOMAINS.bouldering,
      logs: [],
      fatigue: highFatigue,
      dateKey: '2026-11-20',
      mode: 'normal',
      weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
      isBoulderingDay: true,
    });
    expect(tpl.id).toBe('boulder-recovery');
  });

  it('recommends advancing meditation duration after 5 qualifying sits at Stage 1', () => {
    const medLogs: SessionLog[] = Array.from({ length: 5 }, (_, idx) =>
      makeLog({
        id: `m-${idx}`,
        dateKey: `2026-11-${14 + idx}`,
        domainId: 'meditation',
        templateId: 'med-anchor',
        track: 'mindfulness',
        actualMinutes: 8,
        fingerLoad: 0,
      })
    );
    const suggestions = computeProgressionSuggestions(
      DEFAULT_DOMAINS,
      medLogs,
      lowFatigue
    );
    const medSug = suggestions.find((s) => s.actionType === 'bump_meditation_minutes');
    expect(medSug).toBeDefined();
    expect(medSug?.actionPayload?.newMinutes).toBe(10);
  });
});
