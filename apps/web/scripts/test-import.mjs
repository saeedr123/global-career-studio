// File import tests, Phase 2 increment 5. Run with plain Node:
//   node scripts/test-import.mjs
// Uses the real template engine for engine generated files, and
// hand written files built with pdfkit and docx directly, so the
// parser is tested on text it did not generate through a template.
// No content is invented by the parser. Unparsed lines and empty
// files are tested as failures to invent, not as successes.

import assert from "node:assert";
import { parseFileImport } from "../lib/builder-core.mjs";

const engine = await import("../../../packages/template-engine/dist/index.js");
const PDFDocument = (await import("pdfkit")).default;
const docxLib = await import("docx");

function pdfBuffer(lines) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [595.28, 841.89], margins: { top: 48, bottom: 48, left: 48, right: 48 } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    for (const line of lines) {
      doc.text(line);
    }
    doc.end();
  });
}

async function docxBuffer(lines) {
  const { Document, Packer, Paragraph, TextRun } = docxLib;
  const document = new Document({
    sections: [{
      children: lines.map((line) => new Paragraph({ children: [new TextRun({ text: line })] }))
    }]
  });
  return Packer.toBuffer(document);
}

const sample = engine.shortSample;
const withCustom = {
  ...sample,
  customSections: [{ key: "custom-1", title: "Projects", lines: ["Sample project line."] }]
};

let asyncPassed = 0;
async function asyncCheck(label, fn) {
  await fn();
  asyncPassed += 1;
  console.log(`PASS: ${label}`);
}

await asyncCheck("engine PDF import, ATS Minimal, with custom section", async () => {
  const rendered = engine.renderDocument(withCustom, "ats-minimal", { paperSize: "A4", pageCountTarget: 1, includePhoto: false });
  const buffer = await engine.renderPdf(rendered);
  assert.ok(buffer.length > 1000, `engine PDF too small: ${buffer.length}`);
  const extracted = await engine.extractPdfText(buffer);
  assert.ok(extracted.text.includes("Sam Sample"), "engine PDF text missing name");
  const result = parseFileImport(extracted.text);
  assert.equal(result.empty, false);
  assert.equal(result.profile.fullName, "Sam Sample");
  assert.equal(result.profile.headline, "Sample Project Coordinator");
  assert.equal(result.profile.email, "sam.sample@example.test");
  assert.ok(result.profile.experience.length >= 1, "engine PDF experience missing");
  assert.equal(result.profile.experience[0].employer, "Sample Projects Ltd");
  assert.equal(result.profile.education.length, 1);
  assert.deepEqual(result.profile.skills.slice(0, 2), ["Planning", "Scheduling"]);
  assert.deepEqual(result.profile.languages, ["English (Fluent, sample level)"]);
  assert.equal(result.profile.customSections.length, 1);
  // Engine PDF headings are printed in uppercase for ATS Minimal, so
  // the parser returns the printed case, not a guessed original case.
  assert.equal(result.profile.customSections[0].title.toLowerCase(), "projects");
  console.log(`  engine PDF ${buffer.length} bytes, extracted ${extracted.lines.length} lines, unparsed ${result.unparsedLines.length}`);
});

await asyncCheck("engine DOCX import, ATS Minimal, with custom section", async () => {
  const rendered = engine.renderDocument(withCustom, "ats-minimal", { paperSize: "A4", pageCountTarget: 1, includePhoto: false });
  const buffer = await engine.renderDocx(rendered);
  assert.ok(buffer.length > 1000, `engine DOCX too small: ${buffer.length}`);
  const extracted = engine.extractDocxText(buffer);
  assert.ok(extracted.text.includes("Sam Sample"), "engine DOCX text missing name");
  const result = parseFileImport(extracted.text);
  assert.equal(result.empty, false);
  assert.equal(result.profile.fullName, "Sam Sample");
  assert.ok(result.profile.experience.length >= 1, "engine DOCX experience missing");
  assert.equal(result.profile.experience[0].employer, "Sample Projects Ltd");
  assert.ok(result.profile.experience[0].bullets.length >= 1, "engine DOCX bullets missing");
  assert.equal(result.profile.education.length, 1);
  assert.equal(result.profile.customSections.length, 1);
  assert.equal(result.profile.customSections[0].title.toLowerCase(), "projects");
  console.log(`  engine DOCX ${buffer.length} bytes, extracted ${extracted.lines.length} lines, unparsed ${result.unparsedLines.length}`);
});

const handLines = [
  "Imported Person",
  "Sample Designer",
  "imported.person@example.test | +00 111 222 333 | Sample Town",
  "Work Experience",
  "Sample Designer at Sample Studio, Sample Town, 2020 to 2023",
  "- Designed sample layouts.",
  "Education",
  "Sample Design Degree, Sample Art School, 2016 to 2020",
  "Skills",
  "Design, Layout, Colour"
];

await asyncCheck("hand written PDF import", async () => {
  const buffer = await pdfBuffer(handLines);
  const extracted = await engine.extractPdfText(buffer);
  const result = parseFileImport(extracted.text);
  assert.equal(result.profile.fullName, "Imported Person");
  assert.equal(result.profile.headline, "Sample Designer");
  assert.equal(result.profile.experience.length, 1);
  assert.equal(result.profile.experience[0].employer, "Sample Studio");
  assert.equal(result.profile.experience[0].jobTitle, "Sample Designer");
  assert.deepEqual(result.profile.skills, ["Design", "Layout", "Colour"]);
  console.log(`  hand PDF ${buffer.length} bytes, extracted ${extracted.lines.length} lines`);
});

await asyncCheck("hand written DOCX import", async () => {
  const buffer = await docxBuffer(handLines);
  const extracted = engine.extractDocxText(buffer);
  const result = parseFileImport(extracted.text);
  assert.equal(result.profile.fullName, "Imported Person");
  assert.equal(result.profile.experience.length, 1);
  assert.equal(result.profile.experience[0].employer, "Sample Studio");
  assert.deepEqual(result.profile.experience[0].bullets, ["Designed sample layouts."]);
  console.log(`  hand DOCX ${buffer.length} bytes, extracted ${extracted.lines.length} lines`);
});

await asyncCheck("scanned or empty PDF handling, no invented content", async () => {
  const buffer = await pdfBuffer([]);
  const extracted = await engine.extractPdfText(buffer);
  assert.equal(extracted.text.trim(), "");
  const result = parseFileImport(extracted.text);
  assert.equal(result.empty, true);
  assert.equal(result.profile.fullName, "");
  assert.equal(result.profile.experience.length, 0);
});

await asyncCheck("job version export, ATS Minimal and Executive", async () => {
  const { createJobVersion } = await import("../lib/builder-core.mjs");
  const master = { profile: sample, settings: { templateId: "ats-minimal", paperSize: "A4", includePhoto: false, sectionOrder: ["summary", "experience", "education", "skills", "languages"] }, label: "Master draft" };
  const version = createJobVersion(master, "Sample Analyst", "Sample Firm Ltd");
  version.settings.templateId = "executive";
  for (const templateId of ["ats-minimal", "executive"]) {
    const rendered = engine.renderDocument(version.profile, templateId, { paperSize: "A4", pageCountTarget: 1, includePhoto: false });
    const pdf = await engine.renderPdf(rendered);
    const docx = await engine.renderDocx(rendered);
    assert.ok(pdf.length > 1000, `version PDF too small for ${templateId}`);
    assert.ok(docx.length > 1000, `version DOCX too small for ${templateId}`);
    console.log(`  version export ${templateId} PDF ${pdf.length} bytes, DOCX ${docx.length} bytes`);
  }
});

console.log(`Total: ${asyncPassed} passed, 0 failed.`);
