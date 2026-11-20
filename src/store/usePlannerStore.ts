import { create } from 'zustand';
import {
  DEFAULT_DOMAINS,
  DEFAULT_ENTREPRENEUR_TASKS,
  DEFAULT_WEEKLY_TEMPLATE,
  getTemplatesForDomain,
} from '../data/methodology';
import {
  computeSingleDomainMasteryStat,
  normalizeTheme,
} from '../engine/masteryStats';
import { generateDailyPlan } from '../engine/optimizer';
import { scalePhasesToMinutes } from '../engine/progression';
import {
  isSupabaseConfigured,
  syncStateWithCloud,
  type SyncableState,
} from '../sync/supabaseSync';
import type {
  AppSettings,
  ChallengeRating,
  CompletedToastPayload,
  DailyCheckIn,
  DayRecord,
  DomainConfig,
  DomainId,
  EntrepreneurTask,
  FixedCommitment,
  ProgressionSuggestion,
  SessionLog,
  SessionMetrics,
  SessionTemplate,
  WeeklyDayTemplate,
} from '../types/planner';
import { addDays, getLocalDateKey, getNowMinutes, getWeekday } from '../utils/date';

const STORAGE_KEY = 'kaizenos-planner-v1';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

export interface CompleteSessionInput {
  actualMinutes: number;
  quality: 1 | 2 | 3 | 4 | 5;
  challenge: ChallengeRating;
  fingerFatigue?: 1 | 2 | 3 | 4 | 5;
  metrics?: SessionMetrics;
  takeaway: string;
  nextFocus: string;
}

interface PersistedPayload {
  settings: AppSettings;
  domains: Record<DomainId, DomainConfig>;
  weeklyTemplate: WeeklyDayTemplate[];
  entrepreneurTasks: EntrepreneurTask[];
  daysByDate: Record<string, DayRecord>;
  sessionLogs: SessionLog[];
  profileUpdatedAt: string;
}

interface PlannerStore extends PersistedPayload {
  selectedDateKey: string;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  cloudUserEmail: string | null;
  lastCompletedToast: CompletedToastPayload | null;

  clearCompletedToast: () => void;
  ensureDayPlan: (dateKey: string) => DayRecord;
  setSelectedDate: (dateKey: string) => void;
  updateCheckIn: (
    dateKey: string,
    patch: Partial<DailyCheckIn>,
    autoReoptimize?: boolean
  ) => void;
  optimizeDay: (dateKey: string, fromNow?: boolean) => void;
  toggleLockBlock: (dateKey: string, blockId: string) => void;
  swapBlockTemplate: (dateKey: string, blockId: string, templateId: string) => void;
  adjustBlockDuration: (dateKey: string, blockId: string, deltaMinutes: number) => void;
  moveBlock: (dateKey: string, blockId: string, direction: 'up' | 'down') => void;
  addCommitment: (dateKey: string, commitment: Omit<FixedCommitment, 'id'>) => void;
  removeCommitment: (dateKey: string, commitmentId: string) => void;

  completeSession: (
    dateKey: string,
    blockId: string,
    input: CompleteSessionInput
  ) => void;
  skipBlock: (dateKey: string, blockId: string) => void;
  reopenBlock: (dateKey: string, blockId: string) => void;

  updateDomainConfig: (domainId: DomainId, patch: Partial<DomainConfig>) => void;
  toggleMilestone: (
    domainId: DomainId,
    stageIndex: number,
    milestoneId: string
  ) => void;
  advanceStage: (domainId: DomainId, nextStageIndex?: number) => void;
  addCustomDrill: (
    domainId: DomainId,
    drill: Omit<SessionTemplate, 'id' | 'domainId'>
  ) => void;
  deleteCustomDrill: (domainId: DomainId, drillId: string) => void;

  updateWeeklyDay: (weekday: number, patch: Partial<WeeklyDayTemplate>) => void;

  addEntrepreneurTask: (
    task: Omit<EntrepreneurTask, 'id' | 'createdAt' | 'done' | 'isDominoToday'>
  ) => void;
  setDominoTask: (taskId: string) => void;
  toggleEntrepreneurTask: (taskId: string) => void;
  deleteEntrepreneurTask: (taskId: string) => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
  applyProgressionSuggestion: (suggestion: ProgressionSuggestion) => void;

  setCloudUserEmail: (email: string | null) => void;
  triggerCloudSync: () => Promise<void>;
  exportBackupJson: () => string;
  importBackupJson: (raw: string) => { ok: boolean; error?: string };
  seedDemoHistory: () => void;
  resetAllData: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'noir',
  defaultWakeMin: 7 * 60, // 07:00
  defaultSleepMin: 23 * 60, // 23:00
  priorityPreset: 'skills_first',
  supabaseConfig: {
    url: '',
    anonKey: '',
  },
};

function createDefaultCheckIn(
  dateKey: string,
  settings: AppSettings,
  weeklyTemplate: WeeklyDayTemplate[]
): DailyCheckIn {
  const weekday = getWeekday(dateKey);
  const templateDay = weeklyTemplate.find((d) => d.weekday === weekday);
  return {
    energy: 4,
    fingerReadiness: 4,
    bodySoreness: 2,
    wakeMin: settings.defaultWakeMin,
    sleepMin: settings.defaultSleepMin,
    isBoulderingDay: templateDay ? templateDay.isBoulderingDay : false,
    mode: 'normal',
    commitments: [],
  };
}

function createInitialPersistedState(): PersistedPayload {
  const todayKey = getLocalDateKey();
  const checkIn = createDefaultCheckIn(
    todayKey,
    DEFAULT_SETTINGS,
    DEFAULT_WEEKLY_TEMPLATE
  );
  const plan = generateDailyPlan({
    dateKey: todayKey,
    checkIn,
    domains: DEFAULT_DOMAINS,
    logs: [],
    weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
    priorityPreset: DEFAULT_SETTINGS.priorityPreset,
  });

  return {
    settings: DEFAULT_SETTINGS,
    domains: DEFAULT_DOMAINS,
    weeklyTemplate: DEFAULT_WEEKLY_TEMPLATE,
    entrepreneurTasks: DEFAULT_ENTREPRENEUR_TASKS,
    daysByDate: {
      [todayKey]: {
        dateKey: todayKey,
        checkIn,
        blocks: plan.blocks,
        summaryNotes: plan.summaryNotes,
        updatedAt: new Date().toISOString(),
      },
    },
    sessionLogs: [],
    profileUpdatedAt: new Date().toISOString(),
  };
}

function loadFromStorage(): PersistedPayload {
  if (typeof window === 'undefined') {
    return createInitialPersistedState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialPersistedState();
    const parsed = JSON.parse(raw) as Partial<PersistedPayload>;
    if (!parsed || !parsed.domains || !parsed.settings) {
      return createInitialPersistedState();
    }
    return {
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        theme: normalizeTheme(parsed.settings.theme),
        supabaseConfig: {
          ...DEFAULT_SETTINGS.supabaseConfig,
          ...(parsed.settings.supabaseConfig || {}),
        },
      },
      domains: {
        ...DEFAULT_DOMAINS,
        ...parsed.domains,
      },
      weeklyTemplate:
        Array.isArray(parsed.weeklyTemplate) && parsed.weeklyTemplate.length === 7
          ? parsed.weeklyTemplate
          : DEFAULT_WEEKLY_TEMPLATE,
      entrepreneurTasks: Array.isArray(parsed.entrepreneurTasks)
        ? parsed.entrepreneurTasks
        : DEFAULT_ENTREPRENEUR_TASKS,
      daysByDate: parsed.daysByDate || {},
      sessionLogs: Array.isArray(parsed.sessionLogs) ? parsed.sessionLogs : [],
      profileUpdatedAt: parsed.profileUpdatedAt || new Date().toISOString(),
    };
  } catch {
    return createInitialPersistedState();
  }
}

function saveToStorage(state: PersistedPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: PersistedPayload = {
      settings: state.settings,
      domains: state.domains,
      weeklyTemplate: state.weeklyTemplate,
      entrepreneurTasks: state.entrepreneurTasks,
      daysByDate: state.daysByDate,
      sessionLogs: state.sessionLogs,
      profileUpdatedAt: state.profileUpdatedAt,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutoSync(triggerFn: () => Promise<void>): void {
  if (typeof window === 'undefined') return;
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    void triggerFn();
  }, 1500);
}

const initial = loadFromStorage();

export const usePlannerStore = create<PlannerStore>((set, get) => {
  const persistAndQueueSync = (
    updater: (state: PlannerStore) => Partial<PlannerStore>,
    bumpProfileTimestamp = false
  ) => {
    set((state) => {
      const patch = updater(state);
      const next: PlannerStore = {
        ...state,
        ...patch,
        profileUpdatedAt: bumpProfileTimestamp
          ? new Date().toISOString()
          : patch.profileUpdatedAt || state.profileUpdatedAt,
      };
      saveToStorage(next);
      return next;
    });

    const st = get();
    if (st.cloudUserEmail && isSupabaseConfigured(st.settings.supabaseConfig)) {
      scheduleAutoSync(st.triggerCloudSync);
    }
  };

  return {
    ...initial,
    selectedDateKey: getLocalDateKey(),
    syncStatus:
      typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'local',
    syncError: null,
    lastSyncedAt: null,
    cloudUserEmail: null,
    lastCompletedToast: null,

    clearCompletedToast: () => set({ lastCompletedToast: null }),

    ensureDayPlan: (dateKey) => {
      const state = get();
      const existing = state.daysByDate[dateKey];
      if (existing) return existing;

      const checkIn = createDefaultCheckIn(
        dateKey,
        state.settings,
        state.weeklyTemplate
      );
      const plan = generateDailyPlan({
        dateKey,
        checkIn,
        domains: state.domains,
        logs: state.sessionLogs,
        weeklyTemplate: state.weeklyTemplate,
        priorityPreset: state.settings.priorityPreset,
      });
      const record: DayRecord = {
        dateKey,
        checkIn,
        blocks: plan.blocks,
        summaryNotes: plan.summaryNotes,
        updatedAt: new Date().toISOString(),
      };
      persistAndQueueSync((s) => ({
        daysByDate: { ...s.daysByDate, [dateKey]: record },
      }));
      return record;
    },

    setSelectedDate: (dateKey) => {
      get().ensureDayPlan(dateKey);
      set({ selectedDateKey: dateKey });
    },

    updateCheckIn: (dateKey, patch, autoReoptimize = true) => {
      const day = get().ensureDayPlan(dateKey);
      const nextCheckIn: DailyCheckIn = { ...day.checkIn, ...patch };
      persistAndQueueSync((s) => {
        if (!autoReoptimize) {
          return {
            daysByDate: {
              ...s.daysByDate,
              [dateKey]: {
                ...day,
                checkIn: nextCheckIn,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }
        const plan = generateDailyPlan({
          dateKey,
          checkIn: nextCheckIn,
          domains: s.domains,
          logs: s.sessionLogs,
          weeklyTemplate: s.weeklyTemplate,
          priorityPreset: s.settings.priorityPreset,
          existingBlocks: day.blocks,
        });
        return {
          daysByDate: {
            ...s.daysByDate,
            [dateKey]: {
              dateKey,
              checkIn: nextCheckIn,
              blocks: plan.blocks,
              summaryNotes: plan.summaryNotes,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },

    optimizeDay: (dateKey, fromNow = false) => {
      const day = get().ensureDayPlan(dateKey);
      const nowMin =
        fromNow && dateKey === getLocalDateKey() ? getNowMinutes() : undefined;
      persistAndQueueSync((s) => {
        const plan = generateDailyPlan({
          dateKey,
          checkIn: day.checkIn,
          domains: s.domains,
          logs: s.sessionLogs,
          weeklyTemplate: s.weeklyTemplate,
          priorityPreset: s.settings.priorityPreset,
          existingBlocks: day.blocks,
          nowMin,
        });
        return {
          daysByDate: {
            ...s.daysByDate,
            [dateKey]: {
              dateKey,
              checkIn: day.checkIn,
              blocks: plan.blocks,
              summaryNotes: plan.summaryNotes,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },

    toggleLockBlock: (dateKey, blockId) => {
      const day = get().ensureDayPlan(dateKey);
      persistAndQueueSync((s) => ({
        daysByDate: {
          ...s.daysByDate,
          [dateKey]: {
            ...day,
            blocks: day.blocks.map((b) =>
              b.id === blockId ? { ...b, locked: !b.locked } : b
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },

    swapBlockTemplate: (dateKey, blockId, templateId) => {
      const state = get();
      const day = state.ensureDayPlan(dateKey);
      const block = day.blocks.find((b) => b.id === blockId);
      if (!block) return;

      const domain = state.domains[block.domainId];
      const templates = getTemplatesForDomain(block.domainId, domain.customDrills);
      const tpl = templates.find((t) => t.id === templateId);
      if (!tpl) return;

      const duration = block.endMin - block.startMin;
      persistAndQueueSync((s) => ({
        daysByDate: {
          ...s.daysByDate,
          [dateKey]: {
            ...day,
            blocks: day.blocks.map((b) =>
              b.id === blockId
                ? {
                    ...b,
                    templateId: tpl.id,
                    title: tpl.title,
                    track: tpl.track,
                    intensity: tpl.intensity,
                    fingerLoad: tpl.fingerLoad,
                    methodologyNote: tpl.methodologyNote,
                    phases: scalePhasesToMinutes(tpl.phases, duration),
                    subtitle: tpl.phases
                      .map((p) => `${p.minutes}m ${p.title.split(':')[0]}`)
                      .join(' → '),
                  }
                : b
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },

    adjustBlockDuration: (dateKey, blockId, deltaMinutes) => {
      const day = get().ensureDayPlan(dateKey);
      const sorted = [...day.blocks].sort((a, b) => a.startMin - b.startMin);
      const idx = sorted.findIndex((b) => b.id === blockId);
      if (idx === -1) return;

      const target = sorted[idx];
      const currentDur = target.endMin - target.startMin;
      const newDur = Math.max(5, Math.min(180, currentDur + deltaMinutes));
      const nextEnd = Math.min(day.checkIn.sleepMin, target.startMin + newDur);
      const nextBlock = sorted[idx + 1];
      const cappedEnd = nextBlock ? Math.min(nextEnd, nextBlock.startMin) : nextEnd;
      const finalDur = Math.max(5, cappedEnd - target.startMin);

      persistAndQueueSync((s) => ({
        daysByDate: {
          ...s.daysByDate,
          [dateKey]: {
            ...day,
            blocks: day.blocks.map((b) =>
              b.id === blockId
                ? {
                    ...b,
                    endMin: b.startMin + finalDur,
                    phases: scalePhasesToMinutes(b.phases, finalDur),
                  }
                : b
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },

    moveBlock: (dateKey, blockId, direction) => {
      const day = get().ensureDayPlan(dateKey);
      const sorted = [...day.blocks].sort((a, b) => a.startMin - b.startMin);
      const idx = sorted.findIndex((b) => b.id === blockId);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;

      const a = sorted[idx];
      const b = sorted[swapIdx];
      const first = idx < swapIdx ? a : b;
      const second = idx < swapIdx ? b : a;
      const firstDur = first.endMin - first.startMin;
      const secondDur = second.endMin - second.startMin;

      // Swap time positions cleanly keeping 10m gap
      const newSecondStart = first.startMin;
      const newSecondEnd = newSecondStart + secondDur;
      const newFirstStart = newSecondEnd + 10;
      const newFirstEnd = newFirstStart + firstDur;

      if (newFirstEnd > day.checkIn.sleepMin) return;

      const updated = sorted.map((blk) => {
        if (blk.id === second.id) {
          return { ...blk, startMin: newSecondStart, endMin: newSecondEnd, locked: true };
        }
        if (blk.id === first.id) {
          return { ...blk, startMin: newFirstStart, endMin: newFirstEnd, locked: true };
        }
        return blk;
      });

      persistAndQueueSync((s) => ({
        daysByDate: {
          ...s.daysByDate,
          [dateKey]: {
            ...day,
            blocks: updated.sort((x, y) => x.startMin - y.startMin),
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },

    addCommitment: (dateKey, commitment) => {
      const day = get().ensureDayPlan(dateKey);
      const newCommitment: FixedCommitment = {
        ...commitment,
        id: `comm-${Date.now()}`,
      };
      const nextCheckIn: DailyCheckIn = {
        ...day.checkIn,
        commitments: [...day.checkIn.commitments, newCommitment],
      };
      persistAndQueueSync((s) => {
        const plan = generateDailyPlan({
          dateKey,
          checkIn: nextCheckIn,
          domains: s.domains,
          logs: s.sessionLogs,
          weeklyTemplate: s.weeklyTemplate,
          priorityPreset: s.settings.priorityPreset,
          existingBlocks: day.blocks,
        });
        return {
          daysByDate: {
            ...s.daysByDate,
            [dateKey]: {
              dateKey,
              checkIn: nextCheckIn,
              blocks: plan.blocks,
              summaryNotes: plan.summaryNotes,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },

    removeCommitment: (dateKey, commitmentId) => {
      const day = get().ensureDayPlan(dateKey);
      const nextCheckIn: DailyCheckIn = {
        ...day.checkIn,
        commitments: day.checkIn.commitments.filter((c) => c.id !== commitmentId),
      };
      persistAndQueueSync((s) => {
        const plan = generateDailyPlan({
          dateKey,
          checkIn: nextCheckIn,
          domains: s.domains,
          logs: s.sessionLogs,
          weeklyTemplate: s.weeklyTemplate,
          priorityPreset: s.settings.priorityPreset,
          existingBlocks: day.blocks,
        });
        return {
          daysByDate: {
            ...s.daysByDate,
            [dateKey]: {
              dateKey,
              checkIn: nextCheckIn,
              blocks: plan.blocks,
              summaryNotes: plan.summaryNotes,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },

    completeSession: (dateKey, blockId, input) => {
      const day = get().ensureDayPlan(dateKey);
      const block = day.blocks.find((b) => b.id === blockId);
      if (!block) return;

      const nowIso = new Date().toISOString();
      const logId = block.sessionLogId || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newLog: SessionLog = {
        id: logId,
        dateKey,
        domainId: block.domainId,
        templateId: block.templateId,
        title: block.title,
        track: block.track,
        plannedMinutes: block.endMin - block.startMin,
        actualMinutes: Math.max(1, input.actualMinutes),
        quality: input.quality,
        challenge: input.challenge,
        fingerFatigue: input.fingerFatigue,
        fingerLoad: block.fingerLoad,
        metrics: input.metrics,
        takeaway: input.takeaway.trim(),
        nextFocus: input.nextFocus.trim(),
        completedAt: nowIso,
        updatedAt: nowIso,
      };

      const beforeStat = computeSingleDomainMasteryStat(
        get().domains[block.domainId],
        get().sessionLogs,
        dateKey
      );

      persistAndQueueSync((s) => {
        const filteredLogs = s.sessionLogs.filter((l) => l.id !== logId);
        const nextLogs = [newLog, ...filteredLogs];
        const afterStat = computeSingleDomainMasteryStat(
          s.domains[block.domainId],
          nextLogs,
          dateKey
        );
        const pointsGained = Math.max(1, afterStat.score - beforeStat.score || 2);
        const metricText = input.metrics?.bpm
          ? `${input.metrics.bpm} BPM`
          : input.metrics?.maxGrade
            ? `${input.metrics.maxGrade} · ${input.metrics.sends ?? 0} sends`
            : input.metrics?.minedCards
              ? `+${input.metrics.minedCards} cards`
              : input.metrics?.deliverable
                ? input.metrics.deliverable
                : undefined;

        return {
          sessionLogs: nextLogs,
          lastCompletedToast: {
            id: logId,
            domainId: block.domainId,
            title: block.title,
            minutes: newLog.actualMinutes,
            pointsGained,
            newRank: afterStat.rank,
            rankLabel: afterStat.rankLabel,
            nextRankProgress: afterStat.nextRankProgress,
            metricText,
          },
          daysByDate: {
            ...s.daysByDate,
            [dateKey]: {
              ...day,
              blocks: day.blocks.map((b) =>
                b.id === blockId
                  ? { ...b, status: 'completed', sessionLogId: logId }
                  : b
              ),
              updatedAt: nowIso,
            },
          },
        };
      });
    },

    skipBlock: (dateKey, blockId) => {
      const day = get().ensureDayPlan(dateKey);
      persistAndQueueSync((s) => ({
        daysByDate: {
          ...s.daysByDate,
          [dateKey]: {
            ...day,
            blocks: day.blocks.map((b) =>
              b.id === blockId ? { ...b, status: 'skipped' } : b
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },

    reopenBlock: (dateKey, blockId) => {
      const day = get().ensureDayPlan(dateKey);
      persistAndQueueSync((s) => ({
        daysByDate: {
          ...s.daysByDate,
          [dateKey]: {
            ...day,
            blocks: day.blocks.map((b) =>
              b.id === blockId ? { ...b, status: 'pending' } : b
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },

    updateDomainConfig: (domainId, patch) => {
      persistAndQueueSync(
        (s) => ({
          domains: {
            ...s.domains,
            [domainId]: {
              ...s.domains[domainId],
              ...patch,
            },
          },
        }),
        true
      );
    },

    toggleMilestone: (domainId, stageIndex, milestoneId) => {
      persistAndQueueSync((s) => {
        const domain = s.domains[domainId];
        const nextStages = domain.stages.map((st, idx) =>
          idx === stageIndex
            ? {
                ...st,
                milestones: st.milestones.map((m) =>
                  m.id === milestoneId ? { ...m, completed: !m.completed } : m
                ),
              }
            : st
        );
        return {
          domains: {
            ...s.domains,
            [domainId]: { ...domain, stages: nextStages },
          },
        };
      }, true);
    },

    advanceStage: (domainId, nextStageIndex) => {
      persistAndQueueSync((s) => {
        const domain = s.domains[domainId];
        const targetIdx =
          nextStageIndex !== undefined
            ? nextStageIndex
            : Math.min(domain.stages.length - 1, domain.currentStageIndex + 1);
        const stageMinutes = [8, 10, 12, 15, 20];
        const updatedMinutes =
          domainId === 'meditation'
            ? stageMinutes[targetIdx] ?? domain.defaultMinutes
            : domain.defaultMinutes;

        return {
          domains: {
            ...s.domains,
            [domainId]: {
              ...domain,
              currentStageIndex: targetIdx,
              defaultMinutes: updatedMinutes,
            },
          },
        };
      }, true);
    },

    addCustomDrill: (domainId, drill) => {
      const id = `custom-${domainId}-${Date.now()}`;
      persistAndQueueSync((s) => {
        const domain = s.domains[domainId];
        const nextDrill: SessionTemplate = {
          ...drill,
          id,
          domainId,
        };
        return {
          domains: {
            ...s.domains,
            [domainId]: {
              ...domain,
              customDrills: [...domain.customDrills, nextDrill],
            },
          },
        };
      }, true);
    },

    deleteCustomDrill: (domainId, drillId) => {
      persistAndQueueSync((s) => {
        const domain = s.domains[domainId];
        return {
          domains: {
            ...s.domains,
            [domainId]: {
              ...domain,
              customDrills: domain.customDrills.filter((d) => d.id !== drillId),
            },
          },
        };
      }, true);
    },

    updateWeeklyDay: (weekday, patch) => {
      persistAndQueueSync(
        (s) => ({
          weeklyTemplate: s.weeklyTemplate.map((w) =>
            w.weekday === weekday ? { ...w, ...patch } : w
          ),
        }),
        true
      );
    },

    addEntrepreneurTask: (task) => {
      const next: EntrepreneurTask = {
        ...task,
        id: `ent-${Date.now()}`,
        done: false,
        isDominoToday: get().entrepreneurTasks.every((t) => !t.isDominoToday),
        createdAt: new Date().toISOString(),
      };
      persistAndQueueSync(
        (s) => ({
          entrepreneurTasks: [next, ...s.entrepreneurTasks],
        }),
        true
      );
    },

    setDominoTask: (taskId) => {
      persistAndQueueSync(
        (s) => ({
          entrepreneurTasks: s.entrepreneurTasks.map((t) => ({
            ...t,
            isDominoToday: t.id === taskId,
          })),
        }),
        true
      );
    },

    toggleEntrepreneurTask: (taskId) => {
      persistAndQueueSync(
        (s) => ({
          entrepreneurTasks: s.entrepreneurTasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t
          ),
        }),
        true
      );
    },

    deleteEntrepreneurTask: (taskId) => {
      persistAndQueueSync(
        (s) => ({
          entrepreneurTasks: s.entrepreneurTasks.filter((t) => t.id !== taskId),
        }),
        true
      );
    },

    updateSettings: (patch) => {
      persistAndQueueSync(
        (s) => ({
          settings: {
            ...s.settings,
            ...patch,
            supabaseConfig: patch.supabaseConfig
              ? { ...s.settings.supabaseConfig, ...patch.supabaseConfig }
              : s.settings.supabaseConfig,
          },
        }),
        true
      );
    },

    applyProgressionSuggestion: (suggestion) => {
      if (
        suggestion.actionType === 'bump_meditation_minutes' &&
        suggestion.actionPayload
      ) {
        get().advanceStage('meditation', suggestion.actionPayload.nextStageIndex);
        get().optimizeDay(get().selectedDateKey, false);
      } else if (
        suggestion.actionType === 'advance_stage' &&
        suggestion.actionPayload
      ) {
        get().advanceStage(
          suggestion.domainId,
          suggestion.actionPayload.nextStageIndex
        );
        get().optimizeDay(get().selectedDateKey, false);
      }
    },

    setCloudUserEmail: (email) => {
      set({
        cloudUserEmail: email,
        syncStatus: email
          ? 'local'
          : typeof navigator !== 'undefined' && !navigator.onLine
            ? 'offline'
            : 'local',
      });
    },

    triggerCloudSync: async () => {
      const s = get();
      if (!isSupabaseConfigured(s.settings.supabaseConfig)) {
        set({ syncStatus: 'local', syncError: null });
        return;
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        set({ syncStatus: 'offline' });
        return;
      }
      set({ syncStatus: 'syncing', syncError: null });
      try {
        const local: SyncableState = {
          settings: s.settings,
          domains: s.domains,
          weeklyTemplate: s.weeklyTemplate,
          entrepreneurTasks: s.entrepreneurTasks,
          daysByDate: s.daysByDate,
          sessionLogs: s.sessionLogs,
          profileUpdatedAt: s.profileUpdatedAt,
        };
        const { merged, syncedAt, userEmail } = await syncStateWithCloud(local);
        saveToStorage(merged);
        set({
          ...merged,
          syncStatus: 'synced',
          syncError: null,
          lastSyncedAt: syncedAt,
          cloudUserEmail: userEmail,
        });
      } catch (err) {
        set({
          syncStatus: 'error',
          syncError: err instanceof Error ? err.message : 'Cloud sync failed',
        });
      }
    },

    exportBackupJson: () => {
      const s = get();
      const backup: PersistedPayload = {
        settings: s.settings,
        domains: s.domains,
        weeklyTemplate: s.weeklyTemplate,
        entrepreneurTasks: s.entrepreneurTasks,
        daysByDate: s.daysByDate,
        sessionLogs: s.sessionLogs,
        profileUpdatedAt: s.profileUpdatedAt,
      };
      return JSON.stringify(backup, null, 2);
    },

    importBackupJson: (raw) => {
      try {
        const parsed = JSON.parse(raw) as Partial<PersistedPayload>;
        if (!parsed.domains || !parsed.settings) {
          return { ok: false, error: 'Invalid backup JSON format.' };
        }
        const next: PersistedPayload = {
          settings: {
            ...DEFAULT_SETTINGS,
            ...parsed.settings,
            theme: normalizeTheme(parsed.settings.theme),
          },
          domains: { ...DEFAULT_DOMAINS, ...parsed.domains },
          weeklyTemplate: Array.isArray(parsed.weeklyTemplate)
            ? parsed.weeklyTemplate
            : DEFAULT_WEEKLY_TEMPLATE,
          entrepreneurTasks: Array.isArray(parsed.entrepreneurTasks)
            ? parsed.entrepreneurTasks
            : DEFAULT_ENTREPRENEUR_TASKS,
          daysByDate: parsed.daysByDate || {},
          sessionLogs: Array.isArray(parsed.sessionLogs) ? parsed.sessionLogs : [],
          profileUpdatedAt: new Date().toISOString(),
        };
        saveToStorage(next);
        set({ ...next });
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          error: e instanceof Error ? e.message : 'Failed to parse JSON.',
        };
      }
    },

    seedDemoHistory: () => {
      const todayKey = getLocalDateKey();
      const logs: SessionLog[] = [];
      let bpm = 82;
      for (let i = 14; i >= 1; i--) {
        const dk = addDays(todayKey, -i);
        const weekday = getWeekday(dk);
        const iso = `${dk}T18:00:00.000Z`;

        // Daily Meditation
        logs.push({
          id: `demo-med-${dk}`,
          dateKey: dk,
          domainId: 'meditation',
          templateId: 'med-anchor',
          title: 'Breath Anchor Baseline (8m)',
          track: 'mindfulness',
          plannedMinutes: 8,
          actualMinutes: 8,
          quality: i < 5 ? 5 : 4,
          challenge: 'optimal',
          fingerLoad: 0,
          takeaway: 'Breath anchor felt calmer after minute 3.',
          nextFocus: 'Notice jaw tension earlier.',
          completedAt: iso,
          updatedAt: iso,
        });

        // Daily Japanese
        logs.push({
          id: `demo-jp-${dk}`,
          dateKey: dk,
          domainId: 'japanese',
          templateId: i % 2 === 0 ? 'jp-reading-mining' : 'jp-audio-shadowing',
          title:
            i % 2 === 0
              ? 'Active Native Reading & i+1 Mining'
              : 'Raw Listening & Prosody Shadowing',
          track: i % 2 === 0 ? 'reading_mining' : 'audio_shadowing',
          plannedMinutes: 40,
          actualMinutes: 40,
          quality: 4,
          challenge: 'optimal',
          fingerLoad: 0,
          metrics: { minedCards: i % 2 === 0 ? 6 : 2, immersionMin: 40 },
          takeaway: 'Picked up natural connective particles.',
          nextFocus: 'Shadow episode 14 minute 3–5.',
          completedAt: iso,
          updatedAt: iso,
        });

        // Guitar 6d/wk
        if (weekday !== 0) {
          bpm += 1;
          logs.push({
            id: `demo-gui-${dk}`,
            dateKey: dk,
            domainId: 'guitar',
            templateId: i % 3 === 0 ? 'guitar-tech' : i % 3 === 1 ? 'guitar-fretboard' : 'guitar-ear',
            title:
              i % 3 === 0
                ? 'Technical Precision & Speed Pyramids'
                : 'Fretboard Fluency & Ear Training',
            track: i % 3 === 0 ? 'technical' : i % 3 === 1 ? 'fretboard' : 'ear_training',
            plannedMinutes: 45,
            actualMinutes: 45,
            quality: 4,
            challenge: 'optimal',
            fingerLoad: i % 3 === 0 ? 2 : 1,
            metrics: { bpm },
            takeaway: `Clean 16ths locked at ${bpm} BPM.`,
            nextFocus: `Start warmup at ${bpm - 6} BPM and push +2 clean reps.`,
            completedAt: iso,
            updatedAt: iso,
          });
        }

        // Drawing 5d/wk
        if (weekday !== 6) {
          logs.push({
            id: `demo-drw-${dk}`,
            dateKey: dk,
            domainId: 'drawing',
            templateId: 'drawing-stage-1',
            title: 'Line Confidence & Ghosting (Stage 1)',
            track: 'fundamentals',
            plannedMinutes: 45,
            actualMinutes: 45,
            quality: 4,
            challenge: i < 4 ? 'too_easy' : 'optimal',
            fingerLoad: 0,
            takeaway: 'Shoulder pivot much smoother on long horizontals.',
            nextFocus: 'Tighten diagonal endpoints on ghosted planes.',
            completedAt: iso,
            updatedAt: iso,
          });
        }

        // Bouldering Mon/Wed/Fri (skipping yesterday if today is also climbing? keep authentic)
        if (weekday === 1 || weekday === 3 || weekday === 5) {
          logs.push({
            id: `demo-bld-${dk}`,
            dateKey: dk,
            domainId: 'bouldering',
            templateId: weekday === 1 ? 'boulder-limit' : weekday === 3 ? 'boulder-volume' : 'boulder-capacity',
            title:
              weekday === 1
                ? 'Limit Projecting & Max Recruitment'
                : weekday === 3
                  ? 'Silent-Feet Volume & Movement Precision'
                  : 'Anti-Style Attack & Capacity',
            track: weekday === 1 ? 'limit' : weekday === 3 ? 'volume' : 'capacity',
            plannedMinutes: 90,
            actualMinutes: 85,
            quality: 4,
            challenge: 'optimal',
            fingerFatigue: weekday === 1 ? 3 : 2,
            fingerLoad: weekday === 1 ? 3 : 2,
            metrics: { maxGrade: weekday === 1 ? 'V5' : 'V4', sends: weekday === 3 ? 11 : 4 },
            takeaway: 'Strict 3m rests kept high quality on overhangs.',
            nextFocus: 'Keep hips square on sloper top-out.',
            completedAt: iso,
            updatedAt: iso,
          });
        }

        // Stretching daily
        logs.push({
          id: `demo-str-${dk}`,
          dateKey: dk,
          domainId: 'stretching',
          templateId: i % 2 === 0 ? 'stretch-hips' : 'stretch-forearms',
          title:
            i % 2 === 0
              ? 'Climber Hips, Hamstrings & Squat Mobility'
              : 'Guitar & Climber Forearms, Wrists & Thoracic',
          track: i % 2 === 0 ? 'hips_lower' : 'forearms_thoracic',
          plannedMinutes: 18,
          actualMinutes: 18,
          quality: 5,
          challenge: 'optimal',
          fingerLoad: 0,
          takeaway: '90/90 switches felt noticeably looser.',
          nextFocus: 'Keep posterior pelvic tilt in hip flexor stretch.',
          completedAt: iso,
          updatedAt: iso,
        });

        // Entrepreneurship 5d/wk
        if (weekday !== 0 && weekday !== 6) {
          logs.push({
            id: `demo-ent-${dk}`,
            dateKey: dk,
            domainId: 'entrepreneurship',
            templateId: 'ent-domino-build',
            title: 'Single-Domino Deep Work Sprint',
            track: 'deep_work',
            plannedMinutes: 75,
            actualMinutes: 75,
            quality: 4,
            challenge: 'optimal',
            fingerLoad: 0,
            metrics: { deliverable: `Shipped milestone #${15 - i}` },
            takeaway: 'Killing Slack/tabs for 60m doubled output.',
            nextFocus: 'Follow up with 2 warm leads tomorrow.',
            completedAt: iso,
            updatedAt: iso,
          });
        }
      }

      logs.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      persistAndQueueSync((s) => ({
        sessionLogs: logs,
        domains: s.domains,
      }));
      get().optimizeDay(get().selectedDateKey, false);
    },

    resetAllData: () => {
      const fresh = createInitialPersistedState();
      saveToStorage(fresh);
      set({
        ...fresh,
        selectedDateKey: getLocalDateKey(),
      });
    },
  };
});
