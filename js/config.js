/**
 * Application-wide constants. Nothing in this file touches the DOM,
 * so it can be imported from the browser and from Node tests alike.
 */

/** localStorage key. Bump the suffix when the saved state shape changes. */
export const STORAGE_KEY = "krmu-placeiq-v3";

/** Seed for the sample-data generator, so the sample cohort is identical on every load. */
export const SAMPLE_SEED = 20261031;

/** Hiring pipeline, in order. "Rejected" is a terminal state. */
export const STAGES = ["Applied", "Shortlisted", "Interview", "Offered", "Rejected"];

export const DRIVE_STATUSES = ["Open", "Upcoming", "Completed"];
export const STUDENT_STATUSES = ["Placed", "In process", "Not placed yet"];

/** Hash routes. Each one maps to a view in js/views/. */
export const VIEWS = ["dashboard", "drives", "students", "portal", "practice"];

/**
 * Programme catalogue used by the sample generator and the dashboard.
 * code: roll-number segment, n: sample students, skills: skill pool for the programme.
 */
export const PROGRAMMES = {
  "B.Tech CSE": { code: "01", n: 40, skills: ["Python", "Java", "DSA", "SQL", "React", "Node.js", "Cloud", "ML", "Git", "OS & Networks"] },
  "B.Tech ECE": { code: "02", n: 14, skills: ["Embedded C", "VLSI", "IoT", "MATLAB", "PCB Design", "Python"] },
  "B.Tech ME": { code: "03", n: 12, skills: ["AutoCAD", "SolidWorks", "Thermodynamics", "CNC", "Python"] },
  "MBA": { code: "11", n: 24, skills: ["Excel", "Marketing", "Finance", "Analytics", "Communication", "Sales"] },
  "BA LLB": { code: "21", n: 12, skills: ["Legal Research", "Drafting", "Corporate Law", "Moot Court", "Communication"] },
  "B.Com": { code: "31", n: 18, skills: ["Tally", "Excel", "GST", "Accounting", "Communication"] },
};

/**
 * Readiness score weights. They sum to 100 before the backlog penalty.
 * A transparent starting rule, not a trained model: tune against real outcomes.
 */
export const READINESS_WEIGHTS = {
  cgpa: 35,
  aptitude: 25,
  skills: 20,
  projects: 10,
  internships: 10,
  /** Skills, projects and internships reach full marks at these counts. */
  skillsFull: 6,
  projectsFull: 3,
  internshipsFull: 2,
  /** Points lost per active backlog, and the cap on the total penalty. */
  backlogPenalty: 10,
  backlogPenaltyCap: 20,
};

/** Match score = SKILL_SHARE x skill overlap + READINESS_SHARE x readiness, both as percentages. */
export const MATCH_WEIGHTS = { skillShare: 55, readinessShare: 0.45 };
