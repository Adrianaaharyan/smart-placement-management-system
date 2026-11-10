import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStudentsCsv, studentsToCsv, CSV_HEADER } from "../../js/core/csv.js";

test("parse: reads a valid row with every column", () => {
  const { students, skipped } = parseStudentsCsv("Aarav Sharma,2201010101,B.Tech CSE,8.1,0,Python;Java;SQL,72,2,1");
  assert.equal(skipped, 0);
  assert.deepEqual(students[0], {
    id: "s1", name: "Aarav Sharma", roll: "2201010101", branch: "B.Tech CSE", cgpa: 8.1, backlogs: 0,
    skills: ["Python", "Java", "SQL"], aptitude: 72, projects: 2, internships: 1,
  });
});

test("parse: skips a header row", () => {
  const { students } = parseStudentsCsv(CSV_HEADER + "\nA,R1,MBA,7,0,Excel,60,1,0");
  assert.equal(students.length, 1);
  assert.equal(students[0].name, "A");
});

test("parse: optional columns get defaults", () => {
  const { students } = parseStudentsCsv("A,R1,MBA,7,1");
  assert.equal(students[0].aptitude, 50);
  assert.equal(students[0].projects, 0);
  assert.equal(students[0].internships, 0);
  assert.deepEqual(students[0].skills, []);
});

test("parse: skips and counts rows that are too short, missing a name, or have a bad CGPA", () => {
  const text = ["Bad,row", ",R2,MBA,7,0", "C,R3,MBA,11,0", "D,R4,MBA,abc,0", "E,R5,MBA,7.5,0"].join("\n");
  const { students, skipped } = parseStudentsCsv(text);
  assert.equal(students.length, 1);
  assert.equal(students[0].name, "E");
  assert.equal(skipped, 4);
});

test("parse: clamps out-of-range numbers and handles Windows line endings", () => {
  const { students } = parseStudentsCsv("A,R1,MBA,7,99,Excel,500,99,99\r\nB,R2,MBA,7,0");
  assert.equal(students.length, 2);
  assert.equal(students[0].backlogs, 10);
  assert.equal(students[0].aptitude, 100);
  assert.equal(students[0].projects, 20);
  assert.equal(students[0].internships, 10);
});

test("export then import keeps the data", () => {
  const original = [
    { id: "s1", name: "Aarav Sharma", roll: "R1", branch: "MBA", cgpa: 8.25, backlogs: 1, skills: ["Excel", "Sales"], aptitude: 70, projects: 2, internships: 1 },
  ];
  const { students } = parseStudentsCsv(studentsToCsv(original));
  assert.deepEqual(students, original);
});

test("export: commas inside values cannot break the columns", () => {
  const csv = studentsToCsv([{ name: "Sharma, Aarav", roll: "R1", branch: "MBA", cgpa: 7, backlogs: 0, skills: [], aptitude: 50, projects: 0, internships: 0 }]);
  assert.equal(csv.split("\n")[1].split(",").length, 9);
});
