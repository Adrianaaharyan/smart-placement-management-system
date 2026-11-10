/** Read-only queries over the current state (`store.D`). */
import { PROGRAMMES } from "../config.js";
import { store } from "./store.js";
import { todayISO } from "./dates.js";
import { buildNotifications } from "./notifications.js";

export function findDrive(id) {
  return store.D.drives.find((d) => d.id === id) || null;
}

export function findStudent(id) {
  return store.D.students.find((s) => s.id === id) || null;
}

export function appsOfStudent(id) {
  return store.D.apps.filter((a) => a.sid === id);
}

export function appsOfDrive(id) {
  return store.D.apps.filter((a) => a.did === id);
}

/** Highest CTC (LPA) among the student's offers, or 0 if none. */
export function bestCtc(student) {
  let best = 0;
  appsOfStudent(student.id).forEach((a) => {
    if (a.stage === "Offered") {
      const d = findDrive(a.did);
      if (d && d.ctc > best) best = d.ctc;
    }
  });
  return best;
}

/** Placed = at least one Offered application (counted once, however many offers). */
export function placementStatus(student) {
  if (bestCtc(student) > 0) return "Placed";
  if (appsOfStudent(student.id).some((a) => a.stage !== "Rejected")) return "In process";
  return "Not placed yet";
}

/** Catalogue programmes first, then any extra programme found in imported students. */
export function allProgrammes() {
  const out = Object.keys(PROGRAMMES);
  store.D.students.forEach((s) => {
    if (out.indexOf(s.branch) < 0) out.push(s.branch);
  });
  return out;
}

/** Today's date for the portal: the demo date if one is set, otherwise the real date. */
export function currentToday() {
  return store.UI.today || todayISO();
}

/** The student the portal is showing: the chosen one, else the first student, else null. */
export function portalStudentId() {
  const { D, UI } = store;
  if (UI.portalSid && findStudent(UI.portalSid)) return UI.portalSid;
  return D.students.length ? D.students[0].id : null;
}

export function notificationsFor(student, today = currentToday()) {
  return buildNotifications(student, store.D, today, (store.D.notifRead || {})[student.id] || []);
}
