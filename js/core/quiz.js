/**
 * Adaptive aptitude round. A correct answer moves to a harder level, a wrong
 * answer to an easier one. Pure functions over a `round` object, so the engine
 * can be tested without a browser.
 *
 * round: { sid, level, asked[], cur, hist[{l, ok}], ans, earned, done, score? }
 */
import { QUESTIONS } from "../data/questions.js";
import { clamp } from "./util.js";

export const ROUND_LENGTH = 10;
export const START_LEVEL = 2;
export const MAX_LEVEL = 3;
/** Points a very strong round earns: level-3 answers are worth 3, so ten of them would be 30. 28 leaves headroom for the level-2 opener. */
export const MAX_POINTS = 28;

/** Choose an unseen question at `level`, falling back to the nearest level that still has questions. Returns an index into QUESTIONS. */
export function pickQuestion(level, asked, rand = Math.random) {
  const order = [level, level + 1, level - 1, level + 2, level - 2].filter((l) => l >= 1 && l <= MAX_LEVEL);
  for (const lv of order) {
    const pool = [];
    QUESTIONS.forEach((q, i) => {
      if (q.l === lv && !asked.includes(i)) pool.push(i);
    });
    if (pool.length) return pool[Math.floor(rand() * pool.length)];
  }
  return 0;
}

/** Level after answering a question that was at `questionLevel`. */
export function nextLevel(questionLevel, correct) {
  return clamp(questionLevel + (correct ? 1 : -1), 1, MAX_LEVEL);
}

/** Final aptitude score, 0 to 100, from the points earned (a correct answer earns its level). */
export function scoreRound(earned) {
  return clamp(Math.round((earned / MAX_POINTS) * 100), 0, 100);
}

export function startRound(studentId, rand = Math.random) {
  const first = pickQuestion(START_LEVEL, [], rand);
  return { sid: studentId, level: START_LEVEL, asked: [first], cur: first, hist: [], ans: null, earned: 0, done: false };
}

/** Record an answer. Ignored if the current question was already answered. */
export function submitAnswer(round, choice) {
  if (round.ans !== null) return round;
  const q = QUESTIONS[round.cur];
  const ok = choice === q.a;
  round.ans = choice;
  round.hist.push({ l: q.l, ok });
  if (ok) round.earned += q.l;
  round.level = nextLevel(q.l, ok);
  return round;
}

/** Move to the next question, or finish the round after ROUND_LENGTH answers. */
export function advanceRound(round, rand = Math.random) {
  if (round.hist.length >= ROUND_LENGTH) {
    round.score = scoreRound(round.earned);
    round.done = true;
    return round;
  }
  const n = pickQuestion(round.level, round.asked, rand);
  round.asked.push(n);
  round.cur = n;
  round.ans = null;
  return round;
}
