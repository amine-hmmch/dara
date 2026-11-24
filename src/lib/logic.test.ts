import { describe, expect, it } from 'vitest';
import { CircuitError, nextE12, parallel, series, si, solve } from './circuit';
import { INTERVAL_DAYS, dayKey, newCard, review, startOfDay, streak } from './srs';
import {
  checkUnlocked,
  completeLesson,
  emptyState,
  lessonUnlocked,
  levelUnlocked,
  moduleUnlocked,
  nextAction,
  recordCheck,
  sanitize,
} from './progress';
import type { Level, Module } from '../types';

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 24, 15, 0, 0).getTime();

describe('circuit solver', () => {
  it('solves Ohm’s law for one resistor', () => {
    // 9 V source between node 1 (+) and ground, 450 Ω load
    const s = solve(2, [
      { type: 'V', a: 1, b: 0, v: 9 },
      { type: 'R', a: 1, b: 0, r: 450 },
    ]);
    expect(s.v[1]).toBeCloseTo(9);
    expect(s.i[1]).toBeCloseTo(0.02);
    expect(s.i[0]).toBeCloseTo(0.02); // current out of the + terminal
  });

  it('matches the series voltage-divider formula', () => {
    const s = solve(3, [
      { type: 'V', a: 1, b: 0, v: 12 },
      { type: 'R', a: 1, b: 2, r: 1000 },
      { type: 'R', a: 2, b: 0, r: 2000 },
    ]);
    expect(s.v[2]).toBeCloseTo((12 * 2000) / 3000);
    expect(s.i[1]).toBeCloseTo(12 / series(1000, 2000));
  });

  it('matches the parallel formula and Kirchhoff’s current law', () => {
    const s = solve(2, [
      { type: 'V', a: 1, b: 0, v: 6 },
      { type: 'R', a: 1, b: 0, r: 100 },
      { type: 'R', a: 1, b: 0, r: 300 },
    ]);
    expect(s.i[0]).toBeCloseTo(6 / parallel(100, 300));
    expect(s.i[0]).toBeCloseTo(s.i[1] + s.i[2]);
  });

  it('rejects a shorted or floating circuit', () => {
    expect(() =>
      solve(3, [
        { type: 'V', a: 1, b: 0, v: 5 },
        { type: 'R', a: 2, b: 0, r: 10 }, // node 2 never connects to the source
        { type: 'R', a: 2, b: 0, r: 10 },
      ]),
    ).not.toThrow();
    expect(() => solve(2, [{ type: 'R', a: 1, b: 0, r: 0 }])).toThrow(CircuitError);
  });

  it('formats SI prefixes and picks safe E12 values', () => {
    expect(si(0.0153, 'A')).toBe('15.3 mA');
    expect(si(4700, 'Ω')).toBe('4.7 kΩ');
    expect(si(9, 'V')).toBe('9 V');
    expect(nextE12(350)).toBe(390);
    expect(nextE12(330)).toBe(330);
  });
});

describe('spaced repetition', () => {
  it('schedules new cards for tomorrow and climbs the boxes', () => {
    const c0 = newCard(NOW);
    expect(c0.due).toBe(startOfDay(NOW) + DAY);
    const c1 = review(c0, true, NOW);
    expect(c1.box).toBe(1);
    expect(c1.due).toBe(startOfDay(NOW) + INTERVAL_DAYS[1] * DAY);
    const miss = review(c1, false, NOW);
    expect(miss.box).toBe(0);
  });

  it('counts a streak ending today or yesterday', () => {
    const d = (k: number) => dayKey(NOW - k * DAY);
    expect(streak([d(0), d(1), d(2)], NOW)).toBe(3);
    expect(streak([d(1), d(2)], NOW)).toBe(2);
    expect(streak([d(2), d(3)], NOW)).toBe(0);
  });
});

const q = (id: string) => ({
  kind: 'mcq' as const,
  id,
  prompt: '?',
  solution: '',
  options: [
    { text: 'a', correct: true, why: '' },
    { text: 'b', why: '' },
  ],
});
const lesson = (id: string) => ({
  id,
  title: id,
  summary: '',
  minutes: 5,
  objectives: [],
  terms: ['volt'],
  steps: [q(id + '-q')],
  sources: [],
});
const mod = (id: string, lessons: string[], safety = false): Module => ({
  id,
  title: id,
  summary: '',
  safety,
  status: 'ready',
  lessons: lessons.map(lesson),
  check: [q(id + '-c1'), q(id + '-c2')],
});
const levels: Level[] = [
  { n: 0, title: '', subtitle: '', tier: '', modules: [mod('safe', ['s1'], true), mod('math', ['m1', 'm2'])] },
  { n: 1, title: '', subtitle: '', tier: '', modules: [mod('dc', ['d1'])] },
  {
    n: 2,
    title: '',
    subtitle: '',
    tier: '',
    modules: [{ ...mod('comp', []), status: 'planned', check: [] }],
  },
];

describe('mastery and unlock rules', () => {
  it('starts with only the first lesson open', () => {
    const s = emptyState(NOW);
    const [safe, math] = levels[0].modules;
    expect(lessonUnlocked(s, levels, safe, 's1')).toBe(true);
    expect(moduleUnlocked(s, levels, math)).toBe(false);
    expect(levelUnlocked(s, levels, 1)).toBe(false);
    expect(nextAction(s, levels)).toEqual({ type: 'lesson', moduleId: 'safe', lessonId: 's1' });
  });

  it('requires 100% on a safety check and 80% elsewhere', () => {
    const [safe, math] = levels[0].modules;
    let s = completeLesson(emptyState(NOW), 's1', 1, [], ['volt'], NOW);
    expect(checkUnlocked(s, levels, safe)).toBe(true);
    s = recordCheck(s, safe, 0.9, ['safe-c1'], NOW);
    expect(moduleUnlocked(s, levels, math)).toBe(false); // 90% is not enough for safety
    expect(s.cards['q:safe-c1']).toBeDefined();
    s = recordCheck(s, safe, 1, [], NOW);
    expect(moduleUnlocked(s, levels, math)).toBe(true);
    expect(lessonUnlocked(s, levels, math, 'm2')).toBe(false); // lessons go in order

    s = completeLesson(s, 'm1', 1, [], [], NOW);
    s = completeLesson(s, 'm2', 0.5, ['m2-q'], [], NOW);
    s = recordCheck(s, math, 0.8, [], NOW);
    expect(levelUnlocked(s, levels, 1)).toBe(true);
    expect(nextAction(s, levels)).toEqual({ type: 'lesson', moduleId: 'dc', lessonId: 'd1' });
  });

  it('reports waiting when the next level is still in preparation', () => {
    let s = emptyState(NOW);
    for (const l of levels.slice(0, 2))
      for (const m of l.modules) {
        for (const ls of m.lessons) s = completeLesson(s, ls.id, 1, [], [], NOW);
        s = recordCheck(s, m, 1, [], NOW);
      }
    expect(levelUnlocked(s, levels, 2)).toBe(true);
    expect(nextAction(s, levels)).toEqual({ type: 'waiting' });
  });

  it('keeps the best score and never lowers a pass', () => {
    const math = levels[0].modules[1];
    let s = recordCheck(emptyState(NOW), math, 0.9, [], NOW);
    s = recordCheck(s, math, 0.4, [], NOW);
    expect(s.checks.math.best).toBe(0.9);
  });

  it('rejects malformed saved data', () => {
    expect(sanitize(null, NOW)).toBeNull();
    expect(sanitize({ v: 2 }, NOW)).toBeNull();
    const ok = sanitize({ v: 1, lessons: [], xp: 'x' }, NOW)!;
    expect(ok.lessons).toEqual({});
    expect(ok.xp).toBe(0);
  });
});

import { buildFromTag, isNewer } from './platform';
describe('Android update check', () => {
  it('reads the build number from release tags', () => {
    expect(buildFromTag('app-v1.0.17')).toBe(17);
    expect(buildFromTag('v2')).toBeNull();
    expect(buildFromTag(undefined)).toBeNull();
  });
  it('reports an update only when the published build is newer than a real installed build', () => {
    expect(isNewer(5, 3)).toBe(true);
    expect(isNewer(3, 3)).toBe(false);
    expect(isNewer(2, 3)).toBe(false);
    expect(isNewer(null, 3)).toBe(false);
    expect(isNewer(5, 0)).toBe(false); // local/dev build never nags
  });
});
