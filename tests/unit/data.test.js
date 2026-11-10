import { test } from "node:test";
import assert from "node:assert/strict";
import { PROGRAMMES, STAGES } from "../../js/config.js";
import { OFFICIAL, RATE_MISMATCH_THRESHOLD } from "../../js/data/official.js";
import { QUESTIONS } from "../../js/data/questions.js";
import { DRIVES_SEED } from "../../js/data/drives.js";
import { ROUND_LENGTH } from "../../js/core/quiz.js";
import { buildSample } from "../../js/core/sample.js";
import { eligible } from "../../js/core/scoring.js";

test("official: school table totals match the 2024-25 annual report (1,015 eligible, 816 placed)", () => {
  const eligibleTotal = OFFICIAL.schools.reduce((a, s) => a + s.eligible, 0);
  const placedTotal = OFFICIAL.schools.reduce((a, s) => a + s.placed, 0);
  assert.equal(eligibleTotal, 1015);
  assert.equal(placedTotal, 816);
});

test("official: no school has more placed than eligible", () => {
  for (const s of OFFICIAL.schools) assert.ok(s.placed <= s.eligible, s.code);
});

test("official: the data-quality note about mismatched rates is true of the data", () => {
  const mismatched = OFFICIAL.schools.filter(
    (s) => Math.abs(Math.round((s.placed / s.eligible) * 100) - s.statedRate) > RATE_MISMATCH_THRESHOLD
  );
  assert.equal(mismatched.length, 7);
  assert.match(OFFICIAL.notes[0], /Seven of eleven/);
});

test("official: the school with an average above its maximum is SBAS only", () => {
  const bad = OFFICIAL.schools.filter((s) => s.avgCtc > s.maxCtc).map((s) => s.code);
  assert.deepEqual(bad, ["SBAS"]);
});

test("official: sector split and package bands each add up to 100%", () => {
  assert.equal(OFFICIAL.sector.reduce((a, s) => a + s.value, 0), 100);
  assert.equal(OFFICIAL.packageBands.reduce((a, s) => a + s.value, 0), 100);
});

test("official: headline list has exactly one computed tile", () => {
  assert.equal(OFFICIAL.headlines.filter((t) => t.computed).length, 1);
});

test("questions: four options each, a valid answer index, and an explanation", () => {
  for (const q of QUESTIONS) {
    assert.equal(q.o.length, 4, q.q);
    assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < 4, q.q);
    assert.ok(q.e.length > 10, q.q);
    assert.ok([1, 2, 3].includes(q.l), q.q);
  }
});

test("questions: at least one round's worth at every level, with unique text", () => {
  for (const level of [1, 2, 3]) {
    assert.ok(QUESTIONS.filter((q) => q.l === level).length >= 6, "level " + level);
  }
  assert.ok(QUESTIONS.length >= ROUND_LENGTH);
  assert.equal(new Set(QUESTIONS.map((q) => q.q)).size, QUESTIONS.length);
});

test("drives: every programme named in a seed drive exists in the catalogue", () => {
  for (const d of DRIVES_SEED) {
    for (const b of d.branches) assert.ok(PROGRAMMES[b], d.company + " -> " + b);
  }
});

test("drives: every seed drive has at least one eligible sample student when it matters", () => {
  const { students, drives } = buildSample();
  for (const d of drives.filter((x) => x.status !== "Upcoming")) {
    assert.ok(students.some((s) => eligible(s, d).ok), d.company + " has nobody eligible");
  }
});

test("sample: same seed gives identical data", () => {
  assert.deepEqual(buildSample(), buildSample());
});

test("sample: a different seed gives different students", () => {
  assert.notDeepEqual(buildSample(1).students, buildSample(2).students);
});

test("sample: 120 students across the catalogue, unique names and rolls", () => {
  const { students } = buildSample();
  assert.equal(students.length, Object.values(PROGRAMMES).reduce((a, p) => a + p.n, 0));
  assert.equal(new Set(students.map((s) => s.name)).size, students.length);
  assert.equal(new Set(students.map((s) => s.roll)).size, students.length);
  for (const s of students) assert.ok(PROGRAMMES[s.branch], s.branch);
});

test("sample: applications point at real students and drives, use valid stages, and respect eligibility", () => {
  const { students, drives, apps } = buildSample();
  const sById = new Map(students.map((s) => [s.id, s]));
  const dById = new Map(drives.map((d) => [d.id, d]));
  assert.ok(apps.length > 0);
  for (const a of apps) {
    const s = sById.get(a.sid);
    const d = dById.get(a.did);
    assert.ok(s && d);
    assert.ok(STAGES.includes(a.stage));
    assert.notEqual(d.status, "Upcoming");
    assert.equal(eligible(s, d).ok, true);
  }
});

test("sample: completed drives hold only final outcomes (Offered or Rejected)", () => {
  const { drives, apps } = buildSample();
  const completed = new Set(drives.filter((d) => d.status === "Completed").map((d) => d.id));
  for (const a of apps.filter((x) => completed.has(x.did))) {
    assert.ok(["Offered", "Rejected"].includes(a.stage));
  }
});

test("sample: no student applies to the same drive twice", () => {
  const { apps } = buildSample();
  const keys = apps.map((a) => a.sid + "|" + a.did);
  assert.equal(new Set(keys).size, keys.length);
});
