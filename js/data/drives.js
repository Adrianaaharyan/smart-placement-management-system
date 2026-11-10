/**
 * Seed drives for the sample cohort.
 * Company names are real recruiters from KRMU's lists. Roles, CTCs, dates and
 * eligibility rules are examples, kept inside each school's reported CTC range.
 * `day` is the drive date as days from today when the sample is generated: negative for drives
 * that already happened, positive for upcoming ones. That keeps the demo alerts meaningful
 * whenever the app is opened. Replace this list, or add drives from the Drives tab.
 */
export const DRIVES_SEED = [
  { company: "Orient Technologies", role: "Systems Engineer", ctc: 4.2, minCgpa: 6, maxBack: 1, branches: ["B.Tech CSE", "B.Tech ECE"], skills: ["Python", "SQL"], day: -66, status: "Completed" },
  { company: "Acmegrade", role: "Associate Data Engineer", ctc: 3.6, minCgpa: 6, maxBack: 1, branches: ["B.Tech CSE"], skills: ["Python", "SQL"], day: -58, status: "Completed" },
  { company: "HDFC Bank", role: "Relationship Officer", ctc: 4.2, minCgpa: 6, maxBack: 1, branches: ["MBA", "B.Com"], skills: ["Sales", "Communication"], day: -51, status: "Completed" },
  { company: "Tech Mahindra", role: "Graduate Trainee", ctc: 3.8, minCgpa: 5.5, maxBack: 2, branches: ["MBA", "B.Com", "BA LLB"], skills: ["Communication"], day: -44, status: "Completed" },
  { company: "Smartbrew", role: "Business Development Associate", ctc: 3.8, minCgpa: 5.5, maxBack: 1, branches: ["MBA", "B.Com"], skills: ["Sales", "Communication"], day: -37, status: "Completed" },
  { company: "Collegedunia", role: "Admissions Counsellor", ctc: 4.0, minCgpa: 6, maxBack: 1, branches: ["MBA", "B.Com", "BA LLB"], skills: ["Communication"], day: -30, status: "Completed" },
  { company: "Polycab", role: "Graduate Engineer Trainee", ctc: 5.0, minCgpa: 6.5, maxBack: 0, branches: ["B.Tech ME", "B.Tech ECE"], skills: ["Python"], day: -23, status: "Completed" },
  { company: "JTEKT India", role: "Production Engineer", ctc: 4.5, minCgpa: 6, maxBack: 1, branches: ["B.Tech ME"], skills: ["AutoCAD", "CNC"], day: -16, status: "Completed" },
  { company: "RK Logistics", role: "Operations Executive", ctc: 4.2, minCgpa: 6, maxBack: 1, branches: ["MBA", "B.Com", "B.Tech ME"], skills: ["Excel"], day: -9, status: "Completed" },
  { company: "Lawctopus", role: "Legal Content Associate", ctc: 4.0, minCgpa: 6, maxBack: 1, branches: ["BA LLB"], skills: ["Legal Research", "Drafting"], day: -4, status: "Completed" },
  { company: "Ericsson", role: "Associate Engineer", ctc: 8.0, minCgpa: 7.5, maxBack: 0, branches: ["B.Tech ECE", "B.Tech CSE"], skills: ["Python", "Embedded C"], day: 2, status: "Open" },
  { company: "Paisa Bazaar", role: "Software Engineer", ctc: 10.0, minCgpa: 7.5, maxBack: 0, branches: ["B.Tech CSE"], skills: ["DSA", "SQL", "Java"], day: 5, status: "Open" },
  { company: "Red Bull", role: "Management Trainee", ctc: 8.5, minCgpa: 7.5, maxBack: 0, branches: ["MBA"], skills: ["Sales", "Marketing", "Communication"], day: 9, status: "Open" },
  { company: "Sport Dunia", role: "Marketing Executive", ctc: 5.0, minCgpa: 6.5, maxBack: 0, branches: ["MBA", "B.Com"], skills: ["Sales", "Excel"], day: 13, status: "Open" },
  { company: "Gaur & Associates", role: "Associate", ctc: 5.5, minCgpa: 6.5, maxBack: 0, branches: ["BA LLB"], skills: ["Legal Research", "Drafting"], day: 18, status: "Open" },
  { company: "Autodesk", role: "Software Engineer", ctc: 14.0, minCgpa: 8, maxBack: 0, branches: ["B.Tech CSE"], skills: ["DSA", "Cloud", "Python", "Git"], day: 26, status: "Upcoming" },
  { company: "Fahad AL Tamimi", role: "Legal Associate", ctc: 12.0, minCgpa: 8, maxBack: 0, branches: ["BA LLB"], skills: ["Corporate Law", "Drafting", "Legal Research"], day: 31, status: "Upcoming" },
  { company: "Air Works", role: "Legal Executive", ctc: 6.0, minCgpa: 7, maxBack: 0, branches: ["BA LLB"], skills: ["Corporate Law", "Communication"], day: 34, status: "Upcoming" },
  { company: "Kenresearch", role: "Research Analyst", ctc: 4.5, minCgpa: 6.5, maxBack: 0, branches: ["MBA", "B.Com"], skills: ["Analytics", "Excel"], day: 38, status: "Upcoming" },
  { company: "Adda247", role: "Business Associate", ctc: 5.0, minCgpa: 6, maxBack: 1, branches: ["MBA", "B.Com"], skills: ["Sales", "Communication"], day: 41, status: "Upcoming" },
];
