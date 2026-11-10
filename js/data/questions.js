/**
 * Aptitude question bank for the adaptive round.
 *   l: difficulty level (1 easy, 2 medium, 3 hard)
 *   q: question text      o: four options
 *   a: index of the correct option      e: explanation shown after answering
 * Keep six or more questions per level so a ten-question round never runs dry.
 */
export const QUESTIONS = [
  { l: 1, q: "A shirt is sold for ₹800 after a 20% discount. What was the marked price?", o: ["₹960", "₹1,000", "₹1,040", "₹1,200"], a: 1, e: "80% of the marked price is ₹800, so it was 800 ÷ 0.8 = ₹1,000." },
  { l: 1, q: "Next in the series: 3, 6, 12, 24, ?", o: ["36", "42", "48", "72"], a: 2, e: "Each term doubles, so 24 × 2 = 48." },
  { l: 1, q: "Pick the word closest in meaning to 'concise'.", o: ["Lengthy", "Vague", "Brief", "Loud"], a: 2, e: "Concise means saying a lot in few words, which is 'brief'." },
  { l: 1, q: "If 5 pens cost ₹60, what do 8 pens cost?", o: ["₹84", "₹96", "₹100", "₹108"], a: 1, e: "One pen costs ₹12, so 8 pens cost ₹96." },
  { l: 1, q: "A train covers 120 km in 2 hours. What is its average speed?", o: ["50 km/h", "55 km/h", "60 km/h", "65 km/h"], a: 2, e: "Speed = 120 ÷ 2 = 60 km/h." },
  { l: 1, q: "Find the odd one out: Square, Circle, Triangle, Cube.", o: ["Square", "Circle", "Triangle", "Cube"], a: 3, e: "A cube is three-dimensional. The others are flat shapes." },
  { l: 2, q: "A can finish a job in 12 days and B in 18 days. Working together, how long do they take?", o: ["6 days", "7.2 days", "8 days", "15 days"], a: 1, e: "Combined rate is 1/12 + 1/18 = 5/36 per day, so 36 ÷ 5 = 7.2 days." },
  { l: 2, q: "What is the simple interest on ₹5,000 at 8% a year for 3 years?", o: ["₹1,000", "₹1,200", "₹1,250", "₹1,500"], a: 1, e: "SI = 5000 × 8 × 3 ÷ 100 = ₹1,200." },
  { l: 2, q: "Next in the series: 2, 5, 10, 17, 26, ?", o: ["35", "36", "37", "38"], a: 2, e: "The differences are 3, 5, 7, 9, so the next is 11 and 26 + 11 = 37." },
  { l: 2, q: "The average of five numbers is 24. After one number is removed, the average of the rest is 22. What was the removed number?", o: ["28", "30", "32", "34"], a: 2, e: "Total of five is 120. The remaining four total 88. The removed number is 120 − 88 = 32." },
  { l: 2, q: "All managers are leaders. No leader is lazy. Which conclusion must be true?", o: ["All leaders are managers", "No manager is lazy", "Some managers are lazy", "Every lazy person is a manager"], a: 1, e: "Every manager is a leader and no leader is lazy, so no manager is lazy." },
  { l: 2, q: "Pick the correctly spelt word.", o: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"], a: 2, e: "Accommodate has a double c and a double m." },
  { l: 3, q: "Two trains, 150 m and 100 m long, run toward each other at 60 km/h and 40 km/h. How long do they take to cross each other completely?", o: ["7 s", "9 s", "10 s", "12 s"], a: 1, e: "Relative speed is 100 km/h = 250/9 m/s. The distance is 250 m, so the time is 9 s." },
  { l: 3, q: "Milk and water are in the ratio 3:2. After adding 10 L of water the ratio becomes 3:4. What was the original quantity of the mixture?", o: ["20 L", "25 L", "30 L", "35 L"], a: 1, e: "Let milk be 3x and water 2x. Then 3x/(2x+10) = 3/4 gives x = 5, so the mixture was 25 L." },
  { l: 3, q: "What is the compound interest on ₹10,000 at 10% a year for 2 years, compounded annually?", o: ["₹2,000", "₹2,100", "₹2,200", "₹2,050"], a: 1, e: "Amount = 10,000 × 1.1² = ₹12,100, so the interest is ₹2,100." },
  { l: 3, q: "In how many ways can the letters of LEVEL be arranged?", o: ["30", "60", "120", "15"], a: 0, e: "LEVEL has 5 letters with L twice and E twice: 5! ÷ (2! × 2!) = 30." },
  { l: 3, q: "Two dice are rolled. What is the probability that the sum is 8?", o: ["1/6", "5/36", "1/9", "7/36"], a: 1, e: "Sum 8 occurs in 5 of 36 outcomes: (2,6), (3,5), (4,4), (5,3), (6,2)." },
  { l: 3, q: "An item costs ₹500. It is marked 40% above cost and sold at a 10% discount. What is the profit percentage?", o: ["20%", "24%", "26%", "30%"], a: 2, e: "Marked price is ₹700, selling price is ₹630, profit is ₹130 on ₹500, which is 26%." },
];
