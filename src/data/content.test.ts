import { describe, expect, it } from 'vitest';
import { LEVELS, READY_MODULES } from './curriculum';
import { TERM_BY_ID, TERMS } from './glossary';
import type { Block, Step } from '../types';

const allSteps: Step[] = READY_MODULES.flatMap((m) => [...m.lessons.flatMap((l) => l.steps), ...m.check]);

function textsOf(s: Step): string[] {
  switch (s.kind) {
    case 'concept':
      return [s.title, ...(s.darija ? [s.darija] : []), ...s.blocks.flatMap(blockTexts)];
    case 'mcq':
      return [s.prompt, s.solution, ...s.options.flatMap((o) => [o.text, o.why])];
    case 'numeric':
      return [s.prompt, s.solution, ...(s.hint ? [s.hint] : [])];
    case 'lab':
      return [s.title, s.task];
  }
}

function blockTexts(b: Block): string[] {
  switch (b.t) {
    case 'p': case 'warn': case 'tip': return [b.text];
    case 'def': return [b.text];
    case 'formula': return [b.expr, ...(b.note ? [b.note] : [])];
    case 'example': return [b.title, ...b.steps, b.result];
    case 'list': return b.items;
    case 'figure': return b.caption ? [b.caption] : [];
    case 'practice': return [b.title, ...b.needs, ...b.steps, ...b.safety];
  }
}

describe('curriculum content', () => {
  it('has unique ids across modules, lessons and steps', () => {
    const ids = [
      ...LEVELS.flatMap((l) => l.modules.map((m) => m.id)),
      ...READY_MODULES.flatMap((m) => m.lessons.map((l) => l.id)),
      ...allSteps.map((s) => s.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses hash-safe ids', () => {
    for (const m of READY_MODULES) {
      expect(m.id).toMatch(/^[a-z0-9-]+$/);
      for (const l of m.lessons) expect(l.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('gives every multiple-choice question exactly one right answer and feedback on every option', () => {
    for (const s of allSteps) {
      if (s.kind !== 'mcq') continue;
      expect(s.options.filter((o) => o.correct).length, s.id).toBe(1);
      for (const o of s.options) expect(o.why.trim().length, s.id).toBeGreaterThan(0);
      expect(s.options.length, s.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('gives every numeric question a finite answer, a tolerance and a worked solution', () => {
    for (const s of allSteps) {
      if (s.kind !== 'numeric') continue;
      expect(Number.isFinite(s.answer), s.id).toBe(true);
      expect(s.tolerance, s.id).toBeGreaterThan(0);
      expect(s.solution.length, s.id).toBeGreaterThan(0);
    }
  });

  it('resolves every glossary reference', () => {
    const refs = allSteps.flatMap(textsOf).flatMap((t) => [...t.matchAll(/\[\[([a-z0-9-]+)(\|[^\]]+)?\]\]/g)].map((m) => m[1]));
    for (const r of refs) expect(TERM_BY_ID[r], r).toBeDefined();
    for (const s of allSteps)
      if (s.kind === 'concept') for (const b of s.blocks) if (b.t === 'def') expect(TERM_BY_ID[b.term], b.term).toBeDefined();
    for (const m of READY_MODULES) for (const l of m.lessons) for (const t of l.terms) expect(TERM_BY_ID[t], t).toBeDefined();
  });

  it('keeps markup balanced', () => {
    for (const t of allSteps.flatMap(textsOf)) {
      expect((t.match(/\*\*/g) ?? []).length % 2, t).toBe(0);
      expect((t.match(/\{\{/g) ?? []).length, t).toBe((t.match(/\}\}/g) ?? []).length);
      expect((t.match(/\[\[/g) ?? []).length, t).toBe((t.match(/\]\]/g) ?? []).length);
    }
  });

  it('gives every ready module a mastery check and every lesson questions', () => {
    for (const m of READY_MODULES) {
      expect(m.check.length, m.id).toBeGreaterThanOrEqual(2);
      for (const l of m.lessons) expect(l.steps.some((s) => s.kind === 'mcq' || s.kind === 'numeric'), l.id).toBe(true);
    }
  });

  it('has unique glossary ids', () => {
    expect(new Set(TERMS.map((t) => t.id)).size).toBe(TERMS.length);
  });
});

import { bidi } from '../components/Rich';
describe('bidi isolation of values with units', () => {
  it('wraps value+unit runs so "9 V" cannot render as "V 9"', () => {
    expect(bidi('بطارية 9 V')).toBe('بطارية ⁦9 V⁩');
    expect(bidi('بين 1.5–9 V')).toBe('بين ⁦1.5–9 V⁩');
    expect(bidi('تيار 20 mA فقط')).toBe('تيار ⁦20 mA⁩ فقط');
    expect(bidi('المستوى A')).toBe('المستوى A'); // a letter alone is untouched
    expect(bidi('6 خطوات')).toBe('6 خطوات');
  });
});
