import { useEffect, useMemo, useState } from 'react';
import { E12, si, solve } from '../lib/circuit';
import { Ltr, bidi } from '../components/Rich';
import { Battery, resH, resV } from '../components/Figures';
import { IconCheck, IconWarn } from '../components/Icons';
import type { LabGoal, LabId } from '../types';

export type LabProps = { goal?: LabGoal; onGoal?: () => void; onInteract?: () => void };

export const LAB_INFO: Record<LabId, { title: string; summary: string; tier: string }> = {
  ohm: { title: 'مختبر قانون أوم', summary: 'غيّر الجهد والمقاومة وشاهد التيار.', tier: 'محاكاة' },
  led: { title: 'مختبر LED ومقاومه', summary: 'اختر المقاوم الذي يحمي LED.', tier: 'محاكاة' },
  'series-parallel': { title: 'التوالي والتوازي', summary: 'كيف يتقاسم المقاومان الجهد أو التيار.', tier: 'محاكاة' },
  multimeter: { title: 'مدرّب الملتيمتر', summary: 'وصّل الجهاز بشكل صحيح، وشاهد عواقب الخطأ.', tier: 'محاكاة' },
  'color-code': { title: 'فكّ ألوان المقاومات', summary: 'ركّب الألوان واقرأ القيمة، ثم تحدَّ نفسك.', tier: 'محاكاة' },
  rc: { title: 'شحن المكثّف وتفريغه', summary: 'منحنى RC والثابت الزمني τ.', tier: 'محاكاة' },
  transistor: { title: 'الترانزستور كمفتاح', summary: 'اختر مقاوم القاعدة ليُشبع الترانزستور حتى في أسوأ حالة.', tier: 'محاكاة' },
};

export function Lab({ id, ...p }: LabProps & { id: LabId }) {
  switch (id) {
    case 'ohm': return <OhmLab {...p} />;
    case 'led': return <LedLab {...p} />;
    case 'series-parallel': return <SeriesParallelLab {...p} />;
    case 'multimeter': return <MultimeterLab {...p} />;
    case 'color-code': return <ColorCodeLab {...p} />;
    case 'rc': return <RcLab {...p} />;
    case 'transistor': return <TransistorLab {...p} />;
  }
}

// ───────────────────────────── shared controls

const R_RANGE = E12.filter((r) => r >= 10 && r <= 10000);

function Slider({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string;
}) {
  return (
    <label className="slider">
      <span className="slider-head"><span>{label}</span><Ltr>{display}</Ltr></span>
      <input type="range" min={min} max={max} step={step} value={value} dir="ltr"
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function RSlider({ label, value, onChange, range = R_RANGE }: { label: string; value: number; onChange: (r: number) => void; range?: number[] }) {
  const i = Math.max(0, range.indexOf(value));
  return <Slider label={label} value={i} min={0} max={range.length - 1} step={1} onChange={(k) => onChange(range[k])} display={si(value, 'Ω')} />;
}

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: [T, string][]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {bidi(text)}
        </button>
      ))}
    </div>
  );
}

function Readout({ label, value, tone }: { label: string; value: string; tone?: 'main' | 'warn' | 'ok' }) {
  return (
    <div className={`readout ${tone ?? ''}`}>
      <span className="readout-label">{label}</span>
      <Ltr>{value}</Ltr>
    </div>
  );
}

/** Animated charge dots along a loop; speed follows the current. */
function Flow({ d, current, maxCurrent }: { d: string; current: number; maxCurrent: number }) {
  if (current <= 1e-6) return null;
  const k = Math.min(1, Math.log10(1 + (current / maxCurrent) * 99) / 2);
  const dur = (6 - 5 * k).toFixed(2) + 's';
  return (
    <g className="flow">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} r="3.2" className="flow-dot">
          <animateMotion dur={dur} repeatCount="indefinite" path={d} begin={`-${(i * 6 - 5 * k * i) / 6}s`} />
        </circle>
      ))}
    </g>
  );
}

// ───────────────────────────── Ohm

function OhmLab({ onInteract }: LabProps) {
  const [u, setU] = useState(9);
  const [r, setR] = useState(470);
  const i = u / r;
  const touch = <T,>(f: (v: T) => void) => (v: T) => { f(v); onInteract?.(); };
  const loop = 'M50 60V24H270V136H50V96';
  return (
    <div className="lab">
      <div className="lab-stage">
        <svg viewBox="0 0 320 160" className="lab-svg" direction="ltr" role="img" aria-label={`بطارية ${u} فولط ومقاومة ${r} أوم`}>
          <path d="M50 64V24H130M174 24H270V136H50V96" className="fig-wire" />
          <Battery x={50} y={70} />
          <path d={resH(130, 24)} className="fig-comp" />
          <Flow d={loop} current={i} maxCurrent={1.2} />
          <text x="20" y="88" className="fig-label" textAnchor="middle">{u} V</text>
          <text x="152" y="54" className="fig-label" textAnchor="middle">{si(r, 'Ω')}</text>
          <text x="290" y="84" className="fig-label" textAnchor="middle">I</text>
        </svg>
        <div className="lab-readouts">
          <Readout label="التيار I" value={si(i, 'A')} tone="main" />
          <Readout label="القدرة P" value={si(u * i, 'W')} />
        </div>
      </div>
      <div className="lab-equation" dir="ltr">
        I = U ÷ R = {u} V ÷ {si(r, 'Ω')} = <strong>{si(i, 'A')}</strong>
      </div>
      <div className="lab-controls">
        <Slider label="الجهد U" value={u} min={0} max={12} step={0.5} onChange={touch(setU)} display={`${u} V`} />
        <RSlider label="المقاومة R" value={r} onChange={touch(setR)} />
        <div className="lab-quick">
          <button type="button" className="btn-ghost" disabled={u * 2 > 12} onClick={() => touch(setU)(u * 2)}>ضاعِف U</button>
          <button type="button" className="btn-ghost" disabled={r * 2 > 10000} onClick={() => touch(setR)(R_RANGE.find((x) => x >= r * 2 - 1e-9) ?? r)}>ضاعِف R (تقريبًا)</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── LED

const LEDS = { red: { vf: 2.0, name: 'أحمر', color: '#E5483B' }, green: { vf: 2.2, name: 'أخضر', color: '#2FAF5C' }, blue: { vf: 3.0, name: 'أزرق', color: '#3A7BEA' } };
type LedColor = keyof typeof LEDS;
const LED_ABS_MAX = 0.03; // typical absolute maximum for a 5 mm indicator LED
const LED_RANGE = E12.filter((r) => r >= 22 && r <= 4700);

function LedLab({ goal, onGoal, onInteract }: LabProps) {
  const [supply, setSupply] = useState<'5' | '9'>('9');
  const [color, setColor] = useState<LedColor>('red');
  const [r, setR] = useState(1000);
  const [burnt, setBurnt] = useState(false);
  const [reached, setReached] = useState(false);
  const u = Number(supply);
  const led = LEDS[color];
  const i = burnt ? 0 : Math.max(0, (u - led.vf) / r);
  const pR = i * i * r;
  const touch = <T,>(f: (v: T) => void) => (v: T) => { f(v); onInteract?.(); };

  useEffect(() => {
    if (!burnt && (u - led.vf) / r > LED_ABS_MAX) setBurnt(true);
  }, [u, led.vf, r, burnt]);

  const inGoal = goal?.type === 'led-current' && !burnt && i >= goal.min - 1e-9 && i <= goal.max + 1e-9;
  useEffect(() => {
    if (inGoal && !reached) {
      setReached(true);
      onGoal?.();
    }
  }, [inGoal, reached, onGoal]);

  const glow = burnt ? 0 : Math.min(1, i / 0.02);
  const status = burnt
    ? { tone: 'warn' as const, text: `احترق LED: التيار تجاوز حوالي ${si(LED_ABS_MAX, 'A')}. سيبقى محترقًا حتى لو رفعت المقاومة الآن.` }
    : i > 0.02
      ? { tone: 'warn' as const, text: 'فوق التيار الموصى به (20 mA). سيسخن ويقصر عمره.' }
      : i < 0.002
        ? { tone: undefined, text: 'التيار صغير جدًا: الضوء خافت أو منعدم.' }
        : { tone: 'ok' as const, text: 'تيار مناسب.' };

  return (
    <div className="lab">
      <div className="lab-stage">
        <svg viewBox="0 0 320 160" className="lab-svg" direction="ltr" role="img" aria-label="دارة LED مع مقاوم">
          <path d="M50 64V24H120M164 24H236M236 62V136H50V96" className="fig-wire" />
          <Battery x={50} y={70} />
          <path d={resH(120, 24)} className="fig-comp" />
          <path d="M236 24V40" className="fig-wire" />
          {/* LED symbol: triangle + bar */}
          <path d="M224 40H248L236 60Z" className="fig-comp" fill={burnt ? '#5b524a' : led.color} fillOpacity={burnt ? 1 : 0.25 + 0.75 * glow} />
          <path d="M224 62H248" className="fig-comp" strokeWidth="3" />
          {!burnt && glow > 0.05 && <circle cx="236" cy="50" r={14 + 18 * glow} fill={led.color} opacity={0.12 + 0.25 * glow} />}
          {burnt && <path d="M228 44l6 6-4 3 7 6" stroke="#fff" strokeWidth="1.5" fill="none" />}
          <Flow d="M50 60V24H236V136H50V96" current={i} maxCurrent={0.05} />
          <text x="20" y="88" className="fig-label" textAnchor="middle">{u} V</text>
          <text x="142" y="54" className="fig-label" textAnchor="middle">{si(r, 'Ω')}</text>
          <text x="266" y="56" className="fig-small">{led.vf} V</text>
        </svg>
        <div className="lab-readouts">
          <Readout label="تيار LED" value={si(i, 'A')} tone={burnt || i > 0.02 ? 'warn' : inGoal ? 'ok' : 'main'} />
          <Readout label="قدرة المقاوم" value={si(pR, 'W')} tone={pR > 0.125 ? 'warn' : undefined} />
        </div>
      </div>
      <p className={`lab-status ${status.tone ?? ''}`}>
        {status.tone === 'warn' ? <IconWarn size={18} /> : status.tone === 'ok' ? <IconCheck size={18} /> : null}
        {bidi(status.text)}
      </p>
      <div className="lab-equation" dir="ltr">
        I = (U − U_LED) ÷ R = ({u} − {led.vf}) ÷ {si(r, 'Ω')} = <strong>{si(Math.max(0, (u - led.vf) / r), 'A')}</strong>
      </div>
      <div className="lab-controls">
        <div className="lab-row">
          <Segmented label="المصدر" value={supply} options={[['5', 'شاحن USB 5 V'], ['9', 'بطارية 9 V']]} onChange={touch(setSupply)} />
          <Segmented label="لون LED" value={color} options={(Object.keys(LEDS) as LedColor[]).map((k) => [k, LEDS[k].name])} onChange={touch(setColor)} />
        </div>
        <RSlider label="المقاوم R" value={r} onChange={touch(setR)} range={LED_RANGE} />
        {burnt && <button type="button" className="btn-secondary" onClick={() => setBurnt(false)}>استبدل LED</button>}
      </div>
      {goal?.type === 'led-current' && (
        <p className={`lab-goal ${reached ? 'done' : ''}`}>
          {reached ? <IconCheck size={18} /> : null}
          الهدف: تيار بين <Ltr>{si(goal.min, 'A')}</Ltr> و <Ltr>{si(goal.max, 'A')}</Ltr> دون أن يحترق LED.
        </p>
      )}
    </div>
  );
}

// ───────────────────────────── Series / parallel

function SeriesParallelLab({ onInteract }: LabProps) {
  const [mode, setMode] = useState<'series' | 'parallel'>('series');
  const [u, setU] = useState(12);
  const [r1, setR1] = useState(1000);
  const [r2, setR2] = useState(2200);
  const touch = <T,>(f: (v: T) => void) => (v: T) => { f(v); onInteract?.(); };

  const res = useMemo(() => {
    if (mode === 'series') {
      const s = solve(3, [
        { type: 'V', a: 1, b: 0, v: u },
        { type: 'R', a: 1, b: 2, r: r1 },
        { type: 'R', a: 2, b: 0, r: r2 },
      ]);
      return { u1: s.v[1] - s.v[2], u2: s.v[2], i1: s.i[1], i2: s.i[2], i: s.i[0] };
    }
    const s = solve(2, [
      { type: 'V', a: 1, b: 0, v: u },
      { type: 'R', a: 1, b: 0, r: r1 },
      { type: 'R', a: 1, b: 0, r: r2 },
    ]);
    return { u1: s.v[1], u2: s.v[1], i1: s.i[1], i2: s.i[2], i: s.i[0] };
  }, [mode, u, r1, r2]);

  const req = u / res.i;
  const share = mode === 'series' ? res.u1 / u : res.i1 / res.i;
  return (
    <div className="lab">
      <Segmented label="نوع التركيب" value={mode} options={[['series', 'على التوالي'], ['parallel', 'على التوازي']]} onChange={touch(setMode)} />
      <div className="lab-stage">
        <svg viewBox="0 0 320 160" className="lab-svg" direction="ltr" role="img" aria-label={mode === 'series' ? 'مقاومان على التوالي' : 'مقاومان على التوازي'}>
          {mode === 'series' ? (
            <>
              <path d="M50 64V24H100M144 24H180M224 24H270V136H50V96" className="fig-wire" />
              <path d={resH(100, 24)} className="fig-comp r1" />
              <path d={resH(180, 24)} className="fig-comp r2" />
              <text x="122" y="52" className="fig-label" textAnchor="middle">R1</text>
              <text x="202" y="52" className="fig-label" textAnchor="middle">R2</text>
              <Flow d="M50 60V24H270V136H50V96" current={res.i} maxCurrent={0.6} />
            </>
          ) : (
            <>
              <path d="M50 64V24H250V58M170 24V58M170 102V136M250 102V136H50V96" className="fig-wire" />
              <path d={resV(170, 58)} className="fig-comp r1" />
              <path d={resV(250, 58)} className="fig-comp r2" />
              <text x="190" y="84" className="fig-label">R1</text>
              <text x="270" y="84" className="fig-label">R2</text>
              <Flow d="M50 60V24H170V136H50V96" current={res.i1} maxCurrent={0.6} />
              <Flow d="M50 60V24H250V136H50V96" current={res.i2} maxCurrent={0.6} />
            </>
          )}
          <Battery x={50} y={70} />
          <text x="20" y="88" className="fig-label" textAnchor="middle">{u} V</text>
        </svg>
        <div className="lab-readouts">
          <Readout label="المقاومة المكافئة" value={si(req, 'Ω')} tone="main" />
          <Readout label="التيار الكلي" value={si(res.i, 'A')} />
        </div>
      </div>

      <div className="split" aria-label={mode === 'series' ? 'تقاسم الجهد' : 'تقاسم التيار'}>
        <div className="split-head">{mode === 'series' ? 'كيف يتقاسم المقاومان الجهد' : 'كيف يتوزّع التيار على الفرعين'}</div>
        <div className="split-bar" dir="ltr">
          <div className="split-a" style={{ width: `${share * 100}%` }}><Ltr>R1 · {mode === 'series' ? si(res.u1, 'V') : si(res.i1, 'A')}</Ltr></div>
          <div className="split-b" style={{ width: `${(1 - share) * 100}%` }}><Ltr>R2 · {mode === 'series' ? si(res.u2, 'V') : si(res.i2, 'A')}</Ltr></div>
        </div>
        <p className="split-note">
          {mode === 'series'
            ? 'نفس التيار في المقاومين؛ المقاوم الأكبر يأخذ جهدًا أكبر.'
            : 'نفس الجهد على الفرعين؛ الفرع ذو المقاومة الأصغر يحمل تيارًا أكبر.'}
        </p>
      </div>

      <div className="lab-controls">
        <Slider label="جهد المصدر U" value={u} min={1} max={12} step={0.5} onChange={touch(setU)} display={`${u} V`} />
        <RSlider label="R1" value={r1} onChange={touch(setR1)} range={E12.filter((r) => r >= 100 && r <= 10000)} />
        <RSlider label="R2" value={r2} onChange={touch(setR2)} range={E12.filter((r) => r >= 100 && r <= 10000)} />
      </div>
    </div>
  );
}

// ───────────────────────────── Multimeter trainer

type Dial = 'V' | 'A' | 'R';
type Place = 'acrossR' | 'acrossB' | 'series';

const MM_U = 9;
const MM_R = 450;

type Outcome = { display: string; tone: 'ok' | 'warn' | 'info'; text: string; correct?: Dial; blows?: boolean };

function outcome(dial: Dial, place: Place, powered: boolean): Outcome {
  if (dial === 'V') {
    if (!powered) return { display: '0.00 V', tone: 'info', text: 'البطارية مفصولة: لا جهد لتقيسه. الجهد يُقاس والدارة مُغذّاة.' };
    if (place === 'series') return { display: '9.00 V', tone: 'warn', text: 'مقياس الجهد في المسار يقطع التيار تقريبًا (مقاومته كبيرة جدًا): الدارة تتوقف، والجهاز يعرض جهد البطارية. هذا ليس قياسًا لجهد المقاوم.' };
    return { display: '9.00 V', tone: 'ok', text: place === 'acrossR' ? 'صحيح: الجهد على طرفي المقاوم. حمل وحيد ⇒ كل جهد البطارية عليه.' : 'صحيح: جهد البطارية.', correct: 'V' };
  }
  if (dial === 'A') {
    if (!powered) return { display: '0.0 mA', tone: 'info', text: 'البطارية مفصولة: لا تيار.' };
    if (place === 'series') return { display: '20.0 mA', tone: 'ok', text: 'صحيح: الجهاز داخل المسار، فكل التيار يمرّ عبره. I = 9 ÷ 450 = 20 mA.', correct: 'A' };
    return {
      display: '- - - -', tone: 'warn', blows: true,
      text: place === 'acrossB'
        ? 'دارة قصيرة! مقياس التيار شبه سلك، فوصلته مباشرة بطرفي البطارية. احترق المصهر الداخلي للجهاز.'
        : 'دارة قصيرة على المقاوم! كل التيار مرّ عبر الجهاز بدل المقاوم، فاحترق مصهره.',
    };
  }
  // Ohms
  if (powered) return { display: 'Err', tone: 'warn', text: 'لا تقس المقاومة على دارة مُغذّاة: القراءة خاطئة، وقد يتلف الجهاز. افصل البطارية أولًا.' };
  if (place === 'acrossR') return { display: '450 Ω', tone: 'ok', text: 'صحيح: الدارة غير مُغذّاة، والمقاوم وحده بين المِسبارين.', correct: 'R' };
  if (place === 'acrossB') return { display: 'Err', tone: 'warn', text: 'لا معنى لقياس «مقاومة» بطارية بهذا الوضع؛ الجهاز ليس مصمّمًا لذلك.' };
  return { display: 'OL', tone: 'info', text: 'في هذا الوضع يقيس الجهاز فجوة مفتوحة في المسار: OL تعني مقاومة أكبر من مجاله.' };
}

function MultimeterLab({ goal, onGoal, onInteract }: LabProps) {
  const [dial, setDial] = useState<Dial>('V');
  const [place, setPlace] = useState<Place>('acrossR');
  const [powered, setPowered] = useState(true);
  const [fuse, setFuse] = useState(true);
  const [done, setDone] = useState<Set<Dial>>(new Set());
  const touch = <T,>(f: (v: T) => void) => (v: T) => { f(v); onInteract?.(); };

  const out = outcome(dial, place, powered);
  const dead = !fuse && dial === 'A';

  useEffect(() => {
    if (out.blows && fuse) setFuse(false);
  }, [out.blows, fuse]);

  useEffect(() => {
    if (!dead && out.correct && !done.has(out.correct)) {
      const next = new Set(done).add(out.correct);
      setDone(next);
      if (goal?.type === 'meter-correct' && out.correct === goal.quantity) onGoal?.();
    }
  }, [out.correct, dead, done, goal, onGoal]);

  const meter = { acrossR: { x: 152, y: 92 }, acrossB: { x: 108, y: 82 }, series: { x: 222, y: 24 } }[place];
  return (
    <div className="lab">
      <div className="lab-stage">
        <svg viewBox="0 0 320 160" className="lab-svg" direction="ltr" role="img" aria-label="دارة بطارية 9 فولط ومقاوم 450 أوم مع ملتيمتر">
          {place === 'series'
            ? <path d="M50 64V24H130M174 24H202M242 24H270V136H50V96" className="fig-wire" />
            : <path d="M50 64V24H130M174 24H270V136H50V96" className="fig-wire" />}
          {powered ? <Battery x={50} y={70} /> : (
            <g><Battery x={50} y={70} /><path d="M38 60l24 -8" className="fig-cut" /></g>
          )}
          <path d={resH(130, 24)} className="fig-comp" />
          <text x="152" y="54" className="fig-label" textAnchor="middle">450 Ω</text>
          <text x="20" y="88" className="fig-label" textAnchor="middle">9 V</text>
          {place === 'acrossR' && <path d="M126 24V92H134M178 24V92H170" className="fig-probe" />}
          {place === 'acrossB' && <path d="M50 52V40H92V76M50 100V120H108V100" className="fig-probe" />}
          <circle cx={meter.x} cy={meter.y} r="18" className={`fig-meter ${out.tone === 'warn' ? 'bad' : ''}`} />
          <text x={meter.x} y={meter.y + 6} className="fig-meter-letter" textAnchor="middle">{dial === 'R' ? 'Ω' : dial}</text>
          {powered && !dead && !(dial === 'V' && place === 'series') && !(dial === 'A' && place !== 'series') && (
            <Flow d="M50 60V24H270V136H50V96" current={MM_U / MM_R} maxCurrent={0.2} />
          )}
        </svg>
        <div className={`lcd ${out.tone === 'warn' || dead ? 'bad' : ''}`} dir="ltr" aria-live="polite">
          {dead ? 'FUSE' : out.display}
        </div>
      </div>

      <p className={`lab-status ${dead ? 'warn' : out.tone === 'info' ? '' : out.tone}`}>
        {dead ? 'مصهر الجهاز محترق. في الواقع ستحتاج إلى مصهر بنفس القيمة والنوع.' : bidi(out.text)}
      </p>
      {!fuse && <button type="button" className="btn-secondary" onClick={() => { setFuse(true); setDial('V'); setPlace('acrossR'); }}>استبدل المصهر وأعد المِسبار إلى V</button>}

      <div className="lab-controls">
        <div className="control-label">وضع الجهاز</div>
        <Segmented label="وضع الجهاز" value={dial} options={[['V', 'جهد V⎓'], ['A', 'تيار A'], ['R', 'مقاومة Ω']]} onChange={touch(setDial)} />
        <div className="control-label">مكان المِسبارين</div>
        <Segmented label="مكان المِسبارين" value={place} options={[['acrossR', 'على طرفي المقاوم'], ['acrossB', 'على طرفي البطارية'], ['series', 'داخل المسار']]} onChange={touch(setPlace)} />
        <div className="control-label">البطارية</div>
        <Segmented label="البطارية" value={powered ? 'on' : 'off'} options={[['on', 'موصولة'], ['off', 'مفصولة']]} onChange={touch((v: 'on' | 'off') => setPowered(v === 'on'))} />
      </div>

      <ul className="badges" aria-label="القياسات الصحيحة">
        {([['V', 'قست الجهد'], ['A', 'قست التيار'], ['R', 'قست المقاومة']] as [Dial, string][]).map(([k, t]) => (
          <li key={k} className={done.has(k) ? 'done' : ''}>{done.has(k) ? <IconCheck size={16} /> : null}{t}</li>
        ))}
      </ul>
    </div>
  );
}


// ───────────────────────────── Colour code

const COLORS = [
  { name: 'أسود', hex: '#1C1C1C' }, { name: 'بنّي', hex: '#7A4A24' }, { name: 'أحمر', hex: '#D0312D' },
  { name: 'برتقالي', hex: '#E87D1E' }, { name: 'أصفر', hex: '#E8C200' }, { name: 'أخضر', hex: '#2E8B3E' },
  { name: 'أزرق', hex: '#2A62C9' }, { name: 'بنفسجي', hex: '#7B3FA0' }, { name: 'رمادي', hex: '#8A8A8A' },
  { name: 'أبيض', hex: '#F2F2F2' },
];
const GOLD = { name: 'ذهبي', hex: '#C9A227' };
const SILVER = { name: 'فضي', hex: '#B8B8B8' };
// multiplier index: 0..6 → 10^0..10^6, 7 → gold ×0.1, 8 → silver ×0.01
const MULTS = [...COLORS.slice(0, 7).map((c, i) => ({ ...c, f: 10 ** i })), { ...GOLD, f: 0.1 }, { ...SILVER, f: 0.01 }];
const TOLS = [{ ...COLORS[1], t: 1 }, { ...COLORS[2], t: 2 }, { ...GOLD, t: 5 }, { ...SILVER, t: 10 }];

/** "4.7k", "4,7 k", "470", "1M" → ohms; NaN if unreadable. */
export function parseOhms(input: string): number {
  const t = input.trim().replace(/\s/g, '').replace(',', '.').replace(/Ω|ohms?/gi, '');
  const m = /^(\d*\.?\d+)([kKmM]?)$/.exec(t);
  if (!m) return NaN;
  const mult = m[2] === 'k' || m[2] === 'K' ? 1e3 : m[2] === 'M' ? 1e6 : m[2] === 'm' ? 1e-3 : 1;
  return Number(m[1]) * mult;
}

/** Bands (digit1, digit2, multiplier index) for an E12 value ≥ 10 Ω. */
export function bandsFor(ohms: number): [number, number, number] {
  let exp = Math.floor(Math.log10(ohms)) - 1;
  let two = Math.round(ohms / 10 ** exp);
  if (two >= 100) { two = Math.round(two / 10); exp += 1; }
  return [Math.floor(two / 10), two % 10, exp];
}

function ResistorSvg({ bands }: { bands: string[] }) {
  return (
    <svg viewBox="0 0 320 90" className="lab-svg" direction="ltr" role="img" aria-label="مقاوم">
      <path d="M16 45H72M248 45H304" className="fig-wire" />
      <rect x="72" y="22" width="176" height="46" rx="20" className="fig-resbody" />
      {bands.map((c, i) => <rect key={i} x={i === 3 ? 212 : 98 + i * 28} y="22" width="15" height="46" fill={c} stroke="rgb(0 0 0 / .15)" />)}
    </svg>
  );
}

function Swatches({ label, items, value, onChange }: { label: string; items: { name: string; hex: string }[]; value: number; onChange: (i: number) => void }) {
  return (
    <div className="swatch-row">
      <span className="control-label">{label}</span>
      <div className="swatches" role="radiogroup" aria-label={label}>
        {items.map((c, i) => (
          <button key={c.name} type="button" role="radio" aria-checked={value === i} aria-label={c.name} title={c.name}
            className={`swatch ${value === i ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => onChange(i)} />
        ))}
      </div>
    </div>
  );
}

const CHALLENGE_VALUES = E12.filter((r) => r >= 10 && r <= 1000000);

function ColorCodeLab({ goal, onGoal, onInteract }: LabProps) {
  const [d1, setD1] = useState(4);
  const [d2, setD2] = useState(7);
  const [mi, setMi] = useState(2);
  const [ti, setTi] = useState(2);
  const [challenge, setChallenge] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null);
  const [streak, setStreak] = useState(0);
  const [reached, setReached] = useState(false);
  const touch = <T,>(f: (v: T) => void) => (v: T) => { f(v); onInteract?.(); };

  const value = (d1 * 10 + d2) * MULTS[mi].f;
  const tol = TOLS[ti].t;
  const target = goal?.type === 'color-streak' ? goal.count : 3;

  const newChallenge = () => {
    setChallenge(CHALLENGE_VALUES[Math.floor(Math.random() * CHALLENGE_VALUES.length)]);
    setAnswer('');
    setVerdict(null);
    onInteract?.();
  };
  const check = () => {
    if (challenge === null) return;
    const x = parseOhms(answer);
    if (Number.isNaN(x)) { setVerdict({ ok: false, text: 'اكتب القيمة بالأوم، مثل 4700 أو 4.7k.' }); return; }
    const ok = Math.abs(x - challenge) <= challenge * 0.001;
    const n = ok ? streak + 1 : 0;
    setStreak(n);
    setVerdict({ ok, text: ok ? 'صحيح.' : `ليس تمامًا: القيمة ${si(challenge, 'Ω')}.` });
    if (ok && n >= target && !reached) { setReached(true); onGoal?.(); }
  };

  const cb = challenge !== null ? bandsFor(challenge) : null;
  return (
    <div className="lab">
      {challenge === null ? (
        <>
          <ResistorSvg bands={[COLORS[d1].hex, COLORS[d2].hex, MULTS[mi].hex, TOLS[ti].hex]} />
          <div className="lab-readouts row">
            <Readout label="القيمة" value={si(value, 'Ω')} tone="main" />
            <Readout label="التفاوت" value={`±${tol} %`} />
            <Readout label="المجال" value={`${si(value * (1 - tol / 100), 'Ω')} – ${si(value * (1 + tol / 100), 'Ω')}`} />
          </div>
          <div className="lab-controls">
            <Swatches label="الرقم الأول" items={COLORS.slice(1)} value={d1 - 1} onChange={touch((i: number) => setD1(i + 1))} />
            <Swatches label="الرقم الثاني" items={COLORS} value={d2} onChange={touch(setD2)} />
            <Swatches label="المضاعِف" items={MULTS} value={mi} onChange={touch(setMi)} />
            <Swatches label="التفاوت" items={TOLS} value={ti} onChange={touch(setTi)} />
          </div>
          <button type="button" className="btn-secondary" onClick={newChallenge}>تحدٍّ: اقرأ مقاومًا عشوائيًا</button>
        </>
      ) : (
        <>
          <ResistorSvg bands={[COLORS[cb![0]].hex, COLORS[cb![1]].hex, MULTS[cb![2]].hex, GOLD.hex]} />
          <form className="challenge" onSubmit={(e) => { e.preventDefault(); verdict ? newChallenge() : check(); }}>
            <label className="numeric-field">
              <span className="sr-only">القيمة</span>
              <input dir="ltr" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="4.7k" disabled={!!verdict} autoComplete="off" />
              <Ltr>Ω</Ltr>
            </label>
            <button type="submit" className="btn-primary">{verdict ? 'التالي' : 'تحقّق'}</button>
          </form>
          {verdict && <p className={`lab-status ${verdict.ok ? 'ok' : 'warn'}`}>{bidi(verdict.text)}</p>}
          <p className="muted">يمكنك الكتابة بالأوم (4700) أو بالبادئة (4.7k، 1M).</p>
          <button type="button" className="btn-ghost" onClick={() => { setChallenge(null); setVerdict(null); }}>العودة إلى المفكّك</button>
        </>
      )}
      <p className={`lab-goal ${reached ? 'done' : ''}`}>
        {reached ? <IconCheck size={18} /> : null}
        {goal?.type === 'color-streak' ? <>الهدف: {target} قراءات صحيحة متتالية في وضع التحدّي. </> : null}
        السلسلة الحالية: <bdi>{streak}</bdi>
      </p>
    </div>
  );
}

// ───────────────────────────── RC

const CAPS = [10e-6, 47e-6, 100e-6, 220e-6, 470e-6, 1000e-6];
const uF = (c: number) => `${Math.round(c * 1e6)} µF`;

function RcLab({ onInteract }: LabProps) {
  const [r, setR] = useState(10000);
  const [ci, setCi] = useState(5);
  const [mode, setMode] = useState<'charge' | 'discharge'>('charge');
  const [k, setK] = useState(1);
  const touch = <T,>(f: (v: T) => void) => (v: T) => { f(v); onInteract?.(); };
  const U = 9;
  const c = CAPS[ci];
  const tau = r * c;
  const v = (x: number) => (mode === 'charge' ? U * (1 - Math.exp(-x)) : U * Math.exp(-x));
  const W = 300, H = 150, x0 = 34, y0 = 12, pw = W - x0 - 10, ph = H - y0 - 26;
  const X = (x: number) => x0 + (x / 5) * pw;
  const Y = (volts: number) => y0 + ph - (volts / U) * ph;
  const d = Array.from({ length: 101 }, (_, i) => i * 0.05).map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(v(x)).toFixed(1)}`).join('');
  return (
    <div className="lab">
      <Segmented label="الوضع" value={mode} options={[['charge', 'شحن'], ['discharge', 'تفريغ']]} onChange={touch(setMode)} />
      <div className="lab-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lab-svg" direction="ltr" role="img" aria-label="منحنى جهد المكثّف">
          {[0, 0.63, 1].map((f) => <line key={f} x1={x0} x2={x0 + pw} y1={Y(U * f)} y2={Y(U * f)} className="chart-grid" />)}
          {[1, 2, 3, 4, 5].map((n) => (
            <g key={n}>
              <line x1={X(n)} x2={X(n)} y1={y0} y2={y0 + ph} className="chart-grid" />
              <text x={X(n)} y={H - 8} className="fig-small" textAnchor="middle">{n}τ</text>
            </g>
          ))}
          <text x={x0 - 6} y={Y(U) + 4} className="fig-small" textAnchor="end">9 V</text>
          <text x={x0 - 6} y={Y(U * 0.63) + 4} className="fig-small" textAnchor="end">63%</text>
          <text x={x0 - 6} y={Y(0) + 4} className="fig-small" textAnchor="end">0</text>
          <path d={d} className="chart-line" />
          <line x1={X(k)} x2={X(k)} y1={y0} y2={y0 + ph} className="chart-cursor" />
          <circle cx={X(k)} cy={Y(v(k))} r="5" className="chart-dot" />
        </svg>
        <div className="lab-readouts">
          <Readout label="الثابت الزمني τ" value={si(tau, 's')} tone="main" />
          <Readout label="جهد المكثّف" value={`${v(k).toFixed(2)} V`} />
          <Readout label="الزمن" value={`${si(k * tau, 's')} (${k.toFixed(2)}τ)`} />
        </div>
      </div>
      <div className="lab-equation" dir="ltr">τ = R × C = {si(r, 'Ω')} × {uF(c)} = <strong>{si(tau, 's')}</strong></div>
      <div className="lab-controls">
        <Slider label="الزمن" value={k} min={0} max={5} step={0.05} onChange={touch(setK)} display={`${k.toFixed(2)}τ`} />
        <RSlider label="R" value={r} onChange={touch(setR)} range={E12.filter((x) => x >= 1000 && x <= 100000)} />
        <Segmented label="C" value={String(ci)} options={CAPS.map((x, i) => [String(i), uF(x)] as [string, string])} onChange={touch((s: string) => setCi(Number(s)))} />
      </div>
    </div>
  );
}

// ───────────────────────────── Transistor switch

const LOADS = {
  led: { name: 'LED ومقاوم 330 Ω', rl: 330, vd: 2 },
  relay: { name: 'وشيعة مرحّل 9 V (160 Ω)', rl: 160, vd: 0 },
};
type LoadKey = keyof typeof LOADS;

export function bjtSwitch(vin: number, rb: number, beta: number, load: { rl: number; vd: number }, vcc = 9) {
  const vbe = 0.7, vsat = 0.2;
  const ib = vin > vbe ? (vin - vbe) / rb : 0;
  const need = (vcc - load.vd - vsat) / load.rl;
  if (ib === 0) return { ib, ic: 0, vce: vcc - load.vd, p: 0, state: 'off' as const, need, overdrive: 0 };
  const avail = beta * ib;
  if (avail >= need) return { ib, ic: need, vce: vsat, p: vsat * need, state: 'sat' as const, need, overdrive: avail / need };
  const vce = vcc - load.vd - avail * load.rl;
  return { ib, ic: avail, vce, p: vce * avail, state: 'active' as const, need, overdrive: avail / need };
}

function TransistorLab({ goal, onGoal, onInteract }: LabProps) {
  const [vin, setVin] = useState<'0' | '3.3' | '5'>('5');
  const [rb, setRb] = useState(47000);
  const [beta, setBeta] = useState<'110' | '300'>('300');
  const [load, setLoad] = useState<LoadKey>('relay');
  const [reached, setReached] = useState(false);
  const touch = <T,>(f: (v: T) => void) => (v: T) => { f(v); onInteract?.(); };

  const L = LOADS[load];
  const s = bjtSwitch(Number(vin), rb, Number(beta), L);
  const pinTooHigh = s.ib > 0.02;
  const worstOk = beta === '110' && s.state === 'sat' && !pinTooHigh;
  useEffect(() => {
    if (goal?.type === 'bjt-saturated-worst' && worstOk && !reached) { setReached(true); onGoal?.(); }
  }, [worstOk, reached, goal, onGoal]);

  const level = s.need ? s.ic / s.need : 0;
  const msg = s.state === 'off'
    ? { tone: '', text: 'لا تيار في القاعدة: الترانزستور مطفأ، والحمل لا يعمل.' }
    : s.state === 'sat'
      ? { tone: 'ok', text: `مُشبع: مفتاح مغلق جيد. الهامش ×${s.overdrive.toFixed(1)}${s.overdrive < 2 ? ' (ضيّق؛ الأفضل ×2 على الأقل)' : ''}.` }
      : { tone: 'warn', text: `غير مُشبع: الحمل يأخذ ${Math.round(level * 100)} % فقط من تياره، والترانزستور يبدّد ${si(s.p, 'W')} حرارة.` };
  const relayOn = load === 'relay' && level > 0.75;

  return (
    <div className="lab">
      <div className="lab-stage">
        <svg viewBox="0 0 320 170" className="lab-svg" direction="ltr" role="img" aria-label="ترانزستور NPN يقود حملًا">
          <text x="200" y="16" className="fig-small" textAnchor="middle">+9 V</text>
          <path d="M200 22V34M200 74V92" className="fig-wire" />
          <Flow d="M200 26V160" current={s.ic} maxCurrent={0.08} />
          <rect x="176" y="34" width="48" height="40" rx="8" className={load === 'relay' && relayOn ? 'fig-box-strong' : 'fig-box'} />
          {load === 'led'
            ? <circle cx="200" cy="54" r={8 + 8 * level} fill="#E5483B" opacity={0.15 + 0.75 * level} />
            : <text x="200" y="59" className="fig-small" textAnchor="middle">{relayOn ? 'ON' : 'RELAY'}</text>}
          <path d="M184 104V140" className="fig-comp" strokeWidth="4" />
          <path d="M184 112L200 96V92M184 132L200 148V160" className="fig-comp" />
          <path d="M40 122H84M128 122H184" className="fig-wire" />
          <path d={resH(84, 122)} className="fig-comp" />
          <text x="106" y="108" className="fig-small" textAnchor="middle">{si(rb, 'Ω')}</text>
          <text x="30" y="126" className="fig-label" textAnchor="end">{vin}V</text>
          <path d="M186 160H214" className="fig-ground" />
          {s.state === 'active' && <circle cx="192" cy="122" r="22" className="heat" />}
        </svg>
        <div className="lab-readouts">
          <Readout label={`تيار الحمل (يحتاج ${si(s.need, 'A')})`} value={si(s.ic, 'A')} tone={s.state === 'sat' ? 'ok' : s.state === 'active' ? 'warn' : 'main'} />
          <Readout label="Vce" value={`${s.vce.toFixed(2)} V`} />
          <Readout label="حرارة الترانزستور" value={si(s.p, 'W')} tone={s.state === 'active' ? 'warn' : undefined} />
        </div>
      </div>
      <p className={`lab-status ${msg.tone}`}>{bidi(msg.text)}</p>
      {pinTooHigh && <p className="lab-status warn">{bidi(`تيار القاعدة ${si(s.ib, 'A')}: كبير على مخرج متحكّم (عادةً لا يتجاوز حوالي 20 mA). كبّر Rb.`)}</p>}
      <div className="lab-equation" dir="ltr">
        Ib = ({vin} − 0.7) ÷ {si(rb, 'Ω')} = {si(s.ib, 'A')} · β×Ib = {si(Number(beta) * s.ib, 'A')}
      </div>
      <div className="lab-controls">
        <div className="lab-row">
          <Segmented label="جهد الدخل" value={vin} options={[['0', '0 V'], ['3.3', '3.3 V'], ['5', '5 V']]} onChange={touch(setVin)} />
          <Segmented label="β" value={beta} options={[['110', 'β أسوأ حالة 110'], ['300', 'β نموذجي 300']]} onChange={touch(setBeta)} />
        </div>
        <Segmented label="الحمل" value={load} options={(Object.keys(LOADS) as LoadKey[]).map((k) => [k, LOADS[k].name])} onChange={touch(setLoad)} />
        <RSlider label="مقاوم القاعدة Rb" value={rb} onChange={touch(setRb)} range={E12.filter((x) => x >= 100 && x <= 100000)} />
      </div>
      {goal?.type === 'bjt-saturated-worst' && (
        <p className={`lab-goal ${reached ? 'done' : ''}`}>
          {reached ? <IconCheck size={18} /> : null}
          الهدف: ترانزستور مُشبع مع β = 110، دون تجاوز تيار مخرج المتحكّم.
        </p>
      )}
    </div>
  );
}
