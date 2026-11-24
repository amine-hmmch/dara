import { useEffect, useRef, useState } from 'react';
import { TERM_BY_ID } from '../data/glossary';

// Renders the lesson markup as React nodes (never as HTML):
//   **bold**   [[termId]] / [[termId|words]]   {{ltr value}}
const TOKEN = /\*\*(.+?)\*\*|\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]|\{\{(.+?)\}\}/g;

// A Western-digit value followed by a Latin unit ("9 V", "20 mA", "1.5–9 V") inside
// Arabic text is split by the bidi algorithm and shows as "V 9". Wrapping it in
// Unicode isolates (LRI … PDI) keeps it in reading order.
const VALUE_UNIT =
  /\d[\d.,]*(?:\s?[–-]\s?\d[\d.,]*)?\s?(?:kWh|mA|µA|kΩ|MΩ|mW|µF|Hz|°C|mm|Wh|V|A|Ω|W|C|F|s|h)(?![A-Za-z])/g;
export const bidi = (s: string) => s.replace(VALUE_UNIT, (m) => `⁦${m}⁩`);

export function Rich({ text }: { text: string }) {
  return <>{parse(text, 'r')}</>;
}

function parse(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(bidi(text.slice(last, at)));
    const k = `${key}-${i++}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{parse(m[1], k)}</strong>);
    else if (m[2] !== undefined) out.push(<TermChip key={k} id={m[2]} label={m[3]} />);
    else if (m[4] !== undefined) out.push(<Ltr key={k}>{m[4]}</Ltr>);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(bidi(text.slice(last)));
  return out;
}

export function Ltr({ children }: { children: React.ReactNode }) {
  return <bdi dir="ltr" className="ltr">{children}</bdi>;
}

export function TermChip({ id, label }: { id: string; label?: string }) {
  const term = TERM_BY_ID[id];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (!term) return <>{label ?? id}</>;
  return (
    <span className="term" ref={ref}>
      <button type="button" className="term-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label ?? term.ar}
      </button>
      {open && (
        <span className="term-pop" role="dialog" aria-label={term.ar}>
          <span className="term-pop-ar">{term.ar}</span>
          <span className="term-pop-langs">
            <bdi dir="ltr"><span className="lang">FR</span> {term.fr}</bdi>
            <bdi dir="ltr"><span className="lang">EN</span> {term.en}</bdi>
          </span>
          <span className="term-pop-def">{term.def}</span>
          {(term.symbol || term.unit) && (
            <span className="term-pop-meta">
              {term.symbol && <>الرمز: <Ltr>{term.symbol}</Ltr></>}
              {term.symbol && term.unit && ' · '}
              {term.unit && <>الوحدة: <Ltr>{term.unit}</Ltr></>}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/** Term name with its French and English names, for headers and lists. */
export function TermNames({ id }: { id: string }) {
  const t = TERM_BY_ID[id];
  if (!t) return null;
  return (
    <span className="term-names">
      <span>{t.ar}</span>
      <bdi dir="ltr" className="term-names-latin">{t.fr} · {t.en}</bdi>
    </span>
  );
}
