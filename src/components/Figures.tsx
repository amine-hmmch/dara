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
