/**
 * Date helpers. Dates are plain "YYYY-MM-DD" strings, so there are no time zone
 * surprises: "5 days from today" means the same thing everywhere.
 */
const MS_PER_DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function utc(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function isISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(utc(s));
}

/** The local calendar date of a Date object as "YYYY-MM-DD". */
export function todayISO(now = new Date()) {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + m + "-" + d;
}

/** Whole days from one date to another. Negative when `to` is earlier. */
export function daysBetween(from, to) {
  return Math.round((utc(to) - utc(from)) / MS_PER_DAY);
}

export function addDays(iso, n) {
  return new Date(utc(iso) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

/** "2026-11-12" -> "12 Nov 2026" */
export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return d + " " + MONTHS[m - 1] + " " + y;
}

/** "2026-11-12" -> "12 Nov" */
export function formatShort(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return d + " " + MONTHS[m - 1];
}

export function dayOfMonth(iso) {
  return Number(iso.split("-")[2]);
}

export function monthShort(iso) {
  return MONTHS[Number(iso.split("-")[1]) - 1];
}

/** 0 -> "today", 1 -> "tomorrow", 5 -> "in 5 days", -3 -> "3 days ago" */
export function countdown(days) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? "in " + days + " days" : Math.abs(days) + " days ago";
}
