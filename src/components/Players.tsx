import { useCallback, useMemo, useState } from 'react';
import type { Lesson, Level, Module, QuestionStep, Step } from '../types';
import { ConceptView } from './Blocks';
import { QuestionView, type QState, canSubmit, emptyQ, grade } from './Question';
import { Lab, LAB_INFO } from '../labs/Labs';
import { Rich, TermNames } from './Rich';
import { Lido } from './Mascot';
import { IconArrowNext, IconArrowPrev, IconBulb, IconCheck, IconClock, IconFlask, IconQuestion, IconX } from './Icons';
import { passMark } from '../lib/progress';
import { QUESTION_BY_ID } from '../data/curriculum';
import { TERM_BY_ID } from '../data/glossary';

const isQ = (s: Step): s is QuestionStep => s.kind === 'mcq' || s.kind === 'numeric';
const STEP_LABEL = { concept: 'شرح', mcq: 'سؤال', numeric: 'سؤال', lab: 'مختبر' } as const;
const StepIcon = ({ s }: { s: Step }) => (s.kind === 'concept' ? <IconBulb size={16} /> : s.kind === 'lab' ? <IconFlask size={16} /> : <IconQuestion size={16} />);

// ───────────────────────────── Lesson

export function LessonPlayer({ lesson, module, level, showDarija, alreadyDone, onComplete, onExit, onNext }: {
  lesson: Lesson; module: Module; level: Level; showDarija: boolean; alreadyDone: boolean;
  onComplete: (score: number, missed: string[]) => void; onExit: () => void; onNext?: () => void;
}) {
  const [phase, setPhase] = useState<'intro' | 'steps' | 'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [seen, setSeen] = useState(0);
  const [qs, setQs] = useState<Record<string, QState>>({});
  const [labs, setLabs] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ score: number; missed: string[] } | null>(null);

  const step = lesson.steps[idx];
  const questions = lesson.steps.filter(isQ);
  const lessonNo = module.lessons.indexOf(lesson) + 1;
  const q = isQ(step) ? qs[step.id] ?? emptyQ : emptyQ;
  const markLab = useCallback((id: string) => setLabs((l) => (l[id] ? l : { ...l, [id]: true })), []);

  const go = (i: number) => {
    setIdx(i);
    setSeen((s) => Math.max(s, i));
    window.scrollTo({ top: 0 });
  };

  const finish = () => {
    const missed = questions.filter((x) => !qs[x.id]?.correct).map((x) => x.id);
    const score = questions.length ? (questions.length - missed.length) / questions.length : 1;
    setResult({ score, missed });
    onComplete(score, missed);
    setPhase('done');
  };

  if (phase === 'intro') {
    return (
      <div className="player-intro">
        <button type="button" className="btn-back" onClick={onExit}><IconArrowPrev size={18} /> المسار</button>
        <div className="intro-card">
          <span className="crumb">المستوى {level.n} · {module.title} · الدرس {lessonNo} من {module.lessons.length}</span>
          <h1>{lesson.title}</h1>
          <p className="lead">{lesson.summary}</p>
          <div className="intro-meta"><IconClock size={18} /> حوالي {lesson.minutes} دقائق · {lesson.steps.length} خطوات · {questions.length} أسئلة</div>
          <h3>بعد هذا الدرس ستستطيع أن:</h3>
          <ul className="objectives">{lesson.objectives.map((o, i) => <li key={i}><IconCheck size={18} /> <Rich text={o} /></li>)}</ul>
          {lesson.terms.length > 0 && (
            <>
              <h3>مصطلحات جديدة</h3>
              <ul className="intro-terms">{lesson.terms.map((t) => <li key={t}><TermNames id={t} /></li>)}</ul>
            </>
          )}
          <button type="button" className="btn-primary big" onClick={() => setPhase('steps')}>{alreadyDone ? 'أعد الدرس' : 'ابدأ الدرس'}</button>
        </div>
      </div>
    );
  }

  if (phase === 'done' && result) {
    const pct = Math.round(result.score * 100);
    return (
      <div className="player-done">
        <Lido size={110} mood={pct >= 80 ? 'cheer' : 'calm'} />
        <h1>{pct >= 80 ? 'أنهيت الدرس' : 'أنهيت الدرس، والمراجعة ستكمل الباقي'}</h1>
        <p className="lead">أجبت صحيحًا من المحاولة الأولى عن <bdi>{questions.length - result.missed.length}</bdi> من <bdi>{questions.length}</bdi> أسئلة.</p>
        {result.missed.length > 0 && <p>الأسئلة التي أخطأت فيها أُضيفت إلى المراجعة، وستعود إليك غدًا.</p>}
        {lesson.terms.length > 0 && <p>أُضيفت <bdi>{lesson.terms.length}</bdi> مصطلحات إلى المراجعة.</p>}
        <div className="done-actions">
          {onNext && <button type="button" className="btn-primary big" onClick={onNext}>التالي في مسارك</button>}
          <button type="button" className="btn-secondary" onClick={onExit}>العودة إلى المسار</button>
        </div>
        {lesson.sources.length > 0 && (
          <details className="sources">
            <summary>مصادر هذا الدرس</summary>
            <ul>{lesson.sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}</li>)}</ul>
          </details>
        )}
      </div>
    );
  }

  // primary button state
  let primary: { label: string; disabled: boolean; act: () => void };
  const last = idx === lesson.steps.length - 1;
  const next = () => (last ? finish() : go(idx + 1));
  if (isQ(step) && !q.submitted) {
    primary = {
      label: 'تحقّق',
      disabled: !canSubmit(step, q),
      act: () => setQs({ ...qs, [step.id]: { ...q, submitted: true, correct: grade(step, q) } }),
    };
  } else if (step.kind === 'lab' && step.goal && !labs[step.id]) {
    primary = { label: 'أكمل المهمة أولًا', disabled: true, act: () => {} };
  } else {
    primary = { label: last ? 'أنهِ الدرس' : 'التالي', disabled: false, act: next };
  }

  return (
    <div className="player">
      <aside className="rail" aria-label="خطوات الدرس">
        <button type="button" className="btn-back" onClick={onExit}><IconArrowPrev size={18} /> خروج</button>
        <div className="rail-card">
          <span className="rail-kicker">الدرس {lessonNo} من {module.lessons.length}</span>
          <h2>{lesson.title}</h2>
          <div className="progress" aria-label={`الخطوة ${idx + 1} من ${lesson.steps.length}`}>
            <div style={{ width: `${((idx + 1) / lesson.steps.length) * 100}%` }} />
          </div>
        </div>
        <ol className="rail-steps">
          {lesson.steps.map((s, i) => {
            const st = isQ(s) ? qs[s.id] : undefined;
            const state = i === idx ? 'current' : i <= seen ? 'seen' : 'ahead';
            return (
              <li key={s.id}>
                <button type="button" disabled={i > seen} className={`rail-step ${state}`} onClick={() => go(i)} aria-current={i === idx ? 'step' : undefined}>
                  <span className="rail-step-kind"><StepIcon s={s} /> {STEP_LABEL[s.kind]}</span>
                  <span className="rail-step-title">{s.kind === 'concept' || s.kind === 'lab' ? s.title : <Rich text={s.prompt} />}</span>
                  {st?.submitted && (st.correct ? <IconCheck size={16} className="ok" /> : <IconX size={16} className="bad" />)}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <section className="stage">
        <div className="stage-bar">
          <span className="stage-kind"><StepIcon s={step} /> {STEP_LABEL[step.kind]}</span>
          <span className="stage-count"><bdi>{idx + 1}</bdi> / <bdi>{lesson.steps.length}</bdi></span>
        </div>
        <div className="mobile-progress"><div style={{ width: `${((idx + 1) / lesson.steps.length) * 100}%` }} /></div>
        <div className="stage-body" key={step.id}>
          {step.kind === 'concept' && <ConceptView step={step} showDarija={showDarija} />}
          {isQ(step) && (
            <QuestionView q={step} state={q} onChange={(s) => setQs({ ...qs, [step.id]: s })}
              onSubmit={() => setQs({ ...qs, [step.id]: { ...q, submitted: true, correct: grade(step, q) } })} />
          )}
          {step.kind === 'lab' && (
            <div className="lab-step">
              <h2 className="step-title">{step.title}</h2>
              <p className="lab-task"><Rich text={step.task} /></p>
              <Lab id={step.lab} goal={step.goal} onGoal={() => markLab(step.id)} />
              <p className="lab-more">{LAB_INFO[step.lab].title} متاح دائمًا في المكتبة.</p>
            </div>
          )}
        </div>
        <div className="stage-actions">
          <button type="button" className="btn-ghost" disabled={idx === 0} onClick={() => go(idx - 1)}><IconArrowPrev size={18} /> السابق</button>
          <button type="button" className="btn-primary" disabled={primary.disabled} onClick={primary.act}>
            {primary.label} {!primary.disabled && primary.label !== 'تحقّق' && <IconArrowNext size={18} />}
          </button>
        </div>
      </section>
    </div>
  );
}

// ───────────────────────────── Mastery check

export function CheckPlayer({ module, level, onRecord, onExit, onNext }: {
  module: Module; level: Level; onRecord: (score: number, missed: string[]) => void; onExit: () => void; onNext?: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const order = useMemo(() => shuffle(module.check, attempt), [module, attempt]);
  const [idx, setIdx] = useState(0);
  const [qs, setQs] = useState<Record<string, QState>>({});
  const [done, setDone] = useState<{ score: number; missed: string[] } | null>(null);
  const mark = passMark(module);

  const q = order[idx];
  const st = qs[q?.id] ?? emptyQ;

  const finish = () => {
    const missed = order.filter((x) => !qs[x.id]?.correct).map((x) => x.id);
    const score = (order.length - missed.length) / order.length;
    setDone({ score, missed });
    onRecord(score, missed);
  };

  if (done) {
    const passed = done.score >= mark - 1e-9;
    return (
      <div className="player-done">
        <Lido size={110} mood={passed ? 'cheer' : 'think'} />
        <h1>{passed ? 'أتقنت هذه الوحدة' : 'لم تصل بعد إلى عتبة الإتقان'}</h1>
        <p className="lead">النتيجة <bdi>{Math.round(done.score * 100)}%</bdi>. العتبة لهذه الوحدة <bdi>{Math.round(mark * 100)}%</bdi>{module.safety ? ' لأنها وحدة سلامة' : ''}.</p>
        {done.missed.length > 0 && (
          <div className="missed">
            <h3>راجع هذه النقاط</h3>
            <ul>
              {done.missed.map((id) => {
                const mq = order.find((x) => x.id === id)!;
                return <li key={id}><Rich text={mq.prompt} /><span className="missed-sol"><Rich text={mq.solution} /></span></li>;
              })}
            </ul>
          </div>
        )}
        <div className="done-actions">
          {passed && onNext && <button type="button" className="btn-primary big" onClick={onNext}>التالي في مسارك</button>}
          {!passed && <button type="button" className="btn-primary big" onClick={() => { setAttempt((a) => a + 1); setIdx(0); setQs({}); setDone(null); }}>أعد الاختبار</button>}
          <button type="button" className="btn-secondary" onClick={onExit}>العودة إلى المسار</button>
        </div>
      </div>
    );
  }

  const last = idx === order.length - 1;
  return (
    <div className="player single">
      <section className="stage">
        <div className="stage-bar">
          <button type="button" className="btn-back" onClick={onExit}><IconArrowPrev size={18} /> خروج</button>
          <span className="stage-kind">اختبار الإتقان · المستوى {level.n} · {module.title}</span>
          <span className="stage-count"><bdi>{idx + 1}</bdi> / <bdi>{order.length}</bdi></span>
        </div>
        <div className="mobile-progress always"><div style={{ width: `${((idx + 1) / order.length) * 100}%` }} /></div>
        <div className="stage-body" key={q.id}>
          <QuestionView q={q} state={st} onChange={(s) => setQs({ ...qs, [q.id]: s })}
            onSubmit={() => setQs({ ...qs, [q.id]: { ...st, submitted: true, correct: grade(q, st) } })} />
        </div>
        <div className="stage-actions">
          <span className="check-note">العتبة: <bdi>{Math.round(mark * 100)}%</bdi></span>
          {!st.submitted ? (
            <button type="button" className="btn-primary" disabled={!canSubmit(q, st)} onClick={() => setQs({ ...qs, [q.id]: { ...st, submitted: true, correct: grade(q, st) } })}>تحقّق</button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => (last ? finish() : setIdx(idx + 1))}>{last ? 'اعرض النتيجة' : 'التالي'} <IconArrowNext size={18} /></button>
          )}
        </div>
      </section>
    </div>
  );
}

function shuffle<T>(arr: T[], seed: number): T[] {
  if (seed === 0) return arr;
  const a = [...arr];
  let h = seed * 2654435761;
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    const j = Math.abs(h) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ───────────────────────────── Review

export function ReviewSession({ queue: initialQueue, onResult, onExit }: {
  queue: string[]; onResult: (cardId: string, correct: boolean) => void; onExit: () => void;
}) {
  // Freeze the queue at the start: answering a card makes it no longer due,
  // and a live list would shift under the index and skip cards.
  const [queue] = useState(initialQueue);
  const [i, setI] = useState(0);
  const [st, setSt] = useState<QState>(emptyQ);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ right: 0, total: 0 });

  const id = queue[i];
  const advance = (correct: boolean) => {
    onResult(id, correct);
    setTally((t) => ({ right: t.right + (correct ? 1 : 0), total: t.total + 1 }));
    setI(i + 1);
    setSt(emptyQ);
    setRevealed(false);
  };

  if (i >= queue.length) {
    return (
      <div className="player-done">
        <Lido size={110} mood="cheer" />
        <h1>أنهيت مراجعة اليوم</h1>
        <p className="lead">تذكّرت <bdi>{tally.right}</bdi> من <bdi>{tally.total}</bdi>. ما تذكّرته سيعود بعد فترة أطول، وما نسيته سيعود غدًا.</p>
        <button type="button" className="btn-primary big" onClick={onExit}>العودة إلى المسار</button>
      </div>
    );
  }

  const [kind, ref] = [id.slice(0, 1), id.slice(2)];
  const qEntry = kind === 'q' ? QUESTION_BY_ID[ref] : undefined;
  const term = kind === 't' ? TERM_BY_ID[ref] : undefined;

  return (
    <div className="player single">
      <section className="stage">
        <div className="stage-bar">
          <button type="button" className="btn-back" onClick={onExit}><IconArrowPrev size={18} /> خروج</button>
          <span className="stage-kind">المراجعة{qEntry ? ` · ${qEntry.module.title}` : ''}</span>
          <span className="stage-count"><bdi>{i + 1}</bdi> / <bdi>{queue.length}</bdi></span>
        </div>
        <div className="mobile-progress always"><div style={{ width: `${((i + 1) / queue.length) * 100}%` }} /></div>
        <div className="stage-body" key={id}>
          {qEntry && <QuestionView q={qEntry.q} state={st} onChange={setSt} onSubmit={() => setSt({ ...st, submitted: true, correct: grade(qEntry.q, st) })} />}
          {term && (
            <div className="flashcard">
              <span className="flash-kicker">مصطلح</span>
              <h2 className="flash-term">{term.ar}</h2>
              <p className="flash-ask">تذكّر تعريفه واسمه بالفرنسية والإنجليزية، ثم اكشف الإجابة.</p>
              {revealed && (
                <div className="flash-answer">
                  <bdi dir="ltr" className="flash-latin">{term.fr} · {term.en}</bdi>
                  <p>{term.def}</p>
                </div>
              )}
            </div>
          )}
          {!qEntry && !term && <p>هذه البطاقة لم تعد موجودة في المحتوى.</p>}
        </div>
        <div className="stage-actions">
          {qEntry && (!st.submitted
            ? <button type="button" className="btn-primary" disabled={!canSubmit(qEntry.q, st)} onClick={() => setSt({ ...st, submitted: true, correct: grade(qEntry.q, st) })}>تحقّق</button>
            : <button type="button" className="btn-primary" onClick={() => advance(!!st.correct)}>التالي <IconArrowNext size={18} /></button>)}
          {term && (!revealed
            ? <button type="button" className="btn-primary" onClick={() => setRevealed(true)}>اكشف الإجابة</button>
            : <div className="self-grade">
                <button type="button" className="btn-secondary" onClick={() => advance(false)}>لم أتذكّر</button>
                <button type="button" className="btn-primary" onClick={() => advance(true)}>تذكّرت</button>
              </div>)}
          {!qEntry && !term && <button type="button" className="btn-primary" onClick={() => advance(true)}>تخطَّ</button>}
        </div>
      </section>
    </div>
  );
}
