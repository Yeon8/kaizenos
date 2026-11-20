import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  AppSettings,
  DayRecord,
  DomainConfig,
  DomainId,
  EntrepreneurTask,
  SessionLog,
  SupabaseConfig,
  WeeklyDayTemplate,
} from '../types/planner';
import { getAppBaseUrl } from '../utils/pairing';

export interface SyncableState {
  settings: AppSettings;
  domains: Record<DomainId, DomainConfig>;
  weeklyTemplate: WeeklyDayTemplate[];
  entrepreneurTasks: EntrepreneurTask[];
  daysByDate: Record<string, DayRecord>;
  sessionLogs: SessionLog[];
  profileUpdatedAt: string;
}

const clientCache = new Map<string, SupabaseClient>();

export function resolveSupabaseConfig(localConfig?: SupabaseConfig): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return {
    url: (localConfig?.url || envUrl || '').trim(),
    anonKey: (localConfig?.anonKey || envKey || '').trim(),
  };
}

export function isSupabaseConfigured(localConfig?: SupabaseConfig): boolean {
  const resolved = resolveSupabaseConfig(localConfig);
  return Boolean(resolved.url && resolved.anonKey);
}

export function getSupabaseClient(localConfig?: SupabaseConfig): SupabaseClient | null {
  const resolved = resolveSupabaseConfig(localConfig);
  if (!resolved.url || !resolved.anonKey) return null;

  const cacheKey = `${resolved.url}|${resolved.anonKey}`;
  const existing = clientCache.get(cacheKey);
  if (existing) return existing;

  const client = createClient(resolved.url, resolved.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  clientCache.set(cacheKey, client);
  return client;
}

export async function getCurrentUserEmail(
  localConfig?: SupabaseConfig
): Promise<string | null> {
  const client = getSupabaseClient(localConfig);
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.email ?? null;
}

export async function signInWithPassword(
  localConfig: SupabaseConfig,
  email: string,
  password: string
): Promise<{ email: string | null; error?: string }> {
  const client = getSupabaseClient(localConfig);
  if (!client) return { email: null, error: 'Supabase URL and Anon Key are required.' };

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { email: null, error: error.message };
  return { email: data.user?.email ?? null };
}

export async function signUpWithPassword(
  localConfig: SupabaseConfig,
  email: string,
  password: string
): Promise<{ email: string | null; needsConfirmation?: boolean; error?: string }> {
  const client = getSupabaseClient(localConfig);
  if (!client) return { email: null, error: 'Supabase URL and Anon Key are required.' };

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getAppBaseUrl() },
  });
  if (error) return { email: null, error: error.message };
  return {
    email: data.user?.email ?? null,
    needsConfirmation: !data.session,
  };
}

export async function signInWithMagicLink(
  localConfig: SupabaseConfig,
  email: string
): Promise<{ error?: string }> {
  const client = getSupabaseClient(localConfig);
  if (!client) return { error: 'Supabase URL and Anon Key are required.' };

  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: getAppBaseUrl() },
  });
  return error ? { error: error.message } : {};
}

export function subscribeToAuthChanges(
  localConfig: SupabaseConfig,
  onEmailChange: (email: string | null) => void
): () => void {
  const client = getSupabaseClient(localConfig);
  if (!client) return () => {};
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    onEmailChange(session?.user?.email ?? null);
  });
  return () => subscription.unsubscribe();
}

export async function signOutFromCloud(localConfig?: SupabaseConfig): Promise<void> {
  const client = getSupabaseClient(localConfig);
  if (!client) return;
  await client.auth.signOut();
}

export async function syncStateWithCloud(
  local: SyncableState
): Promise<{
  merged: SyncableState;
  syncedAt: string;
  userEmail: string;
}> {
  const client = getSupabaseClient(local.settings.supabaseConfig);
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { data: userRes, error: userErr } = await client.auth.getUser();
  if (userErr || !userRes.user) {
    throw new Error('Sign in required to sync with cloud.');
  }
  const user = userRes.user;

  // 1. Fetch remote records in parallel
  const [profileRes, daysRes, sessionsRes] = await Promise.all([
    client
      .from('planner_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    client.from('planner_days').select('*').eq('user_id', user.id),
    client.from('planner_sessions').select('*').eq('user_id', user.id),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (daysRes.error) throw daysRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  const merged: SyncableState = {
    settings: { ...local.settings },
    domains: { ...local.domains },
    weeklyTemplate: [...local.weeklyTemplate],
    entrepreneurTasks: [...local.entrepreneurTasks],
    daysByDate: { ...local.daysByDate },
    sessionLogs: [...local.sessionLogs],
    profileUpdatedAt: local.profileUpdatedAt,
  };

  // 2. Profile merge (last-writer-wins on profileUpdatedAt, preserving local supabaseConfig)
  const remoteProfile = profileRes.data;
  if (
    remoteProfile &&
    remoteProfile.updated_at &&
    new Date(remoteProfile.updated_at).getTime() >
      new Date(local.profileUpdatedAt || 0).getTime()
  ) {
    const remoteSettings = (remoteProfile.settings || {}) as Partial<AppSettings>;
    merged.settings = {
      ...local.settings,
      ...remoteSettings,
      supabaseConfig: local.settings.supabaseConfig,
    };
    if (remoteProfile.domains && Object.keys(remoteProfile.domains).length > 0) {
      merged.domains = remoteProfile.domains as Record<DomainId, DomainConfig>;
    }
    if (Array.isArray(remoteProfile.weekly_template) && remoteProfile.weekly_template.length === 7) {
      merged.weeklyTemplate = remoteProfile.weekly_template as WeeklyDayTemplate[];
    }
    if (Array.isArray(remoteProfile.entrepreneur_tasks)) {
      merged.entrepreneurTasks = remoteProfile.entrepreneur_tasks as EntrepreneurTask[];
    }
    merged.profileUpdatedAt = remoteProfile.updated_at;
  } else {
    const safeSettings = {
      theme: local.settings.theme,
      defaultWakeMin: local.settings.defaultWakeMin,
      defaultSleepMin: local.settings.defaultSleepMin,
      priorityPreset: local.settings.priorityPreset,
    };
    const { error: upsertProfErr } = await client.from('planner_profiles').upsert({
      user_id: user.id,
      settings: safeSettings,
      domains: local.domains,
      weekly_template: local.weeklyTemplate,
      entrepreneur_tasks: local.entrepreneurTasks,
      updated_at: local.profileUpdatedAt || new Date().toISOString(),
    });
    if (upsertProfErr) throw upsertProfErr;
  }

  // 3. Per-day merge (never clobbers other days edited on another device)
  const remoteDaysMap = new Map<string, Record<string, unknown>>();
  for (const row of daysRes.data || []) {
    remoteDaysMap.set(row.date_key, row);
  }

  const daysToUpsert: Array<Record<string, unknown>> = [];
  const allDateKeys = new Set([
    ...Object.keys(local.daysByDate),
    ...remoteDaysMap.keys(),
  ]);

  for (const dk of allDateKeys) {
    const localDay = local.daysByDate[dk];
    const remoteDay = remoteDaysMap.get(dk);

    if (localDay && !remoteDay) {
      daysToUpsert.push({
        user_id: user.id,
        date_key: dk,
        checkin: localDay.checkIn,
        blocks: localDay.blocks,
        summary_notes: localDay.summaryNotes,
        updated_at: localDay.updatedAt,
      });
    } else if (!localDay && remoteDay) {
      merged.daysByDate[dk] = {
        dateKey: dk,
        checkIn: remoteDay.checkin as DayRecord['checkIn'],
        blocks: (remoteDay.blocks || []) as DayRecord['blocks'],
        summaryNotes: (remoteDay.summary_notes || []) as string[],
        updatedAt: String(remoteDay.updated_at),
      };
    } else if (localDay && remoteDay) {
      const localTs = new Date(localDay.updatedAt || 0).getTime();
      const remoteTs = new Date(String(remoteDay.updated_at || 0)).getTime();
      if (remoteTs > localTs) {
        merged.daysByDate[dk] = {
          dateKey: dk,
          checkIn: remoteDay.checkin as DayRecord['checkIn'],
          blocks: (remoteDay.blocks || []) as DayRecord['blocks'],
          summaryNotes: (remoteDay.summary_notes || []) as string[],
          updatedAt: String(remoteDay.updated_at),
        };
      } else if (localTs > remoteTs) {
        daysToUpsert.push({
          user_id: user.id,
          date_key: dk,
          checkin: localDay.checkIn,
          blocks: localDay.blocks,
          summary_notes: localDay.summaryNotes,
          updated_at: localDay.updatedAt,
        });
      }
    }
  }

  if (daysToUpsert.length > 0) {
    const { error: dayUpsertErr } = await client
      .from('planner_days')
      .upsert(daysToUpsert);
    if (dayUpsertErr) throw dayUpsertErr;
  }

  // 4. Per-session log merge
  const localSessionsMap = new Map<string, SessionLog>();
  for (const s of local.sessionLogs) {
    localSessionsMap.set(s.id, s);
  }
  const remoteSessionsMap = new Map<string, SessionLog>();
  for (const row of sessionsRes.data || []) {
    const payload = row.payload as SessionLog;
    if (payload && payload.id) {
      remoteSessionsMap.set(payload.id, payload);
    }
  }

  const allSessionIds = new Set([
    ...localSessionsMap.keys(),
    ...remoteSessionsMap.keys(),
  ]);
  const mergedSessions: SessionLog[] = [];
  const sessionsToUpsert: Array<Record<string, unknown>> = [];

  for (const id of allSessionIds) {
    const l = localSessionsMap.get(id);
    const r = remoteSessionsMap.get(id);
    if (l && !r) {
      mergedSessions.push(l);
      sessionsToUpsert.push({
        user_id: user.id,
        id: l.id,
        date_key: l.dateKey,
        domain_id: l.domainId,
        payload: l,
        completed_at: l.completedAt,
        updated_at: l.updatedAt,
      });
    } else if (!l && r) {
      mergedSessions.push(r);
    } else if (l && r) {
      const lTs = new Date(l.updatedAt || l.completedAt || 0).getTime();
      const rTs = new Date(r.updatedAt || r.completedAt || 0).getTime();
      if (rTs > lTs) {
        mergedSessions.push(r);
      } else {
        mergedSessions.push(l);
        if (lTs > rTs) {
          sessionsToUpsert.push({
            user_id: user.id,
            id: l.id,
            date_key: l.dateKey,
            domain_id: l.domainId,
            payload: l,
            completed_at: l.completedAt,
            updated_at: l.updatedAt,
          });
        }
      }
    }
  }

  if (sessionsToUpsert.length > 0) {
    const { error: sessUpsertErr } = await client
      .from('planner_sessions')
      .upsert(sessionsToUpsert);
    if (sessUpsertErr) throw sessUpsertErr;
  }

  mergedSessions.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  merged.sessionLogs = mergedSessions;

  return {
    merged,
    syncedAt: new Date().toISOString(),
    userEmail: user.email || 'Signed in',
  };
}
