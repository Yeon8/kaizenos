import type {
  DailyCheckIn,
  DayMode,
  DomainConfig,
  DomainId,
  PriorityPreset,
  ScheduledBlock,
  SessionLog,
  SessionTemplate,
  TendonFatigueReport,
  WeeklyDayTemplate,
} from '../types/planner';
import { formatMinutes } from '../utils/date';
import { computeTendonLoad, shouldProtectFingers } from './fatigue';
import {
  getJapaneseSrsTemplate,
  getMedDurationForDomain,
  scalePhasesToMinutes,
  selectNextTemplate,
} from './progression';

interface TimeInterval {
  start: number;
  end: number;
}

export interface OptimizeDayParams {
  dateKey: string;
  checkIn: DailyCheckIn;
  domains: Record<DomainId, DomainConfig>;
  logs: SessionLog[];
  weeklyTemplate: WeeklyDayTemplate[];
  priorityPreset?: PriorityPreset;
  existingBlocks?: ScheduledBlock[];
  nowMin?: number;
}

export interface OptimizeDayResult {
  blocks: ScheduledBlock[];
  fatigue: TendonFatigueReport;
  summaryNotes: string[];
  unscheduledDomains: DomainId[];
}

function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && b.start < a.end;
}

function findAvailableSlot(
  occupied: TimeInterval[],
  windowStart: number,
  windowEnd: number,
  duration: number,
  preferredGap = 10
): TimeInterval | null {
  if (windowEnd - windowStart < duration) return null;

  const sorted = [...occupied].sort((a, b) => a.start - b.start);

  // First pass: respect preferredGap after preceding intervals; second pass: zero-gap tight fit
  for (const gap of [preferredGap, 0]) {
    let cursor = windowStart;
    for (const block of sorted) {
      if (block.end + gap <= cursor) continue;
      if (cursor + duration <= block.start) {
        return { start: cursor, end: cursor + duration };
      }
      cursor = Math.max(cursor, block.end + gap);
      if (cursor + duration > windowEnd) break;
    }
    if (cursor + duration <= windowEnd) {
      return { start: cursor, end: cursor + duration };
    }
  }
  return null;
}

function buildBlockFromTemplate(params: {
  id: string;
  dateKey: string;
  template: SessionTemplate;
  startMin: number;
  endMin: number;
  energyWindow: string;
  rationale: string;
  subtitle?: string;
}): ScheduledBlock {
  const { id, dateKey, template, startMin, endMin, energyWindow, rationale, subtitle } =
    params;
  const duration = endMin - startMin;
  return {
    id,
    dateKey,
    domainId: template.domainId,
    templateId: template.id,
    title: template.title,
    subtitle:
      subtitle ||
      template.phases.map((p) => `${p.minutes}m ${p.title.split(':')[0]}`).join(' → '),
    track: template.track,
    startMin,
    endMin,
    locked: false,
    status: 'pending',
    energyWindow,
    rationale,
    intensity: template.intensity,
    fingerLoad: template.fingerLoad,
    methodologyNote: template.methodologyNote,
    phases: scalePhasesToMinutes(template.phases, duration),
  };
}

export function generateDailyPlan(params: OptimizeDayParams): OptimizeDayResult {
  const {
    dateKey,
    checkIn,
    domains,
    logs,
    weeklyTemplate,
    priorityPreset = 'skills_first',
    existingBlocks = [],
    nowMin,
  } = params;

  const mode: DayMode = checkIn.mode;
  const fatigue = computeTendonLoad(logs, dateKey, checkIn.fingerReadiness);
  const protectFingers = shouldProtectFingers(fatigue);

  const wakeMin = checkIn.wakeMin;
  const sleepMin = Math.max(wakeMin + 120, checkIn.sleepMin);
  const activeStart =
    nowMin !== undefined ? Math.max(wakeMin, Math.min(sleepMin, nowMin)) : wakeMin;

  const summaryNotes: string[] = [];
  const unscheduledDomains: DomainId[] = [];

  if (checkIn.energy <= 2 && mode !== 'med') {
    summaryNotes.push(
      `Energy is ${checkIn.energy}/5 — switch to MED (Minimum Effective Dose) mode if you want shorter anchor sessions.`
    );
  }
  if (mode === 'med') {
    summaryNotes.push(
      'Minimum Effective Dose (MED) mode active: protecting all daily streaks with compact high-yield anchors.'
    );
  }
  for (const w of fatigue.warnings) {
    summaryNotes.push(w);
  }

  // Preserve completed and user-locked blocks
  const preservedBlocks = existingBlocks.filter(
    (b) => b.status === 'completed' || b.locked
  );

  const occupied: TimeInterval[] = [
    ...checkIn.commitments.map((c) => ({ start: c.startMin, end: c.endMin })),
    ...preservedBlocks.map((b) => ({ start: b.startMin, end: b.endMin })),
  ];

  const placedBlocks: ScheduledBlock[] = [...preservedBlocks];

  const hasPreservedDomain = (domainId: DomainId, microOnly?: boolean): boolean => {
    return preservedBlocks.some((b) => {
      if (b.domainId !== domainId) return false;
      if (domainId === 'japanese') {
        const isMicro = b.templateId === 'jp-srs-micro' || b.track === 'srs';
        return microOnly ? isMicro : !isMicro;
      }
      return true;
    });
  };

  // Pre-compute templates so durations and constraints are known upfront
  const medTemplate = selectNextTemplate({
    domain: domains.meditation,
    logs,
    fatigue,
    dateKey,
    mode,
    weeklyTemplate,
  });
  const jpSrsTemplate = getJapaneseSrsTemplate(domains.japanese, mode);
  const guitarTemplate = selectNextTemplate({
    domain: domains.guitar,
    logs,
    fatigue,
    dateKey,
    mode,
    weeklyTemplate,
  });
  const drawingTemplate = selectNextTemplate({
    domain: domains.drawing,
    logs,
    fatigue,
    dateKey,
    mode,
    weeklyTemplate,
  });
  const boulderTemplate = selectNextTemplate({
    domain: domains.bouldering,
    logs,
    fatigue,
    dateKey,
    mode,
    weeklyTemplate,
    isBoulderingDay: checkIn.isBoulderingDay,
  });
  const jpCoreTemplate = selectNextTemplate({
    domain: domains.japanese,
    logs,
    fatigue,
    dateKey,
    mode,
    weeklyTemplate,
  });
  const entTemplate = selectNextTemplate({
    domain: domains.entrepreneurship,
    logs,
    fatigue,
    dateKey,
    mode,
    weeklyTemplate,
  });
  const stretchTemplate = selectNextTemplate({
    domain: domains.stretching,
    logs,
    fatigue,
    dateKey,
    mode,
    weeklyTemplate,
    isBoulderingDay: checkIn.isBoulderingDay,
  });

  const tryPlace = (options: {
    idSuffix: string;
    template: SessionTemplate;
    preferredStart: number;
    preferredEnd: number;
    fallbackStart?: number;
    fallbackEnd?: number;
    energyWindow: string;
    rationale: string;
    gapAfter?: number;
    allowCompactDuration?: number;
  }): ScheduledBlock | null => {
    const {
      idSuffix,
      template,
      preferredStart,
      preferredEnd,
      fallbackStart = activeStart,
      fallbackEnd = sleepMin,
      energyWindow,
      rationale,
      gapAfter = 10,
      allowCompactDuration,
    } = options;

    const pStart = Math.max(activeStart, preferredStart);
    const pEnd = Math.min(sleepMin, preferredEnd);
    let slot = findAvailableSlot(occupied, pStart, pEnd, template.targetMinutes, 10);

    if (!slot) {
      const fStart = Math.max(activeStart, fallbackStart);
      const fEnd = Math.min(sleepMin, fallbackEnd);
      slot = findAvailableSlot(occupied, fStart, fEnd, template.targetMinutes, 10);
    }

    if (!slot && allowCompactDuration && allowCompactDuration < template.targetMinutes) {
      const fStart = Math.max(activeStart, fallbackStart);
      const fEnd = Math.min(sleepMin, fallbackEnd);
      slot = findAvailableSlot(occupied, fStart, fEnd, allowCompactDuration, 5);
    }

    if (!slot) {
      return null;
    }

    // Store occupied with requested post-block consolidation buffer for future blocks,
    // while keeping actual block endMin exact.
    occupied.push({ start: slot.start, end: slot.end + Math.max(0, gapAfter - 10) });

    const block = buildBlockFromTemplate({
      id: `${dateKey}-${idSuffix}`,
      dateKey,
      template,
      startMin: slot.start,
      endMin: slot.end,
      energyWindow,
      rationale,
    });
    placedBlocks.push(block);
    return block;
  };

  // 1. Morning Meditation (Daily anchor)
  if (!hasPreservedDomain('meditation')) {
    const placed = tryPlace({
      idSuffix: 'meditation',
      template: medTemplate,
      preferredStart: wakeMin + 10,
      preferredEnd: wakeMin + 180,
      energyWindow: 'Morning Grounding',
      rationale:
        'First-thing stillness anchors baseline attention before cognitive or motor demand.',
      gapAfter: 10,
      allowCompactDuration: getMedDurationForDomain('meditation'),
    });
    if (!placed) unscheduledDomains.push('meditation');
  }

  // 2. Morning Japanese SRS Micro-Block
  if (!hasPreservedDomain('japanese', true)) {
    const placed = tryPlace({
      idSuffix: 'japanese-srs',
      template: jpSrsTemplate,
      preferredStart: wakeMin + 20,
      preferredEnd: wakeMin + 240,
      energyWindow: 'Morning Recall',
      rationale:
        'Morning spaced repetition locks yesterday’s mined vocabulary in ~15m while recall is sharpest.',
      gapAfter: 10,
      allowCompactDuration: 10,
    });
    if (!placed) unscheduledDomains.push('japanese');
  }

  // Determine if a preserved bouldering block already pins a hard ceiling for guitar
  const existingBoulder = placedBlocks.find((b) => b.domainId === 'bouldering');
  const stretchReservedMin =
    hasPreservedDomain('stretching') ? 0 : stretchTemplate.targetMinutes + 20;

  // 3. Guitar (MUST precede Bouldering on climbing days!)
  let guitarBlock = placedBlocks.find((b) => b.domainId === 'guitar') || null;
  if (!guitarBlock) {
    const guitarCeiling = existingBoulder
      ? Math.max(activeStart, existingBoulder.startMin - 15)
      : sleepMin - (checkIn.isBoulderingDay ? boulderTemplate.targetMinutes + stretchReservedMin + 25 : 60);

    const guitarRationale = checkIn.isBoulderingDay
      ? protectFingers
        ? 'Tendon protection active: switched to low-tension ear & visualization before climbing.'
        : 'Scheduled before bouldering to protect fine finger precision, skin, and motor plasticity.'
      : protectFingers
        ? 'High tendon load detected: auto-shifted to low-tension ear & fretboard mapping.'
        : 'Peak morning motor plasticity window with spaced sub-skill rotation.';

    guitarBlock = tryPlace({
      idSuffix: 'guitar',
      template: guitarTemplate,
      preferredStart: wakeMin + 45,
      preferredEnd: Math.min(wakeMin + 360, guitarCeiling),
      fallbackStart: activeStart,
      fallbackEnd: guitarCeiling,
      energyWindow: 'Peak Motor Plasticity',
      rationale: guitarRationale,
      gapAfter: 15,
      allowCompactDuration: getMedDurationForDomain('guitar'),
    });

    if (!guitarBlock && existingBoulder) {
      // If user explicitly locked Bouldering very early in the morning, allow low-tension Guitar later
      const recoveryGuitar = selectNextTemplate({
        domain: domains.guitar,
        logs,
        fatigue: { ...fatigue, level: 'high' },
        dateKey,
        mode,
        weeklyTemplate,
      });
      guitarBlock = tryPlace({
        idSuffix: 'guitar',
        template: recoveryGuitar,
        preferredStart: existingBoulder.endMin + 30,
        preferredEnd: sleepMin - 45,
        energyWindow: 'Post-Climb Recovery',
        rationale:
          'Bouldering was locked early — shifted Guitar to tendon-sparing ear & visualization.',
        gapAfter: 10,
        allowCompactDuration: 15,
      });
    }

    if (!guitarBlock) unscheduledDomains.push('guitar');
  }

  // 4. Priority-ordered middle blocks: Drawing, Bouldering (if climbing day), Entrepreneurship, Japanese Core
  // On climbing days, reserve morning/early-afternoon slot for Drawing or place after Bouldering if Entrepreneurship is first.
  const placeDrawing = () => {
    if (hasPreservedDomain('drawing')) return;
    const boulderEndOrNull = placedBlocks.find((b) => b.domainId === 'bouldering')?.endMin;
    const prefStart =
      priorityPreset === 'entrepreneurship_first' && boulderEndOrNull
        ? boulderEndOrNull + 20
        : wakeMin + 90;
    const placed = tryPlace({
      idSuffix: 'drawing',
      template: drawingTemplate,
      preferredStart: prefStart,
      preferredEnd: wakeMin + 480,
      energyWindow: 'Focused Visual Craft',
      rationale: `Beginner Stage ${domains.drawing.currentStageIndex + 1} deliberate drill + 10m 50%-rule fun drawing.`,
      gapAfter: 15,
      allowCompactDuration: getMedDurationForDomain('drawing'),
    });
    if (!placed) unscheduledDomains.push('drawing');
  };

  const placeEntrepreneurship = () => {
    if (hasPreservedDomain('entrepreneurship')) return;
    const prefStart =
      priorityPreset === 'entrepreneurship_first'
        ? wakeMin + 60
        : priorityPreset === 'balanced'
          ? wakeMin + 240
          : wakeMin + 330; // skills_first: afternoon protected sprint
    const placed = tryPlace({
      idSuffix: 'entrepreneurship',
      template: entTemplate,
      preferredStart: prefStart,
      preferredEnd: sleepMin - stretchReservedMin - 20,
      energyWindow:
        priorityPreset === 'entrepreneurship_first'
          ? 'Prime Deep Work'
          : 'Afternoon Deep Work',
      rationale:
        priorityPreset === 'skills_first'
          ? 'Protected afternoon Single-Domino sprint after primary skill & physical blocks.'
          : 'Protected Single-Domino sprint focused on one shippable outcome.',
      gapAfter: 15,
      allowCompactDuration: getMedDurationForDomain('entrepreneurship'),
    });
    if (!placed) unscheduledDomains.push('entrepreneurship');
  };

  const placeBouldering = () => {
    if (!checkIn.isBoulderingDay) return;
    if (hasPreservedDomain('bouldering')) return;

    const minStartAfterGuitar = guitarBlock
      ? guitarBlock.endMin + 15
      : activeStart;
    const maxEndBeforeStretch = sleepMin - stretchReservedMin;

    const boulderRationale =
      boulderTemplate.id === 'boulder-recovery'
        ? 'Auto-swapped to tendon recovery & slab footwork due to cumulative finger fatigue or MED mode.'
        : fatigue.climbedYesterday
          ? 'Climbed yesterday — downgraded from limit intensity to volume/footwork to protect pulleys.'
          : 'Physical prime window after fine motor guitar work; followed by recovery buffer & evening stretch.';

    const placed = tryPlace({
      idSuffix: 'bouldering',
      template: boulderTemplate,
      preferredStart: Math.max(wakeMin + 150, minStartAfterGuitar),
      preferredEnd: Math.min(wakeMin + 630, maxEndBeforeStretch),
      fallbackStart: Math.max(activeStart, minStartAfterGuitar),
      fallbackEnd: maxEndBeforeStretch,
      energyWindow: 'Physical Peak Window',
      rationale: boulderRationale,
      gapAfter: 25,
      allowCompactDuration: 35,
    });
    if (!placed) unscheduledDomains.push('bouldering');
  };

  const placeJapaneseCore = () => {
    if (hasPreservedDomain('japanese', false)) return;
    const placed = tryPlace({
      idSuffix: 'japanese-core',
      template: jpCoreTemplate,
      preferredStart: wakeMin + 270,
      preferredEnd: sleepMin - stretchReservedMin,
      energyWindow: 'Immersion & Synthesis',
      rationale:
        'Spaced hours after morning SRS for dual-coded native immersion, mining, and active output.',
      gapAfter: 10,
      allowCompactDuration: getMedDurationForDomain('japanese', false),
    });
    if (!placed && !unscheduledDomains.includes('japanese')) {
      unscheduledDomains.push('japanese');
    }
  };

  if (priorityPreset === 'entrepreneurship_first') {
    placeEntrepreneurship();
    placeBouldering();
    placeDrawing();
    placeJapaneseCore();
  } else if (priorityPreset === 'balanced') {
    placeDrawing();
    placeBouldering();
    placeEntrepreneurship();
    placeJapaneseCore();
  } else {
    // skills_first (User preference!)
    placeDrawing();
    placeBouldering();
    placeJapaneseCore();
    placeEntrepreneurship();
  }

  // 5. Evening Stretching (MUST strictly start AFTER Bouldering ends!)
  if (!hasPreservedDomain('stretching')) {
    const finalBoulder = placedBlocks.find((b) => b.domainId === 'bouldering');
    const minAfterBoulder = finalBoulder ? finalBoulder.endMin + 15 : activeStart;

    const stretchRationale = finalBoulder
      ? 'Scheduled after bouldering — preserves pre-climb tendon stiffness, restores forearms/hips, and aids sleep.'
      : 'Evening parasympathetic mobility window to decompress wrists, hips, and nervous system.';

    const placed = tryPlace({
      idSuffix: 'stretching',
      template: stretchTemplate,
      preferredStart: Math.max(sleepMin - 90, minAfterBoulder),
      preferredEnd: sleepMin,
      fallbackStart: minAfterBoulder,
      fallbackEnd: sleepMin,
      energyWindow: 'Evening Down-Regulation',
      rationale: stretchRationale,
      gapAfter: 5,
      allowCompactDuration: getMedDurationForDomain('stretching'),
    });
    if (!placed) unscheduledDomains.push('stretching');
  }

  // Sort chronologically and summarize any scheduling constraints
  const sortedBlocks = [...placedBlocks].sort((a, b) => a.startMin - b.startMin);

  if (checkIn.isBoulderingDay) {
    const g = sortedBlocks.find((b) => b.domainId === 'guitar');
    const b = sortedBlocks.find((b) => b.domainId === 'bouldering');
    const s = sortedBlocks.find((b) => b.domainId === 'stretching');
    if (g && b && g.endMin <= b.startMin) {
      summaryNotes.push(
        `Motor-first order locked: Guitar (${formatMinutes(g.startMin)}–${formatMinutes(g.endMin)}) finishes before Bouldering (${formatMinutes(b.startMin)}).`
      );
    }
    if (b && s && b.endMin <= s.startMin) {
      summaryNotes.push(
        `Post-climb recovery: Stretching runs after Bouldering (${formatMinutes(s.startMin)}) to protect climbing stiffness.`
      );
    }
  }

  if (unscheduledDomains.length > 0) {
    summaryNotes.push(
      `Tight window today — could not fit: ${unscheduledDomains.join(', ')}. Try MED mode or extend wake/sleep bounds.`
    );
  }

  // Verify zero accidental overlap on commitments (safety pass for debug clarity)
  for (let i = 0; i < sortedBlocks.length; i++) {
    for (const c of checkIn.commitments) {
      if (
        !sortedBlocks[i].locked &&
        sortedBlocks[i].status === 'pending' &&
        overlaps(
          { start: sortedBlocks[i].startMin, end: sortedBlocks[i].endMin },
          { start: c.startMin, end: c.endMin }
        )
      ) {
        // Should never happen due to occupied checks above
        summaryNotes.push(`Warning: ${sortedBlocks[i].title} overlaps ${c.title}.`);
      }
    }
  }

  return {
    blocks: sortedBlocks,
    fatigue,
    summaryNotes,
    unscheduledDomains,
  };
}
