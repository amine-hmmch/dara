import type { Block, ConceptStep } from '../types';
import { Figure } from './Figures';
import { Rich, TermNames } from './Rich';
import { IconBulb, IconChat, IconFlask, IconShield, IconWarn } from './Icons';
import { useState } from 'react';

const TIER_LABEL = { sim: 'محاكاة', A: 'المستوى A · بطاريات حتى 9 V', B: 'المستوى B · حتى 12 V مع تحديد التيار' };

export function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'p':
      return <p className="b-p"><Rich text={b.text} /></p>;
    case 'def':
      return (
        <div className="b-def">
          <div className="b-def-head"><TermNames id={b.term} /></div>
          <p><Rich text={b.text} /></p>
        </div>
      );
    case 'formula':
      return (
        <div className="b-formula">
          <div className="b-formula-expr" dir="ltr">{b.expr}</div>
          {b.note && <div className="b-formula-note"><Rich text={b.note} /></div>}
        </div>
      );
    case 'warn':
      return <div className="b-callout warn"><IconWarn size={20} /><p><Rich text={b.text} /></p></div>;
    case 'tip':
      return <div className="b-callout tip"><IconBulb size={20} /><p><Rich text={b.text} /></p></div>;
    case 'example':
      return (
        <div className="b-example">
          <div className="b-example-title">مثال محلول: <Rich text={b.title} /></div>
          <ol>{b.steps.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ol>
          <div className="b-example-result"><Rich text={b.result} /></div>
        </div>
      );
    case 'list': {
      const items = b.items.map((s, i) => <li key={i}><Rich text={s} /></li>);
      return b.ordered ? <ol className="b-list">{items}</ol> : <ul className="b-list">{items}</ul>;
    }
    case 'figure':
      return (
        <figure className="b-figure">
          <Figure fig={b.fig} />
          {b.caption && <figcaption><Rich text={b.caption} /></figcaption>}
        </figure>
      );
    case 'practice':
      return (
        <div className="b-practice">
          <div className="b-practice-head">
            <IconFlask size={20} />
            <span className="b-practice-title"><Rich text={b.title} /></span>
            <span className={`tier tier-${b.tier}`}>{TIER_LABEL[b.tier]}</span>
          </div>
          <div className="b-practice-cols">
            <div>
              <h4>ما تحتاجه</h4>
              <ul>{b.needs.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ul>
            </div>
            <div>
              <h4>الخطوات</h4>
              <ol>{b.steps.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ol>
            </div>
          </div>
          <div className="b-practice-safety">
            <h4><IconShield size={18} /> قبل أن تبدأ</h4>
            <ul>{b.safety.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ul>
          </div>
        </div>
      );
  }
}

export function ConceptView({ step, showDarija }: { step: ConceptStep; showDarija: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="concept">
      <h2 className="step-title">{step.title}</h2>
      {step.blocks.map((b, i) => <BlockView key={i} b={b} />)}
      {showDarija && step.darija && (
        <div className="darija">
          <button type="button" className="darija-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <IconChat size={18} /> {open ? 'إخفاء الشرح بالدارجة' : 'شرح بالدارجة'}
          </button>
          {open && <p className="darija-text" lang="ar-MA">{step.darija}</p>}
        </div>
      )}
    </div>
  );
}
