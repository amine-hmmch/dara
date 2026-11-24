import type { Level, Module } from '../types';
import { type Card, dayKey, newCard, review } from './srs';

export const PASS_MARK = 0.8;
export const SAFETY_PASS_MARK = 1;

export type LessonProgress = {
  done: boolean;
  /** Share of questions answered right on the first try, 0..1. */
  score: number;
  at?: number;
};

export type State = {
  v: 1;
  updatedAt: number;
  profile: {
    name: string;
    dailyMinutes: number;
    darija: boolean;
    onboarded: boolean;
    startedAt: number;
  };
  lessons: Record<string, LessonProgress>;
  checks: Record<string, { best: number; passedAt?: number }>;
  cards: Record<string, Card>;
  days: string[];
  xp: number;
};

export function emptyState(now: number): State {
  return {
    v: 1,
    updatedAt: now,
    profile: { name: '', dailyMinutes: 20, darija: true, onboarded: false, startedAt: now },
    lessons: {},
    checks: {},
    cards: {},
    days: [],
    xp: 0,
  };
}

/** Accept only well-formed saved data; anything else falls back to defaults. */
export function sanitize(raw: unknown, now: number): State | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<State>;
  if (s.v !== 1) return null;
  const base = emptyState(now);
  return {
    v: 1,
    updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : 0,
    profile: { ...base.profile, ...(s.profile ?? {}) },
    lessons: isObj(s.lessons) ? s.lessons : {},
    checks: isObj(s.checks) ? s.checks : {},
    cards: isObj(s.cards) ? s.cards : {},
    days: Array.isArray(s.days) ? s.days.filter((d) => typeof d === 'string') : [],
    xp: typeof s.xp === 'number' ? s.xp : 0,
  };
}

const isObj = (x: unknown): x is Record<string, never> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

// ---------- unlock rules ----------

export function passMark(m: Module) {
  return m.safety ? SAFETY_PASS_MARK : PASS_MARK;
}

export function modulePassed(s: State, m: Module): boolean {
  if (m.status !== 'ready') return false;
  const c = s.checks[m.id];
  return !!c && c.best >= passMark(m) - 1e-9;
}

export function levelComplete(s: State, l: Level): boolean {
  return l.modules.length > 0 && l.modules.every((m) => modulePassed(s, m));
}

export function levelUnlocked(s: State, levels: Level[], n: number): boolean {
  if (n === 0) return true;
  const prev = levels.find((l) => l.n === n - 1);
  return !!prev && levelComplete(s, prev);
}

export function moduleUnlocked(s: State, levels: Level[], m: Module): boolean {
  const level = levels.find((l) => l.modules.includes(m));
  if (!level || m.status !== 'ready') return false;
  if (!levelUnlocked(s, levels, level.n)) return false;
  const i = level.modules.indexOf(m);
  return i === 0 || modulePassed(s, level.modules[i - 1]);
}

export function lessonUnlocked(s: State, levels: Level[], m: Module, lessonId: string): boolean {
  if (!moduleUnlocked(s, levels, m)) return false;
  const i = m.lessons.findIndex((l) => l.id === lessonId);
  if (i < 0) return false;
  return i === 0 || !!s.lessons[m.lessons[i - 1].id]?.done;
}

export function checkUnlocked(s: State, levels: Level[], m: Module): boolean {
  return moduleUnlocked(s, levels, m) && m.lessons.every((l) => s.lessons[l.id]?.done);
}

export type NextAction =
  | { type: 'lesson'; moduleId: string; lessonId: string }
  | { type: 'check'; moduleId: string }
  | { type: 'waiting' }; // everything ready is mastered; the next level is in preparation

export function nextAction(s: State, levels: Level[]): NextAction {
  for (const l of levels) {
    for (const m of l.modules) {
      if (m.status !== 'ready') return { type: 'waiting' };
      if (modulePassed(s, m)) continue;
      const lesson = m.lessons.find((x) => !s.lessons[x.id]?.done);
      if (lesson) return { type: 'lesson', moduleId: m.id, lessonId: lesson.id };
      return { type: 'check', moduleId: m.id };
    }
  }
  return { type: 'waiting' };
}

// ---------- state transitions (pure) ----------

function touch(s: State, now: number, xp = 0): State {
  const today = dayKey(now);
  const days = s.days.includes(today) ? s.days : [...s.days, today].slice(-400);
  return { ...s, updatedAt: now, days, xp: s.xp + xp };
}

export function completeLesson(
  s: State,
  lessonId: string,
  score: number,
  missedQuestionIds: string[],
  termIds: string[],
  now: number,
): State {
  const prev = s.lessons[lessonId];
  const cards = { ...s.cards };
  for (const q of missedQuestionIds) cards['q:' + q] = newCard(now);
  for (const t of termIds) if (!cards['t:' + t]) cards['t:' + t] = newCard(now);
  const best = Math.max(prev?.score ?? 0, score);
  const xp = prev?.done ? 5 : 20 + Math.round(score * 20);
  return touch(
    { ...s, cards, lessons: { ...s.lessons, [lessonId]: { done: true, score: best, at: now } } },
    now,
    xp,
  );
}

export function recordCheck(s: State, m: Module, score: number, missed: string[], now: number): State {
  const prev = s.checks[m.id];
  const best = Math.max(prev?.best ?? 0, score);
  const passed = best >= passMark(m) - 1e-9;
  const cards = { ...s.cards };
  for (const q of missed) cards['q:' + q] = newCard(now);
  return touch(
    {
      ...s,
      cards,
      checks: {
        ...s.checks,
        [m.id]: { best, passedAt: passed ? (prev?.passedAt ?? now) : undefined },
      },
    },
    now,
    passed && !prev?.passedAt ? 50 : 5,
  );
}

export function reviewCard(s: State, cardId: string, correct: boolean, now: number): State {
  const card = s.cards[cardId];
  if (!card) return s;
  return touch({ ...s, cards: { ...s.cards, [cardId]: review(card, correct, now) } }, now, correct ? 3 : 1);
}

export function dueCards(s: State, now: number): string[] {
  return Object.entries(s.cards)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}
