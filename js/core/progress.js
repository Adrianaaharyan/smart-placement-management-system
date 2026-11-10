/**
 * Per-student progress that is saved with the rest of the state:
 *   store.D.notifRead[studentId] = [alert ids marked as read]
 *   store.D.prepDone["studentId|driveId"] = [prep step ids ticked off]
 * Both maps are created on demand, so state saved by an earlier version still loads.
 */
import { store, saveState } from "./store.js";

export function readIds(sid) {
  return (store.D.notifRead && store.D.notifRead[sid]) || [];
}

export function markRead(sid, ids) {
  store.D.notifRead = store.D.notifRead || {};
  const set = new Set(store.D.notifRead[sid] || []);
  ids.forEach((id) => set.add(id));
  store.D.notifRead[sid] = Array.from(set);
  saveState();
}

export function doneSteps(sid, did) {
  return (store.D.prepDone && store.D.prepDone[sid + "|" + did]) || [];
}

/** Tick or untick a step. Returns true if it is now ticked. */
export function toggleStep(sid, did, stepId) {
  store.D.prepDone = store.D.prepDone || {};
  const key = sid + "|" + did;
  const set = new Set(store.D.prepDone[key] || []);
  if (set.has(stepId)) set.delete(stepId);
  else set.add(stepId);
  store.D.prepDone[key] = Array.from(set);
  saveState();
  return set.has(stepId);
}
