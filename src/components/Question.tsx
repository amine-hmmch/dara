import { useMemo } from 'react';
import type { QuestionStep } from '../types';
import { Ltr, Rich } from './Rich';
import { IconBulb, IconCheck, IconX } from './Icons';

export type QState = { choice?: number; input?: string; submitted: boolean; correct?: boolean; hint?: boolean };
export const emptyQ: QState = { submitted: false };

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];

/** Accepts "0,35", "0.35", "1 000", "−5". Returns NaN for anything else. */
export function parseNumber(s: string): number {
  const t = s.trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(',', '.');
  if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(t)) return NaN;
  return Number(t);
}

export function canSubmit(q: QuestionStep, s: QState): boolean {
  if (s.submitted) return false;
  return q.kind === 'mcq' ? s.choice !== undefined : !Number.isNaN(parseNumber(s.input ?? ''));
}

export function grade(q: QuestionStep, s: QState): boolean {
  if (q.kind === 'mcq') return s.choice !== undefined && !!q.options[s.choice]?.correct;
  const x = parseNumber(s.input ?? '');
  const tol = q.answer === 0 ? q.tolerance : Math.abs(q.answer) * q.tolerance;
  return Math.abs(x - q.answer) <= tol + 1e-12;
}

/** Stable per-question shuffle so the right answer isn't always in the same place. */
function order(id: string, n: number): number[] {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const j = Math.abs(h) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export function QuestionView({ q, state, onChange, onSubmit }: {
  q: QuestionStep; state: QState; onChange: (s: QState) => void; onSubmit: () => void;
}) {
  const ord = useMemo(() => (q.kind === 'mcq' ? order(q.id, q.options.length) : []), [q]);

  return (
    <div className="question">
      <h2 className="q-prompt"><Rich text={q.prompt} /></h2>

      {q.kind === 'mcq' ? (
        <div className="options" role="radiogroup" aria-label="الاختيارات">
          {ord.map((oi, pos) => {
            const o = q.options[oi];
            const chosen = state.choice === oi;
            const cls = state.submitted ? (o.correct ? 'right' : chosen ? 'wrong' : 'dim') : chosen ? 'chosen' : '';
            return (
              <button key={oi} type="button" role="radio" aria-checked={chosen} disabled={state.submitted}
                className={`option ${cls}`} onClick={() => onChange({ ...state, choice: oi })}>
                <span className="option-letter">{LETTERS[pos]}</span>
                <span className="option-text"><Rich text={o.text} /></span>
                {state.submitted && o.correct && <IconCheck size={20} className="option-mark" />}
                {state.submitted && chosen && !o.correct && <IconX size={20} className="option-mark" />}
              </button>
            );
          })}
        </div>
      ) : (
        <form className="numeric" onSubmit={(e) => { e.preventDefault(); if (canSubmit(q, state)) onSubmit(); }}>
          <label className="numeric-field">
            <span className="sr-only">إجابتك</span>
            <input dir="ltr" inputMode="decimal" autoComplete="off" disabled={state.submitted}
              value={state.input ?? ''} placeholder="0" onChange={(e) => onChange({ ...state, input: e.target.value })}
              className={state.submitted ? (state.correct ? 'right' : 'wrong') : ''} />
            {q.unit && <Ltr>{q.unit}</Ltr>}
          </label>
          {!state.submitted && q.hint && (
            state.hint
              ? <p className="hint"><IconBulb size={18} /> <Rich text={q.hint} /></p>
              : <button type="button" className="btn-link" onClick={() => onChange({ ...state, hint: true })}>تلميح</button>
          )}
          <p className="numeric-note">يمكنك كتابة الفاصلة العشرية بنقطة أو بفاصلة.</p>
        </form>
      )}

      {state.submitted && <Feedback q={q} state={state} />}
    </div>
  );
}

function Feedback({ q, state }: { q: QuestionStep; state: QState }) {
  const ok = !!state.correct;
  const chosen = q.kind === 'mcq' && state.choice !== undefined ? q.options[state.choice] : undefined;
  const right = q.kind === 'mcq' ? q.options.find((o) => o.correct) : undefined;
  return (
    <div className={`feedback ${ok ? 'ok' : 'bad'}`} role="status">
      <div className="feedback-head">
        {ok ? <IconCheck size={20} /> : <IconX size={20} />}
        <span>{ok ? 'أحسنت' : 'ليس تمامًا'}</span>
      </div>
      {chosen && <p><Rich text={chosen.why} /></p>}
      {!ok && right && <p className="feedback-right"><strong>الإجابة الصحيحة:</strong> <Rich text={right.text} />. <Rich text={right.why} /></p>}
      {q.kind === 'numeric' && !ok && <p><strong>الإجابة:</strong> <Ltr>{q.answer} {q.unit}</Ltr></p>}
      <p className="feedback-solution"><strong>الحل:</strong> <Rich text={q.solution} /></p>
    </div>
  );
}
