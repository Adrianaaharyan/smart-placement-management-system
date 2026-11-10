/**
 * CSV import and export for students.
 * Columns: name, roll, branch, cgpa, backlogs, skills (semicolon separated), aptitude, projects, internships.
 * The last three are optional. Values must not contain commas.
 */
import { clamp } from "./util.js";

export const CSV_HEADER = "name,roll,branch,cgpa,backlogs,skills,aptitude,projects,internships";

export function studentsToCsv(students) {
  const rows = [CSV_HEADER];
  students.forEach((s) => {
    rows.push(
      [s.name, s.roll, s.branch, s.cgpa, s.backlogs, s.skills.join(";"), s.aptitude, s.projects, s.internships]
        .map((x) => String(x).replace(/,/g, " "))
        .join(",")
    );
  });
  return rows.join("\n");
}

/**
 * Parse pasted CSV text. A header row is detected and skipped.
 * Rows with fewer than five columns, a missing name or programme, or a CGPA outside 0 to 10 are skipped and counted.
 * @returns {{students: object[], skipped: number}}
 */
export function parseStudentsCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length && /^name\s*,/i.test(lines[0])) lines.shift();
  const students = [];
  let skipped = 0;
  lines.forEach((line, i) => {
    const c = line.split(",").map((x) => x.trim());
    const cgpa = parseFloat(c[3]);
    if (c.length < 5 || !c[0] || !c[2] || isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      skipped++;
      return;
    }
    students.push({
      id: "s" + (i + 1),
      name: c[0],
      roll: c[1] || "R" + (i + 1),
      branch: c[2],
      cgpa: Math.round(cgpa * 100) / 100,
      backlogs: clamp(parseInt(c[4], 10) || 0, 0, 10),
      skills: (c[5] || "").split(";").map((x) => x.trim()).filter(Boolean),
      aptitude: clamp(parseInt(c[6], 10) || 50, 0, 100),
      projects: clamp(parseInt(c[7], 10) || 0, 0, 20),
      internships: clamp(parseInt(c[8], 10) || 0, 0, 10),
    });
  });
  return { students, skipped };
}
