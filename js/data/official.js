/**
 * Official KRMU placement figures, typed in from:
 *   - https://www.krmangalam.edu.in/placements/records
 *   - CDC annual report 2024-25 (krmangalam.edu.in/pdfs/placements/cdc-annual-report-2024-25.pdf)
 *   - CDC annual report 2025-26 (krmangalam.edu.in/pdfs/placements/cdc-annual-report-2025–26.pdf)
 * Read on 31 October 2026. These do not update by themselves.
 * See docs/DATA.md for what each number is and where the sources disagree.
 */
export const OFFICIAL = {
  /** Tiles at the top of the dashboard. The entry with `computed` is filled in by the view. */
  headlines: [
    { label: "Placement", value: "84", unit: "%", note: "2025–26 cohort" },
    { label: "Offers", value: "1200+", unit: "", note: "2025–26, with 500+ PPOs" },
    { label: "Median package", value: "₹6.4", unit: "LPA", note: "up from ₹5.2 in 2023–24" },
    { label: "Recruiters", value: "800+", unit: "", note: "80% are repeat recruiters" },
    { label: "Highest package", value: "₹34", unit: "LPA", note: "₹56.6 LPA on the At a Glance page" },
    { label: "Internship offers", value: "3000+", unit: "", note: "2025–26" },
    { computed: "placed" },
    { label: "International", value: "25+", unit: "", note: "opportunities, 2025–26" },
  ],

  /** System-wide median compensation, LPA. */
  median: [
    { label: "2023–24", value: 5.2 },
    { label: "2024–25", value: 6.0 },
    { label: "2025–26", value: 6.4 },
  ],

  /** Share of hiring by sector, percent. */
  sector: [
    { label: "IT / ITES", value: 31 },
    { label: "Management", value: 19 },
    { label: "Others", value: 20 },
    { label: "E-commerce", value: 11 },
    { label: "BFSI", value: 10 },
    { label: "Manufacturing", value: 9 },
  ],

  /** Package distribution 2025-26, percent. The page labels the last band "Above 1 LPA"; read here as 1 to 2 LPA. */
  packageBands: [
    { label: "10+ LPA", value: 10 },
    { label: "6–10 LPA", value: 24 },
    { label: "4–6 LPA", value: 32 },
    { label: "2–4 LPA", value: 26 },
    { label: "1–2 LPA*", value: 8 },
  ],

  /** School-wise placement, 2024-25 cohort. CTC values in LPA. statedRate is the percentage printed on the page. */
  schools: [
    { code: "SOMC", name: "School of Management and Commerce", eligible: 321, placed: 266, statedRate: 85, maxCtc: 20, avgCtc: 9.8, medianCtc: 8.5 },
    { code: "SOET", name: "School of Engineering and Technology", eligible: 225, placed: 192, statedRate: 85, maxCtc: 34, avgCtc: 10.5, medianCtc: 9.2 },
    { code: "SOLA", name: "School of Liberal Arts", eligible: 135, placed: 120, statedRate: 85, maxCtc: 14, avgCtc: 7.8, medianCtc: 7.1 },
    { code: "SMAS", name: "School of Medical and Allied Sciences", eligible: 127, placed: 89, statedRate: 85, maxCtc: 7, avgCtc: 5.6, medianCtc: 5.2 },
    { code: "SOLS", name: "School of Legal Studies", eligible: 93, placed: 65, statedRate: 91, maxCtc: 12, avgCtc: 5.8, medianCtc: 5.5 },
    { code: "SOED", name: "School of Education", eligible: 29, placed: 22, statedRate: 76, maxCtc: 34, avgCtc: 10.5, medianCtc: 9.2 },
    { code: "SBAS", name: "School of Basic and Applied Sciences", eligible: 29, placed: 21, statedRate: 82, maxCtc: 10, avgCtc: 10.5, medianCtc: 9.2 },
    { code: "SOAD", name: "School of Architecture and Design", eligible: 21, placed: 14, statedRate: 86, maxCtc: 9, avgCtc: 6.8, medianCtc: 6.3 },
    { code: "SJMC", name: "School of Journalism and Mass Communication", eligible: 18, placed: 17, statedRate: 94, maxCtc: 12, avgCtc: 7.2, medianCtc: 6.7 },
    { code: "SOAS", name: "School of Agricultural Sciences", eligible: 14, placed: 7, statedRate: 86, maxCtc: 6.5, avgCtc: 5.9, medianCtc: 5.6 },
    { code: "SPRS", name: "School of Physiotherapy and Rehabilitation Sciences", eligible: 3, placed: 3, statedRate: 84, maxCtc: 7, avgCtc: 6.2, medianCtc: 5.9 },
  ],

  /** Plain-language data quality notes shown under "Check before you quote these numbers". */
  notes: [
    "Seven of eleven schools state a placement rate more than 3 points away from placed ÷ eligible. The biggest gaps are SOAS (86% stated, 50% computed), SOLS (91% and 70%) and SMAS (85% and 70%).",
    "SOET, SOED and SBAS show the same max, average and median CTC pairing in places, and SBAS lists an average of 10.5 LPA above its 10 LPA maximum. This looks like a copy error on the page.",
    "Highest package appears as ₹56.6 LPA on the At a Glance section and ₹34 LPA in the annual reports. Average is reported as 4.25 LPA in the 2024–25 report and 6 to 7 LPA in 2025–26.",
    "The page intro refers to the 2025–26 cohort while the school table is labelled 2024–25.",
  ],
};

/** A rate gap above this many percentage points is flagged as "differs" in the school table. */
export const RATE_MISMATCH_THRESHOLD = 3;
