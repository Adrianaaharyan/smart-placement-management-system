/**
 * Student portal: what a student sees. There is no sign-in; a "Viewing as" selector picks the student.
 *   1. Summary         unread alerts, drives this week, prep progress
 *   2. Alerts          new openings, reminders, shortlists, interviews and offers (core/notifications.js)
 *   3. Upcoming drives the next 45 days with a countdown and prep progress
 *   4. Prep plan       a dated checklist for one drive (core/prep.js), with ticks saved per student
 *   5. Profile         readiness, skills, applications and matches (views/students.js)
 * Panels 1 to 4 have their own element ids so events can refresh them without redrawing the whole tab.
 */
import { store } from "../core/store.js";
import { findStudent, currentToday, portalStudentId, notificationsFor } from "../core/selectors.js";
import { upcomingDrives, pickDefaultDrive, planProgress } from "../core/prep.js";
import { LEVEL_LABEL, countUnread } from "../core/notifications.js";
import { doneSteps } from "../core/progress.js";
import { formatDate, formatShort, countdown, dayOfMonth, monthShort } from "../core/dates.js";
import { esc, lpa, $ } from "../ui/dom.js";
import { kpi } from "../ui/components.js";
import { studentDetail } from "./students.js";

export const UPCOMING_WINDOW_DAYS = 45;
const VISIBLE_ALERTS = 6;
const LEVEL_PILL = { urgent: "p-bad", soon: "p-warn", good: "p-good", info: "p-info" };

const BELL =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

function context() {
  const s = findStudent(portalStudentId());
  if (!s) return null;
  const today = currentToday();
  return { s, today, notifs: notificationsFor(s, today), upcoming: upcomingDrives(s, store.D, today, UPCOMING_WINDOW_DAYS) };
}

function activeDriveId(c) {
  const id = store.UI.prepDid;
  if (id === "closed") return null;
  if (id && c.upcoming.some((x) => x.drive.id === id)) return id;
  const d = pickDefaultDrive(c.upcoming);
  return d ? d.drive.id : null;
}

function summaryHtml(c) {
  let done = 0;
  let total = 0;
  c.upcoming.forEach((x) => {
    const p = planProgress(x.plan, doneSteps(c.s.id, x.drive.id));
    done += p.done;
    total += p.total;
  });
  return (
    '<div class="psum">' +
    kpi("Unread alerts", countUnread(c.notifs), c.notifs.length + " alert" + (c.notifs.length === 1 ? "" : "s") + " in total") +
    kpi("Drives in the next 7 days", c.upcoming.filter((x) => x.days <= 7).length, c.upcoming.length + " in the next " + UPCOMING_WINDOW_DAYS + " days") +
    kpi("Prep steps done", done + " / " + total, "across drives you are eligible for") +
    "</div>"
  );
}

function alertItem(n, s) {
  const buttons = [];
  if (n.cta === "apply") buttons.push('<button class="btn sm pri" data-act="apply" data-s="' + s.id + '" data-d="' + n.did + '">Apply</button>');
  if (n.cta) buttons.push('<button class="btn sm" data-act="prep-open" data-d="' + n.did + '">Prep plan</button>');
  if (!n.read) buttons.push('<button class="btn sm" data-act="notif-read" data-id="' + esc(n.id) + '">Mark read</button>');
  return (
    '<div class="notif' + (n.read ? "" : " unread") + '"><div class="nmain"><div class="ntitle">' +
    (n.read ? "" : '<span class="udot" aria-hidden="true"></span><span class="sr">Unread. </span>') +
    '<span class="pill ' + LEVEL_PILL[n.level] + '">' + LEVEL_LABEL[n.level] + "</span><span>" + esc(n.title) + "</span></div>" +
    '<div class="meta">' + esc(n.body) + "</div></div>" +
    (buttons.length ? '<div class="nact">' + buttons.join("") + "</div>" : "") + "</div>"
  );
}

function alertsHtml(c) {
  const unread = countUnread(c.notifs);
  const shown = store.UI.notifAll ? c.notifs : c.notifs.slice(0, VISIBLE_ALERTS);
  return (
    '<div class="panel"><div class="phead"><h3>' + BELL + " Alerts" + (unread ? ' <span class="badge" aria-label="' + unread + ' unread">' + unread + "</span>" : "") + "</h3>" +
    (unread ? '<button class="btn sm" data-act="notif-readall">Mark all read</button>' : "") + "</div>" +
    '<div class="list">' +
    (shown.length ? shown.map((n) => alertItem(n, c.s)).join("") : '<div class="sub">No alerts right now. New drives, reminders and shortlists appear here as soon as they are announced.</div>') +
    "</div>" +
    (c.notifs.length > VISIBLE_ALERTS
      ? '<div style="margin-top:10px"><button class="btn sm" data-act="notif-more">' + (store.UI.notifAll ? "Show fewer" : "Show all " + c.notifs.length) + "</button></div>"
      : "") +
    "</div>"
  );
}

function upcomingRow(c, x, activeId) {
  const p = planProgress(x.plan, doneSteps(c.s.id, x.drive.id));
  let status;
  if (x.app) status = '<span class="pill p-info">Applied: ' + esc(x.app.stage) + "</span>";
  else if (x.plan.eligible) status = '<span class="pill p-good">Eligible</span> <span class="sub">' + x.plan.match + "% match</span>";
  else status = '<span class="pill p-mute">Not eligible yet</span>';
  const urgency = x.days <= 1 ? "p-bad" : x.days <= 3 ? "p-warn" : "p-mute";
  return (
    '<div class="drow' + (x.drive.id === activeId ? " sel" : "") + '">' +
    '<div class="dateblk"><b>' + dayOfMonth(x.drive.date) + "</b><span>" + monthShort(x.drive.date) + "</span></div>" +
    '<div class="dmain"><b>' + esc(x.drive.company) + '</b> <span class="sub">' + esc(x.drive.role) + " · " + lpa(x.drive.ctc) + "</span>" +
    '<div class="meta">' + status + (!x.plan.eligible && x.plan.why.length ? ' <span class="why">' + esc(x.plan.why[0]) + "</span>" : "") + "</div></div>" +
    '<div class="dright"><span class="pill ' + urgency + '">' + countdown(x.days) + "</span>" +
    (x.plan.steps.length
      ? '<span class="meter" title="Prep steps done"><span class="t"><i style="width:' + Math.round((p.done / p.total) * 100) + '%"></i></span><span class="num">' + p.done + "/" + p.total + "</span></span>"
      : "") +
    '<button class="btn sm" data-act="prep-open" data-d="' + x.drive.id + '">' + (x.plan.eligible ? "Prep plan" : "Details") + "</button></div></div>"
  );
}

function upcomingHtml(c) {
  const activeId = activeDriveId(c);
  return (
    '<div class="panel"><div class="phead"><h3>Upcoming drives</h3><span class="sub">next ' + UPCOMING_WINDOW_DAYS + " days</span></div><div class=\"list\">" +
    (c.upcoming.length
      ? c.upcoming.map((x) => upcomingRow(c, x, activeId)).join("")
      : '<div class="sub">No drives are scheduled in the next ' + UPCOMING_WINDOW_DAYS + " days. You will see them here when the placement cell announces them.</div>") +
    "</div></div>"
  );
}

function stepHtml(s, i, sid, did, done) {
  const ticked = done.indexOf(s.id) >= 0;
  return (
    '<div class="step' + (ticked ? " done" : "") + '">' +
    '<input type="checkbox" id="pp-' + i + '" data-act="prep-toggle" data-s="' + sid + '" data-d="' + did + '" data-step="' + esc(s.id) + '"' + (ticked ? " checked" : "") + ">" +
    '<div class="smain"><label class="stitle" for="pp-' + i + '">' + esc(s.title) + '</label><div class="meta">' + esc(s.detail) + "</div>" +
    (s.action === "aptitude" ? '<div class="sact"><button class="btn sm" data-act="practice" data-s="' + sid + '">Take the aptitude round</button></div>' : "") + "</div>" +
    '<span class="pill p-mute" title="Suggested date">by ' + formatShort(s.by) + "</span></div>"
  );
}

function prepHtml(c) {
  const id = activeDriveId(c);
  if (!id) {
    return c.upcoming.length
      ? '<div class="panel detail"><div class="phead"><h3>Prep plan</h3></div><div class="sub">Choose a drive above and press "Prep plan".</div></div>'
      : "";
  }
  const x = c.upcoming.find((u) => u.drive.id === id);
  const plan = x.plan;
  const head =
    '<div class="dhead"><div><h2>Prep plan · ' + esc(x.drive.company) + "</h2>" +
    '<div class="sub">' + esc(x.drive.role) + " · " + lpa(x.drive.ctc) + " · drive " + countdown(x.days) + " (" + formatDate(x.drive.date) + ")</div></div>" +
    '<button class="btn sm" data-act="prep-close">Close</button></div>';
  if (!plan.eligible) {
    return (
      '<div class="panel detail">' + head + "<h3>Not eligible for this drive yet</h3><div class=\"list\">" +
      plan.why.map((w) => '<div class="item"><div class="main why">' + esc(w) + "</div></div>").join("") +
      '</div><div class="sub" style="margin-top:8px">Work on what is listed above. Eligibility is checked again whenever your CGPA or backlogs change. Other drives that suit you are in the list above.</div></div>'
    );
  }
  const done = doneSteps(c.s.id, x.drive.id);
  const p = planProgress(plan, done);
  return (
    '<div class="panel detail">' + head +
    '<div class="prow"><span class="meter" style="min-width:200px"><span class="t"><i style="width:' + Math.round((p.done / p.total) * 100) + '%"></i></span><span class="num">' + p.done + " of " + p.total + " done</span></span>" +
    '<span class="pill p-info">' + plan.match + "% match</span>" +
    (plan.missing.length ? '<span class="sub">Skills to build: ' + esc(plan.missing.join(", ")) + "</span>" : '<span class="sub">You already have the skills this drive asks for.</span>') + "</div>" +
    '<div class="list" style="margin-top:12px">' + plan.steps.map((s, i) => stepHtml(s, i, c.s.id, x.drive.id, done)).join("") + "</div>" +
    (x.app ? "" : '<div class="sub" style="margin-top:8px">You have not applied yet. The first step registers you for the drive.</div>') + "</div>"
  );
}

export function viewPortal() {
  const { D, UI } = store;
  if (!D.students.length) return '<div class="panel" style="margin-top:14px">No students loaded.</div>';
  UI.portalSid = portalStudentId();
  const c = context();
  const real = !UI.today;
  return (
    '<div class="panel" style="margin-top:14px"><div class="portal-bar"><div><h2>Student portal</h2>' +
    '<div class="sub">Alerts about upcoming placements, a countdown to each drive, and a prep plan you can tick off.</div></div>' +
    '<div class="pctl"><label class="sub">Viewing as <select id="portal-sel" aria-label="Student">' +
    D.students.map((x) => '<option value="' + x.id + '"' + (x.id === c.s.id ? " selected" : "") + ">" + esc(x.name) + " · " + esc(x.branch) + "</option>").join("") +
    '</select></label><label class="sub">Today <input type="date" id="portal-today" value="' + c.today + '" aria-label="Today\'s date"></label>' +
    (real ? "" : '<button class="btn sm" data-act="today-reset">Use real date</button>') + "</div></div></div>" +
    '<div id="psummary">' + summaryHtml(c) + "</div>" +
    '<div class="grid g2"><div class="pcol" id="pnotif">' + alertsHtml(c) + '</div><div class="pcol" id="pupcoming">' + upcomingHtml(c) + "</div></div>" +
    '<div id="pprep" style="margin-top:14px">' + prepHtml(c) + "</div>" +
    '<div class="label" style="margin-top:24px">Profile and applications</div>' +
    '<div id="pdetail">' + studentDetail(c.s.id) + "</div>"
  );
}

/** Redraw panels 1 to 4 in place and keep keyboard focus on the same control. */
export function refreshPortalPanels() {
  const c = context();
  if (!c || !$("#pnotif")) return;
  const active = document.activeElement;
  const id = active && active.id;
  $("#psummary").innerHTML = summaryHtml(c);
  $("#pnotif").innerHTML = alertsHtml(c);
  $("#pupcoming").innerHTML = upcomingHtml(c);
  $("#pprep").innerHTML = prepHtml(c);
  if (id) {
    const el = document.getElementById(id);
    if (el && el.focus) el.focus();
  }
}
