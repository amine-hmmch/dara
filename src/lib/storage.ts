// Progress storage with three layers, best first:
//  1. cloud  — the artifact's private per-person store (data/users/<id>/progress),
//              when the page runs as a Claude artifact and the viewer is signed in;
//  2. local  — this browser's localStorage, as a fast cache and offline fallback;
//  3. memory — if both are unavailable, nothing persists (the UI says so).
// The newer copy (by updatedAt) wins when both exist.

import { type State, sanitize } from './progress';

const KEY = 'dara.progress.v1';

export type StoreKind = 'cloud' | 'local' | 'memory';

type DocRef = {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(data: Record<string, unknown>): Promise<void>;
};

type ClaudeRuntime = { use(name: string): Promise<unknown> };

export function readLocal(now: number): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw), now) : null;
  } catch {
    return null;
  }
}

export function localAvailable(): boolean {
  try {
    const k = '__dara_probe';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function writeLocal(s: State): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

async function waitForRuntime(ms: number): Promise<ClaudeRuntime | null> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const c = (window as unknown as { claude?: ClaudeRuntime }).claude;
    if (c && typeof c.use === 'function') return c;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

/** Resolve the viewer's private cloud document, or null if not available. */
export async function connectCloud(): Promise<DocRef | null> {
  try {
    // On a normal website (e.g. GitHub Pages) there is no Claude runtime and the
    // page is not framed: skip the wait and use browser storage straight away.
    const framed = (() => { try { return window.self !== window.top; } catch { return true; } })();
    const present = !!(window as unknown as { claude?: ClaudeRuntime }).claude;
    if (!framed && !present) return null;
    const rt = await waitForRuntime(2500);
    if (!rt) return null;
    const [db, user] = (await Promise.all([rt.use('db'), rt.use('user')])) as [
      { doc(path: string): DocRef } | null,
      { id(): Promise<string | null> } | null,
    ];
    if (!db || !user) return null;
    const id = await user.id();
    if (!id) return null;
    return db.doc(`data/users/${id}/progress`);
  } catch {
    return null;
  }
}

export async function readCloud(ref: DocRef, now: number): Promise<State | null> {
  const snap = await withTimeout(ref.get(), 10_000);
  if (!snap.exists) return null;
  const body = snap.data();
  if (!body || typeof body.json !== 'string') return null;
  try {
    return sanitize(JSON.parse(body.json), now);
  } catch {
    return null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Saves the latest state: localStorage immediately, the cloud one write at a
 * time and only when something changed, coalescing bursts into one write. */
export class Saver {
  private ref: DocRef | null = null;
  private pending: State | null = null;
  private lastJson = '';
  private writing = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  onStatus: (s: 'saved' | 'saving' | 'error') => void = () => {};

  attach(ref: DocRef | null) {
    this.ref = ref;
  }

  save(s: State) {
    writeLocal(s);
    if (!this.ref) return;
    this.pending = s;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 1200);
  }

  private async flush() {
    if (this.writing || !this.ref || !this.pending) return;
    const json = JSON.stringify(this.pending);
    this.pending = null;
    if (json === this.lastJson) return;
    this.writing = true;
    this.onStatus('saving');
    try {
      await this.ref.set({ json, updatedAt: Date.now() });
      this.lastJson = json;
      this.onStatus('saved');
    } catch {
      this.onStatus('error');
    } finally {
      this.writing = false;
      if (this.pending) void this.flush();
    }
  }
}

export function newer(a: State | null, b: State | null): State | null {
  if (!a) return b;
  if (!b) return a;
  return a.updatedAt >= b.updatedAt ? a : b;
}
