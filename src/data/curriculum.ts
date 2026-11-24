import type { Level, Lesson, Module, QuestionStep } from '../types';
import { LEVEL0_MODULES } from './lessons/level0';
import { LEVEL1_MODULES } from './lessons/level1';

const planned = (id: string, title: string, summary: string, topics: string[], safety = false): Module => ({
  id,
  title,
  summary,
  safety,
  status: 'planned',
  lessons: [],
  check: [],
  planned: topics,
});

export const LEVELS: Level[] = [
  {
    n: 0,
    title: 'الأساس والسلامة',
    subtitle: 'كيف تتعلّم، كيف تحمي نفسك، والرياضيات التي ستحتاجها.',
    tier: 'محاكاة فقط',
    modules: LEVEL0_MODULES,
  },
  {
    n: 1,
    title: 'دارات التيار المستمر',
    subtitle: 'التيار، الجهد، قانون أوم، التوالي والتوازي، والقياس.',
    tier: 'المستوى A: بطاريات 1.5–9 V',
    modules: LEVEL1_MODULES,
  },
  {
    n: 2,
    title: 'المكوّنات',
    subtitle: 'تعرّف على كل قطعة قبل أن تصلحها.',
    tier: 'المستوى A–B: حتى 12 V مع تحديد التيار',
    modules: [
      planned('m2-resistors', 'المقاومات بالتفصيل', 'الألوان، التفاوت، القدرة، المقاومات المتغيّرة.', ['شيفرة الألوان', 'التفاوت والسلاسل E12/E24', 'المقاومة المتغيّرة والضوئية والحرارية']),
      planned('m2-capacitors', 'المكثّفات', 'تخزين الشحنة، الشحن والتفريغ.', ['السعة والفاراد', 'الشحن والتفريغ RC', 'أنواع المكثّفات والقطبية', 'خطر المكثّفات المشحونة']),
      planned('m2-inductors', 'الوشائع والمرحّلات', 'المغناطيسية في الدارات.', ['الوشيعة والحثّ', 'المرحّل (relais)', 'ثنائي الحماية (roue libre)']),
      planned('m2-diodes', 'الثنائيات و LED', 'تيار في اتجاه واحد.', ['الثنائي والتقويم', 'ثنائي زينر', 'LED بالتفصيل']),
      planned('m2-transistors', 'الترانزستور كمفتاح', 'BJT و MOSFET.', ['BJT كمفتاح', 'MOSFET كمفتاح', 'قيادة حمل بمتحكّم']),
      planned('m2-datasheets', 'قراءة أوراق البيانات', 'القيم القصوى والمنحنيات.', ['Absolute maximum ratings', 'المنحنيات المميزة', 'البحث عن بديل لمكوّن']),
    ],
  },
  {
    n: 3,
    title: 'التيار المتناوب والإشارات',
    subtitle: 'الشبكة، المحوّلات، ومصادر التغذية.',
    tier: 'المستوى B؛ الشبكة نظري ومحاكاة',
    modules: [
      planned('m3-sine', 'الموجة الجيبية', 'القيمة الفعالة RMS والتردد.', ['التردد والدور', 'القيمة القصوى والفعالة', '230 V و 50 Hz في المغرب']),
      planned('m3-scope', 'راسم الإشارات', 'رؤية الجهد عبر الزمن.', ['المحاور والمعايرة', 'القياس الآمن والمرجع الأرضي']),
      planned('m3-impedance', 'الممانعة', 'المكثّف والوشيعة في المتناوب.', ['المفاعلة', 'المرشّحات البسيطة']),
      planned('m3-transformers', 'المحوّلات', 'رفع وخفض الجهد، والعزل.', ['نسبة التحويل', 'محوّل العزل', 'محوّل الأمان']),
      planned('m3-supplies', 'مصادر التغذية', 'من 230 V متناوب إلى 5 V مستمر.', ['التقويم والتنعيم', 'المنظّمات الخطية', 'لمحة عن التغذية بالتقطيع']),
      planned('m3-threephase', 'لمحة عن ثلاثي الطور', '400 V بين الأطوار.', ['الأطوار والمحايد', 'لماذا ثلاثي الطور في الصناعة']),
    ],
  },
  {
    n: 4,
    title: 'الإلكترونيات التطبيقية',
    subtitle: 'دارات تعمل فعلًا، ومشروع نهائي.',
    tier: 'المستوى B',
    modules: [
      planned('m4-regulators', 'المنظّمات', 'جهد ثابت مهما تغيّر الحمل.', ['7805 و LDO', 'التبديد الحراري']),
      planned('m4-opamp', 'المضخّم العملياتي', 'التضخيم والمقارنة.', ['المقارن', 'المضخّم غير العاكس']),
      planned('m4-555', 'المؤقّت 555', 'الوميض والتوقيت.', ['النمط أحادي الاستقرار', 'المذبذب']),
      planned('m4-logic', 'المنطق الرقمي', 'البوابات والأعداد الثنائية.', ['البوابات', 'المستويات المنطقية']),
      planned('m4-mcu', 'المتحكّمات الدقيقة', 'Arduino وحسّاسات.', ['المداخل والمخارج', 'قراءة حسّاس', 'قيادة حمل بأمان']),
      planned('m4-soldering', 'اللحام والدارات المطبوعة', 'من اللوحة إلى PCB.', ['تقنية اللحام', 'نزع اللحام', 'قراءة PCB']),
    ],
  },
  {
    n: 5,
    title: 'التشخيص والإصلاح',
    subtitle: 'منهجية لإيجاد العطل بدل التخمين.',
    tier: 'المستوى B؛ أجهزة الشبكة مفصولة ومفرّغة وتحت إشراف',
    modules: [
      planned('m5-method', 'منهجية التشخيص', 'من العَرَض إلى السبب.', ['جمع المعلومات', 'التقسيم إلى نصفين', 'التوثيق']),
      planned('m5-esd', 'الكهرباء الساكنة والمكثّفات', 'حماية الجهاز وحماية نفسك.', ['ESD', 'تفريغ المكثّفات بأمان'], true),
      planned('m5-components', 'فحص المكوّنات', 'داخل الدارة وخارجها.', ['المقاومات والثنائيات', 'المكثّفات', 'الترانزستورات']),
      planned('m5-chargers', 'الشواحن ومصادر التغذية', 'الأعطال الأكثر شيوعًا.', ['قراءة مخطط شاحن', 'أعطال نموذجية']),
      planned('m5-appliances', 'الأجهزة المنزلية الصغيرة', 'سخّانات، مراوح، أجهزة مطبخ.', ['العنصر الحراري', 'المحرّكات الصغيرة', 'الترموستات والصهيرة الحرارية']),
      planned('m5-boards', 'اللوحات الإلكترونية', 'هواتف وحواسيب: المبادئ.', ['خطوط التغذية', 'قياس بلا تلف']),
    ],
  },
  {
    n: 6,
    title: 'التركيبات الكهربائية',
    subtitle: 'كيف يُصمَّم المنزل كهربائيًا، ويُفحص، ويُصان. نظري ومحاكاة.',
    tier: 'نظري ومحاكاة؛ العمل الحقيقي في تكوين رسمي تحت إشراف',
    modules: [
      planned('m6-supply', 'التغذية والعدّاد', '230/400 V، الشبكة والتوزيع.', ['من الشبكة إلى اللوحة', 'المخطط الأحادي']),
      planned('m6-earthing', 'أنظمة التأريض', 'TT و TN و IT.', ['الأنظمة الثلاثة', 'قطب الأرضي ومقاومته'], true),
      planned('m6-protection', 'الحماية', 'القواطع والتفاضلي.', ['المنحنيات B و C', 'التفاضلي وأنواعه', 'التنسيق']),
      planned('m6-cables', 'اختيار الأسلاك', 'المقطع وهبوط الجهد.', ['التيار المسموح', 'هبوط الجهد', 'طرق التمديد']),
      planned('m6-dwelling', 'دارات المسكن', 'إنارة، مقابس، دارات مخصّصة.', ['المخطط المعماري', 'المرجع: NM 06.1.100']),
      planned('m6-isolation', 'العزل الآمن (Consignation)', 'الإجراء الكامل.', ['الفصل، الإقفال، التعرّف، التحقق', 'الإطار المغربي: المرسوم 2.22.630'], true),
      planned('m6-testing', 'الفحص والتحقق', 'قياسات قبل التشغيل.', ['مقاومة العزل', 'مقاومة الأرضي', 'اختبار التفاضلي']),
      planned('m6-industrial', 'لمحة صناعية', 'المحرّكات والملامسات.', ['الملامس (contacteur)', 'دارة التحكم والقدرة']),
    ],
  },
];

// ---------- lookups ----------

export const ALL_MODULES = LEVELS.flatMap((l) => l.modules);
export const READY_MODULES = ALL_MODULES.filter((m) => m.status === 'ready');
export const ALL_LESSONS = READY_MODULES.flatMap((m) => m.lessons);

export function findModule(id: string): Module | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

export function findLesson(id: string): { lesson: Lesson; module: Module; level: Level } | undefined {
  for (const level of LEVELS)
    for (const module of level.modules) {
      const lesson = module.lessons.find((l) => l.id === id);
      if (lesson) return { lesson, module, level };
    }
  return undefined;
}

export function levelOf(m: Module): Level {
  return LEVELS.find((l) => l.modules.includes(m))!;
}

/** Every question in lessons and checks, by id (for the review deck). */
export const QUESTION_BY_ID: Record<string, { q: QuestionStep; module: Module; lesson?: Lesson }> = (() => {
  const out: Record<string, { q: QuestionStep; module: Module; lesson?: Lesson }> = {};
  for (const m of READY_MODULES) {
    for (const l of m.lessons)
      for (const s of l.steps) if (s.kind === 'mcq' || s.kind === 'numeric') out[s.id] = { q: s, module: m, lesson: l };
    for (const q of m.check) out[q.id] = { q, module: m };
  }
  return out;
})();
