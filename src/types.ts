// Content model for Dāra. Lessons are typed data, so a question without an
// explanation, or an option without feedback, fails the build.
//
// Inline text supports a tiny markup, rendered by <Rich>:
//   **bold**           emphasis
//   [[termId]]         glossary term chip (Arabic + FR/EN on tap)
//   [[termId|words]]   same chip, custom Arabic words
//   {{220 V}}          left-to-right island for values, units, formulas

export type FigureId =
  | 'water-analogy'
  | 'simple-circuit'
  | 'series'
  | 'parallel'
  | 'divider'
  | 'body-path'
  | 'meter-voltage'
  | 'meter-current'
  | 'si-ladder'
  | 'kcl';

export type LabId = 'ohm' | 'led' | 'series-parallel' | 'multimeter';

export type Tier = 'sim' | 'A' | 'B';

export type Block =
  | { t: 'p'; text: string }
  | { t: 'def'; term: string; text: string }
  | { t: 'formula'; expr: string; note?: string }
  | { t: 'warn'; text: string }
  | { t: 'tip'; text: string }
  | { t: 'example'; title: string; steps: string[]; result: string }
  | { t: 'list'; items: string[]; ordered?: boolean }
  | { t: 'figure'; fig: FigureId; caption?: string }
  | {
      t: 'practice';
      tier: Tier;
      title: string;
      needs: string[];
      steps: string[];
      safety: string[];
    };

export type Option = { text: string; correct?: boolean; why: string };

export type ConceptStep = {
  kind: 'concept';
  id: string;
  title: string;
  blocks: Block[];
  darija?: string;
};

export type McqStep = {
  kind: 'mcq';
  id: string;
  prompt: string;
  options: Option[];
  solution: string;
};

export type NumericStep = {
  kind: 'numeric';
  id: string;
  prompt: string;
  answer: number;
  /** Relative tolerance, e.g. 0.02 = ±2 % */
  tolerance: number;
  unit: string;
  hint?: string;
  solution: string;
};

export type LabGoal =
  | { type: 'led-current'; min: number; max: number }
  | { type: 'meter-correct'; quantity: 'V' | 'A' | 'R' };

export type LabStep = {
  kind: 'lab';
  id: string;
  title: string;
  lab: LabId;
  task: string;
  goal?: LabGoal;
};

export type QuestionStep = McqStep | NumericStep;
export type Step = ConceptStep | QuestionStep | LabStep;

export type Source = { title: string; url?: string };

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  objectives: string[];
  terms: string[];
  steps: Step[];
  sources: Source[];
};

export type Module = {
  id: string;
  title: string;
  summary: string;
  safety?: boolean;
  status: 'ready' | 'planned';
  lessons: Lesson[];
  check: QuestionStep[];
  planned?: string[];
};

export type Level = {
  n: number;
  title: string;
  subtitle: string;
  tier: string;
  modules: Module[];
};

export type Term = {
  id: string;
  ar: string;
  fr: string;
  en: string;
  def: string;
  symbol?: string;
  unit?: string;
};
