// Leitner-style spaced repetition.
// Box 0 = new or just missed. Each correct review moves a card up one box and
// pushes its next review further out; a miss sends it back to box 0.

export const INTERVAL_DAYS = [1, 3, 7, 16, 35, 70];
export const MASTERED_BOX = 5;
const DAY = 86_400_000;

export type Card = { box: number; due: number };

/** A brand-new card is due tomorrow (start of day), not immediately:
 * reviewing straight after the lesson gives no spacing benefit. */
export function newCard(now: number): Card {
  return { box: 0, due: startOfDay(now) + INTERVAL_DAYS[0] * DAY };
}

export function review(card: Card, correct: boolean, now: number): Card {
  if (!correct) return { box: 0, due: startOfDay(now) + INTERVAL_DAYS[0] * DAY };
  const box = Math.min(card.box + 1, INTERVAL_DAYS.length - 1);
  return { box, due: startOfDay(now) + INTERVAL_DAYS[box] * DAY };
}

export function isDue(card: Card, now: number): boolean {
  return card.due <= now;
}

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayKey(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Consecutive days with activity, ending today or yesterday. */
export function streak(days: string[], now: number): number {
  const set = new Set(days);
  let t = startOfDay(now);
  if (!set.has(dayKey(t))) t -= DAY;
  let n = 0;
  while (set.has(dayKey(t))) {
    n++;
    t -= DAY;
  }
  return n;
}
