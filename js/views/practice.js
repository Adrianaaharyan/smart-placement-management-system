/** Aptitude round tab: start screen, question screen and result screen. The engine itself lives in core/quiz.js. */
import { store } from "../core/store.js";
import { readiness } from "../core/scoring.js";
import { findStudent } from "../core/selectors.js";
import { QUESTIONS } from "../data/questions.js";
import { ROUND_LENGTH, MAX_LEVEL } from "../core/quiz.js";
import { esc } from "../ui/dom.js";

function studentOptions(selectedId) {
  return store.D.students
    .map((x) => '<option value="' + x.id + '"' + (x.id === selectedId ? " selected" : "") + ">" + esc(x.name) + " · " + esc(x.branch) + "</option>")
    .join("");
}

function startScreen() {
  const { D, UI } = store;
  const sid = UI.practiceSid || (D.students[0] && D.students[0].id);
  const s = findStudent(sid);
  return (
    '<div class="grid" style="margin-top:14px"><div class="panel quiz"><h2>Adaptive aptitude round</h2>' +
    '<p class="sub">Ten questions across quantitative, logic and verbal topics. A correct answer moves you to a harder question and a wrong answer to an easier one. The result updates the student\'s aptitude score and readiness.</p>' +
    '<div class="toolbar"><select id="psel" aria-label="Student">' + studentOptions(sid) + "</select>" +
    '<button class="btn pri" data-act="startq">Start round</button></div>' +
    (s ? '<div class="sub">Current aptitude score for ' + esc(s.name) + ': <span class="num">' + s.aptitude + "</span></div>" : "") +
    "</div></div>"
  );
}

function resultScreen(round) {
  const s = findStudent(round.sid);
  const correct = round.hist.filter((h) => h.ok).length;
  return (
    '<div class="grid" style="margin-top:14px"><div class="panel quiz"><h2>Round complete</h2>' +
    '<div style="display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap;margin:10px 0"><div><div class="label">Aptitude score</div><div class="big num">' + round.score + "</div></div>" +
    '<div class="sub">' + correct + " of " + round.hist.length + " correct. " + (s ? esc(s.name) + " now has a readiness score of " + readiness(s).total + "." : "") + "</div></div>" +
    '<div class="label">Difficulty path</div><div class="path">' +
    round.hist.map((h, i) => '<span class="dot ' + (h.ok ? "ok" : "no") + '" title="Question ' + (i + 1) + ", level " + h.l + '">L' + h.l + "</span>").join("") + "</div>" +
    '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="startq">Take another round</button><button class="btn" data-act="practice-end">Back</button></div></div></div>'
  );
}

function questionScreen(round) {
  const q = QUESTIONS[round.cur];
  const n = round.hist.length;
  let h =
    '<div class="grid" style="margin-top:14px"><div class="panel quiz"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
    '<span class="label">Question ' + (n + 1) + " of " + ROUND_LENGTH + '</span><span class="pill p-info">Level ' + q.l + " of " + MAX_LEVEL + "</span></div>" +
    '<div class="path">' + round.hist.map((x, i) => '<span class="dot ' + (x.ok ? "ok" : "no") + '">' + (i + 1) + "</span>").join("") + '<span class="dot cur">' + (n + 1) + "</span></div>" +
    '<div class="qtext">' + esc(q.q) + "</div>";
  q.o.forEach((o, i) => {
    let cls = "";
    if (round.ans !== null) {
      if (i === q.a) cls = " ok";
      else if (i === round.ans) cls = " no";
    }
    h += '<button class="opt' + cls + '" data-act="answer" data-i="' + i + '"' + (round.ans !== null ? " disabled" : "") + ">" + String.fromCharCode(65 + i) + ". " + esc(o) + "</button>";
  });
  if (round.ans !== null) {
    h += '<p style="margin-top:12px"><b>' + (round.ans === q.a ? "Correct." : "Not quite.") + "</b> " + esc(q.e) + "</p>" +
      '<button class="btn pri" data-act="nextq">' + (n >= ROUND_LENGTH ? "See result" : "Next question") + "</button>";
  }
  return h + "</div></div>";
}

export function viewPractice() {
  const round = store.UI.quiz;
  if (!round) return startScreen();
  if (round.done) return resultScreen(round);
  return questionScreen(round);
}
