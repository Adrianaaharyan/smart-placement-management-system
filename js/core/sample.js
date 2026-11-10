/**
 * Sample-data generator. Produces a reproducible cohort (same seed, same data)
 * so the app can be demonstrated without student-level records, which the
 * university does not publish. Replace it by importing a CSV on the Students tab.
 */
import { PROGRAMMES, SAMPLE_SEED } from "../config.js";
import { DRIVES_SEED } from "../data/drives.js";
import { FIRST_NAMES, LAST_NAMES } from "../data/names.js";
import { mulberry32 } from "./util.js";
import { todayISO, addDays } from "./dates.js";
import { eligible, readiness } from "./scoring.js";

/**
 * Drive dates are placed relative to `today`, so upcoming drives are always upcoming.
 * @returns {{source: "sample", students: object[], drives: object[], apps: object[], nextD: number, notifRead: object, prepDone: object}}
 */
export function buildSample(seed = SAMPLE_SEED, today = todayISO()) {
  const rand = mulberry32(seed);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const shuffle = (a) => a.slice().sort(() => rand() - 0.5);

  const students = [];
  const usedNames = {};
  let id = 1;
  Object.keys(PROGRAMMES).forEach((branch) => {
    const cfg = PROGRAMMES[branch];
    for (let i = 0; i < cfg.n; i++) {
      let name;
      do {
        name = pick(FIRST_NAMES) + " " + pick(LAST_NAMES);
      } while (usedNames[name]);
      usedNames[name] = 1;
      const cgpa = 5.8 + ((rand() + rand() + rand()) / 3) * 3.8;
      students.push({
        id: "s" + id,
        name,
        roll: "2201" + cfg.code + String(100 + i),
        branch,
        cgpa: Math.round(cgpa * 100) / 100,
        backlogs: rand() < 0.86 ? 0 : rand() < 0.7 ? 1 : 2,
        skills: shuffle(cfg.skills).slice(0, 3 + Math.floor(rand() * 3)),
        aptitude: Math.round(35 + rand() * 55),
        projects: Math.floor(rand() * 5),
        internships: Math.floor(rand() * 3),
      });
      id++;
    }
  });

  const drives = DRIVES_SEED.map((seedDrive, i) => {
    const { day, ...rest } = JSON.parse(JSON.stringify(seedDrive));
    return Object.assign(rest, { id: "d" + (i + 1), date: addDays(today, day) });
  });

  // Each student applies to one to three eligible drives that have already opened.
  // Offer odds rise with readiness. Completed drives never leave students mid-pipeline.
  const apps = [];
  students.forEach((s) => {
    if (rand() < 0.1) return;
    const options = shuffle(drives.filter((d) => d.status !== "Upcoming" && eligible(s, d).ok));
    const chosen = options.slice(0, 1 + Math.floor(rand() * 3));
    const rd = readiness(s).total / 100;
    chosen.forEach((d) => {
      const x = rand();
      let stage;
      if (d.status === "Completed") {
        const offerOdds = 0.1 + rd * 0.45;
        stage = x < offerOdds ? "Offered" : "Rejected";
      } else {
        stage = x < 0.6 ? "Applied" : x < 0.9 ? "Shortlisted" : "Interview";
      }
      apps.push({ sid: s.id, did: d.id, stage });
    });
  });

  return { source: "sample", students, drives, apps, nextD: drives.length + 1, notifRead: {}, prepDone: {} };
}
