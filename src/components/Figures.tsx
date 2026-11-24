import type { FigureId } from '../types';

// Schematics stay left-to-right (dir="ltr"), as engineers read them everywhere.
// Wires use the ink colour; components get copper; labels are Latin symbols,
// Arabic only for plain-language annotations.

export const resH = (x: number, y: number, len = 44) => {
  const s = len / 8;
  let d = `M${x} ${y}`;
  for (let i = 0; i < 8; i++) d += ` L${x + s * (i + 0.5)} ${y + (i % 2 ? 7 : -7)}`;
  return d + ` L${x + len} ${y}`;
};
export const resV = (x: number, y: number, len = 44) => {
  const s = len / 8;
  let d = `M${x} ${y}`;
  for (let i = 0; i < 8; i++) d += ` L${x + (i % 2 ? 7 : -7)} ${y + s * (i + 0.5)}`;
  return d + ` L${x} ${y + len}`;
};

/** Vertical battery between y and y+16: long plate (+) on top. */
export const Battery = ({ x, y, label }: { x: number; y: number; label?: string }) => (
  <g>
    <line x1={x - 14} y1={y} x2={x + 14} y2={y} className="fig-comp" strokeWidth="3" />
    <line x1={x - 8} y1={y + 10} x2={x + 8} y2={y + 10} className="fig-comp" strokeWidth="5" />
    <text x={x - 22} y={y + 2} className="fig-small" textAnchor="end">+</text>
    {label && <text x={x - 22} y={y + 22} className="fig-label" textAnchor="end">{label}</text>}
  </g>
);

const Arrow = ({ d }: { d: string }) => <path d={d} className="fig-arrow" markerEnd="url(#fig-arrowhead)" />;

function Frame({ children, h = 170, label }: { children: React.ReactNode; h?: number; label: string }) {
  return (
    <svg viewBox={`0 0 320 ${h}`} className="fig-svg" role="img" aria-label={label} direction="ltr">
      <defs>
        <marker id="fig-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="fig-arrowhead" />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

export function Figure({ fig }: { fig: FigureId }) {
  switch (fig) {
    case 'simple-circuit':
      return (
        <Frame label="دارة بسيطة: بطارية ومفتاح ومصباح">
          <path d="M60 70V30H140M180 30H260V71M260 99V140H60V96" className="fig-wire" />
          <Battery x={60} y={76} label="U" />
          <line x1="140" y1="30" x2="176" y2="14" className="fig-comp" strokeWidth="3" />
          <circle cx="140" cy="30" r="3" className="fig-dot" />
          <circle cx="180" cy="30" r="3" className="fig-dot" />
          <circle cx="260" cy="85" r="14" className="fig-comp" />
          <path d="M250 75l20 20M270 75l-20 20" className="fig-comp" />
          <Arrow d="M110 140H80" />
          <text x="95" y="158" className="fig-label" textAnchor="middle">I</text>
        </Frame>
      );
    case 'series':
      return (
        <Frame label="مقاومان على التوالي">
          <path d="M60 70V30H110M154 30H190M234 30H270V140H60V96" className="fig-wire" />
          <Battery x={60} y={76} label="U" />
          <path d={resH(110, 30)} className="fig-comp" />
          <path d={resH(190, 30)} className="fig-comp" />
          <text x="132" y="16" className="fig-label" textAnchor="middle">R1</text>
          <text x="212" y="16" className="fig-label" textAnchor="middle">R2</text>
          <text x="132" y="56" className="fig-small" textAnchor="middle">U1</text>
          <text x="212" y="56" className="fig-small" textAnchor="middle">U2</text>
          <Arrow d="M270 70V110" />
          <text x="284" y="94" className="fig-label">I</text>
        </Frame>
      );
    case 'parallel':
      return (
        <Frame label="مقاومان على التوازي">
          <path d="M60 70V30H250V62M170 30V62M170 106V140M250 106V140H60V96" className="fig-wire" />
          <Battery x={60} y={76} label="U" />
          <path d={resV(170, 62)} className="fig-comp" />
          <path d={resV(250, 62)} className="fig-comp" />
          <circle cx="170" cy="30" r="3.5" className="fig-dot" />
          <circle cx="170" cy="140" r="3.5" className="fig-dot" />
          <text x="186" y="88" className="fig-label">R1</text>
          <text x="266" y="88" className="fig-label">R2</text>
          <Arrow d="M100 30H140" />
          <text x="120" y="20" className="fig-small" textAnchor="middle">I = I1 + I2</text>
          <text x="156" y="52" className="fig-small" textAnchor="end">I1</text>
          <text x="236" y="52" className="fig-small" textAnchor="end">I2</text>
        </Frame>
      );
    case 'divider':
      return (
        <Frame label="مقسّم الجهد">
          <path d="M60 70V24H200V38M200 82V100M200 144V152H60V96M200 91H280" className="fig-wire" />
          <Battery x={60} y={76} label="Uin" />
          <path d={resV(200, 38)} className="fig-comp" />
          <path d={resV(200, 100)} className="fig-comp" />
          <circle cx="200" cy="91" r="3.5" className="fig-dot" />
          <circle cx="280" cy="91" r="3.5" className="fig-dot" />
          <circle cx="280" cy="152" r="3.5" className="fig-dot" />
          <path d="M200 152H280" className="fig-wire" />
          <text x="216" y="64" className="fig-label">R1</text>
          <text x="216" y="126" className="fig-label">R2</text>
          <Arrow d="M292 146V98" />
          <text x="300" y="126" className="fig-label">Uout</text>
        </Frame>
      );
    case 'meter-voltage':
      return (
        <Frame label="قياس الجهد على التوازي">
          <path d="M60 70V30H130M174 30H260V140H60V96" className="fig-wire" />
          <Battery x={60} y={76} label="9 V" />
          <path d={resH(130, 30)} className="fig-comp" />
          <text x="152" y="16" className="fig-label" textAnchor="middle">R</text>
          <path d="M126 30V96H136M178 30V96H168" className="fig-probe" />
          <circle cx="152" cy="96" r="17" className="fig-meter" />
          <text x="152" y="102" className="fig-meter-letter" textAnchor="middle">V</text>
          <text x="206" y="100" className="fig-note" textAnchor="start" direction="rtl">على طرفي العنصر</text>
        </Frame>
      );
    case 'meter-current':
      return (
        <Frame label="قياس التيار على التوالي">
          <path d="M60 70V30H110M154 30H182M222 30H260V140H60V96" className="fig-wire" />
          <Battery x={60} y={76} label="9 V" />
          <path d={resH(110, 30)} className="fig-comp" />
          <text x="132" y="16" className="fig-label" textAnchor="middle">R</text>
          <circle cx="202" cy="30" r="17" className="fig-meter" />
          <text x="202" y="36" className="fig-meter-letter" textAnchor="middle">A</text>
          <text x="202" y="76" className="fig-note" textAnchor="middle" direction="rtl">داخل المسار</text>
        </Frame>
      );
    case 'kcl':
      return (
        <Frame label="قانون العقد" h={160}>
          <circle cx="160" cy="80" r="6" className="fig-dot" />
          <Arrow d="M40 30L150 74" />
          <Arrow d="M40 130L150 86" />
          <Arrow d="M168 74L280 30" />
          <Arrow d="M168 86L280 130" />
          <text x="70" y="30" className="fig-label">3 A</text>
          <text x="70" y="146" className="fig-label">2 A</text>
          <text x="232" y="30" className="fig-label">4 A</text>
          <text x="232" y="146" className="fig-label">1 A</text>
          <text x="160" y="112" className="fig-small" textAnchor="middle">3 + 2 = 4 + 1</text>
        </Frame>
      );
    case 'si-ladder': {
      const steps = [
        ['M', '10⁶'],
        ['k', '10³'],
        ['·', '1'],
        ['m', '10⁻³'],
        ['µ', '10⁻⁶'],
      ];
      return (
        <Frame label="سلّم البادئات" h={120}>
          {steps.map(([p, e], i) => (
            <g key={p}>
              <rect x={12 + i * 62} y={32} width="46" height="46" rx="10" className={i === 2 ? 'fig-box-strong' : 'fig-box'} />
              <text x={35 + i * 62} y={62} className="fig-big" textAnchor="middle">{p === '·' ? 'V A Ω' : p}</text>
              <text x={35 + i * 62} y={98} className="fig-small" textAnchor="middle">{e}</text>
            </g>
          ))}
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <Arrow d={`M${60 + i * 62} 55H${72 + i * 62}`} />
            </g>
          ))}
          <text x="160" y="20" className="fig-small" textAnchor="middle">× 1000 to the left · ÷ 1000 to the right</text>
        </Frame>
      );
    }
    case 'water-analogy':
      return (
        <Frame label="تشبيه الماء" h={150}>
          <rect x="20" y="50" width="56" height="70" rx="10" className="fig-box-strong" />
          <path d="M36 86h24M48 74v24" className="fig-comp" strokeWidth="3" />
          <path d="M76 70H150Q160 70 166 78H214Q220 70 230 70H300" className="fig-pipe" />
          <path d="M76 100H150Q160 100 166 92H214Q220 100 230 100H300" className="fig-pipe" />
          <Arrow d="M96 85H136" />
          <Arrow d="M240 85H284" />
          <text x="48" y="138" className="fig-note" textAnchor="middle" direction="rtl">المضخة = الجهد</text>
          <text x="190" y="40" className="fig-note" textAnchor="middle" direction="rtl">الضيق = المقاومة</text>
          <text x="262" y="124" className="fig-note" textAnchor="middle" direction="rtl">التدفق = التيار</text>
        </Frame>
      );
    case 'psu':
      return (
        <Frame label="مصدر تغذية مختبري" h={170}>
          <rect x="30" y="16" width="260" height="138" rx="14" className="fig-box" />
          <rect x="48" y="32" width="104" height="40" rx="6" className="fig-lcd" />
          <rect x="168" y="32" width="104" height="40" rx="6" className="fig-lcd" />
          <text x="100" y="59" className="fig-lcd-text" textAnchor="middle">9.00 V</text>
          <text x="220" y="59" className="fig-lcd-text" textAnchor="middle">0.050 A</text>
          <circle cx="100" cy="104" r="16" className="fig-knob" />
          <circle cx="220" cy="104" r="16" className="fig-knob" />
          <path d="M100 104L108 92M220 104L210 93" className="fig-wire" />
          <text x="100" y="140" className="fig-small" textAnchor="middle">VOLTAGE</text>
          <text x="220" y="140" className="fig-small" textAnchor="middle">CURRENT LIMIT</text>
          <circle cx="160" cy="96" r="5" className="fig-led-on" />
          <circle cx="160" cy="116" r="5" className="fig-led-off" />
          <text x="150" y="100" className="fig-small" textAnchor="end">CV</text>
          <text x="150" y="120" className="fig-small" textAnchor="end">CC</text>
          <circle cx="268" cy="104" r="7" className="fig-term-red" />
          <circle cx="268" cy="128" r="7" className="fig-term-black" />
          <text x="282" y="108" className="fig-label">+</text>
          <text x="282" y="132" className="fig-label">−</text>
        </Frame>
      );
    case 'color-code': {
      const bands = [['#E8C200', '4'], ['#7B3FA0', '7'], ['#D0312D', '×100'], ['#C9A227', '±5 %']];
      return (
        <Frame label="مقاوم بأربع حلقات" h={130}>
          <path d="M20 54H70M250 54H300" className="fig-wire" />
          <rect x="70" y="34" width="180" height="40" rx="18" className="fig-resbody" />
          {bands.map(([c, l], i) => (
            <g key={i}>
              <rect x={i === 3 ? 214 : 96 + i * 28} y="34" width="14" height="40" fill={c} />
              <text x={(i === 3 ? 214 : 96 + i * 28) + 7} y="98" className="fig-small" textAnchor="middle">{l}</text>
            </g>
          ))}
          <text x="160" y="122" className="fig-label" textAnchor="middle">47 × 100 = 4.7 kΩ ±5 %</text>
        </Frame>
      );
    }
    case 'diode':
      return (
        <Frame label="رمز الثنائي وجسمه" h={130}>
          <path d="M20 40H80M120 40H180" className="fig-wire" />
          <path d="M80 22V58L118 40Z" className="fig-comp" />
          <path d="M120 22V58" className="fig-comp" strokeWidth="3" />
          <text x="60" y="76" className="fig-label" textAnchor="middle">A</text>
          <text x="140" y="76" className="fig-label" textAnchor="middle">K</text>
          <Arrow d="M64 100H136" />
          <text x="100" y="122" className="fig-small" textAnchor="middle">I</text>
          <path d="M200 40H222M298 40H310" className="fig-wire" />
          <rect x="222" y="28" width="76" height="24" rx="6" className="fig-diodebody" />
          <rect x="280" y="28" width="9" height="24" className="fig-band" />
          <text x="284" y="76" className="fig-small" textAnchor="middle">K</text>
        </Frame>
      );
    case 'relay-flyback':
      return (
        <Frame label="مرحّل مع ثنائي حماية" h={180}>
          <text x="70" y="18" className="fig-small" textAnchor="middle">+9 V</text>
          <path d="M70 24V44M70 106V124" className="fig-wire" />
          <path d="M60 44h20v62h-20z" className="fig-comp" />
          <path d="M62 52q12 4 0 8q12 4 0 8q12 4 0 8q12 4 0 8q12 4 0 8" className="fig-comp" />
          <path d="M70 34H112V58M112 94V116H70" className="fig-wire" />
          <path d="M102 94H122L112 66Z" className="fig-comp" />
          <path d="M102 62H122" className="fig-comp" strokeWidth="3" />
          <text x="130" y="84" className="fig-small">1N4007</text>
          <text x="70" y="142" className="fig-small" textAnchor="middle">→ transistor (C)</text>
          <path d="M80 75H200" className="fig-link" />
          <text x="230" y="52" className="fig-label">NC</text>
          <text x="230" y="112" className="fig-label">NO</text>
          <text x="200" y="160" className="fig-label" textAnchor="middle">COM</text>
          <circle cx="222" cy="48" r="3.5" className="fig-dot" />
          <circle cx="222" cy="108" r="3.5" className="fig-dot" />
          <circle cx="200" cy="140" r="3.5" className="fig-dot" />
          <path d="M200 140L220 52" className="fig-comp" strokeWidth="3" />
        </Frame>
      );
    case 'npn-switch':
      return (
        <Frame label="ترانزستور NPN كمفتاح" h={190}>
          <text x="200" y="16" className="fig-small" textAnchor="middle">+9 V</text>
          <path d="M200 22V34M200 74V92" className="fig-wire" />
          <rect x="182" y="34" width="36" height="40" rx="6" className="fig-box-strong" />
          <text x="200" y="59" className="fig-small" textAnchor="middle">LOAD</text>
          <path d="M184 112V148" className="fig-comp" strokeWidth="4" />
          <path d="M184 120L200 104V92M184 140L200 156V176" className="fig-comp" />
          <path d="M192 152L200 156L196 148" className="fig-comp" />
          <path d="M60 130H96M140 130H184" className="fig-wire" />
          <path d={resH(96, 130)} className="fig-comp" />
          <text x="118" y="116" className="fig-label" textAnchor="middle">Rb</text>
          <text x="44" y="134" className="fig-label" textAnchor="end">Vin</text>
          <text x="214" y="104" className="fig-small">C</text>
          <text x="172" y="126" className="fig-small" textAnchor="end">B</text>
          <text x="214" y="164" className="fig-small">E</text>
          <path d="M186 176H214" className="fig-ground" />
          <text x="226" y="180" className="fig-small">0 V</text>
        </Frame>
      );
    case 'mosfet-switch':
      return (
        <Frame label="MOSFET كمفتاح" h={190}>
          <text x="210" y="16" className="fig-small" textAnchor="middle">+12 V</text>
          <path d="M210 22V34M210 74V100" className="fig-wire" />
          <rect x="192" y="34" width="36" height="40" rx="6" className="fig-box-strong" />
          <text x="210" y="59" className="fig-small" textAnchor="middle">LOAD</text>
          <path d="M184 106V150" className="fig-comp" strokeWidth="3" />
          <path d="M192 102V114M192 122V134M192 142V154" className="fig-comp" strokeWidth="4" />
          <path d="M192 108H210V100M192 148H210V176M192 128H204" className="fig-comp" />
          <path d="M40 128H70M114 128H150V128H184" className="fig-wire" />
          <path d={resH(70, 128)} className="fig-comp" />
          <text x="92" y="114" className="fig-small" textAnchor="middle">100 Ω</text>
          <path d="M150 128V136" className="fig-wire" />
          <path d={resV(150, 136, 30)} className="fig-comp" />
          <path d="M150 166V176" className="fig-wire" />
          <text x="138" y="156" className="fig-small" textAnchor="end">10 kΩ</text>
          <text x="32" y="132" className="fig-label" textAnchor="end">G</text>
          <text x="222" y="104" className="fig-small">D</text>
          <text x="222" y="170" className="fig-small">S</text>
          <path d="M140 176H220" className="fig-ground" />
        </Frame>
      );
    case 'body-path':
      return (
        <Frame label="مسار التيار عبر الجسم" h={190}>
          <circle cx="160" cy="30" r="16" className="fig-body" />
          <rect x="138" y="50" width="44" height="66" rx="16" className="fig-body" />
          <path d="M138 62L104 92M182 62L222 34" className="fig-limb" />
          <path d="M150 116L144 176M170 116L176 176" className="fig-limb" />
          <path d="M222 34L172 76L166 116L176 176" className="fig-danger" />
          <path d="M222 34H290" className="fig-wire" />
          <circle cx="222" cy="34" r="4" className="fig-dot" />
          <path d="M120 180H200" className="fig-ground" />
          <path d="M163 74c-3-4-9-2-7 3l7 7 7-7c2-5-4-7-7-3Z" className="fig-heart" />
          <text x="250" y="24" className="fig-note" textAnchor="middle" direction="rtl">سلك مُغذّى</text>
          <text x="240" y="112" className="fig-note" textAnchor="start" direction="rtl">يمرّ قرب القلب</text>
        </Frame>
      );
  }
}
