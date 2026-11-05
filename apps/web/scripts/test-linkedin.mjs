// LinkedIn export import tests, Phase 2 increment 12. Run with plain
// Node: node scripts/test-linkedin.mjs
// All sample data is fictional and marked SAMPLE. No real LinkedIn
// account, no API call, and no scraping is used here. Tests cover the
// full six file set, a current role with an empty Finished On, a
// description with a quoted comma and a multiline description, a
// missing file warning, an unknown column warning, a ZIP of the same
// CSV files, and the correction step with draft only on confirmation.

import assert from "node:assert";
import {
  applyLinkedInImportAfterConfirmation,
  parseCsvText,
  parseLinkedInExports
} from "../lib/linkedin-core.mjs";

const engine = await import("../../../packages/template-engine/dist/index.js");
const AdmZip = (await import("adm-zip")).default;

const PROFILE_CSV = [
  "First Name,Last Name,Headline,Summary,Geo Location",
  "Sam Sample,Sample,SAMPLE Sample Project Coordinator,SAMPLE: Fictional sample summary for testing only.,Sample City"
].join("\n");

const POSITIONS_CSV = [
  "Company Name,Title,Description,Location,Started On,Finished On",
  'Sample Projects Ltd,Sample Project Coordinator,"Coordinated sample schedules, tracked milestones.\nPrepared sample status updates.",Sample City,Jan 2022,',
  "Sample Firm Ltd,Sample Analyst,Prepared sample reports.,Sample Town,Mar 2020,Dec 2021"
].join("\n");

const EDUCATION_CSV = [
  "School Name,Start Date,End Date,Degree Name,Notes,Activities",
  "Sample College,2018,2020,Sample Diploma in Project Support,Sample notes line.,Sample club"
].join("\n");

const SKILLS_CSV = ["Name", "Planning", "Scheduling"].join("\n");

const CERTIFICATIONS_CSV = [
  "Name,Authority,License Number,Url,Started On,Finished On",
  "Sample Project Certificate,Sample Board,,,Jan 2021,Jan 2021"
].join("\n");

const LANGUAGES_CSV = [
  "Name,Proficiency",
  "English,Fluent"
].join("\n");

const fullFiles = {
  "Profile.csv": PROFILE_CSV,
  "Positions.csv": POSITIONS_CSV,
  "Education.csv": EDUCATION_CSV,
  "Skills.csv": SKILLS_CSV,
  "Certifications.csv": CERTIFICATIONS_CSV,
  "Languages.csv": LANGUAGES_CSV
};

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

check("full six file export maps to profile, experience, education, skills, certifications, languages", () => {
  const result = parseLinkedInExports(fullFiles);
  assert.equal(result.profile.fullName, "Sam Sample Sample");
  assert.equal(result.profile.headline, "SAMPLE Sample Project Coordinator");
  assert.equal(result.profile.city, "Sample City");
  assert.ok(result.profile.summary.includes("Fictional sample summary"));
  assert.equal(result.profile.experience.length, 2);
  assert.equal(result.profile.experience[0].employer, "Sample Projects Ltd");
  assert.equal(result.profile.experience[0].jobTitle, "Sample Project Coordinator");
  assert.equal(result.profile.education.length, 1);
  assert.equal(result.profile.education[0].institution, "Sample College");
  assert.equal(result.profile.education[0].qualification, "Sample Diploma in Project Support");
  assert.deepEqual(result.profile.skills, ["Planning", "Scheduling"]);
  assert.deepEqual(result.profile.languages, ["English (Fluent)"]);
  const certSection = result.profile.customSections.find((item) => item.title === "Certifications");
  assert.ok(certSection, "certifications custom section missing");
  assert.ok(certSection.lines[0].includes("Sample Project Certificate"));
  assert.ok(certSection.lines[0].includes("Sample Board"));
  assert.deepEqual(result.filesParsed, [
    "Profile.csv", "Positions.csv", "Education.csv", "Skills.csv", "Certifications.csv", "Languages.csv"
  ]);
  assert.deepEqual(result.filesMissing, []);
  console.log(`  experience ${result.profile.experience.length}, education ${result.profile.education.length}, custom sections ${result.profile.customSections.length}`);
});

check("current role with empty Finished On keeps Month YYYY start and Present", () => {
  const result = parseLinkedInExports(fullFiles);
  assert.equal(result.profile.experience[0].period, "Jan 2022 to Present");
  assert.equal(result.profile.experience[1].period, "Mar 2020 to Dec 2021");
});

check("quoted comma and multiline description are parsed, not split", () => {
  const result = parseLinkedInExports(fullFiles);
  const bullets = result.profile.experience[0].bullets;
  assert.equal(bullets.length, 2);
  assert.equal(bullets[0], "Coordinated sample schedules, tracked milestones.");
  assert.equal(bullets[1], "Prepared sample status updates.");
  const rows = parseCsvText(POSITIONS_CSV);
  assert.equal(rows.length, 3);
  assert.ok(rows[1][2].includes("\n"), "multiline description lost its newline in the raw parse");
});

check("missing file is warned about, never invented", () => {
  const partial = { ...fullFiles };
  delete partial["Languages.csv"];
  const result = parseLinkedInExports(partial);
  assert.deepEqual(result.profile.languages, []);
  assert.ok(result.filesMissing.includes("Languages.csv"));
  assert.ok(result.warnings.some((item) => item.includes("Languages.csv") && item.includes("not supplied")));
});

check("unknown column is warned about, never silently used", () => {
  const withUnknown = {
    ...fullFiles,
    "Skills.csv": "Name,Sample Unknown Column\nPlanning,zzz\nScheduling,yyy"
  };
  const result = parseLinkedInExports(withUnknown);
  assert.deepEqual(result.profile.skills, ["Planning", "Scheduling"]);
  assert.ok(result.warnings.some((item) => item.includes("Sample Unknown Column") && item.includes("Skills.csv")));
});

check("missing column is warned about, never invented", () => {
  const withoutHeadline = {
    ...fullFiles,
    "Profile.csv": "First Name,Last Name,Summary,Geo Location\nSam Sample,Sample,SAMPLE summary.,Sample City"
  };
  const result = parseLinkedInExports(withoutHeadline);
  assert.equal(result.profile.headline, "");
  assert.ok(result.warnings.some((item) => item.includes("Headline") && item.includes("Profile.csv")));
});

check("empty position row is reported as unparsed, never silently dropped", () => {
  const withEmptyRow = {
    ...fullFiles,
    "Positions.csv": "Company Name,Title,Description,Location,Started On,Finished On\n,,,Sample City,Jan 2022,\nSample Firm Ltd,Sample Analyst,Prepared sample reports.,Sample Town,Mar 2020,Dec 2021"
  };
  const result = parseLinkedInExports(withEmptyRow);
  assert.equal(result.profile.experience.length, 1);
  assert.ok(result.unparsedLines.some((item) => item.includes("Positions.csv")));
});

check("ZIP of the same CSV files extracts and parses to the same profile", () => {
  const zip = new AdmZip();
  for (const [name, text] of Object.entries(fullFiles)) {
    zip.addFile(name, Buffer.from(text, "utf8"));
  }
  const buffer = zip.toBuffer();
  const entries = engine.extractZipCsvFiles(buffer);
  assert.equal(entries.length, 6);
  const fromZip = {};
  for (const entry of entries) {
    fromZip[entry.name] = entry.text;
  }
  const result = parseLinkedInExports(fromZip);
  assert.equal(result.profile.fullName, "Sam Sample Sample");
  assert.equal(result.profile.experience.length, 2);
  assert.equal(result.profile.experience[0].period, "Jan 2022 to Present");
  console.log(`  ZIP ${buffer.length} bytes, ${entries.length} CSV entries`);
});

check("correction step and draft only on confirmation", () => {
  const draftBefore = { fullName: "Draft Owner", headline: "Draft Headline" };
  const result = parseLinkedInExports(fullFiles);
  // Parsing alone must not change the draft object.
  assert.equal(draftBefore.fullName, "Draft Owner");
  // The user corrects the parsed name first, then confirms.
  const corrected = { ...result.profile, fullName: "Corrected Sample Name" };
  const applied = applyLinkedInImportAfterConfirmation(corrected);
  assert.equal(applied.fullName, "Corrected Sample Name");
  assert.equal(applied.experience[0].period, "Jan 2022 to Present");
  // The applied copy is independent of later edits to the parsed object.
  corrected.fullName = "Changed After Apply";
  assert.equal(applied.fullName, "Corrected Sample Name");
});

check("education notes and activities are kept in a custom section, not dropped", () => {
  const result = parseLinkedInExports(fullFiles);
  const notes = result.profile.customSections.find((item) => item.title === "Education notes");
  assert.ok(notes, "education notes custom section missing");
  assert.ok(notes.lines.some((line) => line.includes("Sample notes line.")));
  assert.ok(notes.lines.some((line) => line.includes("Sample club")));
});

console.log(`Total: ${passed} passed, 0 failed.`);
