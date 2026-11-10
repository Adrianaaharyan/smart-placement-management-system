/** DOM and formatting helpers used by the views and event handlers. */

export const $ = (selector) => document.querySelector(selector);

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape text before putting it into an HTML string. Every user-supplied value goes through this. */
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export { lpa } from "../core/util.js";

/** CSS class for a status pill. Works for drive statuses and student statuses. */
export function pillFor(status) {
  switch (status) {
    case "Placed":
    case "Open":
      return "p-good";
    case "In process":
      return "p-info";
    case "Upcoming":
      return "p-warn";
    default:
      return "p-mute";
  }
}

let toastTimer;
/** Show a short confirmation message at the bottom of the screen. */
export function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.className = "on";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "";
  }, 2600);
}
