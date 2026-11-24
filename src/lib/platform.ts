import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export const APK_URL = 'https://github.com/amine-hmmch/dara/releases/latest/download/dara.apk';
export const RELEASES_URL = 'https://github.com/amine-hmmch/dara/releases/latest';

export const isNativeApp = () => Capacitor.isNativePlatform();

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
