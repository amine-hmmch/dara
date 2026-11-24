import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LEVELS, findLesson, findModule, levelOf } from './data/curriculum';
import {
  type State, checkUnlocked, completeLesson, dueCards, emptyState, lessonUnlocked, nextAction, recordCheck, reviewCard,
} from './lib/progress';
import { Saver, type StoreKind, connectCloud, localAvailable, newer, readCloud, readLocal } from './lib/storage';
import { Journey } from './components/Journey';
import { CheckPlayer, LessonPlayer, ReviewSession } from './components/Players';
import { Glossary, LabPage, Library, Onboarding, Profile } from './components/Pages';
import { LAB_INFO } from './labs/Labs';
import { Lido, Logo } from './components/Mascot';
import { IconLibrary, IconLock, IconPath, IconReview, IconUser } from './components/Icons';
import type { LabId } from './types';

const useHash = () => {
  const read = () => decodeURIComponent(location.hash.replace(/^#/, '')) || 'home';
  const [hash, setHash] = useState(read);
  useEffect(() => {
    const on = () => setHash(read());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const go = useCallback((h: string) => {
    if (h === read()) return;
    location.hash = h === 'home' ? '' : h;
    if (h === 'home') setHash('home');
    window.scrollTo({ top: 0 });
  }, []);
  return [hash, go] as const;
};

export default function App() {
  // A fresh state gets updatedAt 0 so any saved copy (local or cloud) wins over it.
  const [state, setStateRaw] = useState<State>(() => readLocal(Date.now()) ?? { ...emptyState(Date.now()), updatedAt: 0 });
  const [store, setStore] = useState<StoreKind>(() => (localAvailable() ? 'local' : 'memory'));
  const [cloudChecked, setCloudChecked] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [hash, go] = useHash();
  const saver = useRef(new Saver());
  const first = useRef(true);

  // Connect to the private cloud store once; take whichever copy is newer.
  useEffect(() => {
    saver.current.onStatus = setSaveStatus;
    let alive = true;
    (async () => {
      const ref = await connectCloud();
      if (!alive) return;
      if (ref) {
        try {
          const cloud = await readCloud(ref, Date.now());
          if (!alive) return;
          setStateRaw((local) => newer(local, cloud) ?? local);
          saver.current.attach(ref);
          setStore('cloud');
        } catch {
          /* cloud unreachable: stay local */
        }
      }
      setCloudChecked(true);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    saver.current.save(state);
  }, [state]);

  const setState = useCallback((f: (s: State) => State) => setStateRaw(f), []);
  const now = Date.now();
  const due = useMemo(() => dueCards(state, now), [state, now]);
  // A review session keeps its own queue until the user leaves #review, so the
  // "done" screen still shows after the last due card is answered.
  const [reviewQueue, setReviewQueue] = useState<string[] | null>(null);
  const activeQueue = reviewQueue ?? (hash === 'review' && due.length ? due.slice(0, 20) : null);
  useEffect(() => {
    if (hash === 'review' && !reviewQueue && due.length) setReviewQueue(due.slice(0, 20));
    if (hash !== 'review' && reviewQueue) setReviewQueue(null);
  }, [hash, due, reviewQueue]);

  const goNext = useCallback(() => {
    const n = nextAction(state, LEVELS);
    go(n.type === 'lesson' ? 'lesson-' + n.lessonId : n.type === 'check' ? 'check-' + n.moduleId : 'home');
  }, [state, go]);

  if (!state.profile.onboarded && !cloudChecked) {
    return (
      <div className="splash" role="status">
        <Lido size={96} mood="calm" />
        <p>نجهّز مسارك…</p>
      </div>
    );
  }
  if (!state.profile.onboarded) {
    return (
      <Onboarding onDone={(p) => setState((s) => ({ ...s, updatedAt: Date.now(), profile: { ...s.profile, ...p, onboarded: true, startedAt: Date.now() } }))} />
    );
  }

  // ---------- focus views (no navigation chrome)
  if (hash.startsWith('lesson-')) {
    const f = findLesson(hash.slice(7));
    if (!f) return <NotFound go={go} />;
    if (!lessonUnlocked(state, LEVELS, f.module, f.lesson.id)) return <Locked go={go} />;
    const nextLesson = f.module.lessons[f.module.lessons.indexOf(f.lesson) + 1];
    return (
      <main className="focus">
        <LessonPlayer key={f.lesson.id} lesson={f.lesson} module={f.module} level={f.level}
          showDarija={state.profile.darija} alreadyDone={!!state.lessons[f.lesson.id]?.done}
          onComplete={(score, missed) => setState((s) => completeLesson(s, f.lesson.id, score, missed, f.lesson.terms, Date.now()))}
          onExit={() => go('home')}
          onNext={nextLesson ? () => go('lesson-' + nextLesson.id) : () => go('check-' + f.module.id)} />
      </main>
    );
  }
  if (hash.startsWith('check-')) {
    const m = findModule(hash.slice(6));
    if (!m || m.status !== 'ready') return <NotFound go={go} />;
    if (!checkUnlocked(state, LEVELS, m)) return <Locked go={go} />;
    return (
      <main className="focus">
        <CheckPlayer key={m.id} module={m} level={levelOf(m)}
          onRecord={(score, missed) => setState((s) => recordCheck(s, m, score, missed, Date.now()))}
          onExit={() => go('home')} onNext={goNext} />
      </main>
    );
  }
  if (hash === 'review' && activeQueue) {
    return (
      <main className="focus">
        <ReviewSession queue={activeQueue}onResult={(id, ok) => setState((s) => reviewCard(s, id, ok, Date.now()))} onExit={() => go('home')} />
      </main>
    );
  }

  // ---------- main views
  let view: React.ReactNode;
  let tab: 'home' | 'review' | 'library' | 'profile' = 'home';
  if (hash === 'review') {
    tab = 'review';
    view = <ReviewEmpty state={state} go={go} />;
  } else if (hash === 'library') {
    tab = 'library';
    view = <Library go={go} />;
  } else if (hash === 'glossary') {
    tab = 'library';
    view = <Glossary go={go} />;
  } else if (hash.startsWith('lab-') && hash.slice(4) in LAB_INFO) {
    tab = 'library';
    view = <LabPage id={hash.slice(4) as LabId} go={go} />;
  } else if (hash === 'profile') {
    tab = 'profile';
    view = <Profile state={state} setState={setState} store={store} saveStatus={saveStatus} go={go} />;
  } else {
    view = <Journey state={state} now={now} go={go} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <a href="#" className="brand" onClick={(e) => { e.preventDefault(); go('home'); }}>
          <Logo size={34} /><span>دارة</span>
        </a>
        <nav className="tabs" aria-label="التنقل الرئيسي">
          <Tab on={tab === 'home'} onClick={() => go('home')} icon={<IconPath size={20} />} label="المسار" />
          <Tab on={tab === 'review'} onClick={() => go('review')} icon={<IconReview size={20} />} label="المراجعة" badge={due.length} />
          <Tab on={tab === 'library'} onClick={() => go('library')} icon={<IconLibrary size={20} />} label="المكتبة" />
        </nav>
        <button type="button" className={`avatar ${tab === 'profile' ? 'on' : ''}`} onClick={() => go('profile')} aria-label="حسابي">
          {state.profile.name.trim() ? state.profile.name.trim().slice(0, 1) : <IconUser size={20} />}
        </button>
      </header>
      <main className="main">{view}</main>
      <nav className="bottombar" aria-label="التنقل">
        <Tab on={tab === 'home'} onClick={() => go('home')} icon={<IconPath size={22} />} label="المسار" />
        <Tab on={tab === 'review'} onClick={() => go('review')} icon={<IconReview size={22} />} label="المراجعة" badge={due.length} />
        <Tab on={tab === 'library'} onClick={() => go('library')} icon={<IconLibrary size={22} />} label="المكتبة" />
        <Tab on={tab === 'profile'} onClick={() => go('profile')} icon={<IconUser size={22} />} label="حسابي" />
      </nav>
    </div>
  );
}

function Tab({ on, onClick, icon, label, badge }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button type="button" className={`tab ${on ? 'on' : ''}`} aria-current={on ? 'page' : undefined} onClick={onClick}>
      {icon}<span>{label}</span>
      {!!badge && <span className="badge" aria-label={`${badge} للمراجعة`}><bdi>{badge}</bdi></span>}
    </button>
  );
}

function ReviewEmpty({ state, go }: { state: State; go: (h: string) => void }) {
  const upcoming = Object.values(state.cards).map((c) => c.due).sort((a, b) => a - b)[0];
  const total = Object.keys(state.cards).length;
  return (
    <div className="page narrow empty-state">
      <Lido size={110} mood="calm" />
      <h1>لا شيء للمراجعة الآن</h1>
      <p className="lead">
        {total === 0
          ? 'عندما تنهي درسًا، تدخل مصطلحاته والأسئلة التي أخطأت فيها إلى المراجعة، وتعود إليك في الوقت المناسب.'
          : <>في مجموعتك <bdi>{total}</bdi> بطاقة. أقرب مراجعة {upcoming ? <>يوم <bdi>{new Date(upcoming).toLocaleDateString('ar-MA', { weekday: 'long', day: 'numeric', month: 'long' })}</bdi></> : 'قريبًا'}.</>}
      </p>
      <button type="button" className="btn-primary big" onClick={() => go('home')}>تابع مسارك</button>
    </div>
  );
}

function NotFound({ go }: { go: (h: string) => void }) {
  return (
    <main className="focus"><div className="page narrow empty-state">
      <Lido size={100} mood="think" />
      <h1>هذه الصفحة غير موجودة</h1>
      <p className="lead">ربما تغيّر الرابط. مسارك ينتظرك في الصفحة الرئيسية.</p>
      <button type="button" className="btn-primary big" onClick={() => go('home')}>اذهب إلى المسار</button>
    </div></main>
  );
}

function Locked({ go }: { go: (h: string) => void }) {
  return (
    <main className="focus"><div className="page narrow empty-state">
      <div className="lock-big"><IconLock size={40} /></div>
      <h1>هذه الخطوة مقفلة بعد</h1>
      <p className="lead">تُفتح عندما تنهي ما قبلها وتتقن الوحدة السابقة. هكذا تُبنى الأسس قبل التقدّم.</p>
      <button type="button" className="btn-primary big" onClick={() => go('home')}>اذهب إلى خطوتك التالية</button>
    </div></main>
  );
}
