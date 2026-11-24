import { useLayoutEffect, useRef, useState } from 'react';
import type { Level, Module } from '../types';
import type { State } from '../lib/progress';
import {
  checkUnlocked, dueCards, lessonUnlocked, levelComplete, levelUnlocked, modulePassed, moduleUnlocked, nextAction, passMark,
} from '../lib/progress';
import { streak } from '../lib/srs';
import { LEVELS, findLesson, findModule, READY_MODULES } from '../data/curriculum';
import { Bubble, Lido } from './Mascot';
import { bidi } from './Rich';
import { IconArrowNext, IconBolt, IconCheck, IconClock, IconFlame, IconLock, IconReview, IconShield, IconTarget } from './Icons';

type Node = {
  key: string;
  kind: 'lesson' | 'check';
  title: string;
  meta: string;
  href: string;
  status: 'done' | 'open' | 'locked';
  current: boolean;
  score?: number;
};

export function Journey({ state, now, go }: { state: State; now: number; go: (hash: string) => void }) {
  const next = nextAction(state, LEVELS);
  const due = dueCards(state, now).length;
  const mastered = READY_MODULES.filter((m) => modulePassed(state, m)).length;
  const days = streak(state.days, now);
  const name = state.profile.name.trim();

  let hero: { title: string; crumb: string; cta: string; href: string; minutes?: number } | null = null;
  if (next.type === 'lesson') {
    const f = findLesson(next.lessonId)!;
    hero = { title: f.lesson.title, crumb: `المستوى ${f.level.n} · ${f.module.title}`, cta: state.lessons[f.lesson.id] ? 'أكمل' : 'ابدأ', href: 'lesson-' + f.lesson.id, minutes: f.lesson.minutes };
  } else if (next.type === 'check') {
    const m = findModule(next.moduleId)!;
    hero = { title: `اختبار الإتقان: ${m.title}`, crumb: `عتبة النجاح ${Math.round(passMark(m) * 100)}%`, cta: 'ابدأ الاختبار', href: 'check-' + m.id };
  }

  return (
    <div className="journey">
      <section className="hero">
        <div className="hero-greet">
          <Lido size={78} mood={next.type === 'waiting' ? 'cheer' : 'happy'} />
          <Bubble>
            {next.type === 'waiting'
              ? <>أتقنت كل ما هو جاهز{name ? ` يا ${name}` : ''}. المستوى التالي قيد الإعداد؛ حافظ على المراجعة اليومية حتى ذلك الحين.</>
              : due > 0
                ? <>مرحبًا{name ? ` ${name}` : ''}. ابدأ بالمراجعة ({due}) ثم تابع درسك.</>
                : <>مرحبًا{name ? ` ${name}` : ''}. خطوتك التالية جاهزة.</>}
          </Bubble>
        </div>

        {hero && (
          <button type="button" className="next-card" onClick={() => go(hero.href)}>
            <span className="next-kicker">التالي في مسارك</span>
            <span className="next-title">{hero.title}</span>
            <span className="next-crumb">{hero.crumb}{hero.minutes ? <> · <IconClock size={15} /> {hero.minutes} د</> : null}</span>
            <span className="next-cta">{hero.cta} <IconArrowNext size={18} /></span>
          </button>
        )}

        <div className="stats">
          <button type="button" className={`stat ${due ? 'hot' : ''}`} onClick={() => go('review')}>
            <IconReview size={20} /><span className="stat-n"><bdi>{due}</bdi></span><span className="stat-l">للمراجعة اليوم</span>
          </button>
          <div className="stat"><IconFlame size={20} /><span className="stat-n"><bdi>{days}</bdi></span><span className="stat-l">{days === 1 ? 'يوم متتالٍ' : 'أيام متتالية'}</span></div>
          <div className="stat"><IconTarget size={20} /><span className="stat-n"><bdi>{mastered}/{READY_MODULES.length}</bdi></span><span className="stat-l">وحدات متقنة</span></div>
          <div className="stat"><IconBolt size={20} /><span className="stat-n"><bdi>{state.xp}</bdi></span><span className="stat-l">نقطة</span></div>
        </div>
      </section>

      {LEVELS.map((level) => <LevelSection key={level.n} level={level} state={state} go={go} next={next} />)}
    </div>
  );
}

function LevelSection({ level, state, go, next }: { level: Level; state: State; go: (h: string) => void; next: ReturnType<typeof nextAction> }) {
  const unlocked = levelUnlocked(state, LEVELS, level.n);
  const ready = level.modules.filter((m) => m.status === 'ready');
  const passed = ready.filter((m) => modulePassed(state, m)).length;
  const planned = ready.length === 0;
  const complete = levelComplete(state, level);

  return (
    <section className={`level ${unlocked ? '' : 'locked'} ${planned ? 'planned' : ''}`} id={`level-${level.n}`}>
      <header className="level-head">
        <span className="level-badge" aria-hidden="true">{level.n}</span>
        <div className="level-text">
          <h2>المستوى {level.n}: {level.title}</h2>
          <p>{bidi(level.subtitle)}</p>
          <div className="level-tags">
            <span className="tag"><IconShield size={15} /> {bidi(level.tier)}</span>
            {planned ? <span className="tag soon">قيد الإعداد</span>
              : <span className={`tag ${complete ? 'ok' : ''}`}><bdi>{passed}/{ready.length}</bdi> وحدات متقنة</span>}
            {!unlocked && !planned && <span className="tag"><IconLock size={15} /> أتقن المستوى السابق لفتحه</span>}
          </div>
        </div>
      </header>
      {planned
        ? <div className="planned-grid">{level.modules.map((m) => <PlannedModule key={m.id} m={m} />)}</div>
        : <Board level={level} state={state} go={go} next={next} />}
    </section>
  );
}

function PlannedModule({ m }: { m: Module }) {
  return (
    <div className="planned-card">
      <div className="planned-head">
        <h3>{m.title}</h3>
        {m.safety && <span className="tag safety"><IconShield size={14} /> سلامة</span>}
      </div>
      <p>{bidi(m.summary)}</p>
      {m.planned && <ul>{m.planned.map((t) => <li key={t}>{bidi(t)}</li>)}</ul>}
    </div>
  );
}

function Board({ level, state, go, next }: { level: Level; state: State; go: (h: string) => void; next: ReturnType<typeof nextAction> }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; lit: boolean }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const groups = level.modules.filter((m) => m.status === 'ready').map((m) => {
    const mUnlocked = moduleUnlocked(state, LEVELS, m);
    const nodes: Node[] = m.lessons.map((l) => {
      const p = state.lessons[l.id];
      const open = lessonUnlocked(state, LEVELS, m, l.id);
      return {
        key: l.id, kind: 'lesson', title: l.title, meta: `درس · ${l.minutes} د`, href: 'lesson-' + l.id,
        status: p?.done ? 'done' : open ? 'open' : 'locked',
        current: next.type === 'lesson' && next.lessonId === l.id, score: p?.done ? p.score : undefined,
      };
    });
    const c = state.checks[m.id];
    nodes.push({
      key: 'check-' + m.id, kind: 'check', title: 'اختبار الإتقان', meta: `${m.check.length} أسئلة · العتبة ${Math.round(passMark(m) * 100)}%`,
      href: 'check-' + m.id,
      status: modulePassed(state, m) ? 'done' : checkUnlocked(state, LEVELS, m) ? 'open' : 'locked',
      current: next.type === 'check' && next.moduleId === m.id, score: c?.best,
    });
    return { m, mUnlocked, nodes };
  });

  const flat = groups.flatMap((g) => g.nodes);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const draw = () => {
      const b = box.getBoundingClientRect();
      const pads = [...box.querySelectorAll<HTMLElement>('[data-pad]')];
      const pts = pads.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top, done: el.dataset.done === '1' };
      });
      const out: { d: string; lit: boolean }[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const c = pts[i + 1];
        const mid = (a.y + c.y) / 2;
        // PCB-style trace: vertical, 45° chamfered corners, horizontal, vertical
        const dx = c.x - a.x;
        const ch = Math.min(18, Math.abs(dx) / 2, Math.abs(c.y - a.y) / 4);
        const sx = Math.sign(dx);
        const d = Math.abs(dx) < 2
          ? `M${a.x} ${a.y}V${c.y}`
          : `M${a.x} ${a.y}V${mid - ch}L${a.x + sx * ch} ${mid}H${c.x - sx * ch}L${c.x} ${mid + ch}V${c.y}`;
        out.push({ d, lit: a.done && c.done });
      }
      setPaths(out);
      setSize({ w: b.width, h: b.height });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, [state, level]);

  let n = 0;
  return (
    <div className="board" ref={boxRef}>
      <svg className="board-traces" width={size.w} height={size.h} aria-hidden="true">
        {paths.map((p, i) => <path key={i} d={p.d} className={`trace-under`} />)}
        {paths.map((p, i) => <path key={'t' + i} d={p.d} className={`trace ${p.lit ? 'lit' : ''}`} />)}
      </svg>
      {groups.map(({ m, mUnlocked, nodes }) => (
        <div key={m.id} className={`board-module ${mUnlocked ? '' : 'locked'}`}>
          <div className="silk">
            <span className="silk-title">{m.title}</span>
            {m.safety && <span className="tag safety"><IconShield size={14} /> سلامة · 100%</span>}
            {modulePassed(state, m) && <span className="tag ok"><IconCheck size={14} /> متقنة</span>}
            <span className="silk-sum">{bidi(m.summary)}</span>
          </div>
          {nodes.map((node) => {
            const side = n++ % 2 === 0 ? 'start' : 'end';
            const flatIdx = flat.indexOf(node);
            return (
              <div key={node.key} className={`node-row ${side}`}>
                <button type="button" className={`node ${node.status} ${node.current ? 'current' : ''} ${node.kind}`}
                  disabled={node.status === 'locked'} onClick={() => go(node.href)}
                  aria-label={`${node.title}${node.status === 'locked' ? ' (مقفل)' : ''}`}>
                  <span className="pad" data-pad data-done={node.status === 'done' ? '1' : '0'}>
                    {node.status === 'done' ? <IconCheck size={20} /> : node.status === 'locked' ? <IconLock size={18} />
                      : node.kind === 'check' ? <IconTarget size={20} /> : <bdi>{flatIdx + 1}</bdi>}
                  </span>
                  <span className="node-text">
                    <span className="node-title">{node.title}</span>
                    <span className="node-meta">
                      {node.meta}
                      {node.score !== undefined && <> · <bdi>{Math.round(node.score * 100)}%</bdi></>}
                    </span>
                  </span>
                  {node.current && <span className="node-go">ابدأ <IconArrowNext size={16} /></span>}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
