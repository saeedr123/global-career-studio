// Session and server auth tests, Phase 2 increment 14. Run with
// plain Node:
//   node scripts/test-session.mjs
// Tests the server session functions and server password handling
// in lib/database-core.mjs, plus the local fallback behaviour of
// the auth, profile, and documents API routes, with a mocked
// Prisma client only. No real database is used, no Neon database
// is touched, and no DATABASE_URL value appears anywhere in this
// file. All sample data here is fictional and marked SAMPLE where
// it is sample content, and no real user data is used. Only a
// hash of a session token is ever stored: the plain token is
// returned once, at creation, and the stored row holds the hash.
import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertAdminUser,
  assertOwnsDocument,
  createDocumentRecord,
  createSessionRecord,
  createUserRecord,
  deleteDocumentRecord,
  getDocumentForUser,
  getSessionByToken,
  getSessionUser,
  getUserByEmail,
  hashServerPassword,
  hashSessionToken,
  localDraftToDocumentInput,
  logAdminAction,
  publicSession,
  requireClient,
  revokeAllSessionsForUser,
  revokeSessionRecord,
  sessionExpiryFrom,
  verifyServerPassword
} from "../lib/database-core.mjs";

let passed = 0;
async function check(label, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

const here = path.dirname(fileURLToPath(import.meta.url));

function createMockClient() {
  const store = { users: [], sessions: [], documents: [], audit: [] };
  let counter = 0;
  const nextId = (prefix) => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
  return {
    store,
    user: {
      findUnique: async ({ where }) => {
        if (where.email) {
          return store.users.find((item) => item.email === where.email) || null;
        }
        if (where.id) {
          return store.users.find((item) => item.id === where.id) || null;
        }
        return null;
      },
      create: async ({ data }) => {
        const row = { id: nextId("user"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null, ...data };
        store.users.push(row);
        return row;
      }
    },
    session: {
      create: async ({ data }) => {
        const row = { id: nextId("session"), createdAt: new Date().toISOString(), ...data };
        store.sessions.push(row);
        return row;
      },
      findUnique: async ({ where }) => {
        if (where.tokenHash) {
          return store.sessions.find((item) => item.tokenHash === where.tokenHash) || null;
        }
        return null;
      },
      delete: async ({ where }) => {
        const index = store.sessions.findIndex((item) => item.id === where.id);
        if (index < 0) {
          throw new Error("Session not found.");
        }
        const [removed] = store.sessions.splice(index, 1);
        return removed;
      },
      deleteMany: async ({ where }) => {
        const before = store.sessions.length;
        store.sessions = store.sessions.filter((item) => item.userId !== where.userId);
        return { count: before - store.sessions.length };
      }
    },
    document: {
      create: async ({ data }) => {
        const row = { id: nextId("doc"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null, ...data };
        store.documents.push(row);
        return row;
      },
      findUnique: async ({ where }) => store.documents.find((item) => item.id === where.id) || null,
      update: async ({ where, data }) => {
        const found = store.documents.find((item) => item.id === where.id);
        if (!found) {
          throw new Error("That document was not found.");
        }
        Object.assign(found, data);
        return found;
      }
    },
    adminAuditLog: {
      create: async ({ data }) => {
        const row = { id: nextId("audit"), createdAt: new Date().toISOString(), ...data };
        store.audit.push(row);
        return row;
      }
    }
  };
}

async function createSampleUser(client) {
  const hashed = hashServerPassword("SAMPLE-password-1");
  return createUserRecord(client, { name: "Sam Sample", email: "sam.sample@example.test" }, hashed.passwordHash);
}

await check("hashSessionToken is deterministic, differs per token, and rejects an empty token", async () => {
  const first = hashSessionToken("SAMPLE-token-one");
  assert.equal(first, hashSessionToken("SAMPLE-token-one"));
  assert.notEqual(first, hashSessionToken("SAMPLE-token-two"));
  assert.equal(first.length, 64);
  assert.throws(() => hashSessionToken(""), /session token is required/);
});

await check("session expiry is 24 hours after creation", async () => {
  const now = Date.now();
  const expires = sessionExpiryFrom(now);
  assert.equal(expires.getTime() - now, 24 * 60 * 60 * 1000);
});

await check("hashServerPassword and verifyServerPassword round trip, wrong password fails", async () => {
  const hashed = hashServerPassword("SAMPLE-password-1");
  assert.equal(hashed.passwordHash.includes(":"), true);
  assert.equal(verifyServerPassword("SAMPLE-password-1", hashed.passwordHash), true);
  assert.equal(verifyServerPassword("wrong-password", hashed.passwordHash), false);
  assert.equal(verifyServerPassword("SAMPLE-password-1", ""), false);
  assert.throws(() => hashServerPassword("short"), /at least 8 characters/);
});

await check("createSessionRecord stores only the token hash and returns the plain token once", async () => {
  const client = createMockClient();
  const user = await createSampleUser(client);
  const created = await createSessionRecord(client, user.id);
  assert.equal(typeof created.token, "string");
  assert.equal(created.token.length, 64);
  assert.equal("tokenHash" in created.session, false);
  assert.equal(created.session.userId, user.id);
  const stored = client.store.sessions[0];
  assert.equal(stored.tokenHash, hashSessionToken(created.token));
  assert.equal(stored.tokenHash.includes(created.token), false);
});

await check("createSessionRecord requires a client and a user id", async () => {
  const client = createMockClient();
  await assert.rejects(createSessionRecord(null, "user-1"), /Database is not configured/);
  await assert.rejects(createSessionRecord(client, ""), /user id is required/);
});

await check("getSessionByToken returns the session for a valid token and null for a wrong token", async () => {
  const client = createMockClient();
  const user = await createSampleUser(client);
  const created = await createSessionRecord(client, user.id);
  const found = await getSessionByToken(client, created.token);
  assert.equal(found.userId, user.id);
  assert.equal("tokenHash" in found, false);
  assert.equal(await getSessionByToken(client, "not-a-real-token"), null);
  assert.equal(await getSessionByToken(client, ""), null);
});

await check("getSessionByToken treats an expired session as missing", async () => {
  const client = createMockClient();
  const user = await createSampleUser(client);
  const created = await createSessionRecord(client, user.id);
  client.store.sessions[0].expiresAt = new Date(Date.now() - 1000).toISOString();
  assert.equal(await getSessionByToken(client, created.token), null);
  assert.equal(await getSessionUser(client, created.token), null);
});

await check("getSessionUser returns the public user, never the password hash", async () => {
  const client = createMockClient();
  const user = await createSampleUser(client);
  const created = await createSessionRecord(client, user.id);
  const found = await getSessionUser(client, created.token);
  assert.equal(found.email, "sam.sample@example.test");
  assert.equal("passwordHash" in found, false);
});

await check("revokeSessionRecord revokes once, a second revoke returns false, unknown token returns false", async () => {
  const client = createMockClient();
  const user = await createSampleUser(client);
  const created = await createSessionRecord(client, user.id);
  assert.equal(await revokeSessionRecord(client, created.token), true);
  assert.equal(await getSessionByToken(client, created.token), null);
  assert.equal(await revokeSessionRecord(client, created.token), false);
  assert.equal(await revokeSessionRecord(client, "not-a-real-token"), false);
  assert.equal(await revokeSessionRecord(client, ""), false);
});

await check("revokeAllSessionsForUser revokes only that user sessions", async () => {
  const client = createMockClient();
  const first = await createSampleUser(client);
  const second = await createUserRecord(client, { name: "Pat Sample", email: "pat.sample@example.test" }, hashServerPassword("SAMPLE-password-2").passwordHash);
  await createSessionRecord(client, first.id);
  await createSessionRecord(client, first.id);
  await createSessionRecord(client, second.id);
  assert.equal(await revokeAllSessionsForUser(client, first.id), 2);
  assert.equal(client.store.sessions.length, 1);
  assert.equal(client.store.sessions[0].userId, second.id);
  assert.equal(await revokeAllSessionsForUser(client, ""), 0);
});

await check("publicSession strips the token hash and keeps the rest", async () => {
  const cleaned = publicSession({ id: "session-1", userId: "user-1", tokenHash: "SAMPLE-hash", expiresAt: "2026-11-06T00:00:00.000Z" });
  assert.equal(cleaned.userId, "user-1");
  assert.equal("tokenHash" in cleaned, false);
  assert.equal(publicSession(null), null);
});

await check("duplicate email is rejected, case insensitively, on the server path", async () => {
  const client = createMockClient();
  await createSampleUser(client);
  await assert.rejects(
    createUserRecord(client, { name: "Sam Sample", email: "SAM.SAMPLE@example.test" }, hashServerPassword("SAMPLE-password-3").passwordHash),
    /already exists/
  );
  const found = await getUserByEmail(client, "SAM.SAMPLE@example.test");
  assert.equal(found.email, "sam.sample@example.test");
  assert.equal("passwordHash" in found, false);
});

await check("ownership checks block another user from reading a document", async () => {
  const client = createMockClient();
  const owner = await createSampleUser(client);
  const created = await createDocumentRecord(client, { userId: owner.id, documentType: "cv" });
  const found = await getDocumentForUser(client, owner.id, created.id);
  assert.equal(found.id, created.id);
  await assert.rejects(getDocumentForUser(client, "user-99", created.id), /different user/);
  assert.throws(() => assertOwnsDocument("user-99", { id: created.id, userId: owner.id }), /different user/);
});

await check("assertAdminUser passes only for a real admin user from the database", async () => {
  const client = createMockClient();
  const admin = await createUserRecord(client, { name: "Ana Admin", email: "ana.admin@example.test", role: "admin" }, hashServerPassword("SAMPLE-password-4").passwordHash);
  const checked = await assertAdminUser(client, admin.id);
  assert.equal(checked.role, "admin");
  assert.equal("passwordHash" in checked, false);
  const plain = await createSampleUser(client);
  await assert.rejects(assertAdminUser(client, plain.id), /Admin access requires/);
  await assert.rejects(assertAdminUser(client, "user-99"), /Admin access requires/);
  await assert.rejects(assertAdminUser(null, admin.id), /Database is not configured/);
});

await check("logAdminAction through the database needs admin and reason and sanitises the audit row", async () => {
  const client = createMockClient();
  const admin = await createUserRecord(client, { name: "Ana Admin", email: "ana.admin@example.test", role: "admin" }, hashServerPassword("SAMPLE-password-5").passwordHash);
  const entry = await logAdminAction(client, admin, "view", "Document", "doc-1", "Support check for sam.sample@example.test");
  assert.equal(entry.adminUserId, admin.id);
  assert.equal(entry.reason.includes("sam.sample@example.test"), false);
  assert.equal(client.store.audit.length, 1);
});

await check("deleteDocumentRecord soft deletes only a document owned by the caller", async () => {
  const client = createMockClient();
  const owner = await createSampleUser(client);
  const other = await createUserRecord(client, { name: "Ollie Other", email: "ollie.other@example.test" }, hashServerPassword("SAMPLE-password-6").passwordHash);
  const created = await createDocumentRecord(client, localDraftToDocumentInput({ label: "SAMPLE document", profile: {}, settings: { templateId: "ats-minimal" } }, owner.id, "commercial"));
  const missing = await deleteDocumentRecord(client, owner.id, "doc-does-not-exist");
  assert.equal(missing.deleted, false);
  await assert.rejects(deleteDocumentRecord(client, other.id, created.id), /different user/);
  const deleted = await deleteDocumentRecord(client, owner.id, created.id);
  assert.equal(deleted.deleted, true);
  assert.notEqual(client.store.documents[0].deletedAt, null);
});

await check("local fallback: session and document functions throw plainly with no client", async () => {
  await assert.rejects(createSessionRecord(null, "user-1"), /Database is not configured/);
  await assert.rejects(getSessionByToken(null, "SAMPLE-token"), /Database is not configured/);
  await assert.rejects(revokeSessionRecord(null, "SAMPLE-token"), /Database is not configured/);
  assert.throws(() => requireClient(null), /Database is not configured/);
});

await check("auth, profile, and documents routes keep a local only 501 fallback and contain no connection string value", async () => {
  for (const route of ["auth", "profile", "documents"]) {
    const text = readFileSync(path.resolve(here, "..", "app", "api", route, "route.ts"), "utf8");
    assert.equal(text.includes("local_only"), true, `${route} route must keep the local only fallback`);
    assert.equal(text.includes("501"), true, `${route} route must answer 501 when no database is available`);
    assert.equal(text.includes("postgresql://"), false, `${route} route must not contain a connection string value`);
  }
  const core = readFileSync(path.resolve(here, "..", "lib", "database-core.mjs"), "utf8");
  assert.equal(core.includes("postgresql://"), false);
  const documentsRoute = readFileSync(path.resolve(here, "..", "app", "api", "documents", "route.ts"), "utf8");
  assert.equal(documentsRoute.includes("export async function DELETE"), true, "documents route must offer DELETE for a server document");
  assert.equal(documentsRoute.includes("deleteDocumentRecord"), true, "documents DELETE must use the data layer delete");
  assert.equal(core.includes("export async function deleteDocumentRecord"), true, "data layer must offer a document delete");
});

console.log(`Total: ${passed} passed, 0 failed.`);
