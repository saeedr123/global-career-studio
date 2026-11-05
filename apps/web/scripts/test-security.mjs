// Security hardening tests, 2026-11-05. Run with plain Node:
//   node scripts/test-security.mjs
// Covers scrypt password hashing with old SHA-256 rows still
// verifying, the admin check for the human help list, the in memory
// rate limiter, and the security headers in next.config.mjs. Uses a
// mocked Prisma client only, no database and no live service. All
// sample data is fictional and marked SAMPLE.
import assert from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createSessionRecord,
  createUserRecord,
  getAdminFromToken,
  hashServerPassword,
  passwordNeedsRehash,
  updateUserPasswordHash,
  verifyServerPassword
} from "../lib/database-core.mjs";
import { checkRateLimit, clientAddress, resetRateLimits } from "../lib/rate-limit-core.mjs";

let passed = 0;
async function check(label, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const read = (file) => readFileSync(path.join(webDir, file), "utf8");

function createMockClient() {
  const store = { users: [], sessions: [] };
  let counter = 0;
  const nextId = (prefix) => `${prefix}-${++counter}`;
  return {
    store,
    user: {
      create: async ({ data }) => {
        const row = { id: nextId("user"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null, ...data };
        store.users.push(row);
        return row;
      },
      findUnique: async ({ where }) =>
        store.users.find((row) => (where.id ? row.id === where.id : row.email === where.email)) || null,
      update: async ({ where, data }) => {
        const row = store.users.find((item) => item.id === where.id);
        Object.assign(row, data);
        return row;
      }
    },
    session: {
      create: async ({ data }) => {
        const row = { id: nextId("session"), createdAt: new Date().toISOString(), revokedAt: null, ...data };
        store.sessions.push(row);
        return row;
      },
      findUnique: async ({ where }) => store.sessions.find((row) => row.tokenHash === where.tokenHash) || null
    }
  };
}

await check("new password hashes use scrypt, verify, and reject a wrong password", () => {
  const { passwordHash } = hashServerPassword("SAMPLE-password-1");
  assert.ok(passwordHash.startsWith("scrypt$16384$8$1$"), "hash is not scrypt");
  assert.equal(passwordHash.split("$").length, 6);
  assert.equal(verifyServerPassword("SAMPLE-password-1", passwordHash), true);
  assert.equal(verifyServerPassword("SAMPLE-password-2", passwordHash), false);
  assert.equal(passwordNeedsRehash(passwordHash), false);
});

await check("two hashes of the same password differ, because each has its own salt", () => {
  const first = hashServerPassword("SAMPLE-password-1").passwordHash;
  const second = hashServerPassword("SAMPLE-password-1").passwordHash;
  assert.notEqual(first, second);
});

await check("old salted SHA-256 rows still verify and are marked for rehash", () => {
  const salt = "a1b2c3d4e5f60718";
  const legacy = `${salt}:${createHash("sha256").update(`${salt}:SAMPLE-password-1`).digest("hex")}`;
  assert.equal(verifyServerPassword("SAMPLE-password-1", legacy), true);
  assert.equal(verifyServerPassword("wrong-password", legacy), false);
  assert.equal(passwordNeedsRehash(legacy), true);
});

await check("old unsalted SHA-256 rows still verify and are marked for rehash", () => {
  const legacy = createHash("sha256").update("SAMPLE-password-1").digest("hex");
  assert.equal(verifyServerPassword("SAMPLE-password-1", legacy), true);
  assert.equal(verifyServerPassword("wrong-password", legacy), false);
  assert.equal(passwordNeedsRehash(legacy), true);
});

await check("malformed stored hashes never verify", () => {
  assert.equal(verifyServerPassword("SAMPLE-password-1", "scrypt$broken"), false);
  assert.equal(verifyServerPassword("SAMPLE-password-1", "scrypt$1$8$1$aa$bb"), false);
  assert.equal(verifyServerPassword("SAMPLE-password-1", "salt:nothex"), false);
  assert.equal(verifyServerPassword("SAMPLE-password-1", ""), false);
});

await check("updateUserPasswordHash replaces an old hash with scrypt", async () => {
  const client = createMockClient();
  const legacy = createHash("sha256").update("SAMPLE-password-1").digest("hex");
  const user = await createUserRecord(client, { name: "Sam Sample", email: "sam.sample@example.test" }, legacy);
  await updateUserPasswordHash(client, user.id, hashServerPassword("SAMPLE-password-1").passwordHash);
  const stored = client.store.users[0].passwordHash;
  assert.ok(stored.startsWith("scrypt$"));
  assert.equal(verifyServerPassword("SAMPLE-password-1", stored), true);
});

await check("getAdminFromToken returns an admin, and null for a normal user or a missing token", async () => {
  const client = createMockClient();
  const admin = await createUserRecord(client, { name: "Ana Admin", email: "ana.admin@example.test", role: "admin" }, hashServerPassword("SAMPLE-password-4").passwordHash);
  const plain = await createUserRecord(client, { name: "Sam Sample", email: "sam.sample@example.test" }, hashServerPassword("SAMPLE-password-1").passwordHash);
  const adminSession = await createSessionRecord(client, admin.id);
  const plainSession = await createSessionRecord(client, plain.id);
  const found = await getAdminFromToken(client, adminSession.token);
  assert.equal(found.id, admin.id);
  assert.equal("passwordHash" in found, false);
  assert.equal(await getAdminFromToken(client, plainSession.token), null);
  assert.equal(await getAdminFromToken(client, ""), null);
  assert.equal(await getAdminFromToken(client, "SAMPLE-unknown-token"), null);
});

await check("human help list route requires an admin session before reading any request", () => {
  const route = read("app/api/human-help/route.ts");
  const getBody = route.slice(route.indexOf("export async function GET"), route.indexOf("export async function POST"));
  assert.ok(getBody.includes("getAdminFromToken"), "GET does not check the admin session");
  assert.ok(getBody.includes("status: 401"), "GET does not answer 401");
  assert.ok(
    getBody.indexOf("getAdminFromToken") < getBody.indexOf("listHumanHelpRequests"),
    "GET reads the requests before the admin check"
  );
  assert.ok(route.includes("checkRateLimit"), "POST has no rate limit");
});

await check("admin page sends the signed in session to the human help list", () => {
  const page = read("app/admin/page.tsx");
  assert.ok(page.includes("serverHeaders(session)"), "admin page does not send the session token");
  assert.ok(page.includes("response.status === 401"), "admin page does not handle 401");
});

await check("auth route rate limits sign in and sign up, and upgrades old hashes on sign in", () => {
  const route = read("app/api/auth/route.ts");
  assert.ok(route.includes("checkRateLimit(`auth:ip:"), "no per address limit");
  assert.ok(route.includes("checkRateLimit(`auth:email:"), "no per email limit");
  assert.ok(route.includes("passwordNeedsRehash"), "no rehash on sign in");
  assert.ok(route.includes("DUMMY_PASSWORD_HASH"), "unknown emails answer faster than known ones");
});

await check("rate limiter allows up to the limit, blocks after, and resets after the window", () => {
  resetRateLimits();
  const start = 1_000_000;
  for (let i = 0; i < 3; i += 1) {
    assert.equal(checkRateLimit("SAMPLE-key", 3, 60_000, start).allowed, true);
  }
  const blocked = checkRateLimit("SAMPLE-key", 3, 60_000, start + 1000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 59);
  assert.equal(checkRateLimit("SAMPLE-other", 3, 60_000, start + 1000).allowed, true);
  assert.equal(checkRateLimit("SAMPLE-key", 3, 60_000, start + 60_000).allowed, true);
});

await check("clientAddress reads the first forwarded address", () => {
  assert.equal(clientAddress(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
  assert.equal(clientAddress(new Headers({ "x-real-ip": "203.0.113.10" })), "203.0.113.10");
  assert.equal(clientAddress(new Headers()), "unknown");
});

await check("next.config.mjs sends frame, sniffing, referrer, and permissions headers, and noindex on /admin", () => {
  const config = read("next.config.mjs");
  for (const header of ["X-Frame-Options", "frame-ancestors 'none'", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Robots-Tag"]) {
    assert.ok(config.includes(header), `missing ${header}`);
  }
});

console.log(`\n${passed} passed, 0 failed`);
