# دارة · Dāra

An Arabic-first (RTL) platform for learning electronics, device repair and electrical
installations from zero. Its structure is inspired by Educato: a learning path, short
concept cards alternating with questions, misconception-specific feedback, and spaced
review. Branding, mascot (Lido) and implementation are original.

## What v1 contains

- **Curriculum map** of 7 levels. Levels 0–1 are fully written: 13 modules, 15 lessons,
  each module ending with a mastery check. Levels 2–6 are shown as "in preparation", with
  their planned topics listed.
- **Mastery gates**: a module opens the next one at 80 %; safety modules need 100 %.
- **Spaced review** (Leitner boxes at 1, 3, 7, 16, 35 and 70 days) of missed questions
  and new glossary terms.
- **4 interactive labs**: Ohm's law, the LED resistor (the LED burns out above ~30 mA),
  series/parallel (solved by a nodal-analysis engine), and a multimeter trainer where
  wrong connections blow the meter's fuse.
- **Trilingual glossary** (Arabic · French · English), with optional Darija explanations.
- **Progress storage**: a per-person cloud store when running as a Claude artifact,
  otherwise localStorage, plus a copy/paste JSON backup.

## Commands

```bash
npm install
npm run dev            # local development server
npm test               # 21 unit tests: solver, scheduler, unlock rules, content integrity, bidi
npm run typecheck
npm run build          # static site in dist/ (any static host: Cloudflare Pages, GitHub Pages)
npm run build:single   # one self-contained HTML file in dist-single/
```

## Layout

```
src/
  types.ts                 content model (typed, so incomplete questions fail the build)
  data/glossary.ts         single source of terminology
  data/curriculum.ts       levels, modules, lookups
  data/lessons/level0.ts   foundations and safety
  data/lessons/level1.ts   DC circuits
  lib/circuit.ts           MNA DC solver, E12 values, SI formatting
  lib/srs.ts               spaced repetition, streaks
  lib/progress.ts          state, unlock rules, transitions (pure functions)
  lib/storage.ts           cloud/local storage adapter
  components/              journey board, players, pages, figures, mascot
  labs/Labs.tsx            the four labs
```

## Authoring a lesson

Add a `Lesson` to a module in `data/lessons/levelN.ts`. Inline markup:
`**bold**`, `[[termId]]` for a glossary chip, and `{{9 V}}` for a left-to-right value.
`npm test` then checks one correct option per question, feedback on every option,
unique ids, balanced markup, and that every term reference exists.

## Safety position

Mains (220–230 V) and installation work are taught only as theory and simulation.
Hands-on tiers: A (batteries up to 9 V) and B (bench supply up to 12 V, current-limited).
Moroccan regulatory claims are labelled verified, disputed or not yet verified.
