import { getTemplatesForDomain, SESSION_TEMPLATES } from '../data/methodology';
import type {
  DayMode,
  DomainConfig,
  DomainId,
  DrillPhase,
  ProgressionSuggestion,
  SessionLog,
  SessionTemplate,
  TendonFatigueReport,
  WeeklyDayTemplate,
} from '../types/planner';
import { getWeekday } from '../utils/date';
import { shouldProtectFingers } from './fatigue';

export function scalePhasesToMinutes(
  phases: DrillPhase[],
  targetMinutes: number
): DrillPhase[] {
  const totalBase = phases.reduce((acc, p) => acc + p.minutes, 0);
  if (totalBase <= 0 || targetMinutes <= 0) return phases;
  if (totalBase === targetMinutes) return phases.map((p) => ({ ...p }));

  const scaled = phases.map((p) => ({
    ...p,
    minutes: Math.max(1, Math.round((p.minutes / totalBase) * targetMinutes)),
  }));

  let diff = targetMinutes - scaled.reduce((acc, p) => acc + p.minutes, 0);
  // Adjust largest phase to absorb rounding delta
  if (diff !== 0 && scaled.length > 0) {
    let targetIdx = 0;
    for (let i = 1; i < scaled.length; i++) {
      if (scaled[i].minutes > scaled[targetIdx].minutes) {
        targetIdx = i;
      }
    }
    scaled[targetIdx].minutes = Math.max(1, scaled[targetIdx].minutes + diff);
  }
  return scaled;
}

function getLeastRecentlyTrainedTrack(
  tracks: string[],
  domainId: DomainId,
  logs: SessionLog[]
): string {
  const lastSeen = new Map<string, string>();
  for (const log of logs) {
    if (log.domainId !== domainId) continue;
    const prev = lastSeen.get(log.track);
    if (!prev || log.dateKey > prev) {
      lastSeen.set(log.track, log.dateKey);
    }
  }

  let bestTrack = tracks[0];
  let oldestDate = '9999-99-99';

  for (const track of tracks) {
    const date = lastSeen.get(track);
    if (!date) {
      return track; // Never trained — highest priority
    }
    if (date < oldestDate) {
      oldestDate = date;
      bestTrack = track;
    }
  }
  return bestTrack;
}

export function getMedDurationForDomain(
  domainId: DomainId,
  isMicroBlock = false
): number {
  switch (domainId) {
    case 'meditation':
      return 6;
    case 'japanese':
      return isMicroBlock ? 10 : 20;
    case 'guitar':
      return 15;
    case 'drawing':
      return 15;
    case 'bouldering':
      return 25;
    case 'entrepreneurship':
      return 30;
    case 'stretching':
      return 10;
  }
}

export function getJapaneseSrsTemplate(
  domain: DomainConfig,
  mode: DayMode
): SessionTemplate {
  const base =
    getTemplatesForDomain('japanese', domain.customDrills).find(
      (t) => t.id === 'jp-srs-micro'
    ) || SESSION_TEMPLATES.find((t) => t.id === 'jp-srs-micro')!;

  const targetMinutes = mode === 'med' ? 10 : mode === 'peak' ? 20 : base.targetMinutes;
  return {
    ...base,
    targetMinutes,
    phases: scalePhasesToMinutes(base.phases, targetMinutes),
  };
}

export function selectNextTemplate(params: {
  domain: DomainConfig;
  logs: SessionLog[];
  fatigue: TendonFatigueReport;
  dateKey: string;
  mode: DayMode;
  weeklyTemplate: WeeklyDayTemplate[];
  isBoulderingDay?: boolean;
}): SessionTemplate {
  const { domain, logs, fatigue, dateKey, mode, weeklyTemplate, isBoulderingDay } = params;
  const templates = getTemplatesForDomain(domain.id, domain.customDrills);
  let chosen: SessionTemplate = templates[0];

  if (domain.id === 'guitar') {
    if (shouldProtectFingers(fatigue)) {
      chosen = templates.find((t) => t.id === 'guitar-recovery') || templates[0];
    } else {
      const activeTracks = domain.tracks.filter((t) => t !== 'recovery');
      const nextTrack = getLeastRecentlyTrainedTrack(
        activeTracks.length > 0 ? activeTracks : ['technical'],
        'guitar',
        logs
      );
      chosen = templates.find((t) => t.track === nextTrack) || templates[0];
    }
  } else if (domain.id === 'drawing') {
    const stageNum = Math.max(1, Math.min(6, domain.currentStageIndex + 1));
    chosen =
      templates.find((t) => t.id === `drawing-stage-${stageNum}`) || templates[0];
  } else if (domain.id === 'japanese') {
    const coreTemplates = templates.filter((t) => !t.isMicroBlock);
    const coreTracks = ['reading_mining', 'audio_shadowing', 'output_pitch'];
    const nextTrack = getLeastRecentlyTrainedTrack(coreTracks, 'japanese', logs);
    chosen =
      coreTemplates.find((t) => t.track === nextTrack) ||
      coreTemplates[0] ||
      templates[0];
  } else if (domain.id === 'bouldering') {
    if (shouldProtectFingers(fatigue) || mode === 'med') {
      chosen = templates.find((t) => t.id === 'boulder-recovery') || templates[0];
    } else {
      const weekday = getWeekday(dateKey);
      const dayBlueprint = weeklyTemplate.find((w) => w.weekday === weekday);
      let focus = dayBlueprint?.boulderingFocus || 'volume';
      if (fatigue.climbedYesterday && focus === 'limit') {
        focus = 'volume';
      }
      chosen = templates.find((t) => t.track === focus) || templates[0];
    }
  } else if (domain.id === 'entrepreneurship') {
    const entLogs = logs
      .filter((l) => l.domainId === 'entrepreneurship')
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    const lastId = entLogs[0]?.templateId;
    if (lastId === 'ent-domino-build') {
      // Roughly 2 build days per 1 distribution day unless user ran build twice
      const secondLastId = entLogs[1]?.templateId;
      if (secondLastId === 'ent-domino-build') {
        chosen = templates.find((t) => t.id === 'ent-distribution') || templates[0];
      } else {
        chosen = templates.find((t) => t.id === 'ent-domino-build') || templates[0];
      }
    } else {
      chosen = templates.find((t) => t.id === 'ent-domino-build') || templates[0];
    }
  } else if (domain.id === 'meditation') {
    const medIds = [
      'med-anchor',
      'med-labeling',
      'med-body-scan',
      'med-open',
      'med-deep',
    ];
    const idx = Math.max(0, Math.min(medIds.length - 1, domain.currentStageIndex));
    chosen = templates.find((t) => t.id === medIds[idx]) || templates[0];
  } else if (domain.id === 'stretching') {
    const tracks =
      isBoulderingDay || fatigue.climbedYesterday
        ? ['forearms_thoracic', 'hips_lower']
        : ['hips_lower', 'forearms_thoracic', 'full_decompress'];
    const nextTrack = getLeastRecentlyTrainedTrack(tracks, 'stretching', logs);
    chosen = templates.find((t) => t.track === nextTrack) || templates[0];
  }

  let targetMinutes = chosen.targetMinutes;
  if (domain.id === 'japanese') {
    // Japanese core block is defaultMinutes minus the 15m SRS micro-block (min 25m)
    targetMinutes = Math.max(25, domain.defaultMinutes - 15);
  } else if (domain.id !== 'meditation' && chosen.id !== 'guitar-recovery' && chosen.id !== 'boulder-recovery') {
    targetMinutes = domain.defaultMinutes;
  }

  if (mode === 'med') {
    targetMinutes = getMedDurationForDomain(domain.id, false);
  } else if (mode === 'peak') {
    targetMinutes = Math.round(targetMinutes * 1.15);
  }

  return {
    ...chosen,
    targetMinutes,
    phases: scalePhasesToMinutes(chosen.phases, targetMinutes),
  };
}

export function getLastSessionCarryover(
  domainId: DomainId,
  logs: SessionLog[]
): {
  title: string;
  dateKey: string;
  nextFocus: string;
  takeaway: string;
  bpm?: number;
  maxGrade?: string;
} | null {
  const domainLogs = logs
    .filter((l) => l.domainId === domainId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  if (domainLogs.length === 0) return null;
  const latest = domainLogs[0];
  return {
    title: latest.title,
    dateKey: latest.dateKey,
    nextFocus: latest.nextFocus || 'Continue clean fundamentals from last session.',
    takeaway: latest.takeaway || '',
    bpm: latest.metrics?.bpm,
    maxGrade: latest.metrics?.maxGrade,
  };
}

export function computeProgressionSuggestions(
  domains: Record<DomainId, DomainConfig>,
  logs: SessionLog[],
  fatigue: TendonFatigueReport
): ProgressionSuggestion[] {
  const suggestions: ProgressionSuggestion[] = [];

  // 1. Meditation progressive ramp
  const med = domains.meditation;
  if (med.currentStageIndex < med.stages.length - 1) {
    const medLogs = logs.filter((l) => l.domainId === 'meditation');
    const stageMinutes = [8, 10, 12, 15, 20];
    const currentTarget = stageMinutes[med.currentStageIndex] ?? 8;
    const qualifying = medLogs.filter((l) => l.actualMinutes >= Math.max(6, currentTarget - 1));
    if (qualifying.length >= 5 * (med.currentStageIndex + 1)) {
      const nextStageIdx = med.currentStageIndex + 1;
      const nextMinutes = stageMinutes[nextStageIdx] ?? currentTarget + 2;
      suggestions.push({
        id: `prog-med-${nextStageIdx}`,
        domainId: 'meditation',
        title: `Ready to expand Meditation to ${nextMinutes} min`,
        reason: `You have built strong consistency at Stage ${med.currentStageIndex + 1}. Advancing deepens attention stability.`,
        actionType: 'bump_meditation_minutes',
        actionPayload: { newMinutes: nextMinutes, nextStageIndex: nextStageIdx },
      });
    }
  }

  // 2. Stage milestone completion across skills
  for (const domain of Object.values(domains)) {
    if (domain.id === 'meditation') continue;
    const currentStage = domain.stages[domain.currentStageIndex];
    if (!currentStage) continue;
    const allComplete =
      currentStage.milestones.length > 0 &&
      currentStage.milestones.every((m) => m.completed);
    if (allComplete && domain.currentStageIndex < domain.stages.length - 1) {
      suggestions.push({
        id: `prog-stage-${domain.id}-${domain.currentStageIndex + 1}`,
        domainId: domain.id,
        title: `Advance ${domain.name} to Stage ${domain.currentStageIndex + 2}`,
        reason: `All milestones in "${currentStage.title}" are complete.`,
        actionType: 'advance_stage',
        actionPayload: { nextStageIndex: domain.currentStageIndex + 1 },
      });
    }
  }

  // 3. Challenge-Zone Calibration (Ericsson ~85% optimal edge)
  for (const domain of Object.values(domains)) {
    const recent = logs
      .filter((l) => l.domainId === domain.id)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 5);
    if (recent.length < 3) continue;

    const tooEasyCount = recent.filter((l) => l.challenge === 'too_easy').length;
    const tooHardCount = recent.filter((l) => l.challenge === 'too_hard').length;

    if (tooEasyCount >= 3) {
      suggestions.push({
        id: `cal-up-${domain.id}`,
        domainId: domain.id,
        title: `Raise the edge in ${domain.name}`,
        reason: `${tooEasyCount} of your last ${recent.length} sessions felt too easy. Increase tempo, problem grade, or complexity to stay in the growth zone.`,
        actionType: 'challenge_calibration',
      });
    } else if (tooHardCount >= 3) {
      suggestions.push({
        id: `cal-down-${domain.id}`,
        domainId: domain.id,
        title: `Dial back ${domain.name} difficulty slightly`,
        reason: `${tooHardCount} of your last ${recent.length} sessions felt too hard. Slow down tempo or isolate smaller chunks to restore clean form.`,
        actionType: 'challenge_calibration',
      });
    }
  }

  // 4. Tendon protection insight
  if (fatigue.level === 'high') {
    suggestions.push({
      id: 'tendon-protect',
      domainId: 'bouldering',
      title: 'Tendon Recovery Priority Active',
      reason:
        fatigue.warnings[0] ||
        'Elevated cumulative finger load detected. Keep grip work light for 24–48h.',
      actionType: 'protect_tendons',
    });
  }

  return suggestions;
}
