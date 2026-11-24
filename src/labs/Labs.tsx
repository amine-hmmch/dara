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
};

export function Lab({ id, ...p }: LabProps & { id: LabId }) {
  switch (id) {
    case 'ohm': return <OhmLab {...p} />;
    case 'led': return <LedLab {...p} />;
    case 'series-parallel': return <SeriesParallelLab {...p} />;
    case 'multimeter': return <MultimeterLab {...p} />;
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
