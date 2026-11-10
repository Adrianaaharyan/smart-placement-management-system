import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "../../js/data/questions.js";
import {
  pickQuestion, nextLevel, scoreRound, startRound, submitAnswer, advanceRound,
  ROUND_LENGTH, START_LEVEL, MAX_POINTS,
} from "../../js/core/quiz.js";

const first = () => 0; // deterministic "random": always the first candidate

function playRound(answerFor) {
  const round = startRound("s1", first);
  while (!round.done) {
    const q = QUESTIONS[round.cur];
    submitAnswer(round, answerFor(q));
    advanceRound(round, first);
  }
  return round;
}

test("pickQuestion: returns a question at the requested level when one is unseen", () => {
  for (const level of [1, 2, 3]) {
    assert.equal(QUESTIONS[pickQuestion(level, [], first)].l, level);
  }
});

test("pickQuestion: never returns an already asked question", () => {
  const asked = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const n = pickQuestion(2, asked, first);
    assert.ok(!asked.includes(n), "repeated question " + n);
    asked.push(n);
  }
});

test("pickQuestion: falls back to the nearest level when a level is used up", () => {
  const level3 = QUESTIONS.map((q, i) => (q.l === 3 ? i : -1)).filter((i) => i >= 0);
  assert.equal(QUESTIONS[pickQuestion(3, level3, first)].l, 2);
});

test("nextLevel: up on correct, down on wrong, clamped to 1..3", () => {
  assert.equal(nextLevel(2, true), 3);
  assert.equal(nextLevel(2, false), 1);
  assert.equal(nextLevel(3, true), 3);
  assert.equal(nextLevel(1, false), 1);
});

test("scoreRound: 0 earns 0, full points earns 100, and the score is capped at 100", () => {
  assert.equal(scoreRound(0), 0);
  assert.equal(scoreRound(MAX_POINTS), 100);
  assert.equal(scoreRound(MAX_POINTS + 10), 100);
  assert.equal(scoreRound(14), 50);
});

test("startRound: begins at the start level with the first question recorded", () => {
  const r = startRound("s7", first);
  assert.equal(r.sid, "s7");
  assert.equal(r.level, START_LEVEL);
  assert.equal(QUESTIONS[r.cur].l, START_LEVEL);
  assert.deepEqual(r.asked, [r.cur]);
  assert.equal(r.done, false);
});

test("submitAnswer: a second answer to the same question is ignored", () => {
  const r = startRound("s1", first);
  const correct = QUESTIONS[r.cur].a;
  submitAnswer(r, correct);
  submitAnswer(r, (correct + 1) % 4);
  assert.equal(r.hist.length, 1);
  assert.equal(r.hist[0].ok, true);
});

test("a round of all correct answers finishes after 10 questions with a high score and no repeats", () => {
  const r = playRound((q) => q.a);
  assert.equal(r.hist.length, ROUND_LENGTH);
  assert.equal(new Set(r.asked).size, r.asked.length);
  assert.ok(r.score >= 85 && r.score <= 100, "score " + r.score);
  assert.ok(r.hist.slice(1).some((h) => h.l === 3), "difficulty should rise to level 3");
});

test("a round of all wrong answers scores 0 and drops to level 1", () => {
  const r = playRound((q) => (q.a + 1) % 4);
  assert.equal(r.score, 0);
  assert.ok(r.hist.slice(1).every((h) => h.l <= 2));
  assert.ok(r.hist.some((h) => h.l === 1));
});
