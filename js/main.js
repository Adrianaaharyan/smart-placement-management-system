/** Entry point: load saved state (or sample data), wire events and routing, draw the first view. */
import { store, loadState } from "./core/store.js";
import { initEvents } from "./events.js";
import { route } from "./app.js";

store.D = loadState();
initEvents();
window.addEventListener("hashchange", route);
route();
