// Builder tests, Phase 2 increment 3. Run with plain Node, no build step:
//   node scripts/test-builder.mjs
// Tests builder core logic and, for export, the real template engine
// from packages/template-engine/dist, built by that package test run.

import assert from "node:assert";
import {
  addCustomSection,
  buildPreviewSections,
  createDefaultSettings,
  createDraft,
  createSampleProfile,
  moveSection,
  parseDraft,
  parseImport,
  photoIncluded,
  pushVersion,
  restoreVersion,
  sectionOrderFor,
  serialiseDraft,
  validateProfile
} from "../lib/builder-core.mjs";

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

const profile = createSampleProfile();
const settings = createDefaultSettings();

check("section reorder move down and move up", () => {
  const order = ["summary", "experience", "education", "skills", "languages"];
  assert.deepEqual(moveSection(order, "summary", "down"), [
    "experience", "summary", "education", "skills", "languages"
  ]);
  assert.deepEqual(moveSection(order, "summary", "up"), order);
  assert.deepEqual(moveSection(order, "languages", "down"), order);
});

check("section reorder ignores unknown key", () => {
  assert.deepEqual(moveSection(["summary", "experience"], "unknown", "down"), [
    "summary", "experience"
  ]);
});

check("custom section add and preview order", () => {
  const updated = addCustomSection(profile, "Projects", "Sample project line one\nSample project line two");
  assert.equal(updated.customSections.length, 1);
  assert.equal(updated.customSections[0].key, "custom-1");
  const order = sectionOrderFor(updated, ["skills", "custom-1", "summary"]);
  assert.equal(order[0], "skills");
  assert.equal(order[1], "custom-1");
  const sections = buildPreviewSections(updated, order);
  const custom = sections.find((item) => item.key === "custom-1");
  assert.ok(custom);
  assert.deepEqual(custom.lines, ["Sample project line one", "Sample project line two"]);
});

check("template switch and photo flag", () => {
  assert.equal(photoIncluded("ats-minimal", true), false);
  assert.equal(photoIncluded("modern-professional", true), true);
  assert.equal(photoIncluded("modern-professional", false), false);
});

check("paper size settings are preserved in a draft", () => {
  const us = { ...settings, paperSize: "US_LETTER" };
  const draft = createDraft(profile, us, "US Letter draft");
  assert.equal(parseDraft(serialiseDraft(draft)).settings.paperSize, "US_LETTER");
});

check("draft autosave round trip and version restore", () => {
  const first = createDraft(profile, settings, "Version 1");
  const edited = { ...profile, headline: "Edited sample headline" };
  const second = createDraft(edited, settings, "Version 2");
  const history = pushVersion(pushVersion([], first), second);
  assert.equal(history.length, 2);
  assert.equal(restoreVersion(history, 1).profile.headline, "Sample Project Coordinator");
  assert.equal(restoreVersion(history, 99), null);
});

check("profile validation reports missing fields", () => {
  assert.deepEqual(validateProfile({ ...profile, summary: "" }), ["summary"]);
  assert.deepEqual(validateProfile(profile), []);
});

const importText = [
  "Name: Imported Sample",
  "Headline: Sample Analyst",
  "Email: imported@example.test",
  "Summary: Sample imported summary.",
  "Experience: Sample Firm | Sample Analyst | Sample City | 2021 to 2023",
  "- Sample bullet one.",
  "Education: Sample Degree | Sample University | 2017 to 2021",
  "Skills: Analysis, Reporting",
  "Languages: English (Fluent, sample level)",
  "Custom: Projects",
  "Sample project line."
].join("\n");

check("import parse, with correction before use", () => {
  const result = parseImport(importText);
  assert.equal(result.profile.fullName, "Imported Sample");
  assert.equal(result.profile.experience.length, 1);
  assert.deepEqual(result.profile.experience[0].bullets, ["Sample bullet one."]);
  assert.equal(result.profile.education.length, 1);
  assert.deepEqual(result.profile.skills, ["Analysis", "Reporting"]);
  assert.equal(result.profile.customSections.length, 1);
  assert.deepEqual(result.unparsedLines, []);
  // Correction step: the parsed profile is editable before it becomes a
  // document. This test proves the parsed object can be changed.
  const corrected = { ...result.profile, headline: "Corrected sample headline" };
  assert.equal(corrected.headline, "Corrected sample headline");
  assert.equal(result.profile.headline, "Sample Analyst");
});

check("import parse reports unparsed lines, never silently drops them", () => {
  const result = parseImport("Name: X\nSome random line without a field");
  assert.deepEqual(result.unparsedLines, ["Some random line without a field"]);
});

// Export test, using the real template engine, including a custom section.
const engine = await import("../../../packages/template-engine/dist/index.js");

async function exportCheck() {
  const withCustom = addCustomSection(profile, "Projects", "Sample project line.");
  for (const templateId of ["ats-minimal", "modern-professional"]) {
    const rendered = engine.renderDocument(withCustom, templateId, {
      paperSize: "A4",
      pageCountTarget: 1,
      includePhoto: false,
      sectionOrder: sectionOrderFor(withCustom)
    });
    const custom = rendered.sections.find((item) => item.key === "custom-1");
    assert.ok(custom, `custom section missing in ${templateId} export`);
    const pdf = await engine.renderPdf(rendered);
    const docx = await engine.renderDocx(rendered);
    assert.ok(pdf.length > 1000, `PDF too small for ${templateId}`);
    assert.ok(docx.length > 1000, `DOCX too small for ${templateId}`);
    console.log(`PASS: export ${templateId} PDF ${pdf.length} bytes, DOCX ${docx.length} bytes, custom section present`);
    passed += 1;
  }
}
await exportCheck();

console.log(`Total: ${passed} passed, 0 failed.`);
