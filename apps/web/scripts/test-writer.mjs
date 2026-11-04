// Writer, letter, and ATS tests, Phase 2 increment 7.
// Run with plain Node, no build step: node scripts/test-writer.mjs
// Tests writer core logic only. No AI provider is called, no text is
// sent anywhere, and no letter or ATS result claims a real ATS pass.

import assert from "node:assert";
import {
  LETTER_TYPES,
  analyzeAts,
  applyRewrite,
  buildCvText,
  extractKeywords,
  generateLetter,
  missingFields,
  suggestBulletRewrite,
  suggestSummaryRewrite
} from "../lib/writer-core.mjs";
import { createDefaultSettings, createSampleProfile } from "../lib/builder-core.mjs";

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

check("summary rewrite rephrases only supplied words, no invented employer, title, date, or certification", () => {
  const original = "I was responsible for coordinating sample project schedules at Sample Projects Ltd in 2022 to 2024.";
  const result = suggestSummaryRewrite(original);
  assert.equal(result.missing.length, 0);
  assert.ok(result.suggested.includes("Coordinated"));
  assert.ok(result.suggested.includes("Sample Projects Ltd"));
  assert.ok(!result.suggested.includes("Google"));
  assert.ok(!result.suggested.includes("Microsoft"));
  assert.ok(!result.suggested.includes("2020"));
  assert.ok(!result.suggested.includes("PhD"));
  assert.ok(!result.suggested.includes("certified"));
  assert.ok(!result.suggested.includes("award"));
});

check("bullet rewrite keeps the supplied achievement words and adds no new claim", () => {
  const result = suggestBulletRewrite("prepared sample status updates for a sample project team");
  assert.ok(result.suggested.startsWith("Prepared"));
  assert.ok(result.suggested.includes("sample status updates"));
  assert.ok(!result.suggested.includes("increased"));
  assert.ok(!result.suggested.includes("saved"));
});

check("empty summary and empty bullet prompt instead of inventing content", () => {
  const summary = suggestSummaryRewrite("");
  assert.equal(summary.suggested, "");
  assert.deepEqual(summary.missing, ["summary"]);
  assert.ok(summary.prompt.includes("no summary will be invented"));
  const bullet = suggestBulletRewrite("   ");
  assert.equal(bullet.suggested, "");
  assert.deepEqual(bullet.missing, ["bullet"]);
});

check("rewrite is applied only after confirmation", () => {
  const original = "prepared sample updates";
  const suggested = suggestBulletRewrite(original).suggested;
  assert.equal(applyRewrite(original, suggested, false), original);
  assert.equal(applyRewrite(original, suggested, true), suggested);
  assert.equal(applyRewrite(original, "", true), original);
});

check("missing fields are prompts, never filled values", () => {
  const missing = missingFields({ fullName: "", headline: "", summary: "", email: "", experience: [], education: [], skills: [], languages: [] });
  const fields = missing.map((item) => item.field);
  assert.ok(fields.includes("fullName"));
  assert.ok(fields.includes("summary"));
  assert.ok(fields.includes("experience"));
  for (const item of missing) {
    assert.ok(item.prompt.length > 0);
    assert.ok(!item.prompt.includes("Sample Projects"));
  }
  assert.deepEqual(missingFields(createSampleProfile()), []);
});

check("all 12 letter types exist", () => {
  assert.equal(LETTER_TYPES.length, 12);
  const ids = LETTER_TYPES.map((item) => item.id);
  for (const id of ["cover", "motivation", "reference", "recommendation", "employment-verification", "resignation", "follow-up", "thank-you", "job-application-email", "linkedin-about", "bio", "personal-statement"]) {
    assert.ok(ids.includes(id), id);
  }
});

check("cover letter uses only supplied job title and company", () => {
  const result = generateLetter("cover", { fullName: "Sam Sample", headline: "Sample Project Coordinator", jobTitle: "Project Assistant", company: "Sample Firm Ltd" });
  assert.deepEqual(result.missing, []);
  const text = result.paragraphs.join(" ");
  assert.ok(text.includes("Project Assistant"));
  assert.ok(text.includes("Sample Firm Ltd"));
  assert.ok(text.includes("Sam Sample") || text.includes("Your name"));
  assert.ok(!text.includes("Google"));
});

check("motivation letter uses the supplied summary and no invented company", () => {
  const result = generateLetter("motivation", { fullName: "Sam Sample", summary: "Organised sample project coordinator.", jobTitle: "Project Assistant", company: "Sample Firm Ltd" });
  assert.deepEqual(result.missing, []);
  assert.ok(result.paragraphs.join(" ").includes("Organised sample project coordinator"));
  assert.ok(!result.paragraphs.join(" ").includes("Harvard"));
});

check("resignation letter uses supplied company and a placeholder last day, never an invented date", () => {
  const result = generateLetter("resignation", { fullName: "Sam Sample", company: "Sample Firm Ltd" });
  assert.deepEqual(result.missing, []);
  const text = result.paragraphs.join(" ");
  assert.ok(text.includes("Sample Firm Ltd"));
  assert.ok(text.includes("Last working day"));
  assert.ok(!/\b(19|20)\d{2}\b/.test(text));
});

check("letter generation refuses to invent a missing required field", () => {
  const result = generateLetter("cover", { fullName: "Sam Sample" });
  assert.deepEqual(result.paragraphs, []);
  assert.ok(result.missing.includes("jobTitle"));
  assert.ok(result.missing.includes("company"));
  assert.ok(result.prompt.includes("no value will be invented"));
});

check("ATS keyword overlap, section presence, and contact presence are measured only", () => {
  const profile = createSampleProfile();
  const settings = createDefaultSettings();
  const job = "We need planning, scheduling, and spreadsheets for a project coordinator, plus quantum computing experience.";
  const result = analyzeAts(profile, settings, job);
  assert.ok(result.matched.includes("planning"));
  assert.ok(result.matched.includes("scheduling"));
  assert.ok(result.matched.includes("spreadsheets"));
  assert.ok(result.missing.includes("quantum"));
  assert.ok(result.sectionPresence.summary);
  assert.ok(result.sectionPresence.experience);
  assert.ok(result.contactPresence.email);
  assert.ok(result.disclaimer.includes("not a real ATS"));
  assert.ok(!("score" in result));
  assert.ok(!("pass" in result));
  assert.ok(result.keywordCoveragePercent > 0 && result.keywordCoveragePercent < 100);
});

check("ATS parse note differs for design first templates, with no pass or fail claim", () => {
  const profile = createSampleProfile();
  const friendly = analyzeAts(profile, { ...createDefaultSettings(), templateId: "ats-minimal" }, "planning");
  assert.equal(friendly.parseFriendly, true);
  const design = analyzeAts(profile, { ...createDefaultSettings(), templateId: "sidebar" }, "planning");
  assert.equal(design.parseFriendly, false);
  assert.ok(design.parseNote.includes("ATS Minimal"));
  assert.ok(design.disclaimer.includes("not a pass or fail result"));
});

check("ATS text order follows the section order and keywords are unique", () => {
  const profile = createSampleProfile();
  const settings = { ...createDefaultSettings(), sectionOrder: ["skills", "summary", "experience", "education", "languages"] };
  const result = analyzeAts(profile, settings, "planning planning scheduling");
  assert.deepEqual(result.textOrder, ["skills", "summary", "experience", "education", "languages"]);
  assert.equal(result.keywords.filter((word) => word === "planning").length, 1);
  const text = buildCvText(profile, settings);
  assert.ok(text.includes("Sam Sample"));
  assert.ok(text.includes("Planning"));
});

check("keyword extraction drops short words and common stopwords", () => {
  const keywords = extractKeywords("The job and the team for a role in IT");
  assert.ok(!keywords.includes("the"));
  assert.ok(!keywords.includes("and"));
  assert.ok(!keywords.includes("job"));
  assert.ok(!keywords.includes("it"));
});

// Letter export test, using the real template engine, built by the
// engine test run, as in the builder test.
const engine = await import("../../../packages/template-engine/dist/index.js");

await (async () => {
  const letter = generateLetter("cover", { fullName: "Sam Sample", headline: "Sample Project Coordinator", jobTitle: "Project Assistant", company: "Sample Firm Ltd" });
  assert.deepEqual(engine.cleanLetterParagraphs([...letter.paragraphs, "   ", ""]), letter.paragraphs);
  const pdf = await engine.renderLetterPdf("Cover letter", letter.paragraphs);
  const docx = await engine.renderLetterDocx("Cover letter", letter.paragraphs);
  assert.ok(pdf.length > 1000, `Letter PDF too small: ${pdf.length}`);
  assert.ok(docx.length > 1000, `Letter DOCX too small: ${docx.length}`);
  console.log(`PASS: letter export cover PDF ${pdf.length} bytes, DOCX ${docx.length} bytes`);
  passed += 1;
})();

console.log(`Total: ${passed} passed, 0 failed.`);
