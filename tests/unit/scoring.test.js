import { test } from "node:test";
import assert from "node:assert/strict";
import { eligible, readiness, missing, matchScore } from "../../js/core/scoring.js";

const strong = { cgpa: 10, backlogs: 0, branch: "MBA", skills: ["a", "b", "c", "d", "e", "f"], aptitude: 100, projects: 3, internships: 2 };
const weak = { cgpa: 0, backlogs: 2, branch: "MBA", skills: [], aptitude: 0, projects: 0, internships: 0 };
const drive = { minCgpa: 7, maxBack: 0, branches: ["MBA", "B.Com"], skills: ["Excel", "Sales"] };

test("eligible: passes when CGPA, backlogs and programme all fit", () => {
  const r = eligible({ cgpa: 7.5, backlogs: 0, branch: "MBA" }, drive);
  assert.equal(r.ok, true);
  assert.deepEqual(r.why, []);
});

test("eligible: explains every failed rule in plain words", () => {
  const r = eligible({ cgpa: 6.5, backlogs: 2, branch: "BA LLB" }, drive);
  assert.equal(r.ok, false);
  assert.equal(r.why.length, 3);
  assert.match(r.why[0], /CGPA 6\.50 is below the 7\.0 cut-off/);
  assert.match(r.why[1], /2 active backlogs \(limit 0\)/);
  assert.match(r.why[2], /BA LLB is not in the eligible branches/);
});

test("eligible: CGPA exactly at the cut-off is allowed", () => {
  assert.equal(eligible({ cgpa: 7, backlogs: 0, branch: "MBA" }, drive).ok, true);
});

test("readiness: a perfect profile scores 100", () => {
  assert.equal(readiness(strong).total, 100);
});

test("readiness: never goes below 0, even with backlogs", () => {
  assert.equal(readiness(weak).total, 0);
});

test("readiness: backlog penalty is 10 per backlog and capped at 20", () => {
  assert.equal(readiness({ ...strong, backlogs: 1 }).penalty, 10);
  assert.equal(readiness({ ...strong, backlogs: 5 }).penalty, 20);
  assert.equal(readiness({ ...strong, backlogs: 5 }).total, 80);
});

test("readiness: component caps hold (extra skills, projects and internships add nothing)", () => {
  const r = readiness({ ...strong, skills: new Array(20).fill("x"), projects: 10, internships: 9 });
  assert.equal(r.skills, 20);
  assert.equal(r.projects, 10);
  assert.equal(r.intern, 10);
});

test("missing: lists only skills the student lacks", () => {
  assert.deepEqual(missing({ skills: ["Excel"] }, drive), ["Sales"]);
  assert.deepEqual(missing({ skills: ["Excel", "Sales"] }, drive), []);
});

test("matchScore: full skill overlap plus perfect readiness is 100", () => {
  assert.equal(matchScore({ ...strong, skills: ["Excel", "Sales", "c", "d", "e", "f"] }, drive), 100);
});

test("matchScore: no skill overlap leaves only the readiness share", () => {
  // `strong` has six skills, none of which the drive asks for, and readiness 100.
  assert.equal(matchScore(strong, drive), 45);
});

test("matchScore: a drive with no required skills counts as full overlap", () => {
  assert.equal(matchScore(strong, { ...drive, skills: [] }), 100);
});
