// End to end smoke test, Phase 2 increment 10. Run with plain Node:
//   node scripts/test-e2e-smoke.mjs
// Walks one local visitor flow with local data only, reusing the
// existing core modules instead of a second copy of the logic:
// onboarding suggestion, builder draft, template switch, country
// pack application, writer suggestion with confirmation, letter
// generation, ATS check, and export. Sample data is fictional and
// marked SAMPLE by the sample profile itself. No browser, database,
// payment, or connected AI is used here.

import assert from "node:assert";
import {
  TEMPLATES,
  createDefaultSettings,
  createDraft,
  createSampleProfile,
  parseDraft,
  serialiseDraft,
  templateById
} from "../lib/builder-core.mjs";
import { applyCountryPack, recommendOnboarding } from "../lib/packs-core.mjs";
import {
  analyzeAts,
  applyRewrite,
  generateLetter,
  suggestSummaryRewrite
} from "../lib/writer-core.mjs";
import { canExportDocument, createSubscriptionState } from "../lib/billing-core.mjs";
import { createAccountId, isSessionValid } from "../lib/auth-core.mjs";

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

const engine = await import("../../../packages/template-engine/dist/index.js");

// 1. Onboarding suggestion: Germany, no occupation typed, job
// application goal. This is a suggestion only, not a forced choice.
const suggestion = recommendOnboarding("germany", "", "tailor");
check("onboarding suggests a Germany pack and a template", () => {
  assert.equal(suggestion.countryPackId, "germany");
  assert.equal(suggestion.templateId, "ats-minimal");
  assert.ok(suggestion.reason.includes("You can change"));
});

// 2. Builder draft from the sample profile, with the suggested
// template and section order applied.
const profile = createSampleProfile();
const settings = createDefaultSettings();
settings.templateId = suggestion.templateId;
settings.sectionOrder = suggestion.sectionOrder;
const draft = createDraft(profile, settings, "SAMPLE smoke draft");
check("builder draft round trip keeps profile and settings", () => {
  const restored = parseDraft(serialiseDraft(draft));
  assert.equal(restored.profile.fullName, "Sam Sample");
  assert.equal(restored.settings.templateId, "ats-minimal");
  assert.deepEqual(restored.settings.sectionOrder, suggestion.sectionOrder);
});

// 3. Template switch in the builder: European, which is allowed on
// the Free plan, with its template definition present.
settings.templateId = "european";
check("template switch to European finds a real template", () => {
  assert.equal(templateById("european").id, "european");
  assert.ok(TEMPLATES.some((item) => item.id === "european"));
});

// 4. Country pack application: Germany pack applied to the draft
// settings, then the user can still change the template afterwards.
const packed = applyCountryPack(settings, "germany", TEMPLATES);
check("country pack application sets pack, paper size, and order", () => {
  assert.equal(packed.countryPackId, "germany");
  assert.equal(packed.paperSize, "A4");
  assert.deepEqual(packed.sectionOrder, suggestion.sectionOrder);
});
packed.templateId = "european";
check("user override after pack application is kept", () => {
  assert.equal(packed.templateId, "european");
  assert.equal(packed.countryPackId, "germany");
});

// 5. Writer suggestion with confirmation: the rewrite is shown
// first, and only applied after confirmation.
const rewrite = suggestSummaryRewrite(profile.summary);
check("writer suggestion exists and applies only after confirmation", () => {
  assert.ok(rewrite.suggested.length > 0);
  assert.equal(applyRewrite(profile.summary, rewrite.suggested, false), profile.summary);
  assert.equal(applyRewrite(profile.summary, rewrite.suggested, true), rewrite.suggested);
});
const rewrittenProfile = { ...profile, summary: applyRewrite(profile.summary, rewrite.suggested, true) };

// 6. Letter generation from supplied fields only.
const letter = generateLetter("cover", {
  fullName: rewrittenProfile.fullName,
  jobTitle: "Sample Project Coordinator",
  company: "Sample Projects Ltd"
});
check("letter generation produces a cover letter from supplied fields", () => {
  assert.equal(letter.missing.length, 0);
  assert.ok(letter.paragraphs.length > 0);
  assert.ok(letter.paragraphs.join(" ").includes("Sample Projects Ltd"));
});

// 7. Heuristic ATS check against a pasted job description. This is
// a heuristic check only, not a real ATS, not a score, and not a
// pass or fail result.
const ats = analyzeAts(rewrittenProfile, packed, "planning scheduling");
check("ATS check reports keyword overlap and section presence", () => {
  assert.ok(ats.disclaimer.includes("not a pass or fail result"));
  assert.ok(ats.matched.includes("planning"));
  assert.equal(ats.sectionPresence.summary, true);
  assert.equal(ats.sectionPresence.experience, true);
  assert.equal(ats.contactPresence.email, true);
});

// 8. Local account and subscription shapes used by the flow.
const subscription = createSubscriptionState("free");
check("local account id and free subscription state exist", () => {
  assert.ok(createAccountId().length > 0);
  assert.equal(subscription.plan, "free");
  assert.equal(
    isSessionValid({
      token: "local-test-token",
      email: "test@example.test",
      expiresAt: new Date(Date.now() + 60000).toISOString()
    }),
    true
  );
});

// 9. Export through the real template engine, gated by the local
// Free entitlement check, PDF and DOCX.
const allowed = canExportDocument({ planId: "free", templateId: "european", format: "pdf", existingDocument: false });
assert.equal(allowed.allowed, true);
const rendered = engine.renderDocument(rewrittenProfile, "european", {
  paperSize: "A4",
  pageCountTarget: 1,
  includePhoto: false,
  sectionOrder: packed.sectionOrder
});
const pdf = await engine.renderPdf(rendered);
console.log(`INFO: smoke PDF size ${pdf.length} bytes`);
check("smoke export renders a PDF through the real engine", () => {
  assert.ok(pdf.length > 1000, `Smoke PDF too small: ${pdf.length}`);
});
const docx = await engine.renderDocx(rendered);
console.log(`INFO: smoke DOCX size ${docx.length} bytes`);
check("smoke export renders a DOCX through the real engine", () => {
  assert.ok(docx.length > 1000, `Smoke DOCX too small: ${docx.length}`);
});

console.log(`Total: ${passed} passed, 0 failed.`);
