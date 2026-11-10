/** Rendering and routing. `render` repaints the current tab; `route` reads the URL hash and then renders. */
import { VIEWS } from "./config.js";
import { store } from "./core/store.js";
import { findStudent, currentToday, portalStudentId, notificationsFor } from "./core/selectors.js";
import { countUnread } from "./core/notifications.js";
import { $ } from "./ui/dom.js";
import { viewDashboard } from "./views/dashboard.js";
import { viewDrives } from "./views/drives.js";
import { viewStudents } from "./views/students.js";
import { viewPortal } from "./views/portal.js";
import { viewPractice } from "./views/practice.js";

const VIEW_RENDERERS = {
  dashboard: viewDashboard,
  drives: viewDrives,
  students: viewStudents,
  portal: viewPortal,
  practice: viewPractice,
};

const SAMPLE_BANNER =
  '<div class="banner"><b>Sample student records.</b><span>The official figures at the top of the dashboard come from KRMU\'s placement records page. ' +
  "KRMU does not publish student-level data, so students, roles, CTCs and offers below are generated. Recruiter names are real ones from KRMU's lists. " +
  "Import the cell's own CSV on the Students tab to replace the students.</span></div>";

/** Show the unread-alert count on the Student portal tab, for the student the portal is showing. */
export function updateTabBadge() {
  const link = document.querySelector('nav.tabs a[data-tab="portal"]');
  if (!link) return;
  const s = findStudent(portalStudentId());
  const n = s ? countUnread(notificationsFor(s, currentToday())) : 0;
  link.innerHTML = "Student portal" + (n ? ' <span class="badge" aria-label="' + n + ' unread alerts">' + n + "</span>" : "");
}

export function render() {
  const { D, UI } = store;
  document.querySelectorAll("nav.tabs a").forEach((a) => {
    if (a.getAttribute("data-tab") === UI.view) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $("#banner").innerHTML = D.source === "sample" ? SAMPLE_BANNER : "";
  $("#view").innerHTML = VIEW_RENDERERS[UI.view]();
  updateTabBadge();
}

export function route() {
  const hash = location.hash.replace("#", "");
  store.UI.view = VIEWS.includes(hash) ? hash : "dashboard";
  render();
}

/** Navigate to a tab. If the hash is already right, just repaint. */
export function go(view) {
  if (location.hash === "#" + view) route();
  else location.hash = view;
}
