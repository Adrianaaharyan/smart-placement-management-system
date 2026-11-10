/** Drives tab: list with filters, drive detail with applicants and ranked eligible students, and the add-drive form. */
import { store } from "../core/store.js";
import { eligible, matchScore, missing } from "../core/scoring.js";
import { findDrive, findStudent, appsOfDrive, allProgrammes } from "../core/selectors.js";
import { DRIVE_STATUSES } from "../config.js";
import { esc, lpa, pillFor } from "../ui/dom.js";
import { stageSelect } from "../ui/components.js";

/** Table body. Re-rendered on its own when the search box or a status chip changes. */
export function driveRows() {
  const { D, UI } = store;
  const q = UI.dq.toLowerCase();
  const rows = D.drives
    .filter((d) => (UI.ds === "All" || d.status === UI.ds) && (!q || (d.company + " " + d.role).toLowerCase().indexOf(q) >= 0))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!rows.length) return '<tr><td colspan="7" class="sub">No drives match.</td></tr>';
  return rows
    .map((d) => {
      const eligibleCount = D.students.filter((s) => eligible(s, d).ok).length;
      return (
        '<tr class="row' + (UI.selD === d.id ? " sel" : "") + '" data-act="seld" data-id="' + d.id + '" tabindex="0">' +
        "<td><b>" + esc(d.company) + '</b><div class="sub">' + esc(d.role) + "</div></td>" +
        '<td class="num">' + lpa(d.ctc) + "</td>" +
        '<td class="sub">CGPA ' + d.minCgpa.toFixed(1) + "+ · " +
          (d.maxBack === 0 ? "no backlogs" : "up to " + d.maxBack + " backlog" + (d.maxBack > 1 ? "s" : "")) +
          "<br>" + esc(d.branches.join(", ")) + "</td>" +
        '<td class="num">' + esc(d.date) + "</td>" +
        '<td><span class="pill ' + pillFor(d.status) + '">' + d.status + "</span></td>" +
        '<td class="r num">' + eligibleCount + '</td><td class="r num">' + appsOfDrive(d.id).length + "</td></tr>"
      );
    })
    .join("");
}

/** Selected drive: applicants with stage selectors, and the top eligible students who have not applied. */
export function driveDetail() {
  const { D, UI } = store;
  const d = UI.selD ? findDrive(UI.selD) : null;
  if (!d) return "";
  const apps = appsOfDrive(d.id);
  const applied = {};
  apps.forEach((a) => (applied[a.sid] = 1));
  const candidates = D.students
    .filter((s) => eligible(s, d).ok && !applied[s.id])
    .map((s) => ({ s, m: matchScore(s, d) }))
    .sort((a, b) => b.m - a.m);

  let h = '<div class="panel detail"><div class="dhead"><div><h2>' + esc(d.company) + " · " + esc(d.role) + "</h2>" +
    '<div class="sub">' + lpa(d.ctc) + " · " + esc(d.date) + " · wants " + esc(d.skills.join(", ") || "no listed skills") + "</div></div>" +
    '<span class="pill ' + pillFor(d.status) + '">' + d.status + "</span></div>";

  h += '<div class="grid g2" style="margin-top:0"><div><h3>Applicants (' + apps.length + ')</h3><div class="list">';
  h += apps.length
    ? apps.map((a) => {
        const s = findStudent(a.sid);
        if (!s) return "";
        return (
          '<div class="item"><div class="main"><b>' + esc(s.name) + '</b><div class="meta">' + esc(s.branch) +
          " · CGPA " + s.cgpa.toFixed(2) + " · match " + matchScore(s, d) + "%</div></div>" +
          stageSelect(a.sid, a.did, a.stage) + "</div>"
        );
      }).join("")
    : '<div class="sub">Nobody has applied yet.</div>';

  h += '</div></div><div><h3>Eligible, not yet applied (' + candidates.length + ')</h3><div class="list">';
  h += candidates.length
    ? candidates.slice(0, 8).map((x) => {
        const miss = missing(x.s, d);
        return (
          '<div class="item"><div class="main"><b>' + esc(x.s.name) + '</b><div class="meta">' + esc(x.s.branch) +
          " · CGPA " + x.s.cgpa.toFixed(2) + ' · match <span class="num">' + x.m + "%</span>" +
          (miss.length ? " · needs " + esc(miss.join(", ")) : "") + "</div></div>" +
          '<button class="btn sm" data-act="apply" data-s="' + x.s.id + '" data-d="' + d.id + '">Add to drive</button></div>'
        );
      }).join("") + (candidates.length > 8 ? '<div class="sub">Top 8 of ' + candidates.length + " by match score.</div>" : "")
    : '<div class="sub">Every eligible student has already applied.</div>';
  h += "</div></div></div></div>";
  return h;
}

export function viewDrives() {
  const { UI } = store;
  return (
    '<div class="grid" style="margin-top:14px"><div class="panel"><h2>Campus drives</h2>' +
    '<div class="sub" style="margin:2px 0 12px">Select a drive to see ranked eligible students and move applicants through the stages.</div>' +
    '<div class="toolbar"><input type="search" id="dq" placeholder="Search company or role" value="' + esc(UI.dq) + '" aria-label="Search drives">' +
    ["All"].concat(DRIVE_STATUSES).map((s) => '<button class="chip" data-act="dstat" data-v="' + s + '" aria-pressed="' + (UI.ds === s) + '">' + s + "</button>").join("") +
    '</div><div class="scroll"><table><thead><tr><th>Company</th><th>CTC</th><th>Eligibility</th><th>Date</th><th>Status</th><th class="r">Eligible</th><th class="r">Applied</th></tr></thead>' +
    '<tbody id="drows">' + driveRows() + "</tbody></table></div></div></div>" +
    '<div id="ddetail">' + driveDetail() + "</div>" +
    '<details class="add"><summary>Add a drive</summary><form class="f" id="drive-form">' +
    '<label>Company<input id="f-co" required></label>' +
    '<label>Role<input id="f-role" required></label>' +
    '<label>CTC (LPA)<input id="f-ctc" type="number" step="0.1" min="0" required></label>' +
    '<label>Minimum CGPA<input id="f-cg" type="number" step="0.1" min="0" max="10" value="6" required></label>' +
    '<label>Max backlogs<input id="f-bk" type="number" min="0" max="5" value="0" required></label>' +
    '<label>Date<input id="f-date" type="date" required></label>' +
    '<label>Status<select id="f-st">' + ["Upcoming", "Open", "Completed"].map((s) => "<option>" + s + "</option>").join("") + "</select></label>" +
    '<label class="full">Skills wanted (comma separated)<input id="f-sk" placeholder="Python, SQL, Communication"></label>' +
    '<div class="full"><div class="sub" style="margin-bottom:4px">Eligible programmes</div><div class="checks">' +
    allProgrammes().map((b, i) => '<label><input type="checkbox" name="fb" value="' + esc(b) + '" id="fb' + i + '" checked>' + esc(b) + "</label>").join("") +
    '</div></div><div class="full"><button class="btn pri" type="submit">Add drive</button></div></form></details>'
  );
}
