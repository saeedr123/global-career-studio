// Auth, profile, and dashboard tests, Phase 2 increment 6.
// Run with plain Node, no build step: node scripts/test-auth.mjs
// Tests auth-core logic only. No database is used, and no account
// created here is a real server account.

import assert from "node:assert";
import {
  createAccount,
  createDocumentId,
  deleteDocument,
  draftFromProfile,
  duplicateDocument,
  isSessionValid,
  listDocuments,
  loadProfileIntoDraft,
  login,
  profileFromDraft,
  renameDocument,
  requestPasswordReset,
  resetPassword,
  saveDraftToProfile,
  seedDocumentsFromBuilder,
  validateLogin,
  validateSignup
} from "../lib/auth-core.mjs";
import { createDefaultSettings, createDraft, createJobVersion, createSampleProfile } from "../lib/builder-core.mjs";

let passed = 0;
function check(label, fn) {
  const result = fn();
  if (result && typeof result.then === "function") {
    return result.then(() => {
      passed += 1;
      console.log(`PASS: ${label}`);
    });
  }
  passed += 1;
  console.log(`PASS: ${label}`);
  return result;
}

check("signup validation reports missing fields, invalid email, short password, mismatch", () => {
  assert.deepEqual(validateSignup({}), ["name", "email", "password"]);
  assert.deepEqual(validateSignup({ name: "Sam", email: "not-an-email", password: "short", confirmPassword: "different" }), ["email", "password", "confirmPassword"]);
  assert.deepEqual(validateSignup({ name: "Sam", email: "sam@example.test", password: "longenough1", confirmPassword: "longenough1" }), []);
});

check("login validation reports invalid email and missing password", () => {
  assert.deepEqual(validateLogin({ email: "bad", password: "" }), ["email", "password"]);
  assert.deepEqual(validateLogin({ email: "sam@example.test", password: "secret123" }), []);
});

let accounts = [];
let created = null;
await check("create account hashes password and never stores plain text", async () => {
  const result = await createAccount(accounts, { name: "Sam Sample", email: "Sam@Example.Test", password: "secret1234", confirmPassword: "secret1234" }, "commercial");
  accounts = result.accounts;
  created = result.account;
  assert.equal(created.email, "sam@example.test");
  assert.equal(created.edition, "commercial");
  assert.ok(!("passwordHash" in created));
  assert.ok(!("salt" in created));
  const stored = accounts[0];
  assert.ok(stored.passwordHash);
  assert.ok(stored.salt);
  assert.notEqual(stored.passwordHash, "secret1234");
  assert.equal(JSON.stringify(accounts).includes("secret1234"), false);
});

await check("duplicate email is rejected, case insensitively", async () => {
  await assert.rejects(
    () => createAccount(accounts, { name: "Other", email: "SAM@example.test", password: "secret1234", confirmPassword: "secret1234" }),
    /already exists/
  );
});

await check("login succeeds with correct password and fails with wrong password", async () => {
  const ok = await login(accounts, "sam@example.test", "secret1234");
  assert.equal(ok.account.email, "sam@example.test");
  assert.ok(ok.session.token);
  assert.equal(isSessionValid(ok.session), true);
  await assert.rejects(() => login(accounts, "sam@example.test", "wrongpassword"), /does not match/);
  await assert.rejects(() => login(accounts, "nobody@example.test", "secret1234"), /No local account/);
});

check("session expiry is checked", () => {
  const expired = { token: "abc", email: "sam@example.test", expiresAt: new Date(Date.now() - 1000).toISOString() };
  assert.equal(isSessionValid(expired), false);
  assert.equal(isSessionValid(null), false);
  assert.equal(isSessionValid({}), false);
});

let resetToken = null;
await check("password reset request, bad token, expired token, and successful reset", async () => {
  const unknown = requestPasswordReset(accounts, "nobody@example.test");
  assert.equal(unknown.found, false);
  assert.equal(unknown.token, null);
  const known = requestPasswordReset(accounts, "sam@example.test");
  assert.equal(known.found, true);
  assert.ok(known.token);
  accounts = known.accounts;
  resetToken = known.token;
  await assert.rejects(() => resetPassword(accounts, "bad-token", "newsecret12", "newsecret12"), /not valid/);
  const expiredAccounts = accounts.map((item) => ({ ...item, resetExpiresAt: new Date(Date.now() - 1000).toISOString() }));
  await assert.rejects(() => resetPassword(expiredAccounts, resetToken, "newsecret12", "newsecret12"), /expired/);
  await assert.rejects(() => resetPassword(accounts, resetToken, "short", "short"), /at least 8/);
  await assert.rejects(() => resetPassword(accounts, resetToken, "newsecret12", "different12"), /do not match/);
  const reset = await resetPassword(accounts, resetToken, "newsecret12", "newsecret12");
  accounts = reset.accounts;
  await assert.rejects(() => login(accounts, "sam@example.test", "secret1234"), /does not match/);
  const after = await login(accounts, "sam@example.test", "newsecret12");
  assert.equal(after.account.email, "sam@example.test");
});

check("profile from draft, draft from profile, and save back confirmation", () => {
  const profile = createSampleProfile();
  const settings = createDefaultSettings();
  const draft = createDraft(profile, settings, "Master draft");
  const loaded = profileFromDraft(draft);
  assert.equal(loaded.fullName, "Sam Sample");
  assert.ok(!("sampleMarker" in loaded));
  const editedDraftProfile = { ...loaded, headline: "Edited headline" };
  const unconfirmed = saveDraftToProfile(loaded, editedDraftProfile, false);
  assert.equal(unconfirmed.headline, "Sample Project Coordinator");
  const confirmed = saveDraftToProfile(loaded, editedDraftProfile, true);
  assert.equal(confirmed.headline, "Edited headline");
  const back = loadProfileIntoDraft(draft, confirmed);
  assert.equal(back.profile.headline, "Edited headline");
  assert.deepEqual(back.settings, settings);
  const fromProfile = draftFromProfile(confirmed, settings);
  assert.equal(fromProfile.profile.headline, "Edited headline");
});

check("dashboard seed lists master and job versions", () => {
  const profile = createSampleProfile();
  const settings = createDefaultSettings();
  const master = createDraft(profile, settings, "Master draft");
  const version = createJobVersion(master, "Sample Analyst", "Sample Firm Ltd");
  const documents = seedDocumentsFromBuilder(master, "Master draft", [version]);
  assert.equal(documents.length, 2);
  assert.ok(documents.some((item) => item.kind === "master" && item.label === "Master draft"));
  assert.ok(documents.some((item) => item.kind === "job" && item.label === "Sample Analyst at Sample Firm Ltd"));
  assert.ok(listDocuments(documents).length === 2);
  assert.ok(createDocumentId().startsWith("doc-"));
});

check("dashboard duplicate creates a copy and leaves the original unchanged", () => {
  const documents = [
    { id: "doc-1", kind: "job", label: "Sample Analyst at Sample Firm Ltd", profile: {}, settings: {}, updatedAt: "2026-01-01T00:00:00.000Z" }
  ];
  const next = duplicateDocument(documents, "doc-1");
  assert.equal(next.length, 2);
  assert.equal(documents.length, 1);
  const copy = next.find((item) => item.id !== "doc-1");
  assert.equal(copy.label, "Sample Analyst at Sample Firm Ltd (copy)");
  assert.throws(() => duplicateDocument(documents, "missing"), /not found/);
});

check("dashboard rename rejects an empty name and changes a valid name", () => {
  const documents = [{ id: "doc-1", kind: "master", label: "Master draft", profile: {}, settings: {}, updatedAt: "2026-01-01T00:00:00.000Z" }];
  assert.throws(() => renameDocument(documents, "doc-1", "   "), /name is required/);
  const renamed = renameDocument(documents, "doc-1", "My Germany CV");
  assert.equal(renamed[0].label, "My Germany CV");
  assert.equal(documents[0].label, "Master draft");
});

check("dashboard delete needs confirmation and then removes only that document", () => {
  const documents = [
    { id: "doc-1", kind: "master", label: "Master draft", profile: {}, settings: {}, updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "doc-2", kind: "job", label: "Job version", profile: {}, settings: {}, updatedAt: "2026-01-02T00:00:00.000Z" }
  ];
  assert.equal(deleteDocument(documents, "doc-2", false).length, 2);
  const removed = deleteDocument(documents, "doc-2", true);
  assert.equal(removed.length, 1);
  assert.equal(removed[0].id, "doc-1");
});

console.log(`Total: ${passed} passed, 0 failed.`);
