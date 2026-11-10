/**
 * Pure scoring and eligibility rules. No DOM, no storage, no shared state:
 * every function takes plain objects and returns plain values, so it is easy to test.
 *
 * student: { cgpa, backlogs, branch, skills[], aptitude, projects, internships }
 * drive:   { minCgpa, maxBack, branches[], skills[] }
 */
import { READINESS_WEIGHTS as W, MATCH_WEIGHTS } from "../config.js";
import { clamp } from "./util.js";

/** Eligibility: CGPA, backlog limit and programme. `why` explains every failed test in plain words. */
export function eligible(student, drive) {
  const why = [];
  if (student.cgpa < drive.minCgpa) {
    why.push("CGPA " + student.cgpa.toFixed(2) + " is below the " + drive.minCgpa.toFixed(1) + " cut-off");
  }
  if (student.backlogs > drive.maxBack) {
    why.push(student.backlogs + " active backlog" + (student.backlogs > 1 ? "s" : "") + " (limit " + drive.maxBack + ")");
  }
  if (drive.branches.indexOf(student.branch) < 0) {
    why.push(student.branch + " is not in the eligible branches");
  }
  return { ok: why.length === 0, why };
}

/** Readiness score, 0 to 100, with the points each component contributed. */
export function readiness(student) {
  const cgpa = clamp(student.cgpa / 10, 0, 1) * W.cgpa;
  const aptitude = clamp(student.aptitude / 100, 0, 1) * W.aptitude;
  const skills = clamp(student.skills.length / W.skillsFull, 0, 1) * W.skills;
  const projects = clamp(student.projects / W.projectsFull, 0, 1) * W.projects;
  const intern = clamp(student.internships / W.internshipsFull, 0, 1) * W.internships;
  const penalty = Math.min(student.backlogs * W.backlogPenalty, W.backlogPenaltyCap);
  const total = Math.round(clamp(cgpa + aptitude + skills + projects + intern - penalty, 0, 100));
  return { cgpa, aptitude, skills, projects, intern, penalty, total };
}

/** Skills a drive asks for that the student does not have. */
export function missing(student, drive) {
  return drive.skills.filter((k) => student.skills.indexOf(k) < 0);
}

/** Fit between a student and a drive, 0 to 100: skill overlap blended with readiness. */
export function matchScore(student, drive) {
  const have = drive.skills.length - missing(student, drive).length;
  const overlap = drive.skills.length ? have / drive.skills.length : 1;
  return Math.round(MATCH_WEIGHTS.skillShare * overlap + MATCH_WEIGHTS.readinessShare * readiness(student).total);
}
