/**
 * Dashboard. Two halves, kept visibly separate:
 *   1. Official KRMU figures (from data/official.js)
 *   2. Working records computed live from the loaded students and applications
 */
import { OFFICIAL, RATE_MISMATCH_THRESHOLD } from "../data/official.js";
import { store } from "../core/store.js";
import { findDrive, bestCtc, placementStatus, allProgrammes } from "../core/selectors.js";
import { esc, lpa } from "../ui/dom.js";
import { barRows, kpi } from "../ui/components.js";

const WALKTHROUGH =
  '<details class="panel tour" open><summary>Demo walkthrough, about two minutes</summary><ol>' +
  '<li><a href="#dashboard">Dashboard</a>: official KRMU figures first, then charts computed from the working records.</li>' +
  '<li><a href="#drives">Drives</a>: open Paisa Bazaar, see eligible students ranked by match, add one to the drive.</li>' +
  '<li><a href="#students">Students</a>: filter by programme, select a student to see readiness and skill gaps.</li>' +
  '<li><a href="#portal">Student portal</a>: read the alerts, open a prep plan and tick off steps, then apply to a drive and move its stage to Offered to watch the dashboard update.</li>' +
  '<li><a href="#practice">Aptitude round</a>: answer ten adaptive questions and see the score feed back into readiness.</li></ol></details>';

function tile(t) {
  return (
    '<div><div class="label">' + t.label + '</div><div class="v">' + t.value + (t.unit ? " <small>" + t.unit + "</small>" : "") +
    '</div><div class="k">' + t.note + "</div></div>"
  );
}

function officialSection() {
  const schools = OFFICIAL.schools;
  const eligibleTotal = schools.reduce((a, s) => a + s.eligible, 0);
  const placedTotal = schools.reduce((a, s) => a + s.placed, 0);

  const tiles = OFFICIAL.headlines.map((t) =>
    t.computed === "placed"
      ? { label: "Placed, 2024–25", value: String(placedTotal), unit: "", note: "of " + eligibleTotal + " eligible in the school table" }
      : t
  );
  const schoolBars = schools.map((s) => ({
    l: s.code,
    v: (s.placed / s.eligible) * 100,
    t: Math.round((s.placed / s.eligible) * 100) + "% · " + s.placed + "/" + s.eligible,
  }));

  let h = '<div class="label" style="margin-top:18px">Official figures · KRMU Career Development Cell</div>';
  h += '<div class="reported" style="margin-top:6px">' + tiles.map(tile).join("") + "</div>";

  h += '<div class="grid g2">';
  h += '<div class="panel"><h3>Median package by year</h3>' +
    barRows(OFFICIAL.median.map((m) => ({ l: m.label, v: m.value, t: "₹" + m.value.toFixed(1) + "L" })), 8, true) +
    '<div class="sub" style="margin-top:8px">System-wide median compensation.</div></div>';
  h += '<div class="panel"><h3>Hiring by sector</h3>' +
    barRows(OFFICIAL.sector.slice().sort((a, b) => b.value - a.value).map((m) => ({ l: m.label, v: m.value, t: m.value + "%" })), 35) + "</div>";
  h += '<div class="panel"><h3>Package distribution, 2025–26</h3>' +
    barRows(OFFICIAL.packageBands.map((m) => ({ l: m.label, v: m.value, t: m.value + "%" })), 35, true) +
    '<div class="sub" style="margin-top:8px">*The page labels the lowest band "Above 1 LPA". It most likely means 1 to 2 LPA.</div></div>';
  h += '<div class="panel"><h3>Placed ÷ eligible by school, 2024–25</h3>' + barRows(schoolBars, 100) + "</div>";
  h += "</div>";

  h += '<div class="panel" style="margin-top:14px"><h3>School-wise placement, 2024–25 cohort</h3><div class="scroll"><table><thead><tr>' +
    '<th>School</th><th class="r">Eligible</th><th class="r">Placed</th><th class="r">Placed ÷ eligible</th><th class="r">Rate stated</th>' +
    '<th class="r">Max CTC</th><th class="r">Avg CTC</th><th class="r">Median CTC</th></tr></thead><tbody>' +
    schools.map((s) => {
      const computed = Math.round((s.placed / s.eligible) * 100);
      const differs = Math.abs(computed - s.statedRate) > RATE_MISMATCH_THRESHOLD;
      const avgAboveMax = s.avgCtc > s.maxCtc;
      return (
        "<tr><td><b>" + s.code + '</b><div class="sub">' + esc(s.name) + "</div></td>" +
        '<td class="r num">' + s.eligible + '</td><td class="r num">' + s.placed + '</td><td class="r num">' + computed + "%</td>" +
        '<td class="r num">' + s.statedRate + "%" + (differs ? ' <span class="pill p-warn">differs</span>' : "") + "</td>" +
        '<td class="r num">' + s.maxCtc + "</td>" +
        '<td class="r num">' + s.avgCtc.toFixed(1) + (avgAboveMax ? ' <span class="pill p-bad">above max</span>' : "") + "</td>" +
        '<td class="r num">' + s.medianCtc.toFixed(1) + "</td></tr>"
      );
    }).join("") +
    '<tr><td><b>All schools</b></td><td class="r num">' + eligibleTotal + '</td><td class="r num">' + placedTotal + '</td>' +
    '<td class="r num">' + Math.round((placedTotal / eligibleTotal) * 100) + '%</td>' +
    '<td colspan="4" class="sub">The 2024–25 annual report states 81% placed. 816 ÷ 1,015 is 80%.</td></tr>' +
    "</tbody></table></div>" +
    '<div class="sub" style="margin-top:10px">CTC in LPA. Eligible and placed counts match the 2024–25 annual report totals (816 placed). A student counts as placed once, however many written offers they hold.</div></div>';

  h += '<div class="panel" style="margin-top:14px"><h3>Check before you quote these numbers</h3><div class="list">' +
    OFFICIAL.notes.map((n) => '<div class="item"><div class="main">' + esc(n) + "</div></div>").join("") +
    "</div></div>";
  return h;
}

export function viewDashboard() {
  const D = store.D;
  const S = D.students;
  const placed = S.filter((s) => bestCtc(s) > 0);
  const rate = S.length ? Math.round((placed.length / S.length) * 100) : 0;
  const avg = placed.length ? placed.reduce((a, s) => a + bestCtc(s), 0) / placed.length : 0;
  const highest = placed.reduce((a, s) => Math.max(a, bestCtc(s)), 0);
  const inProcess = S.filter((s) => placementStatus(s) === "In process").length;
  const openDrives = D.drives.filter((d) => d.status !== "Completed").length;

  const programmeRows = allProgrammes()
    .map((b) => {
      const all = S.filter((s) => s.branch === b);
      if (!all.length) return null;
      const p = all.filter((s) => bestCtc(s) > 0).length;
      return { l: b, v: (p / all.length) * 100, t: Math.round((p / all.length) * 100) + "% · " + all.length };
    })
    .filter(Boolean);

  const bins = [["Below 4", 0, 4], ["4 to 6", 4, 6], ["6 to 8", 6, 8], ["8 to 12", 8, 12], ["12 and above", 12, 999]].map((b) => {
    const c = placed.filter((s) => {
      const x = bestCtc(s);
      return x >= b[1] && x < b[2];
    }).length;
    return { l: b[0] + " LPA", v: c, t: String(c) };
  });

  const A = D.apps;
  const funnel = [
    ["Applications", A.length],
    ["Shortlisted or beyond", A.filter((a) => ["Shortlisted", "Interview", "Offered"].includes(a.stage)).length],
    ["Interview or beyond", A.filter((a) => ["Interview", "Offered"].includes(a.stage)).length],
    ["Offers", A.filter((a) => a.stage === "Offered").length],
  ].map((x) => ({ l: x[0], v: x[1], t: String(x[1]) }));

  const byCompany = {};
  A.forEach((a) => {
    if (a.stage === "Offered") {
      const d = findDrive(a.did);
      if (d) byCompany[d.company] = (byCompany[d.company] || 0) + 1;
    }
  });
  const companies = Object.keys(byCompany)
    .map((k) => ({ l: k, v: byCompany[k], t: String(byCompany[k]) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 7);

  let h = WALKTHROUGH + officialSection();
  h += '<div class="label" style="margin-top:28px">Your working records · ' + (D.source === "sample" ? "sample" : "imported") + " data</div>";
  h += '<div class="grid g4" style="margin-top:6px">' +
    kpi("Students", S.length, "in this batch") +
    kpi("Placed", placed.length, rate + "% of batch") +
    kpi("Average offer", avg ? lpa(avg) : "–", "placed students, best offer") +
    kpi("Open and upcoming drives", openDrives, inProcess + " students in process") +
    "</div>";
  h += '<div class="grid g2">' +
    '<div class="panel"><h3>Placement rate by programme</h3>' + barRows(programmeRows, 100) + "</div>" +
    '<div class="panel"><h3>Best offer, placed students</h3>' +
      barRows(bins, Math.max(1, ...bins.map((b) => b.v)), true) +
      '<div class="sub" style="margin-top:8px">Highest in this data: ' + (highest ? lpa(highest) : "–") + "</div></div>" +
    '<div class="panel"><h3>Hiring funnel</h3>' + barRows(funnel, funnel[0].v) + "</div>" +
    '<div class="panel"><h3>Offers by recruiter</h3>' +
      (companies.length ? barRows(companies, companies[0].v) : '<div class="sub">No offers recorded yet.</div>') + "</div>" +
    "</div>";
  return h;
}

