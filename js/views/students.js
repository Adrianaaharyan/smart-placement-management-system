/** Students tab: filterable list, student profile, and CSV import. The profile is reused by the Student portal. */
import { store } from "../core/store.js";
import { eligible, readiness, matchScore, missing } from "../core/scoring.js";
import { findDrive, findStudent, appsOfStudent, bestCtc, placementStatus, allProgrammes } from "../core/selectors.js";
import { STUDENT_STATUSES } from "../config.js";
import { esc, lpa, pillFor } from "../ui/dom.js";
import { barRows, stageSelect } from "../ui/components.js";

const ROW_LIMIT = 60;

/** Table body, ranked by readiness. Re-rendered on its own when filters change. */
export function studentRows() {
  const { D, UI } = store;
  const q = UI.sq.toLowerCase();
  const rows = D.students
    .filter((s) => {
      const st = placementStatus(s);
      return (UI.sb === "All" || s.branch === UI.sb) && (UI.ss === "All" || st === UI.ss) && (!q || (s.name + " " + s.roll).toLowerCase().indexOf(q) >= 0);
    })
    .sort((a, b) => readiness(b).total - readiness(a).total);
  if (!rows.length) return '<tr><td colspan="5" class="sub">No students match.</td></tr>';
  return (
    rows.slice(0, ROW_LIMIT).map((s) => {
      const r = readiness(s).total;
      const st = placementStatus(s);
      const b = bestCtc(s);
      return (
        '<tr class="row' + (UI.selS === s.id ? " sel" : "") + '" data-act="sels" data-id="' + s.id + '" tabindex="0">' +
        "<td><b>" + esc(s.name) + '</b><div class="sub num">' + esc(s.roll) + "</div></td><td>" + esc(s.branch) + "</td>" +
        '<td class="r num">' + s.cgpa.toFixed(2) + (s.backlogs ? ' <span class="pill p-bad">' + s.backlogs + " backlog</span>" : "") + "</td>" +
        '<td><span class="meter"><span class="t"><i style="width:' + r + '%"></i></span><span class="num">' + r + "</span></span></td>" +
        '<td><span class="pill ' + pillFor(st) + '">' + st + "</span>" + (b ? ' <span class="num sub">' + lpa(b) + "</span>" : "") + "</td></tr>"
      );
    }).join("") +
    (rows.length > ROW_LIMIT ? '<tr><td colspan="5" class="sub">Showing the top ' + ROW_LIMIT + " of " + rows.length + " by readiness. Narrow with search or filters.</td></tr>" : "")
  );
}

/**
 * Student profile: readiness breakdown, skills and gaps, applications, best open matches, blocked drives.
 * @param {string} [sid] student id; defaults to the student selected on the Students tab
 */
export function studentDetail(sid) {
  const { D, UI } = store;
  const s = sid ? findStudent(sid) : UI.selS ? findStudent(UI.selS) : null;
  if (!s) return "";
  const r = readiness(s);
  const status = placementStatus(s);
  const best = bestCtc(s);
  const myApps = appsOfStudent(s.id);
  const applied = {};
  myApps.forEach((a) => (applied[a.did] = 1));

  const live = D.drives.filter((d) => d.status !== "Completed" && !applied[d.id]);
  const matches = live.filter((d) => eligible(s, d).ok).map((d) => ({ d, m: matchScore(s, d) })).sort((a, b) => b.m - a.m).slice(0, 5);
  const blocked = live.filter((d) => !eligible(s, d).ok && d.branches.indexOf(s.branch) >= 0).sort((a, b) => b.ctc - a.ctc).slice(0, 3);

  // Skills missing most often across open drives for the student's own programme.
  const gap = {};
  live.filter((d) => d.branches.indexOf(s.branch) >= 0).forEach((d) => missing(s, d).forEach((k) => (gap[k] = (gap[k] || 0) + 1)));
  const gaps = Object.keys(gap).sort((a, b) => gap[b] - gap[a]).slice(0, 6);

  let h = '<div class="panel detail"><div class="dhead"><div><h2>' + esc(s.name) + "</h2>" +
    '<div class="sub num">' + esc(s.roll) + " · " + esc(s.branch) + " · CGPA " + s.cgpa.toFixed(2) + " · aptitude " + s.aptitude + " · " +
    s.projects + " project" + (s.projects === 1 ? "" : "s") + " · " + s.internships + " internship" + (s.internships === 1 ? "" : "s") + "</div></div>" +
    '<div><span class="pill ' + pillFor(status) + '">' + status + "</span>" + (best ? ' <span class="num">' + lpa(best) + "</span>" : "") + "</div></div>";

  h += '<div class="grid g2" style="margin-top:0"><div><h3>Readiness ' + r.total + " / 100</h3>" +
    barRows([
      { l: "CGPA (35)", v: r.cgpa, t: r.cgpa.toFixed(0) },
      { l: "Aptitude (25)", v: (r.aptitude / 25) * 35, t: r.aptitude.toFixed(0) },
      { l: "Skills (20)", v: (r.skills / 20) * 35, t: r.skills.toFixed(0) },
      { l: "Projects (10)", v: (r.projects / 10) * 35, t: r.projects.toFixed(0) },
      { l: "Internships (10)", v: (r.intern / 10) * 35, t: r.intern.toFixed(0) },
    ], 35) +
    (r.penalty ? '<div class="why" style="margin-top:6px">Backlog penalty: −' + r.penalty + "</div>" : "") +
    '<h3 style="margin-top:14px">Skills</h3><div>' +
    (s.skills.length ? s.skills.map((k) => '<span class="skill have">' + esc(k) + "</span>").join("") : '<span class="sub">None recorded</span>') + "</div>" +
    (gaps.length ? '<h3 style="margin-top:10px">Worth building next</h3><div>' +
      gaps.map((k) => '<span class="skill need">' + esc(k) + " · " + gap[k] + " drive" + (gap[k] > 1 ? "s" : "") + "</span>").join("") + "</div>" : "") +
    '<div style="margin-top:10px"><button class="btn sm" data-act="practice" data-s="' + s.id + '">Take the aptitude round</button></div></div>';

  h += "<div><h3>Applications (" + myApps.length + ')</h3><div class="list">' +
    (myApps.length
      ? myApps.map((a) => {
          const d = findDrive(a.did);
          if (!d) return "";
          return '<div class="item"><div class="main"><b>' + esc(d.company) + '</b><div class="meta">' + esc(d.role) + " · " + lpa(d.ctc) + "</div></div>" + stageSelect(s.id, d.id, a.stage) + "</div>";
        }).join("")
      : '<div class="sub">No applications yet.</div>') +
    '</div><h3 style="margin-top:14px">Best matches still open</h3><div class="list">' +
    (matches.length
      ? matches.map((x) => {
          const miss = missing(s, x.d);
          return (
            '<div class="item"><div class="main"><b>' + esc(x.d.company) + '</b> <span class="pill p-info num">' + x.m + '% match</span>' +
            '<div class="meta">' + esc(x.d.role) + " · " + lpa(x.d.ctc) + (miss.length ? " · missing " + esc(miss.join(", ")) : " · all skills covered") + "</div></div>" +
            '<button class="btn sm" data-act="apply" data-s="' + s.id + '" data-d="' + x.d.id + '">' + (x.d.status === "Open" ? "Apply" : "Register interest") + "</button></div>"
          );
        }).join("")
      : '<div class="sub">No eligible open drives left.</div>') +
    "</div>" +
    (blocked.length
      ? '<h3 style="margin-top:14px">Not eligible yet</h3><div class="list">' +
        blocked.map((d) => '<div class="item"><div class="main"><b>' + esc(d.company) + '</b> <span class="sub num">' + lpa(d.ctc) + '</span><div class="why">' + esc(eligible(s, d).why.join("; ")) + "</div></div></div>").join("") +
        "</div>"
      : "") +
    "</div></div></div>";
  return h;
}

export function viewStudents() {
  const { UI } = store;
  return (
    '<div class="grid" style="margin-top:14px"><div class="panel"><h2>Students</h2>' +
    '<div class="sub" style="margin:2px 0 12px">Ranked by readiness score. Select a student for skill gaps, matched drives and application stages.</div>' +
    '<div class="toolbar"><input type="search" id="sq" placeholder="Search name or roll number" value="' + esc(UI.sq) + '" aria-label="Search students">' +
    '<select id="sb" aria-label="Programme"><option>All</option>' + allProgrammes().map((b) => "<option" + (UI.sb === b ? " selected" : "") + ">" + esc(b) + "</option>").join("") + "</select>" +
    '<select id="ss" aria-label="Status">' + ["All"].concat(STUDENT_STATUSES).map((b) => "<option" + (UI.ss === b ? " selected" : "") + ">" + b + "</option>").join("") + "</select></div>" +
    '<div class="scroll"><table><thead><tr><th>Student</th><th>Programme</th><th class="r">CGPA</th><th>Readiness</th><th>Status</th></tr></thead>' +
    '<tbody id="srows">' + studentRows() + "</tbody></table></div></div></div>" +
    '<div id="sdetail">' + studentDetail() + "</div>" +
    '<details class="add"><summary>Import your own records</summary>' +
    '<p class="sub">Paste CSV with columns <span class="num">name, roll, branch, cgpa, backlogs, skills, aptitude, projects, internships</span>. Separate skills with semicolons. The last three columns are optional. Importing replaces all students and clears applications. Drives are kept.</p>' +
    '<form class="f" id="import-form"><label class="full">CSV rows<textarea id="csv-in" placeholder="Aarav Sharma,2201010101,B.Tech CSE,8.1,0,Python;Java;SQL,72,2,1"></textarea></label>' +
    '<div class="full" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="submit">Import records</button>' +
    '<button class="btn" type="button" data-act="copycsv">Copy current students as CSV</button>' +
    '<button class="btn" type="button" data-act="reset">Reset to sample data</button></div></form></details>'
  );
}
