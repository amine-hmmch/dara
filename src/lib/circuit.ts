// A small DC solver using Modified Nodal Analysis (MNA).
// Supports resistors and ideal voltage sources. Node 0 is ground.
// Used by the labs and checked against closed-form results in tests.

export type Element =
  | { type: 'R'; a: number; b: number; r: number }
  | { type: 'V'; a: number; b: number; v: number }; // a = + terminal, b = − terminal

export type Solution = {
  /** Node voltages, index = node number (node 0 is 0 V). */
  v: number[];
  /** Current through each element, in element order, flowing a → b
   * inside a resistor, and out of the + terminal for a source. */
  i: number[];
};

export class CircuitError extends Error {}

export function solve(nodeCount: number, els: Element[]): Solution {
  const n = nodeCount - 1; // unknown node voltages (ground excluded)
  const sources = els.filter((e) => e.type === 'V');
  const m = sources.length;
  const size = n + m;
  const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const z: number[] = new Array(size).fill(0);
  const idx = (node: number) => node - 1; // -1 means ground

  let k = 0;
  for (const e of els) {
    if (e.type === 'R') {
      if (!(e.r > 0)) throw new CircuitError('resistance must be positive');
      const g = 1 / e.r;
      const a = idx(e.a);
      const b = idx(e.b);
      if (a >= 0) A[a][a] += g;
      if (b >= 0) A[b][b] += g;
      if (a >= 0 && b >= 0) {
        A[a][b] -= g;
        A[b][a] -= g;
      }
    } else {
      const row = n + k;
      const a = idx(e.a);
      const b = idx(e.b);
      if (a >= 0) {
        A[a][row] += 1;
        A[row][a] += 1;
      }
      if (b >= 0) {
        A[b][row] -= 1;
        A[row][b] -= 1;
      }
      z[row] = e.v;
      k++;
    }
  }

  const x = gauss(A, z);
  const v = [0, ...x.slice(0, n)];
  let s = 0;
  const i = els.map((e) => {
    if (e.type === 'R') return (v[e.a] - v[e.b]) / e.r;
    // MNA unknown is current into the + terminal; report current out of it.
    return -x[n + s++];
  });
  return { v, i };
}

function gauss(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, r) => [...row, b[r]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) {
      throw new CircuitError('circuit has no unique solution (short circuit or floating node)');
    }
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((row, r) => row[n] / row[r]);
}

export const series = (...rs: number[]) => rs.reduce((s, r) => s + r, 0);
export const parallel = (...rs: number[]) => 1 / rs.reduce((s, r) => s + 1 / r, 0);

/** Standard E12 resistor values across 10 Ω – 1 MΩ. */
export const E12 = (() => {
  const base = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
  const out: number[] = [];
  for (let d = 1; d <= 100000; d *= 10) for (const b of base) out.push(b * d);
  out.push(1000000);
  return out;
})();

/** Smallest E12 value that is ≥ r (the safe choice for an LED resistor). */
export function nextE12(r: number): number {
  return E12.find((x) => x >= r - 1e-9) ?? E12[E12.length - 1];
}

/** Format a value with an SI prefix: 0.0153 A → "15.3 mA". */
export function si(value: number, unit: string, digits = 3): string {
  if (!isFinite(value)) return '∞ ' + unit;
  const abs = Math.abs(value);
  const prefixes: [number, string][] = [
    [1e6, 'M'],
    [1e3, 'k'],
    [1, ''],
    [1e-3, 'm'],
    [1e-6, 'µ'],
  ];
  if (abs === 0) return `0 ${unit}`;
  for (const [f, p] of prefixes) {
    if (abs >= f * 0.9995) return `${trim(value / f, digits)} ${p}${unit}`;
  }
  return `${trim(value / 1e-6, digits)} µ${unit}`;
}

function trim(x: number, digits: number): string {
  return String(Number(x.toPrecision(digits)));
}
