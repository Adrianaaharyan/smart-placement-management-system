/** Small pure helpers shared by core modules. */

/** 7.5 -> "₹7.5 LPA" */
export function lpa(n) {
  return "₹" + (Math.round(n * 10) / 10).toFixed(1) + " LPA";
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Mulberry32: a tiny seeded pseudo-random generator. Returns a function that yields numbers in [0, 1). */
export function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
