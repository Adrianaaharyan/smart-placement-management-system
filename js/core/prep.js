/**
 * Preparation plans. For one student and one drive, build a short checklist of what to do
 * before the drive, each step with a "do it by" date spread between today and the drive.
 * Pure functions: the plan is derived from the profile, the drive's required skills, the
 * student's stage and the days left. Which steps are ticked off is stored separately (progress.js).
 *
 * plan: { driveId, daysLeft, eligible, why[], match, missing[], applied, stage, steps[] }
 * step: { id, kind, title, detail, by, action? }
 */
import { eligible, matchScore, missing } from "./scoring.js";
import { daysBetween, addDays, isISODate } from "./dates.js";

/** Below this aptitude score, the plan includes a step to raise it. */
export const APTITUDE_TARGET = 70;
const MAX_SKILL_STEPS = 4;
const MAX_REVISE_STEPS = 3;

export function buildPrepPlan(student, drive, application, today) {
  const daysLeft = daysBetween(today, drive.date);
  const el = eligible(student, drive);
  const plan = {
    driveId: drive.id, daysLeft, eligible: el.ok, why: el.why, match: matchScore(student, drive),
    missing: missing(student, drive), applied: !!application, stage: application ? application.stage : null, steps: [],
  };
  if (!el.ok) return plan;

  const steps = [];
  const step = (id, kind, title, detail, extra) => steps.push(Object.assign({ id, kind, title, detail }, extra));

  if (!application) {
    step("apply", "apply", "Apply to " + drive.company, "Register for the " + drive.role + " drive so the placement cell can shortlist you.");
  }
  step("research", "research", "Research " + drive.company,
    "Read what the company does, its recent news and what a " + drive.role + " does day to day.");

  plan.missing.slice(0, MAX_SKILL_STEPS).forEach((k) =>
    step("skill:" + k, "skill", "Learn the basics of " + k,
      "This drive asks for " + k + " and it is not on your profile yet. Practise a few exercises, then add it to your profile."));

  drive.skills.filter((k) => student.skills.indexOf(k) >= 0).slice(0, MAX_REVISE_STEPS).forEach((k) =>
    step("revise:" + k, "skill", "Revise " + k,
      "Required for this role and already on your profile. Solve a few problems so you can explain it with confidence."));

  if (student.aptitude < APTITUDE_TARGET) {
    step("aptitude", "aptitude", "Raise your aptitude score",
      "Your score is " + student.aptitude + ". Aim for " + APTITUDE_TARGET + " or more with a few adaptive rounds.", { action: "aptitude" });
  }

  step("resume", "resume", "Update your resume",
    student.projects < 2
      ? "You list " + student.projects + " project" + (student.projects === 1 ? "" : "s") + ". Add one more, with what you built and the result."
      : "Describe your " + student.projects + " projects with what you built and the result, and keep it to one page.");
  step("intro", "interview", "Prepare a one-minute introduction",
    "Cover your programme, your strongest skill, one project, and why this role.");

  if (application && application.stage === "Shortlisted") {
    step("round", "interview", "Prepare for the technical or domain round",
      "Expect questions on the skills this role asks for. Practise explaining your answers aloud.");
  }
  if (application && application.stage === "Interview") {
    step("mock", "interview", "Do a mock interview", "Ask a friend or a faculty member to interview you, and time your answers.");
    step("questions", "interview", "Prepare questions to ask", "Two or three thoughtful questions about the team, the role and training.");
  }
  if (daysLeft <= 2) {
    step("docs", "docs", "Keep your documents ready", "ID card, printed resumes and mark sheets, packed the evening before.");
  }

  // Spread the steps between today and the day before the drive. Applying comes first.
  const span = Math.max(daysLeft - 1, 0);
  steps.forEach((s, i) => {
    const offset = s.id === "apply" ? 0 : Math.min(span, Math.floor((span * (i + 1)) / steps.length));
    s.by = addDays(today, offset);
  });
  plan.steps = steps;
  return plan;
}

/** { done, total } for a plan, counting only ticks that match a current step. */
export function planProgress(plan, doneIds) {
  const ids = new Set(plan.steps.map((s) => s.id));
  const done = (doneIds || []).filter((id) => ids.has(id)).length;
  return { done, total: plan.steps.length };
}

/**
 * Drives that have not happened yet, soonest first, each with the student's eligibility and prep plan.
 * @returns {{drive, days, app, plan}[]}
 */
export function upcomingDrives(student, data, today, withinDays) {
  const appOf = {};
  data.apps.forEach((a) => {
    if (a.sid === student.id) appOf[a.did] = a;
  });
  return data.drives
    .filter((d) => d.status !== "Completed" && isISODate(d.date))
    .map((d) => ({ drive: d, days: daysBetween(today, d.date), app: appOf[d.id] || null }))
    .filter((x) => x.days >= 0 && x.days <= withinDays)
    .sort((a, b) => a.days - b.days)
    .map((x) => Object.assign(x, { plan: buildPrepPlan(student, x.drive, x.app, today) }));
}

/** The drive to show a prep plan for when the student has not chosen one: soonest applied, else soonest eligible, else soonest. */
export function pickDefaultDrive(list) {
  const live = (x) => !x.app || (x.app.stage !== "Offered" && x.app.stage !== "Rejected");
  return list.find((x) => x.app && live(x)) || list.find((x) => x.plan.eligible && !x.app) || list[0] || null;
}
