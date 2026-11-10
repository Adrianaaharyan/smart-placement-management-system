import { test } from "node:test";
import assert from "node:assert/strict";
import { isISODate, daysBetween, addDays, formatDate, countdown } from "../../js/core/dates.js";
import { buildNotifications, countUnread } from "../../js/core/notifications.js";
import { buildPrepPlan, planProgress, upcomingDrives } from "../../js/core/prep.js";
import { buildSample } from "../../js/core/sample.js";

const TODAY = "2026-11-10";

test("dates: arithmetic and formatting", () => {
  assert.equal(isISODate("2026-11-10"), true);
  assert.equal(isISODate("10/11/2026"), false);
  assert.equal(addDays("2026-11-30", 2), "2026-12-02");
  assert.equal(daysBetween("2026-11-10", "2026-11-15"), 5);
  assert.equal(formatDate("2026-11-12"), "12 Nov 2026");
  assert.equal(countdown(0), "today");
  assert.equal(countdown(1), "tomorrow");
  assert.equal(countdown(5), "in 5 days");
});

test("sample: drive dates are relative to the given date and match status", () => {
  const d = buildSample(undefined, TODAY);
  d.drives.forEach((x) => {
    const n = daysBetween(TODAY, x.date);
    if (x.status === "Completed") assert.ok(n < 0, x.company);
    else assert.ok(n >= 0, x.company);
  });
  assert.deepEqual(d.notifRead, {});
  assert.deepEqual(d.prepDone, {});
  assert.deepEqual(buildSample(undefined, TODAY), buildSample(undefined, TODAY));
});

test("notifications: ids are unique, urgent ones sort first among unread, read state is honoured", () => {
  const d = buildSample(undefined, TODAY);
  let total = 0;
  d.students.forEach((s) => {
    const list = buildNotifications(s, d, TODAY, []);
    total += list.length;
    assert.equal(new Set(list.map((n) => n.id)).size, list.length);
    assert.equal(countUnread(list), list.length);
    if (list.length) {
      const again = buildNotifications(s, d, TODAY, [list[0].id]);
      assert.equal(countUnread(again), list.length - 1);
    }
  });
  assert.ok(total > 0, "demo data should produce alerts");
});

test("notifications: a read reminder returns when the drive gets closer", () => {
  const d = buildSample(undefined, TODAY);
  const s = d.students.find((x) => buildNotifications(x, d, TODAY, []).some((n) => n.type === "drive"));
  assert.ok(s, "some student has a drive reminder");
  const first = buildNotifications(s, d, TODAY, []).find((n) => n.type === "drive");
  const readAll = buildNotifications(s, d, TODAY, [first.id]);
  assert.equal(readAll.find((n) => n.id === first.id).read, true);
  const later = buildNotifications(s, d, addDays(TODAY, first.days > 1 ? first.days - 1 : 0), [first.id]);
  const same = later.find((n) => n.type === "drive" && n.did === first.did);
  if (same && same.days !== first.days) assert.notEqual(same.id, first.id);
});

test("prep plan: eligible student gets dated steps, ineligible gets none", () => {
  const d = buildSample(undefined, TODAY);
  let eligibleSeen = false;
  let inelSeen = false;
  d.students.slice(0, 40).forEach((s) => {
    upcomingDrives(s, d, TODAY, 45).forEach((x) => {
      assert.ok(x.days >= 0 && x.days <= 45);
      if (x.plan.eligible) {
        eligibleSeen = true;
        assert.ok(x.plan.steps.length >= 4);
        x.plan.steps.forEach((st) => assert.ok(st.by >= TODAY && st.by <= x.drive.date, st.id));
        const p = planProgress(x.plan, [x.plan.steps[0].id]);
        assert.equal(p.done, 1);
        assert.equal(p.total, x.plan.steps.length);
      } else {
        inelSeen = true;
        assert.equal(x.plan.steps.length, 0);
        assert.ok(x.plan.why.length > 0);
      }
    });
  });
  assert.ok(eligibleSeen && inelSeen);
});

test("prep plan: no apply step once applied", () => {
  const d = buildSample(undefined, TODAY);
  const app = d.apps.find((a) => d.drives.find((x) => x.id === a.did).status === "Open");
  const s = d.students.find((x) => x.id === app.sid);
  const drive = d.drives.find((x) => x.id === app.did);
  const plan = buildPrepPlan(s, drive, app, TODAY);
  assert.equal(plan.steps.some((x) => x.id === "apply"), false);
});
