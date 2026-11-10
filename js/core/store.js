/**
 * Application state.
 *   store.D  - data: { source, students[], drives[], apps[], nextD }
 *   store.UI - view state: current tab, selections, filters, the running quiz round
 *
 * Data is saved to localStorage after every change. That storage is per browser
 * and per device. See docs/ARCHITECTURE.md for the path to shared storage.
 */
import { STORAGE_KEY } from "../config.js";
import { buildSample } from "./sample.js";

export function createUiState() {
  return {
    view: "dashboard",
    portalSid: null,
    selS: null,
    selD: null,
    sq: "",
    sb: "All",
    ss: "All",
    dq: "",
    ds: "All",
    quiz: null,
    practiceSid: null,
    /** Student portal: demo date override (null = real today), open prep plan ("closed" hides it), alert list expanded. */
    today: null,
    prepDid: null,
    notifAll: false,
  };
}

export const store = { D: null, UI: createUiState() };

/** Saved state if present and well formed, otherwise a fresh sample cohort. */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.students && p.drives && p.apps) {
        p.notifRead = p.notifRead || {};
        p.prepDone = p.prepDone || {};
        return p;
      }
    }
  } catch (e) {
    /* private window or blocked storage: fall through to sample data */
  }
  return buildSample();
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.D));
  } catch (e) {
    /* storage unavailable: the app keeps working in memory */
  }
}

export function resetToSample() {
  store.D = buildSample();
  store.UI.selS = null;
  store.UI.selD = null;
  store.UI.prepDid = null;
  saveState();
}
