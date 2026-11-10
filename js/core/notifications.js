/**
 * Student alerts, computed from the drives, the student's applications and today's date.
 * Nothing is stored except which alerts the student has marked as read, so alerts
 * always reflect the current state: change a stage or a drive date and the inbox follows.
 *
 * A notification: { id, type, level, title, body, did, days, cta, read }
 *   type:  "offer" | "drive" | "opening"
 *   level: "urgent" (1 day or less) | "soon" (3 days or less) | "good" | "info"
 *   cta:   "prep" (open the prep plan), "apply" (apply, then prep), or null
 *
 * Alert ids include a time bucket (today, tomorrow, within 3, 7 or 14 days), so an alert
 * the student already read comes back as a new one when the drive gets closer.
 */
import { eligible, matchScore, missing } from "./scoring.js";
import { daysBetween, countdown, formatDate, isISODate } from "./dates.js";
import { lpa } from "./util.js";

/** Applied students are reminded this many days ahead. Shortlisted and interview stages are announced up to OPENING_WITHIN_DAYS ahead. */
export const REMIND_WITHIN_DAYS = 14;
/** New openings are announced when the drive is at most this many days away. */
export const OPENING_WITHIN_DAYS = 30;
export const MAX_OPENINGS = 5;

export const LEVEL_LABEL = { urgent: "Urgent", soon: "Soon", good: "Good news", info: "New" };
const LEVEL_ORDER = { urgent: 0, soon: 1, good: 2, info: 3 };

function bucket(days) {
  if (days <= 0) return 0;
  if (days <= 1) return 1;
  if (days <= 3) return 3;
  if (days <= 7) return 7;
  return 14;
}

function nearLevel(days, fallback) {
  if (days <= 1) return "urgent";
  if (days <= 3) return "soon";
  return fallback;
}

/**
 * @param {object} student
 * @param {{drives: object[], apps: object[]}} data
 * @param {string} today "YYYY-MM-DD"
 * @param {string[]} [readIds] alert ids the student has marked as read
 * @returns {object[]} unread first, then by urgency, then by how soon the drive is
 */
export function buildNotifications(student, data, today, readIds) {
  const read = new Set(readIds || []);
  const appOf = {};
  data.apps.forEach((a) => {
    if (a.sid === student.id) appOf[a.did] = a;
  });

  const out = [];
  const openings = [];
  const add = (n) => {
    n.read = read.has(n.id);
    out.push(n);
  };

  data.drives.forEach((d) => {
    if (!isISODate(d.date)) return;
    const days = daysBetween(today, d.date);
    const app = appOf[d.id];

    if (app) {
      if (app.stage === "Offered") {
        add({
          id: "offer:" + d.id, type: "offer", level: "good", did: d.id, days, cta: null,
          title: "Offer from " + d.company,
          body: "You have an offer for " + d.role + " at " + lpa(d.ctc) + ". Confirm the joining details with the placement cell.",
        });
        return;
      }
      if (app.stage === "Rejected" || d.status === "Completed" || days < 0) return;

      const when = countdown(days) + " (" + formatDate(d.date) + ")";
      let n = null;
      if (app.stage === "Interview" && days <= OPENING_WITHIN_DAYS) {
        n = { level: nearLevel(days, "info"), title: "Interview stage at " + d.company, body: "The drive is " + when + ". Prepare for the interview and keep your documents ready." };
      } else if (app.stage === "Shortlisted" && days <= OPENING_WITHIN_DAYS) {
        n = { level: nearLevel(days, "good"), title: "You are shortlisted for " + d.company, body: "The drive is " + when + ". Prepare for the technical or domain round." };
      } else if (app.stage === "Applied" && days <= REMIND_WITHIN_DAYS) {
        n = { level: nearLevel(days, "info"), title: d.company + " drive " + countdown(days), body: "You have applied for " + d.role + ". The drive is on " + formatDate(d.date) + ". Work through your prep plan." };
      }
      if (n) add(Object.assign(n, { id: "drive:" + d.id + ":" + app.stage + ":" + bucket(days), type: "drive", did: d.id, days, cta: "prep" }));
      return;
    }

    if (d.status !== "Completed" && days >= 0 && days <= OPENING_WITHIN_DAYS && eligible(student, d).ok) {
      openings.push({ d, days, match: matchScore(student, d) });
    }
  });

  openings
    .sort((a, b) => a.days - b.days || b.match - a.match)
    .slice(0, MAX_OPENINGS)
    .forEach(({ d, days, match }) => {
      const gaps = missing(student, d);
      add({
        id: "open:" + d.id + ":" + bucket(days), type: "opening", level: nearLevel(days, "info"), did: d.id, days, cta: "apply",
        title: "New opening: " + d.company,
        body: d.role + ", " + lpa(d.ctc) + ". The drive is " + countdown(days) + " (" + formatDate(d.date) + "). " + match + "% match." +
          (gaps.length ? " Skills to build: " + gaps.join(", ") + "." : " You already have the skills it asks for."),
      });
    });

  out.sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0) || LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.days - b.days);
  return out;
}

export function countUnread(list) {
  return list.filter((n) => !n.read).length;
}
