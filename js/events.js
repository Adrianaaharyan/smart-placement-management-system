/**
 * All user interaction, wired once with event delegation on `document`.
 * Elements opt in with a `data-act` attribute; inputs are matched by id.
 * Partial updates (table bodies, detail panels) avoid re-rendering the whole tab,
 * so search boxes keep focus while the user types.
 */
import { store, saveState, resetToSample } from "./core/store.js";
import { findDrive, findStudent, notificationsFor, currentToday, portalStudentId } from "./core/selectors.js";
import { markRead, toggleStep } from "./core/progress.js";
import { todayISO, isISODate } from "./core/dates.js";
import { startRound, submitAnswer, advanceRound } from "./core/quiz.js";
import { parseStudentsCsv, studentsToCsv } from "./core/csv.js";
import { $, toast } from "./ui/dom.js";
import { render, go, updateTabBadge } from "./app.js";
import { refreshPortalPanels } from "./views/portal.js";
import { driveRows, driveDetail } from "./views/drives.js";
import { studentRows, studentDetail } from "./views/students.js";

function refreshDrives() {
  $("#drows").innerHTML = driveRows();
  $("#ddetail").innerHTML = driveDetail();
}
function refreshStudents() {
  $("#srows").innerHTML = studentRows();
  $("#sdetail").innerHTML = studentDetail();
}
/** Redraw the portal's alert, drive and prep panels, and the unread count on the tab. */
function refreshPortal() {
  refreshPortalPanels();
  updateTabBadge();
}
function scrollToDetail(selector) {
  const el = $(selector);
  if (el && el.firstChild) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function importCsv(text) {
  const { students, skipped } = parseStudentsCsv(text);
  if (!students.length) {
    toast("No valid rows found. Check the column order.");
    return;
  }
  store.D.students = students;
  store.D.apps = [];
  store.D.notifRead = {};
  store.D.prepDone = {};
  store.D.source = "imported";
  store.UI.selS = null;
  saveState();
  render();
  toast("Imported " + students.length + " students" + (skipped ? ", skipped " + skipped + " invalid row" + (skipped > 1 ? "s" : "") : ""));
}

function copyCsv() {
  const text = studentsToCsv(store.D.students);
  const fallback = () => {
    const ta = $("#csv-in");
    ta.value = text;
    ta.select();
    toast("Clipboard blocked. CSV placed in the box, press copy.");
  };
  try {
    navigator.clipboard.writeText(text).then(() => toast("CSV copied to clipboard"), fallback);
  } catch (err) {
    fallback();
  }
}

function addApplication(sid, did) {
  const { D, UI } = store;
  if (!D.apps.some((x) => x.sid === sid && x.did === did)) {
    D.apps.push({ sid, did, stage: "Applied" });
    saveState();
    const d = findDrive(did);
    const s = findStudent(sid);
    toast((s ? s.name : "Student") + " added to " + (d ? d.company : "drive"));
  }
  if (UI.view === "drives") refreshDrives();
  else if (UI.view === "portal") render();
  else refreshStudents();
}

function onClick(e) {
  const t = e.target.closest("[data-act]");
  if (!t || t.tagName === "SELECT") return;
  const { D, UI } = store;
  switch (t.getAttribute("data-act")) {
    case "seld":
      UI.selD = t.getAttribute("data-id");
      refreshDrives();
      scrollToDetail("#ddetail");
      break;
    case "sels":
      UI.selS = t.getAttribute("data-id");
      refreshStudents();
      scrollToDetail("#sdetail");
      break;
    case "dstat":
      UI.ds = t.getAttribute("data-v");
      document.querySelectorAll('[data-act="dstat"]').forEach((c) => c.setAttribute("aria-pressed", String(c.getAttribute("data-v") === UI.ds)));
      $("#drows").innerHTML = driveRows();
      break;
    case "apply":
      addApplication(t.getAttribute("data-s"), t.getAttribute("data-d"));
      break;
    case "practice":
      UI.practiceSid = t.getAttribute("data-s");
      UI.quiz = null;
      go("practice");
      break;
    case "practice-end":
      UI.quiz = null;
      render();
      break;
    case "startq": {
      const picker = $("#psel");
      const sid = picker ? picker.value : (UI.quiz && UI.quiz.sid) || UI.practiceSid || D.students[0].id;
      UI.practiceSid = sid;
      UI.quiz = startRound(sid);
      render();
      break;
    }
    case "answer":
      submitAnswer(UI.quiz, parseInt(t.getAttribute("data-i"), 10));
      render();
      break;
    case "nextq": {
      const round = advanceRound(UI.quiz);
      if (round.done) {
        const s = findStudent(round.sid);
        if (s) {
          s.aptitude = round.score;
          saveState();
        }
      }
      render();
      break;
    }
    case "prep-open":
      UI.prepDid = t.getAttribute("data-d");
      refreshPortal();
      scrollToDetail("#pprep");
      break;
    case "prep-close":
      UI.prepDid = "closed";
      refreshPortal();
      break;
    case "notif-read":
      markRead(portalStudentId(), [t.getAttribute("data-id")]);
      refreshPortal();
      break;
    case "notif-readall": {
      const s = findStudent(portalStudentId());
      if (s) markRead(s.id, notificationsFor(s, currentToday()).map((n) => n.id));
      refreshPortal();
      break;
    }
    case "notif-more":
      UI.notifAll = !UI.notifAll;
      refreshPortal();
      break;
    case "today-reset":
      UI.today = null;
      render();
      break;
    case "copycsv":
      copyCsv();
      break;
    case "reset":
      resetToSample();
      render();
      toast("Sample data restored");
      break;
  }
}

function onChange(e) {
  const t = e.target;
  const { D, UI } = store;
  if (t.getAttribute("data-act") === "prep-toggle") {
    toggleStep(t.getAttribute("data-s"), t.getAttribute("data-d"), t.getAttribute("data-step"));
    refreshPortal();
    return;
  }
  if (t.id === "portal-today") {
    if (isISODate(t.value)) UI.today = t.value === todayISO() ? null : t.value;
    render();
    return;
  }
  if (t.getAttribute("data-act") === "stage") {
    const sid = t.getAttribute("data-s");
    const did = t.getAttribute("data-d");
    D.apps.forEach((a) => {
      if (a.sid === sid && a.did === did) a.stage = t.value;
    });
    saveState();
    toast("Stage set to " + t.value);
    if (UI.view === "drives") $("#drows").innerHTML = driveRows();
    else if (UI.view === "students") $("#srows").innerHTML = studentRows();
    else if (UI.view === "portal") render();
    return;
  }
  if (t.id === "sb") {
    UI.sb = t.value;
    $("#srows").innerHTML = studentRows();
  } else if (t.id === "ss") {
    UI.ss = t.value;
    $("#srows").innerHTML = studentRows();
  } else if (t.id === "psel") {
    UI.practiceSid = t.value;
    render();
  } else if (t.id === "portal-sel") {
    UI.portalSid = t.value;
    UI.prepDid = null;
    render();
  }
}

function onInput(e) {
  const t = e.target;
  if (t.id === "sq") {
    store.UI.sq = t.value;
    $("#srows").innerHTML = studentRows();
  } else if (t.id === "dq") {
    store.UI.dq = t.value;
    $("#drows").innerHTML = driveRows();
  }
}

function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const { D, UI } = store;
  if (f.id === "import-form") {
    importCsv($("#csv-in").value);
  } else if (f.id === "drive-form") {
    const branches = [].slice.call(f.querySelectorAll('input[name="fb"]:checked')).map((x) => x.value);
    if (!branches.length) {
      toast("Pick at least one programme");
      return;
    }
    const nextId = D.nextD || D.drives.length + 1;
    const drive = {
      id: "d" + nextId,
      company: $("#f-co").value.trim(),
      role: $("#f-role").value.trim(),
      ctc: parseFloat($("#f-ctc").value),
      minCgpa: parseFloat($("#f-cg").value),
      maxBack: parseInt($("#f-bk").value, 10),
      branches,
      skills: $("#f-sk").value.split(",").map((x) => x.trim()).filter(Boolean),
      date: $("#f-date").value,
      status: $("#f-st").value,
    };
    D.nextD = nextId + 1;
    D.drives.push(drive);
    UI.selD = drive.id;
    saveState();
    render();
    toast(drive.company + " drive added");
  }
}

/** Space or Enter on a focused table row acts like a click, so rows work from the keyboard. */
function onKeydown(e) {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("tr.row")) {
    e.preventDefault();
    e.target.click();
  }
}

export function initEvents() {
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("change", onChange);
  document.addEventListener("input", onInput);
  document.addEventListener("submit", onSubmit);
}
