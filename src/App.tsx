import { useEffect, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { CommandPalette } from './components/CommandPalette';
import { DomainsView } from './components/DomainsView';
import { Layout, type NavTab } from './components/Layout';
import { PairPhoneModal } from './components/PairPhoneModal';
import { RankUpToast } from './components/RankUpToast';
import { SessionRunner } from './components/SessionRunner';
import { SettingsView } from './components/SettingsView';
import { TodayView } from './components/TodayView';
import { normalizeTheme } from './engine/masteryStats';
import { usePlannerStore } from './store/usePlannerStore';
import {
  getCurrentUserEmail,
  subscribeToAuthChanges,
} from './sync/supabaseSync';
import type { ScheduledBlock } from './types/planner';
import { addDays, getLocalDateKey } from './utils/date';
import { parsePairingHash } from './utils/pairing';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const THEME_META_COLOR: Record<'noir' | 'reload' | 'washi', string> = {
  noir: '#0A0B0F',
  reload: '#080D18',
  washi: '#F4EFE4',
};

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const [pairedBanner, setPairedBanner] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{
    block: ScheduledBlock;
    dateKey: string;
  } | null>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const theme = usePlannerStore((s) => s.settings.theme);
  const supabaseConfig = usePlannerStore((s) => s.settings.supabaseConfig);
  const selectedDateKey = usePlannerStore((s) => s.selectedDateKey);
  const daysByDate = usePlannerStore((s) => s.daysByDate);
  const ensureDayPlan = usePlannerStore((s) => s.ensureDayPlan);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);
  const updateSettings = usePlannerStore((s) => s.updateSettings);
  const setCloudUserEmail = usePlannerStore((s) => s.setCloudUserEmail);
  const triggerCloudSync = usePlannerStore((s) => s.triggerCloudSync);

  // Ensure today's optimized plan exists on launch & parse 1-scan phone pairing URL hash
  useEffect(() => {
    ensureDayPlan(getLocalDateKey());

    const applyPairingHash = () => {
      const pairedConfig = parsePairingHash(window.location.hash);
      if (pairedConfig) {
        updateSettings({ supabaseConfig: pairedConfig });
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
        setActiveTab('settings');
        setPairedBanner(
          'Cloud Sync paired from QR/Link! Sign in below with your email & password to sync your devices.'
        );
      }
    };

    applyPairingHash();
    window.addEventListener('hashchange', applyPairingHash);
    return () => window.removeEventListener('hashchange', applyPairingHash);
  }, [ensureDayPlan, updateSettings]);

  // Apply theme class (theme-noir / theme-reload / theme-washi) to <html>
  useEffect(() => {
    const root = document.documentElement;
    const normalized = normalizeTheme(theme);
    root.classList.remove('theme-noir', 'theme-reload', 'theme-washi', 'dark', 'light');
    root.classList.add(`theme-${normalized}`);
    if (normalized !== 'washi') {
      root.classList.add('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', THEME_META_COLOR[normalized]);
    }
  }, [theme]);

  // Global keyboard shortcuts: Ctrl/Cmd+K, 1-4 views, [ / ] days, T today
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }

      if (
        paletteOpen ||
        pairOpen ||
        activeSession ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName || ''
        )
      ) {
        return;
      }

      if (e.key === '1') setActiveTab('today');
      else if (e.key === '2') setActiveTab('domains');
      else if (e.key === '3') setActiveTab('insights');
      else if (e.key === '4') setActiveTab('settings');
      else if (e.key === '[') {
        setSelectedDate(addDays(selectedDateKey, -1));
      } else if (e.key === ']') {
        setSelectedDate(addDays(selectedDateKey, 1));
      } else if (e.key.toLowerCase() === 't') {
        setSelectedDate(getLocalDateKey());
        setActiveTab('today');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen, pairOpen, activeSession, selectedDateKey, setSelectedDate]);

  // Capture PWA beforeinstallprompt
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  // Initialize Supabase session check, auth state listener + online/visibility auto-sync
  useEffect(() => {
    let active = true;
    void (async () => {
      const email = await getCurrentUserEmail(supabaseConfig);
      if (!active) return;
      setCloudUserEmail(email);
      if (email) {
        await triggerCloudSync();
      }
    })();

    const unsubscribeAuth = subscribeToAuthChanges(supabaseConfig, (email) => {
      if (!active) return;
      setCloudUserEmail(email);
      if (email) {
        if (
          window.location.hash.includes('access_token=') ||
          window.location.hash.includes('refresh_token=')
        ) {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          );
        }
        void triggerCloudSync();
      }
    });

    const onOnlineOrFocus = () => {
      if (document.visibilityState === 'visible') {
        ensureDayPlan(getLocalDateKey());
        if (usePlannerStore.getState().cloudUserEmail) {
          void triggerCloudSync();
        }
      }
    };

    window.addEventListener('online', onOnlineOrFocus);
    document.addEventListener('visibilitychange', onOnlineOrFocus);
    return () => {
      active = false;
      unsubscribeAuth();
      window.removeEventListener('online', onOnlineOrFocus);
      document.removeEventListener('visibilitychange', onOnlineOrFocus);
    };
  }, [supabaseConfig, setCloudUserEmail, triggerCloudSync, ensureDayPlan]);

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const res = await installPrompt.userChoice;
    if (res.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const activeDay = daysByDate[selectedDateKey];
  const nextPendingBlock =
    activeDay?.blocks.find((b) => b.status === 'pending') || null;

  const handleStartSession = (block: ScheduledBlock) => {
    setActiveSession({ block, dateKey: selectedDateKey });
  };

  const handleStartNextSession = () => {
    if (nextPendingBlock) {
      setActiveSession({ block: nextPendingBlock, dateKey: selectedDateKey });
    } else {
      setActiveTab('today');
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenPairPhone={() => setPairOpen(true)}
        onStartNextSession={handleStartNextSession}
        hasNextPendingSession={Boolean(nextPendingBlock)}
        canInstallPwa={Boolean(installPrompt)}
        onInstallPwa={() => void handleInstallPwa()}
      >
        {activeTab === 'today' && (
          <TodayView onStartSession={handleStartSession} />
        )}
        {activeTab === 'domains' && <DomainsView />}
        {activeTab === 'insights' && <AnalyticsView />}
        {activeTab === 'settings' && (
          <SettingsView
            canInstallPwa={Boolean(installPrompt)}
            onInstallPwa={() => void handleInstallPwa()}
            onOpenPairPhone={() => setPairOpen(true)}
            pairedBanner={pairedBanner}
            onDismissPairedBanner={() => setPairedBanner(null)}
          />
        )}
      </Layout>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActiveTab}
        onStartBlock={handleStartSession}
        onOpenPairPhone={() => setPairOpen(true)}
      />

      <PairPhoneModal open={pairOpen} onClose={() => setPairOpen(false)} />

      {activeSession && (
        <SessionRunner
          block={activeSession.block}
          dateKey={activeSession.dateKey}
          onClose={() => setActiveSession(null)}
        />
      )}

      <RankUpToast />
    </>
  );
}

export default App;
