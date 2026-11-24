import { useMemo, useState } from 'react';
import { TERMS } from '../data/glossary';
import { ALL_LESSONS } from '../data/curriculum';
import { Lab, LAB_INFO } from '../labs/Labs';
import type { LabId } from '../types';
import { type State, emptyState, sanitize } from '../lib/progress';
import type { StoreKind } from '../lib/storage';
import { Bubble, Lido, Logo } from './Mascot';
import { APK_URL, RELEASES_URL, isNativeApp, useInstallPrompt } from '../lib/platform';
import { Ltr, bidi } from './Rich';
import {
  IconArrowNext, IconArrowPrev, IconBook, IconChat, IconCloud, IconFlask, IconLink, IconSearch, IconShield, IconWarn,
} from './Icons';

// ───────────────────────────── Android app

export function AppCard() {
  const install = useInstallPrompt();
  if (isNativeApp()) {
    return (
      <section className="card app-card">
        <span className="app-icon"><Logo size={64} /></span>
        <div>
          <h2>تطبيق أندرويد</h2>
          <p className="muted">أنت تستعمل التطبيق. للتحديث، حمّل أحدث نسخة وثبّتها فوق الحالية؛ يبقى تقدّمك محفوظًا.</p>
        </div>
        <div className="app-actions">
          <a className="btn-secondary" href={RELEASES_URL} target="_blank" rel="noreferrer">صفحة أحدث نسخة</a>
        </div>
      </section>
    );
  }
  return (
    <section className="card app-card">
      <span className="app-icon"><Logo size={64} /></span>
      <div>
        <h2>حمّل دارة على هاتف أندرويد</h2>
        <ol>
          <li>اضغط «حمّل التطبيق» من هاتفك.</li>
          <li>افتح الملف <bdi dir="ltr">dara.apk</bdi> بعد اكتمال التحميل.</li>
          <li>إذا طُلب منك، اسمح لمتصفحك بتثبيت التطبيقات (Install unknown apps)، ثم اضغط «تثبيت».</li>
        </ol>
      </div>
      <div className="app-actions">
        <a className="btn-primary" href={APK_URL} target="_blank" rel="noreferrer">حمّل التطبيق (APK)</a>
        {install && <button type="button" className="btn-secondary" onClick={install}>أو ثبّت نسخة الويب على هذا الجهاز</button>}
      </div>
      <p className="app-note">التطبيق يعمل دون إنترنت. تقدّمك في الموقع لا ينتقل تلقائيًا إلى التطبيق: انسخ «النسخة الاحتياطية» من صفحة «حسابي» واسترجعها في التطبيق.</p>
    </section>
  );
}

// ───────────────────────────── Library

export function Library({ go }: { go: (h: string) => void }) {
  const sources = useMemo(() => {
    const seen = new Map<string, string | undefined>();
    for (const l of ALL_LESSONS) for (const s of l.sources) if (!seen.has(s.title)) seen.set(s.title, s.url);
    return [...seen.entries()];
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">المكتبة</h1>
      <AppCard />

      <section className="lib-section">
        <h2><IconFlask size={22} /> المختبرات</h2>
        <p className="section-lead">محاكاة بلا أي خطر. جرّب بحرية، ثم توقّع قبل أن تغيّر.</p>
        <div className="lab-grid">
          {(Object.keys(LAB_INFO) as LabId[]).map((id) => (
            <button key={id} type="button" className={`lab-card lab-${id}`} onClick={() => go('lab-' + id)}>
              <span className="lab-card-title">{LAB_INFO[id].title}</span>
              <span className="lab-card-sum">{LAB_INFO[id].summary}</span>
              <span className="lab-card-go">افتح <IconArrowNext size={16} /></span>
            </button>
          ))}
        </div>
      </section>

      <div className="lib-two">
        <section className="lib-section">
          <h2><IconBook size={22} /> المعجم</h2>
          <p className="section-lead"><bdi>{TERMS.length}</bdi> مصطلحًا بالعربية مع أسمائها الفرنسية والإنجليزية.</p>
          <button type="button" className="btn-secondary" onClick={() => go('glossary')}>افتح المعجم</button>
        </section>

        <section className="lib-section safety-card">
          <h2><IconShield size={22} /> قواعد السلامة</h2>
          <ol className="rules">
            <li><strong>لا عمل على دارة مُغذّاة.</strong> افصل، أقفل، تعرّف، تحقّق من غياب الجهد.</li>
            <li>{bidi('الشبكة المنزلية (220–230 V): نظري ومحاكاة فقط على هذه المنصة.')}</li>
            <li>{bidi('عملي: المستوى A بطاريات حتى 9 V، والمستوى B حتى 12 V مع تحديد التيار.')}</li>
            <li>افصل المصدر قبل أي تعديل على الدارة.</li>
            <li>لا LED بلا مقاوم، ولا تقصير لبطارية.</li>
            <li>المِسبار الأحمر في V إلا عند قياس التيار.</li>
          </ol>
          <div className="emergency">
            <IconWarn size={20} />
            <div>
              <strong>عند حادث كهربائي:</strong> اقطع التيار أولًا، لا تلمس الضحية قبل ذلك.<br />
              الوقاية المدنية <Ltr>15</Ltr> · الإسعاف الطبي SAMU <Ltr>141</Ltr>
            </div>
          </div>
        </section>
      </div>

      <section className="lib-section">
        <h2><IconLink size={22} /> المصادر والإطار المغربي</h2>
        <div className="reg">
          <div className="reg-item verified">
            <span className="reg-tag">مُتحقَّق منه</span>
            <p>المعيار المغربي للتركيبات الكهربائية منخفضة الجهد هو <Ltr>NM 06.1.100</Ltr>، صادقت عليه IMANOR في ماي 2025 ونُشر في الجريدة الرسمية، وطُرحت ثمانية مشاريع معايير مكمّلة للبحث العمومي.</p>
          </div>
          <div className="reg-item verified">
            <span className="reg-tag">مُتحقَّق منه</span>
            <p>المرسوم <Ltr>2.22.630</Ltr> يحدّد شروط استعمال الأجهزة والآلات التي قد تضرّ بصحة الأجراء، ومنها التركيبات الكهربائية، وحلّ محلّ المرسوم <Ltr>2.12.236</Ltr>.</p>
          </div>
          <div className="reg-item disputed">
            <span className="reg-tag">محلّ خلاف</span>
            <p>هل <Ltr>NM 06.1.100</Ltr> إلزامية قانونًا؟ مصادر مهنية كثيرة تقول ذلك، ومصادر أخرى تقول إن هذا غير ثابت. لذلك نسمّيها هنا «المعيار المرجعي».</p>
          </div>
          <div className="reg-item unverified">
            <span className="reg-tag">لم يُتحقَّق بعد</span>
            <p>القيم الرقمية التفصيلية للمعيار المغربي (مثل حالات فرض القاطع التفاضلي 30 mA). ستُدرَّس في المستوى 6 بعد قراءة النص الرسمي.</p>
          </div>
        </div>
        <h3>مصادر الدروس</h3>
        <ul className="source-list">
          {sources.map(([t, u]) => <li key={t}>{u ? <a href={u} target="_blank" rel="noreferrer"><bdi dir="auto">{t}</bdi></a> : <bdi dir="auto">{t}</bdi>}</li>)}
        </ul>
      </section>
    </div>
  );
}

export function LabPage({ id, go }: { id: LabId; go: (h: string) => void }) {
  const info = LAB_INFO[id];
  return (
    <div className="page narrow">
      <button type="button" className="btn-back" onClick={() => go('library')}><IconArrowPrev size={18} /> المكتبة</button>
      <h1 className="page-title">{info.title}</h1>
      <p className="section-lead">{bidi(info.summary)}</p>
      <div className="lab-frame"><Lab id={id} /></div>
    </div>
  );
}

// ───────────────────────────── Glossary

export function Glossary({ go }: { go: (h: string) => void }) {
  const [q, setQ] = useState('');
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[ً-ٟ̀-ͯ]/g, '');
  const list = TERMS.filter((t) => !q || norm(`${t.ar} ${t.fr} ${t.en} ${t.symbol ?? ''}`).includes(norm(q)));
  return (
    <div className="page narrow">
      <button type="button" className="btn-back" onClick={() => go('library')}><IconArrowPrev size={18} /> المكتبة</button>
      <h1 className="page-title">المعجم</h1>
      <label className="search">
        <IconSearch size={20} />
        <span className="sr-only">ابحث</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالعربية أو الفرنسية أو الإنجليزية" />
      </label>
      <ul className="glossary">
        {list.map((t) => (
          <li key={t.id}>
            <div className="g-head">
              <strong>{t.ar}</strong>
              <bdi dir="ltr" className="g-latin">{t.fr} · {t.en}</bdi>
            </div>
            <p>{t.def}</p>
            {(t.symbol || t.unit) && (
              <p className="g-meta">
                {t.symbol && <>الرمز <Ltr>{t.symbol}</Ltr></>}{t.symbol && t.unit && ' · '}{t.unit && <>الوحدة <Ltr>{t.unit}</Ltr></>}
              </p>
            )}
          </li>
        ))}
        {list.length === 0 && <li className="empty">لا نتيجة لـ «{q}». جرّب الاسم بالفرنسية، مثل «tension».</li>}
      </ul>
    </div>
  );
}

// ───────────────────────────── Profile

export function Profile({ state, setState, store, saveStatus, go }: {
  state: State; setState: (f: (s: State) => State) => void; store: StoreKind; saveStatus: string; go: (h: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const p = state.profile;
  const setP = (patch: Partial<State['profile']>) => setState((s) => ({ ...s, updatedAt: Date.now(), profile: { ...s.profile, ...patch } }));
  const backup = JSON.stringify(state);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(backup);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setImportMsg({ ok: false, text: 'تعذّر النسخ تلقائيًا. حدّد النص في الخانة وانسخه يدويًا.' });
    }
  };

  const doImport = () => {
    try {
      const s = sanitize(JSON.parse(importText), Date.now());
      if (!s) throw new Error();
      setState(() => ({ ...s, updatedAt: Date.now() }));
      setImportMsg({ ok: true, text: 'استُرجع تقدّمك.' });
      setImportText('');
    } catch {
      setImportMsg({ ok: false, text: 'هذا النص ليس نسخة احتياطية صالحة من دارة. انسخ النص كاملًا كما هو.' });
    }
  };

  const storeText = {
    cloud: 'يُحفظ تقدّمك في حسابك، ويتبعك على أي جهاز تفتح منه هذه الصفحة.',
    local: 'يُحفظ تقدّمك في هذا المتصفح فقط. احتفظ بنسخة احتياطية إذا أردت نقله.',
    memory: 'تعذّر الحفظ في هذا المتصفح: سيضيع تقدّمك عند إغلاق الصفحة. انسخ النسخة الاحتياطية قبل الخروج.',
  }[store];

  return (
    <div className="page narrow">
      <button type="button" className="btn-back" onClick={() => go('home')}><IconArrowPrev size={18} /> المسار</button>
      <h1 className="page-title">حسابي</h1>

      <section className="card form">
        <label className="field">
          <span>اسمك (اختياري)</span>
          <input value={p.name} maxLength={40} onChange={(e) => setP({ name: e.target.value })} />
        </label>
        <div className="field">
          <span>هدفك اليومي</span>
          <div className="segmented">
            {[10, 20, 30, 45].map((m) => (
              <button key={m} type="button" className={p.dailyMinutes === m ? 'on' : ''} aria-pressed={p.dailyMinutes === m} onClick={() => setP({ dailyMinutes: m })}>{m} د</button>
            ))}
          </div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={p.darija} onChange={(e) => setP({ darija: e.target.checked })} />
          <span><IconChat size={18} /> أظهر زر «شرح بالدارجة» في الدروس</span>
        </label>
      </section>

      <section className="card">
        <h2><IconCloud size={22} /> الحفظ</h2>
        <p className={`store store-${store}`}>{storeText}{store === 'cloud' && saveStatus === 'error' ? ' آخر محاولة حفظ فشلت؛ سنعيد المحاولة عند التغيير التالي.' : ''}</p>
        <h3>نسخة احتياطية</h3>
        <p className="muted">انسخ هذا النص واحفظه في ملاحظة. يمكنك استرجاع تقدّمك به في أي وقت.</p>
        <textarea className="backup" readOnly value={backup} dir="ltr" rows={3} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn-secondary" onClick={copy}>{copied ? 'نُسخ' : 'انسخ النسخة الاحتياطية'}</button>

        <h3>استرجاع</h3>
        <textarea className="backup" dir="ltr" rows={3} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{"v":1,...}' />
        <button type="button" className="btn-secondary" disabled={!importText.trim()} onClick={doImport}>استرجع التقدّم</button>
        {importMsg && <p className={`msg ${importMsg.ok ? 'ok' : 'bad'}`} role="status">{importMsg.text}</p>}
      </section>

      <AppCard />

      <section className="card danger">
        <h2>البدء من جديد</h2>
        <p className="muted">يحذف كل التقدّم والمراجعات. انسخ النسخة الاحتياطية أولًا إن أردت الرجوع.</p>
        {!confirmReset
          ? <button type="button" className="btn-danger" onClick={() => setConfirmReset(true)}>امسح التقدّم</button>
          : (
            <div className="confirm" role="alertdialog" aria-label="تأكيد المسح">
              <p>متأكد؟ لا يمكن التراجع عن هذا إلا بالنسخة الاحتياطية.</p>
              <button type="button" className="btn-danger" onClick={() => { setState(() => ({ ...emptyState(Date.now()), updatedAt: Date.now() })); setConfirmReset(false); go('home'); }}>نعم، امسح كل شيء</button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>إلغاء</button>
            </div>
          )}
      </section>
    </div>
  );
}

// ───────────────────────────── Onboarding

export function Onboarding({ onDone }: { onDone: (p: { name: string; dailyMinutes: number; darija: boolean }) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(20);
  const [darija, setDarija] = useState(true);
  const total = 4;

  const lines = [
    'مرحبًا! أنا ليدو. سأرافقك من الصفر إلى فهم الدارات، وتشخيص الأعطال، والتركيبات الكهربائية.',
    'كيف أناديك؟',
    'كم دقيقة تريد أن تتعلّم يوميًا؟ القليل كل يوم أنفع من الكثير مرة في الأسبوع.',
    'بعض الأفكار الصعبة لها شرح إضافي بالدارجة. هل تريد أن يظهر زرّه؟',
  ];

  return (
    <div className="onboard">
      <div className="onboard-card">
        <div className="onboard-progress" aria-hidden="true"><div style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
        <div className="onboard-mascot">
          <Lido size={104} mood={step === 0 ? 'cheer' : 'happy'} />
          <Bubble>{lines[step]}</Bubble>
        </div>

        {step === 0 && (
          <ul className="onboard-points">
            <li>دروس قصيرة، وسؤال بعد كل فكرة.</li>
            <li>مختبرات محاكاة ترى فيها التيار والجهد.</li>
            <li>السلامة أولًا: لا عمل عملي قبل وحدة السلامة.</li>
            <li>المصطلحات بالعربية والفرنسية والإنجليزية.</li>
          </ul>
        )}
        {step === 1 && (
          <label className="field">
            <span className="sr-only">اسمك</span>
            <input autoFocus value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="اسمك (اختياري)"
              onKeyDown={(e) => { if (e.key === 'Enter') setStep(2); }} />
          </label>
        )}
        {step === 2 && (
          <div className="choice-grid">
            {[[10, 'خفيف'], [20, 'منتظم'], [30, 'جاد'], [45, 'مكثّف']].map(([m, l]) => (
              <button key={m} type="button" className={`choice ${minutes === m ? 'on' : ''}`} aria-pressed={minutes === m} onClick={() => setMinutes(m as number)}>
                <span className="choice-n"><bdi>{m}</bdi> د</span><span>{l}</span>
              </button>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="choice-grid two">
            <button type="button" className={`choice ${darija ? 'on' : ''}`} aria-pressed={darija} onClick={() => setDarija(true)}>
              <span className="choice-n">نعم</span><span>أظهر شرح الدارجة</span>
            </button>
            <button type="button" className={`choice ${!darija ? 'on' : ''}`} aria-pressed={!darija} onClick={() => setDarija(false)}>
              <span className="choice-n">لا</span><span>الفصحى تكفيني</span>
            </button>
          </div>
        )}

        <div className="onboard-actions">
          {step > 0 && <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}><IconArrowPrev size={18} /> رجوع</button>}
          {step < total - 1
            ? <button type="button" className="btn-primary big" onClick={() => setStep(step + 1)}>{step === 0 ? 'لنبدأ' : 'التالي'} <IconArrowNext size={18} /></button>
            : <button type="button" className="btn-primary big" onClick={() => onDone({ name: name.trim(), dailyMinutes: minutes, darija })}>افتح مساري</button>}
        </div>
      </div>
    </div>
  );
}
