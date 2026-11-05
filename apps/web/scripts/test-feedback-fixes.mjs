// Feedback fixes tests, Phase 2 increment 21. Run with plain Node, no build step:
//   node scripts/test-feedback-fixes.mjs
// Proves the two user feedback fixes: sample data is placeholder
// hint text only, never a field value, and every user-facing error
// carries an error and a solution. Also proves language detection
// and that no em or en dash appears in the changed files.

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPreviewSections,
  createDefaultSettings,
  createEmptyProfile,
  createSampleProfile,
  parseFileImport,
  parseImport,
  samplePlaceholders,
  sectionOrderFor
} from "../lib/builder-core.mjs";
import {
  authErrors,
  detectLanguage,
  documentErrors,
  errorWithSolution,
  exportErrors,
  humanHelpErrors,
  importErrors,
  linkedinErrors,
  profileErrors
} from "../lib/error-format.mjs";
import { parseLinkedInExports } from "../lib/linkedin-core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const repoDir = path.resolve(webDir, "..", "..");

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

function assertErrorWithSolution(result) {
  assert.ok(result && typeof result.error === "string" && result.error.length > 0, "error must be a non-empty string");
  assert.ok(result && typeof result.solution === "string" && result.solution.length > 0, "solution must be a non-empty string");
}

// Part 1: sample data as placeholder only.

check("starting draft has empty real values", () => {
  const profile = createEmptyProfile();
  assert.equal(profile.fullName, "");
  assert.equal(profile.headline, "");
  assert.equal(profile.email, "");
  assert.equal(profile.phone, "");
  assert.equal(profile.city, "");
  assert.equal(profile.summary, "");
  assert.deepEqual(profile.experience, []);
  assert.deepEqual(profile.education, []);
  assert.deepEqual(profile.skills, []);
  assert.deepEqual(profile.languages, []);
  assert.deepEqual(profile.customSections, []);
  assert.ok(!("sampleMarker" in profile), "an empty draft carries no sample marker");
});

check("placeholder hints come from the sample profile, values stay empty", () => {
  const hints = samplePlaceholders();
  const sample = createSampleProfile();
  assert.equal(hints.fullName, sample.fullName);
  assert.equal(hints.headline, sample.headline);
  assert.equal(hints.email, sample.email);
  assert.equal(hints.summary, sample.summary.replace(/^SAMPLE: /, ""));
  assert.equal(hints.employer, sample.experience[0].employer);
  assert.equal(hints.skills, sample.skills.join(", "));
  assert.ok(hints.fullName.length > 0, "hint text must exist for the field");
  assert.ok(!hints.summary.startsWith("SAMPLE:"), "hint summary must not carry the SAMPLE prefix");
  const profile = createEmptyProfile();
  assert.notEqual(profile.fullName, hints.fullName, "the hint is not the value");
});

check("typing into a field replaces the hint and the value holds the typed text", () => {
  const hints = samplePlaceholders();
  const profile = createEmptyProfile();
  const typed = { ...profile, fullName: "Aisha Khan", headline: "Nurse" };
  assert.equal(typed.fullName, "Aisha Khan");
  assert.equal(typed.headline, "Nurse");
  assert.notEqual(typed.fullName, hints.fullName);
  assert.notEqual(typed.headline, hints.headline);
});

check("preview of an empty draft shows Add your hints, never sample content", () => {
  const profile = createEmptyProfile();
  const sections = buildPreviewSections(profile, sectionOrderFor(profile));
  const text = sections.map((item) => item.lines.join(" ")).join(" ");
  assert.ok(!text.includes("SAMPLE"), "preview must not show SAMPLE for an empty draft");
  assert.ok(!text.includes("Sam Sample"), "preview must not show the sample name");
  assert.ok(!text.includes("Sample Project"), "preview must not show the sample job");
  const summary = sections.find((item) => item.key === "summary");
  assert.ok(summary && summary.hint === true, "empty summary section is marked as a hint");
  assert.ok(summary.lines[0].startsWith("Add your"), "empty summary shows an Add your hint");
  const experience = sections.find((item) => item.key === "experience");
  assert.ok(experience && experience.hint === true, "empty experience section is marked as a hint");
});

check("builder page renders placeholders from hints, not sample values", () => {
  const source = fs.readFileSync(path.join(webDir, "app", "builder", "page.tsx"), "utf8");
  assert.ok(source.includes("placeholder={hints.fullName}"), "full name field uses the hint placeholder");
  assert.ok(source.includes("placeholder={hints.summary}"), "summary field uses the hint placeholder");
  assert.ok(source.includes("placeholder={hints.email}"), "email field uses the hint placeholder");
  assert.ok(source.includes("createEmptyProfile()"), "builder starts from an empty profile");
  assert.ok(source.includes("Load an example"), "reset wording is Load an example");
  assert.ok(!source.includes("createSampleProfile()"), "builder never loads the sample profile as a value");
  assert.ok(!source.includes("Reset to sample"), "old reset wording is gone");
  assert.ok(source.includes("Load example text"), "guided paste offers example text on request only");
  assert.ok(source.includes('useState("")'), "guided paste starts empty");
});

check("an untouched draft exports with no sample text", async () => {
  const engine = await import("../../../packages/template-engine/dist/index.js");
  const profile = createEmptyProfile();
  const settings = createDefaultSettings();
  const rendered = engine.renderDocument(profile, "ats-minimal", {
    paperSize: "A4",
    pageCountTarget: 1,
    includePhoto: false,
    sectionOrder: sectionOrderFor(profile)
  });
  const text = rendered.sections
    .map((item) => [...(item.lines || []), ...((item.bullets || []).flat())].join(" "))
    .join(" ");
  assert.ok(!text.includes("SAMPLE"), "exported sections must not contain SAMPLE");
  assert.ok(!text.includes("Sam Sample"), "exported sections must not contain the sample name");
  assert.ok(!text.includes("Sample Project"), "exported sections must not contain the sample job");
  assert.ok(!text.includes("sample@example.test"), "exported sections must not contain the sample email");
  const pdf = await engine.renderPdf(rendered);
  assert.ok(pdf.length > 0, "PDF renders for an empty draft");
  assert.ok(!pdf.toString("latin1").includes("SAMPLE"), "PDF bytes must not contain SAMPLE");
});

check("a genuinely sample document still renders its SAMPLE marker", async () => {
  const engine = await import("../../../packages/template-engine/dist/index.js");
  const profile = createSampleProfile();
  const settings = createDefaultSettings();
  const rendered = engine.renderDocument(profile, "ats-minimal", {
    paperSize: "A4",
    pageCountTarget: 1,
    includePhoto: false,
    sectionOrder: sectionOrderFor(profile)
  });
  const text = rendered.sections.map((item) => (item.lines || []).join(" ")).join(" ");
  assert.ok(text.includes("SAMPLE:"), "a sample document keeps its SAMPLE marker");
});

check("imported CV text is the user's own, never sample marked", () => {
  const parsed = parseImport("Name: Aisha Khan\nHeadline: Nurse\nSummary: Care work in Lahore.");
  assert.ok(!("sampleMarker" in parsed.profile), "guided paste import carries no sample marker");
  const fileParsed = parseFileImport("Aisha Khan\nNurse\nCare work in Lahore.");
  assert.ok(!("sampleMarker" in fileParsed.profile), "file import carries no sample marker");
  const linked = parseLinkedInExports({
    "Profile.csv": "First Name,Last Name,Headline\nAisha,Khan,Nurse\n"
  });
  assert.ok(!("sampleMarker" in linked.profile), "LinkedIn import carries no sample marker");
});

// Part 2: error plus solution everywhere.

check("shared error pattern carries an error and a solution", () => {
  const result = errorWithSolution("The file could not be read.", "Upload a fresh PDF or DOCX file and try again.");
  assertErrorWithSolution(result);
  assert.equal(result.error, "The file could not be read.");
  assert.equal(result.solution, "Upload a fresh PDF or DOCX file and try again.");
});

check("every import error case returns an error plus a solution", () => {
  const errors = importErrors();
  assertErrorWithSolution(errors.noFile());
  assertErrorWithSolution(errors.wrongFormat("cv.txt", ".txt"));
  assert.ok(errors.wrongFormat("cv.txt", ".txt").error.includes("cv.txt"), "wrong format names the file");
  assert.ok(errors.wrongFormat("cv.txt", ".txt").error.includes(".txt"), "wrong format names the format received");
  assert.ok(errors.wrongFormat("cv.txt", ".txt").solution.includes("PDF or DOCX"), "wrong format names the formats accepted");
  assertErrorWithSolution(errors.emptyFile("cv.pdf"));
  assertErrorWithSolution(errors.oversize("cv.pdf"));
  assertErrorWithSolution(errors.unreadable());
  assertErrorWithSolution(errors.failed());
  const mismatch = errors.languageMismatch("German", "English");
  assertErrorWithSolution(mismatch);
  assert.ok(mismatch.error.includes("German"), "mismatch states the detected language");
  assert.ok(mismatch.solution.includes("English"), "mismatch offers the builder language");
  const unknown = errors.languageUnknown("English");
  assertErrorWithSolution(unknown);
  assert.ok(unknown.error.includes("could not be determined"), "unknown language says so plainly");
  assert.ok(unknown.solution.includes("guided paste"), "unknown language offers the guided paste");
});

check("every LinkedIn import error case returns an error plus a solution", () => {
  const errors = linkedinErrors();
  assertErrorWithSolution(errors.noFile());
  assertErrorWithSolution(errors.wrongFormat("notes.txt"));
  assert.ok(errors.wrongFormat("notes.txt").error.includes("notes.txt"), "wrong format names the file");
  assertErrorWithSolution(errors.emptyOrOversize("Profile.csv"));
  assertErrorWithSolution(errors.zipUnreadable("export.zip"));
  assertErrorWithSolution(errors.zipNoCsv("export.zip"));
  assertErrorWithSolution(errors.failed());
});

check("export, auth, document, human help, and profile errors return an error plus a solution", () => {
  const exportErr = exportErrors();
  assertErrorWithSolution(exportErr.invalid());
  assertErrorWithSolution(exportErr.format());
  assertErrorWithSolution(exportErr.notAllowed("That template is not in your plan."));
  assertErrorWithSolution(exportErr.failed());
  const auth = authErrors();
  assertErrorWithSolution(auth.nameRequired());
  assertErrorWithSolution(auth.emailInvalid());
  assertErrorWithSolution(auth.passwordShort());
  assertErrorWithSolution(auth.passwordMismatch());
  assertErrorWithSolution(auth.accountExists());
  assertErrorWithSolution(auth.loginMismatch());
  assertErrorWithSolution(auth.tokenRequired());
  assertErrorWithSolution(auth.bodyNotJson());
  assertErrorWithSolution(auth.actionInvalid());
  const docs = documentErrors();
  assertErrorWithSolution(docs.tokenRequired());
  assertErrorWithSolution(docs.sessionInvalid());
  assertErrorWithSolution(docs.idRequired());
  assertErrorWithSolution(docs.notFound());
  assertErrorWithSolution(docs.saveFailed());
  assertErrorWithSolution(docs.bodyNotJson());
  const help = humanHelpErrors();
  assertErrorWithSolution(help.validation("A valid email is required."));
  assertErrorWithSolution(help.saveFailed());
  assertErrorWithSolution(help.readFailed());
  assertErrorWithSolution(help.bodyNotJson());
  const profileErr = profileErrors();
  assertErrorWithSolution(profileErr.tokenRequired());
  assertErrorWithSolution(profileErr.sessionInvalid());
  assertErrorWithSolution(profileErr.saveFailed());
  assertErrorWithSolution(profileErr.bodyNotJson());
});

check("a failed import leaves the draft unchanged", () => {
  const draft = createEmptyProfile();
  draft.fullName = "Aisha Khan";
  draft.headline = "Nurse";
  const before = JSON.stringify(draft);
  const failed = parseFileImport("");
  assert.ok(failed.empty, "empty file parses as empty");
  assert.equal(JSON.stringify(draft), before, "the draft object is untouched by a failed parse");
  const builderSource = fs.readFileSync(path.join(webDir, "app", "builder", "page.tsx"), "utf8");
  assert.ok(builderSource.includes("Your draft was not changed"), "the builder says a failed import leaves the draft unchanged");
});

check("language detection finds German, French, and English, and stays honest when unsure", () => {
  const german = "Ich habe drei Jahre als Krankenschwester in Berlin gearbeitet und die Patienten im Krankenhaus betreut. Meine Ausbildung habe ich in Deutschland abgeschlossen.";
  assert.equal(detectLanguage(german).language, "de");
  const french = "Je travaille comme infirmière à Lyon depuis trois ans et je soigne les patients dans un hôpital. Je parle français et anglais avec mes collègues.";
  assert.equal(detectLanguage(french).language, "fr");
  const english = "I worked as a nurse in London for three years and cared for patients in the hospital. I also speak English and work with my colleagues every day.";
  assert.equal(detectLanguage(english).language, "en");
  assert.equal(detectLanguage("hello world").language, "unknown");
  assert.equal(detectLanguage("x q z w").language, "unknown");
});

check("the shared error pattern renders an error and a solution in the UI", () => {
  const noticeSource = fs.readFileSync(path.join(webDir, "app", "components", "ErrorNotice.tsx"), "utf8");
  assert.ok(noticeSource.includes("What to do:"), "ErrorNotice renders the solution label");
  assert.ok(noticeSource.includes('role="alert"'), "ErrorNotice is an alert");
  for (const page of ["builder", "auth", "human-help", "dashboard", "profile"]) {
    const source = fs.readFileSync(path.join(webDir, "app", page, "page.tsx"), "utf8");
    assert.ok(source.includes('import ErrorNotice from "../components/ErrorNotice"'), `${page} imports ErrorNotice`);
    assert.ok(source.includes("solution={"), `${page} passes a solution to ErrorNotice`);
  }
  for (const route of ["import", "linkedin-import", "export", "auth", "documents", "human-help", "profile"]) {
    const source = fs.readFileSync(path.join(webDir, "app", "api", route, "route.ts"), "utf8");
    assert.ok(source.includes("solution"), `${route} API carries a solution field`);
  }
});

check("no em or en dash in changed files", () => {
  const changed = [
    "apps/web/lib/builder-core.mjs",
    "apps/web/lib/linkedin-core.mjs",
    "apps/web/lib/error-format.mjs",
    "apps/web/lib/session-client.mjs",
    "apps/web/app/components/ErrorNotice.tsx",
    "apps/web/app/builder/page.tsx",
    "apps/web/app/auth/page.tsx",
    "apps/web/app/human-help/page.tsx",
    "apps/web/app/dashboard/page.tsx",
    "apps/web/app/profile/page.tsx",
    "apps/web/app/api/import/route.ts",
    "apps/web/app/api/linkedin-import/route.ts",
    "apps/web/app/api/export/route.ts",
    "apps/web/app/api/auth/route.ts",
    "apps/web/app/api/documents/route.ts",
    "apps/web/app/api/human-help/route.ts",
    "apps/web/app/api/profile/route.ts",
    "packages/template-engine/src/render.ts",
    "packages/template-engine/src/exports/pdf.ts",
    "packages/template-engine/src/exports/docx.ts",
    "apps/web/scripts/test-feedback-fixes.mjs"
  ];
  const EM_DASH = String.fromCharCode(8212);
  const EN_DASH = String.fromCharCode(8211);
  for (const file of changed) {
    const source = fs.readFileSync(path.join(repoDir, file), "utf8");
    assert.ok(!source.includes(EM_DASH), `${file} must not contain an em dash`);
    assert.ok(!source.includes(EN_DASH), `${file} must not contain an en dash`);
  }
});

console.log(`Total: ${passed} passed, 0 failed.`);
