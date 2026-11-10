/** Small reusable HTML builders shared by several views. Each returns a string. */
import { STAGES } from "../config.js";
import { esc } from "./dom.js";

/**
 * Horizontal bar chart drawn with CSS.
 * rows: [{ l: label, v: value, t: text shown at the right }], max: value that fills the bar.
 */
export function barRows(rows, max, mark) {
  return (
    '<div class="bars">' +
    rows
      .map((r) => {
        const w = max > 0 ? Math.round((r.v / max) * 100) : 0;
        return (
          '<div class="brow"><span class="l" title="' + esc(r.l) + '">' + esc(r.l) + "</span>" +
          '<span class="t"><i class="' + (mark ? "m" : "") + '" style="width:' + w + '%"></i></span>' +
          '<span class="n num">' + esc(r.t) + "</span></div>"
        );
      })
      .join("") +
    "</div>"
  );
}

/** Number tile: label, big value, one line of context. */
export function kpi(label, value, note) {
  return (
    '<div class="panel kpi"><div class="label">' + esc(label) + '</div><div class="v num">' + esc(value) +
    '</div><div class="k">' + esc(note) + "</div></div>"
  );
}

/** Stage dropdown for one application. Handled by the "stage" action in events.js. */
export function stageSelect(studentId, driveId, current) {
  return (
    '<select class="stage" data-act="stage" data-s="' + studentId + '" data-d="' + driveId + '" aria-label="Stage">' +
    STAGES.map((x) => "<option" + (x === current ? " selected" : "") + ">" + x + "</option>").join("") +
    "</select>"
  );
}
