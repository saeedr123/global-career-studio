// Billing and entitlement tests, Phase 2 increment 9.
// Plain Node, no browser, database, payment provider, or checkout.
// Tests the billing config module only, plus one real engine export
// for an allowed free export, to prove allowed exports are not broken.

import assert from "node:assert";
import {
  BILLING_NOT_FINAL_NOTE,
  DOWNGRADE_BEHAVIOUR,
  PLANS,
  PRICE_NOTE,
  TRIAL_CONFIG,
  applyTrialExpiry,
  canDownloadExistingDocument,
  canExportDocument,
  canExportLetter,
  canStartTrial,
  canViewDocument,
  cancelLocalSubscription,
  createSubscriptionState,
  downgradeToFree,
  effectivePlan,
  getEntitlements,
  isAdvancedAiAllowed,
  isAdvancedAtsAllowed,
  isExportFormatAllowed,
  isLetterTypeAllowed,
  isTemplateAllowed,
  isTrialActive,
  isWithinTrialAllowance,
  planById,
  startTrial,
  trialEndDate
} from "../lib/billing-core.mjs";
import { createDefaultSettings, createSampleProfile } from "../lib/builder-core.mjs";

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

check("all plans use placeholder prices only, no invented price, currency, or Stripe product id", () => {
  assert.equal(PLANS.length, 3);
  for (const plan of PLANS) {
    assert.equal(plan.price, null, plan.id);
    assert.equal(plan.currency, null, plan.id);
    assert.equal(plan.stripeProductId, null, plan.id);
  }
  assert.ok(PRICE_NOTE.includes("decided later by the owner"));
  assert.ok(BILLING_NOT_FINAL_NOTE.includes("not final"));
});

check("free plan allows free templates and locks premium templates", () => {
  assert.ok(isTemplateAllowed("free", "ats-minimal"));
  assert.ok(isTemplateAllowed("free", "modern-professional"));
  assert.ok(isTemplateAllowed("free", "european"));
  assert.ok(!isTemplateAllowed("free", "executive"));
  assert.ok(!isTemplateAllowed("free", "sidebar"));
  assert.ok(!isTemplateAllowed("free", "two-column"));
  assert.equal(getEntitlements("free").documentLimit, 2);
});

check("free plan allows PDF only, DOCX is a premium export", () => {
  assert.ok(isExportFormatAllowed("free", "pdf"));
  assert.ok(!isExportFormatAllowed("free", "docx"));
  assert.ok(isExportFormatAllowed("premium", "docx"));
  assert.ok(isExportFormatAllowed("trial", "docx"));
});

check("free plan allows cover letters only, premium and trial allow full letter types", () => {
  assert.ok(isLetterTypeAllowed("free", "cover"));
  assert.ok(!isLetterTypeAllowed("free", "motivation"));
  assert.ok(!isLetterTypeAllowed("free", "reference"));
  assert.ok(isLetterTypeAllowed("premium", "motivation"));
  assert.ok(isLetterTypeAllowed("trial", "reference"));
});

check("free plan has basic AI only, premium and trial have advanced AI and advanced ATS", () => {
  assert.ok(!isAdvancedAiAllowed("free"));
  assert.ok(isAdvancedAiAllowed("premium"));
  assert.ok(isAdvancedAiAllowed("trial"));
  assert.ok(!isAdvancedAtsAllowed("free"));
  assert.ok(isAdvancedAtsAllowed("premium"));
  assert.ok(isAdvancedAtsAllowed("trial"));
});

check("viewing a document is never locked, on any plan", () => {
  assert.equal(canViewDocument().allowed, true);
  assert.equal(canDownloadExistingDocument().allowed, true);
  assert.ok(canViewDocument().reason.includes("never locked"));
});

check("downgrade behaviour keeps view and download and locks premium editing, templates, and exports", () => {
  assert.equal(DOWNGRADE_BEHAVIOUR.keepView, true);
  assert.equal(DOWNGRADE_BEHAVIOUR.keepDownload, true);
  assert.equal(DOWNGRADE_BEHAVIOUR.lockPremiumEditing, true);
  assert.equal(DOWNGRADE_BEHAVIOUR.lockPremiumTemplates, true);
  assert.equal(DOWNGRADE_BEHAVIOUR.lockPremiumExports, true);
  assert.equal(DOWNGRADE_BEHAVIOUR.neverLockViewingOwnCv, true);
});

check("trial config starts at 7 days, no card, one trial per account", () => {
  assert.equal(TRIAL_CONFIG.lengthDays, 7);
  assert.equal(TRIAL_CONFIG.cardRequired, false);
  assert.equal(TRIAL_CONFIG.perAccountLimit, 1);
  assert.equal(planById("trial").trialLengthDays, 7);
  assert.equal(planById("trial").trialCardRequired, false);
  assert.equal(planById("trial").trialPerAccountLimit, 1);
});

check("trial plan allows full premium templates, formats, and letters", () => {
  assert.ok(isTemplateAllowed("trial", "sidebar"));
  assert.ok(isTemplateAllowed("trial", "executive"));
  assert.ok(isExportFormatAllowed("trial", "pdf"));
  assert.ok(isExportFormatAllowed("trial", "docx"));
  assert.ok(isLetterTypeAllowed("trial", "personal-statement"));
});

check("trial start sets an end date 7 days after start and is active before that date", () => {
  const state = startTrial(createSubscriptionState("free"), "2026-11-04T00:00:00.000Z");
  assert.equal(state.plan, "trial");
  assert.equal(state.trialCount, 1);
  assert.equal(state.trialEnd, "2026-11-11T00:00:00.000Z");
  assert.equal(trialEndDate("2026-11-04T00:00:00.000Z", 7), "2026-11-11T00:00:00.000Z");
  assert.ok(isTrialActive(state, "2026-11-10T00:00:00.000Z"));
  assert.ok(!isTrialActive(state, "2026-11-12T00:00:00.000Z"));
  assert.equal(effectivePlan(state, "2026-11-10T00:00:00.000Z"), "trial");
});

check("one trial per account is enforced, a second trial start throws", () => {
  const first = startTrial(createSubscriptionState("free"), "2026-11-04T00:00:00.000Z");
  assert.equal(canStartTrial(first), false);
  assert.throws(() => startTrial(first, "2026-11-05T00:00:00.000Z"), /Only one trial is allowed per account/);
  assert.equal(canStartTrial(createSubscriptionState("free")), true);
});

check("trial expiry downgrades to free without locking view", () => {
  const trial = startTrial(createSubscriptionState("free"), "2026-11-04T00:00:00.000Z");
  const after = applyTrialExpiry(trial, "2026-11-12T00:00:00.000Z");
  assert.equal(after.plan, "free");
  assert.equal(after.previousPlan, "trial");
  assert.equal(canViewDocument().allowed, true);
  assert.equal(canDownloadExistingDocument().allowed, true);
  assert.ok(!isTemplateAllowed(after.plan, "sidebar"));
});

check("free cannot export a premium template, even as PDF", () => {
  const result = canExportDocument({ planId: "free", templateId: "sidebar", format: "pdf", existingDocument: false });
  assert.equal(result.allowed, false);
  assert.ok(result.reason.includes("locked"));
});

check("free cannot export a free template as DOCX, a premium format", () => {
  const result = canExportDocument({ planId: "free", templateId: "ats-minimal", format: "docx", existingDocument: false });
  assert.equal(result.allowed, false);
  assert.ok(result.reason.includes("locked"));
});

check("free can export a free template as PDF", () => {
  const result = canExportDocument({ planId: "free", templateId: "ats-minimal", format: "pdf", existingDocument: false });
  assert.equal(result.allowed, true);
});

check("trial can export a premium template as DOCX within allowance", () => {
  const result = canExportDocument({ planId: "trial", templateId: "sidebar", format: "docx", existingDocument: false, exportsUsed: 0 });
  assert.equal(result.allowed, true);
  const letter = canExportLetter({ planId: "trial", format: "docx", existingDocument: false });
  assert.equal(letter.allowed, true);
  const freeLetter = canExportLetter({ planId: "free", format: "docx", existingDocument: false });
  assert.equal(freeLetter.allowed, false);
});

check("trial allowance helper respects a numeric allowance and allows when no allowance is set", () => {
  const trial = startTrial(createSubscriptionState("free"), "2026-11-04T00:00:00.000Z");
  assert.equal(isWithinTrialAllowance(trial, "export"), true);
  const saved = TRIAL_CONFIG.exportAllowance;
  try {
    TRIAL_CONFIG.exportAllowance = 1;
    assert.equal(isWithinTrialAllowance({ ...trial, exportsUsed: 0 }, "export"), true);
    assert.equal(isWithinTrialAllowance({ ...trial, exportsUsed: 1 }, "export"), false);
    assert.equal(canExportDocument({ planId: "trial", templateId: "ats-minimal", format: "pdf", existingDocument: false, exportsUsed: 1 }).allowed, false);
  } finally {
    TRIAL_CONFIG.exportAllowance = saved;
  }
  assert.equal(TRIAL_CONFIG.exportAllowance, null);
});

check("already created premium document stays viewable and downloadable after downgrade", () => {
  const trial = startTrial(createSubscriptionState("free"), "2026-11-04T00:00:00.000Z");
  const downgraded = downgradeToFree(trial);
  assert.equal(downgraded.plan, "free");
  assert.equal(canViewDocument().allowed, true);
  assert.equal(canDownloadExistingDocument().allowed, true);
  const download = canExportDocument({ planId: "free", templateId: "sidebar", format: "docx", existingDocument: true });
  assert.equal(download.allowed, true);
  assert.ok(download.reason.includes("already created"));
  const fresh = canExportDocument({ planId: "free", templateId: "sidebar", format: "docx", existingDocument: false });
  assert.equal(fresh.allowed, false);
});

check("local cancel sets cancelled and access until trial end, with no charge and no provider contact", () => {
  const trial = startTrial(createSubscriptionState("free"), "2026-11-04T00:00:00.000Z");
  const cancelled = cancelLocalSubscription(trial);
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.accessUntil, trial.trialEnd);
  assert.ok(cancelled.cancelNote.includes("No charge was made"));
  assert.ok(cancelled.cancelNote.includes("no payment provider was contacted"));
  assert.equal(effectivePlan(cancelled, "2026-11-10T00:00:00.000Z"), "trial");
  assert.equal(effectivePlan(cancelled, "2026-11-12T00:00:00.000Z"), "free");
  assert.equal(canViewDocument().allowed, true);
});

check("unknown plan falls back to free, and premium also has no invented price", () => {
  assert.equal(planById("unknown-plan").id, "free");
  assert.equal(planById("premium").price, null);
  assert.equal(planById("premium").currency, null);
});

// Allowed free export through the real engine, to prove allowed
// exports are not broken by entitlement wiring.
const engine = await import("../../../packages/template-engine/dist/index.js");
await (async () => {
  const allowed = canExportDocument({ planId: "free", templateId: "ats-minimal", format: "pdf", existingDocument: false });
  assert.equal(allowed.allowed, true);
  const profile = createSampleProfile();
  const settings = createDefaultSettings();
  const rendered = engine.renderDocument(profile, settings.templateId, {
    paperSize: "A4",
    pageCountTarget: 1,
    includePhoto: false,
    sectionOrder: settings.sectionOrder
  });
  const pdf = await engine.renderPdf(rendered);
  assert.ok(pdf.length > 1000, `Free PDF too small: ${pdf.length}`);
  console.log(`PASS: allowed free export renders PDF ${pdf.length} bytes`);
  passed += 1;
})();

console.log(`Total: ${passed} passed, 0 failed.`);
