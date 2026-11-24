import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export const APK_URL = 'https://github.com/amine-hmmch/dara/releases/latest/download/dara.apk';
export const RELEASES_URL = 'https://github.com/amine-hmmch/dara/releases/latest';

export const APP_BUILD: number = __APP_BUILD__;
export const APK_BUILD_LABEL = APP_BUILD > 0 ? `1.0.${APP_BUILD}` : 'تطوير';

// `__daraTestNative` lets the browser tests exercise the in-app update banner.
export const isNativeApp = () =>
  Capacitor.isNativePlatform() || (window as unknown as { __daraTestNative?: boolean }).__daraTestNative === true;

const framed = () => {
  try { return window.self !== window.top; } catch { return true; }
};

/** Offline cache for the installed website (not inside the Android app or a framed preview). */
export function registerServiceWorker() {
  if (isNativeApp() || framed() || !('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline mode unavailable; site still works */ });
  });
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach((l) => l());
  });
  addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

/** Browser "install this site" prompt, when the browser offers one (Chrome on Android, desktop). */
export function useInstallPrompt() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return deferred
    ? async () => {
        const ev = deferred!;
        await ev.prompt();
        await ev.userChoice;
        deferred = null;
        listeners.forEach((l) => l());
      }
    : null;
}

// ───────────────────────────── update check (Android app)

const LATEST_API = 'https://api.github.com/repos/amine-hmmch/dara/releases/latest';
const CHECK_KEY = 'dara.update.lastCheck';
const DISMISS_KEY = 'dara.update.dismissed';
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

/** "app-v1.0.17" → 17; anything else → null. */
export function buildFromTag(tag: unknown): number | null {
  if (typeof tag !== 'string') return null;
  const m = /^app-v\d+\.\d+\.(\d+)$/.exec(tag.trim());
  return m ? Number(m[1]) : null;
}

export function isNewer(latest: number | null, current: number): boolean {
  return latest !== null && current > 0 && latest > current;
}

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

/** Returns the newer build number if one is published, else null. Never throws. */
export async function checkForUpdate(now = Date.now(), force = false): Promise<number | null> {
  if (!isNativeApp()) return null;
  const last = Number(store.get(CHECK_KEY) ?? 0);
  const cached = Number(store.get(CHECK_KEY + '.result') ?? 0);
  if (!force && now - last < CHECK_EVERY_MS) return isNewer(cached || null, APP_BUILD) ? cached : null;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(LATEST_API, { headers: { Accept: 'application/vnd.github+json' }, signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const latest = buildFromTag((await res.json())?.tag_name);
    store.set(CHECK_KEY, String(now));
    store.set(CHECK_KEY + '.result', String(latest ?? 0));
    return isNewer(latest, APP_BUILD) ? latest : null;
  } catch {
    return null; // offline or GitHub unreachable: try again next launch
  }
}

export function useUpdateAvailable(): [number | null, () => void] {
  const [latest, setLatest] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    checkForUpdate().then((n) => {
      if (alive && n !== null && store.get(DISMISS_KEY) !== String(n)) setLatest(n);
    });
    return () => { alive = false; };
  }, []);
  const dismiss = () => {
    if (latest !== null) store.set(DISMISS_KEY, String(latest));
    setLatest(null);
  };
  return [latest, dismiss];
}
