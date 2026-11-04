// Admin tests, Phase 2 increment 10. Run with plain Node:
//   node scripts/test-admin.mjs
// Tests aggregated counts with no CV content leaked, version publish
// and rollback, feature flag on and off, and audit log entries with
// no secrets. All data here is fictional and marked SAMPLE where it
// is sample content, and no real user data is used.

import assert from "node:assert";
import {
  CONFIG_KINDS,
  FEATURE_FLAG_KEYS,
  aggregateCounts,
  appendAuditLog,
  createAuditLog,
  createFeatureFlags,
  createVersionedConfig,
  previewConfig,
  publishConfig,
  rollbackConfig,
  setFeatureFlag
} from "../lib/admin-core.mjs";

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

const sampleDocuments = [
  {
    settings: { templateId: "ats-minimal", countryPackId: "germany" },
    profile: { fullName: "Sam Sample", email: "sam.sample@example.test", summary: "SAMPLE secret summary text that must never appear in counts." },
    secretToken: "SAMPLE token value that must never appear in counts"
  },
  {
    settings: { templateId: "ats-minimal", countryPackId: "germany" },
    profile: { fullName: "Alex Sample", email: "alex.sample@example.test", summary: "SAMPLE second summary text." }
  },
  {
    settings: { templateId: "european", countryPackId: "us" },
    profile: { fullName: "Jo Sample", email: "jo.sample@example.test", summary: "SAMPLE third summary text." }
  },
  { settings: {} }
];

check("aggregated counts by template, country pack, and plan", () => {
  const counts = aggregateCounts(sampleDocuments, "free");
  assert.equal(counts.total, 4);
  assert.equal(counts.byTemplate["ats-minimal"], 2);
  assert.equal(counts.byTemplate.european, 1);
  assert.equal(counts.byTemplate.unknown, 1);
  assert.equal(counts.byCountryPack.germany, 2);
  assert.equal(counts.byCountryPack.us, 1);
  assert.equal(counts.byCountryPack["not recorded"], 1);
  assert.equal(counts.byPlan.free, 4);
});

check("aggregated counts leak no CV content, names, emails, or secrets", () => {
  const counts = aggregateCounts(sampleDocuments, "free");
  const text = JSON.stringify(counts);
  assert.ok(!text.includes("Sam Sample"));
  assert.ok(!text.includes("sam.sample@example.test"));
  assert.ok(!text.includes("secret summary text"));
  assert.ok(!text.includes("token value"));
  assert.ok(!text.includes("SAMPLE"));
});

check("aggregated counts handle an empty list and no plan", () => {
  const counts = aggregateCounts([], "");
  assert.equal(counts.total, 0);
  assert.equal(counts.byPlan["not recorded"], 0);
});

check("config kinds are templates, prompts, and country packs", () => {
  assert.deepEqual([...CONFIG_KINDS].sort(), ["countryPacks", "prompts", "templates"]);
});

check("version publish sets the published version", () => {
  let store = createVersionedConfig();
  store = publishConfig(store, "templates", "1.0", "First local version.", "Initial local setup");
  assert.equal(store.templates.published.version, "1.0");
  assert.equal(store.templates.history.length, 0);
});

check("second publish keeps the first version in history", () => {
  let store = createVersionedConfig();
  store = publishConfig(store, "prompts", "1.0", "First local version.", "Initial local setup");
  store = publishConfig(store, "prompts", "1.1", "Second local version.", "Weekly local review");
  assert.equal(store.prompts.published.version, "1.1");
  assert.equal(store.prompts.history.length, 1);
  assert.equal(store.prompts.history[0].version, "1.0");
});

check("preview does not change the published version", () => {
  let store = createVersionedConfig();
  store = publishConfig(store, "countryPacks", "1.0", "First local version.", "Initial local setup");
  store = previewConfig(store, "countryPacks", "1.1", "Draft preview only.", "Preview before publish");
  assert.equal(store.countryPacks.published.version, "1.0");
  assert.equal(store.countryPacks.preview.version, "1.1");
});

check("rollback restores the earlier published version", () => {
  let store = createVersionedConfig();
  store = publishConfig(store, "templates", "1.0", "First local version.", "Initial local setup");
  store = publishConfig(store, "templates", "1.1", "Second local version.", "Weekly local review");
  store = rollbackConfig(store, "templates", "Second version had a local wording error");
  assert.equal(store.templates.published.version, "1.0");
  assert.equal(store.templates.preview, null);
});

check("rollback with no earlier version throws", () => {
  const store = createVersionedConfig();
  assert.throws(() => rollbackConfig(store, "templates", "No earlier version exists"), /No earlier published version/);
});

check("publish without a reason throws", () => {
  const store = createVersionedConfig();
  assert.throws(() => publishConfig(store, "templates", "1.0", "No reason given.", ""), /reason is required/);
});

check("publish with an unknown kind throws", () => {
  const store = createVersionedConfig();
  assert.throws(() => publishConfig(store, "unknown-kind", "1.0", "Bad kind.", "Testing"), /Unknown config kind/);
});

check("feature flags cover writer, letters, ATS, packs, and onboarding", () => {
  assert.deepEqual([...FEATURE_FLAG_KEYS].sort(), ["ats", "letters", "onboarding", "packs", "writer"]);
  const flags = createFeatureFlags();
  assert.equal(flags.writer, true);
  assert.equal(flags.letters, true);
  assert.equal(flags.ats, true);
  assert.equal(flags.packs, true);
  assert.equal(flags.onboarding, true);
});

check("feature flag turns off and back on", () => {
  let flags = createFeatureFlags();
  flags = setFeatureFlag(flags, "writer", false, "Writer hidden for local review");
  assert.equal(flags.writer, false);
  flags = setFeatureFlag(flags, "writer", true, "Writer restored after local review");
  assert.equal(flags.writer, true);
});

check("feature flag change without a reason throws", () => {
  const flags = createFeatureFlags();
  assert.throws(() => setFeatureFlag(flags, "ats", false, ""), /reason is required/);
});

check("unknown feature flag throws", () => {
  const flags = createFeatureFlags();
  assert.throws(() => setFeatureFlag(flags, "unknown-flag", false, "Testing"), /Unknown feature flag/);
});

check("audit log entry records action, time, and reason", () => {
  let log = createAuditLog();
  log = appendAuditLog(log, "publish templates", "Weekly local review", "Published version 1.1.", "2026-11-04T23:00:00.000Z");
  assert.equal(log.length, 1);
  assert.equal(log[0].action, "publish templates");
  assert.equal(log[0].time, "2026-11-04T23:00:00.000Z");
  assert.equal(log[0].reason, "Weekly local review");
  assert.equal(log[0].summary, "Published version 1.1.");
});

check("audit log entry without a reason throws", () => {
  const log = createAuditLog();
  assert.throws(() => appendAuditLog(log, "publish templates", "", "No reason."), /reason is required/);
});

check("audit log sanitises emails and secret style values in the summary", () => {
  let log = createAuditLog();
  log = appendAuditLog(
    log,
    "preview prompts",
    "Local review",
    "Contact sam.sample@example.test about token: SAMPLE-secret-value-123"
  );
  const text = JSON.stringify(log[0]);
  assert.ok(!text.includes("sam.sample@example.test"));
  assert.ok(!text.includes("SAMPLE-secret-value-123"));
  assert.ok(text.includes("[removed]"));
});

check("audit log keeps entries in order", () => {
  let log = createAuditLog();
  log = appendAuditLog(log, "preview templates", "First local review", "Previewed version 1.1.", "2026-11-04T23:00:00.000Z");
  log = appendAuditLog(log, "publish templates", "Second local review", "Published version 1.1.", "2026-11-04T23:01:00.000Z");
  assert.equal(log.length, 2);
  assert.equal(log[0].action, "preview templates");
  assert.equal(log[1].action, "publish templates");
});

console.log(`Total: ${passed} passed, 0 failed.`);
