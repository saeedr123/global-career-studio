// Auth simplification tests, Phase 2 increment 17. Run with plain Node:
//   node scripts/test-auth-simplified.mjs
// Checks that the account page offers one email flow only, with no
// choice between account types and no split wording in user-facing
// copy, that the sign-in gate still accepts both a stored account
// session and an existing browser session, and that no Google button
// exists yet. Reads source files and runs the session helper with a
// fake storage object only. No real database is used, no Neon
// database is touched, and no password or session token value
// appears anywhere in this file except as a SAMPLE token used only
// inside the test, which is never logged.

import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSignedInSession, storeServerSession } from "../lib/session-client.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");

let passed = 0;
async function check(label, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

function read(relative) {
  return readFileSync(path.join(webDir, relative), "utf8");
}

// User-facing copy only: comment lines are stripped first, so an
// internal code comment that names the fallback does not trip a
// check. The banned phrases are the account split wording, not the
// internal function and variable names in the code.
function publicCopy(relative) {
  return read(relative)
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const bannedPhrases = [
  "server account",
  "local account",
  "local browser account",
  "syncs across devices",
  "Use a server",
  "Use a local",
  "Now using",
  "Signed in on the server",
  "Signed in locally",
  "Save to server",
  "server document",
  "on the server"
];

const sweptPages = [
  "app/auth/page.tsx",
  "app/dashboard/page.tsx",
  "app/profile/page.tsx",
  "app/builder/page.tsx",
  "app/components/RequireAuth.tsx",
  "app/subscription/page.tsx"
];

await check("no swept page shows the account split wording", () => {
  const bad = [];
  for (const file of sweptPages) {
    const copy = publicCopy(file);
    for (const phrase of bannedPhrases) {
      if (copy.toLowerCase().includes(phrase.toLowerCase())) {
        bad.push(`${file}: ${phrase}`);
      }
    }
  }
  assert.deepStrictEqual(bad, [], `split wording found: ${bad.join("; ")}`);
});

await check("auth page has no account type switch", () => {
  const page = publicCopy("app/auth/page.tsx");
  assert.ok(!page.includes("accountMode"), "auth page still has an account mode switch");
  assert.ok(!page.includes("sessionMode"), "auth page still labels the session type");
  assert.ok(!page.includes("Use a server account"), "auth page still offers a server account");
  assert.ok(!page.includes("Use a local browser account instead"), "auth page still offers a local browser account");
});

await check("auth page offers one email flow only", () => {
  const page = publicCopy("app/auth/page.tsx");
  assert.ok(page.includes("Create account"), "auth page has no Create account button");
  assert.ok(page.includes("Sign in"), "auth page has no Sign in button");
  assert.ok(page.includes("Create your account with your email address"), "auth page does not describe the email flow");
  assert.ok(page.includes("Password, at least 8 characters"), "auth page does not state the password rule");
});

await check("auth page has no Google button yet", () => {
  const page = publicCopy("app/auth/page.tsx");
  assert.ok(!page.toLowerCase().includes("google"), "auth page mentions Google before the Google step");
});

await check("forgot password says no reset email is sent and points to help", () => {
  const page = publicCopy("app/auth/page.tsx");
  assert.ok(page.includes("Password reset by email is not set up yet"), "forgot password does not say reset is not set up");
  assert.ok(page.includes("No reset email is sent"), "forgot password does not say no reset email is sent");
  assert.ok(page.includes("free consultation"), "forgot password does not point to the free consultation");
  assert.ok(!page.includes("reset token"), "forgot password still shows a reset token");
});

await check("auth page keeps the browser fallback silent", () => {
  const page = publicCopy("app/auth/page.tsx");
  assert.ok(page.includes("Your drafts are saved in this browser"), "auth page does not explain the browser fallback in plain terms");
  assert.ok(!page.toLowerCase().includes("local only"), "auth page still says local only in public copy");
});

function createFakeStorage() {
  const store = {};
  return {
    store,
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
}

const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

await check("gate accepts a stored account session", () => {
  const storage = createFakeStorage();
  storeServerSession(storage, {
    token: "SAMPLE-token",
    email: "sample@example.test",
    accountId: "sample-account",
    expiresAt: futureExpiry
  });
  const session = readSignedInSession(storage);
  assert.ok(session, "stored account session was not accepted");
  assert.strictEqual(session.email, "sample@example.test");
});

await check("gate accepts an existing browser session", () => {
  const storage = createFakeStorage();
  storage.setItem(
    "gcs-session",
    JSON.stringify({ token: "SAMPLE-token", email: "sample@example.test", expiresAt: futureExpiry, mode: "local" })
  );
  const session = readSignedInSession(storage);
  assert.ok(session, "existing browser session was not accepted");
  assert.strictEqual(session.email, "sample@example.test");
});

await check("gate rejects an expired session and a malformed session", () => {
  const storage = createFakeStorage();
  storage.setItem(
    "gcs-session",
    JSON.stringify({ token: "SAMPLE-token", email: "sample@example.test", expiresAt: new Date(Date.now() - 1000).toISOString(), mode: "server" })
  );
  assert.strictEqual(readSignedInSession(storage), null, "expired session was accepted");
  storage.setItem("gcs-session", "not json");
  assert.strictEqual(readSignedInSession(storage), null, "malformed session was accepted");
});

await check("changed files contain no em dash or en dash", () => {
  const changedFiles = [
    "app/auth/page.tsx",
    "app/dashboard/page.tsx",
    "app/profile/page.tsx",
    "app/builder/page.tsx",
    "app/components/RequireAuth.tsx",
    "app/subscription/page.tsx",
    "lib/config.ts",
    "scripts/test-auth-simplified.mjs"
  ];
  const bad = [];
  for (const file of changedFiles) {
    const text = read(file);
    if (text.includes("\u2014") || text.includes("\u2013")) {
      bad.push(file);
    }
  }
  assert.deepStrictEqual(bad, [], `em or en dash in: ${bad.join(", ")}`);
});

console.log(`${passed} passed, 0 failed`);
