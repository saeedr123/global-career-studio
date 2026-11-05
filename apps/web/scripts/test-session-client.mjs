// Session client tests, Phase 2 increment 15. Run with plain Node:
//   node scripts/test-session-client.mjs
// Tests the browser session helper in lib/session-client.mjs with a
// mocked fetch and a fake storage object only. No real database is
// used, no Neon database is touched, and no DATABASE_URL, password,
// or session token value appears anywhere in this file except as a
// SAMPLE token used only inside the test, which is never logged.
// All sample data here is fictional and marked SAMPLE.

import assert from "node:assert";
import {
  SESSION_KEY,
  checkServerAvailable,
  clearServerSession,
  deleteServerDocument,
  fetchServerDocuments,
  fetchServerProfile,
  readServerSession,
  readSignedInSession,
  saveServerDocument,
  serverLogin,
  serverLogout,
  serverSignup,
  storeServerSession
} from "../lib/session-client.mjs";

let passed = 0;
async function check(label, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

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

function createMockFetch(handler) {
  const calls = [];
  const runFetch = async (path, options) => {
    const call = { path, method: (options && options.method) || "GET", headers: (options && options.headers) || {}, body: (options && options.body) || "" };
    calls.push(call);
    const result = handler(call);
    return {
      status: result.status,
      ok: result.status >= 200 && result.status < 300,
      json: async () => result.body || {}
    };
  };
  runFetch.calls = calls;
  return runFetch;
}

const SAMPLE_TOKEN = "SAMPLE-server-token-1";
const SAMPLE_SESSION = {
  token: SAMPLE_TOKEN,
  email: "sam.sample@example.test",
  accountId: "account-1",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

await check("serverLogin returns the session and the token is stored under gcs-session with mode server", async () => {
  const runFetch = createMockFetch(() => ({
    status: 200,
    body: {
      status: "database",
      account: { id: "account-1", email: "sam.sample@example.test", name: "Sam Sample", edition: "commercial" },
      sessionToken: SAMPLE_TOKEN,
      expiresAt: SAMPLE_SESSION.expiresAt
    }
  }));
  const storage = createFakeStorage();
  const result = await serverLogin(runFetch, { email: "sam.sample@example.test", password: "SAMPLE-password-1" });
  assert.equal(result.sessionToken, SAMPLE_TOKEN);
  const stored = storeServerSession(storage, { token: result.sessionToken, email: result.account.email, accountId: result.account.id, expiresAt: result.expiresAt });
  assert.equal(stored.mode, "server");
  const saved = JSON.parse(storage.store[SESSION_KEY]);
  assert.equal(saved.token, SAMPLE_TOKEN);
  assert.equal(saved.mode, "server");
  const read = readServerSession(storage);
  assert.equal(read.token, SAMPLE_TOKEN);
  assert.equal(read.email, "sam.sample@example.test");
});

await check("Bearer header is sent on server documents and profile calls", async () => {
  const runFetch = createMockFetch((call) => {
    if (call.path.startsWith("/api/documents")) {
      return { status: 200, body: { status: "database", documents: [{ id: "doc-1", title: "SAMPLE document" }] } };
    }
    return { status: 200, body: { status: "database", profile: { fullName: "Sam Sample" } } };
  });
  const documents = await fetchServerDocuments(runFetch, SAMPLE_SESSION);
  assert.equal(documents.length, 1);
  assert.equal(documents[0].id, "doc-1");
  const profile = await fetchServerProfile(runFetch, SAMPLE_SESSION);
  assert.equal(profile.fullName, "Sam Sample");
  for (const call of runFetch.calls) {
    assert.equal(call.headers.Authorization, `Bearer ${SAMPLE_TOKEN}`);
  }
});

await check("501 from the server reports local_only so the caller can fall back to local", async () => {
  const runFetch = createMockFetch(() => ({
    status: 501,
    body: { status: "local_only", message: "Auth is local only here." }
  }));
  await assert.rejects(serverLogin(runFetch, { email: "sam.sample@example.test", password: "SAMPLE-password-1" }), (error) => error.code === "local_only" && error.status === 501);
  const checked = await checkServerAvailable(runFetch);
  assert.equal(checked.available, false);
  assert.equal(checked.status, "local_only");
});

await check("unreachable server reports unreachable and checkServerAvailable returns available false", async () => {
  const failingFetch = async () => {
    throw new Error("network down");
  };
  await assert.rejects(serverLogin(failingFetch, { email: "sam.sample@example.test", password: "SAMPLE-password-1" }), (error) => error.code === "unreachable");
  const checked = await checkServerAvailable(failingFetch);
  assert.equal(checked.available, false);
  assert.equal(checked.status, "unreachable");
});

await check("serverLogout clears the token even when the server call fails", async () => {
  const storage = createFakeStorage();
  storeServerSession(storage, SAMPLE_SESSION);
  assert.equal(readServerSession(storage).token, SAMPLE_TOKEN);
  const failingFetch = async () => {
    throw new Error("network down");
  };
  const result = await serverLogout(failingFetch, storage);
  assert.equal(result.revoked, false);
  assert.equal(storage.store[SESSION_KEY], undefined);
  assert.equal(readServerSession(storage), null);
});

await check("serverLogout calls the logout route with the Bearer token and clears the token", async () => {
  const runFetch = createMockFetch(() => ({ status: 200, body: { status: "database", action: "logout", revoked: true } }));
  const storage = createFakeStorage();
  storeServerSession(storage, SAMPLE_SESSION);
  const result = await serverLogout(runFetch, storage);
  assert.equal(result.revoked, true);
  assert.equal(storage.store[SESSION_KEY], undefined);
  assert.equal(runFetch.calls.length, 1);
  assert.equal(runFetch.calls[0].path, "/api/auth");
  assert.equal(runFetch.calls[0].headers.Authorization, `Bearer ${SAMPLE_TOKEN}`);
  assert.equal(JSON.parse(runFetch.calls[0].body).action, "logout");
});

await check("no token is logged during server login and signup", async () => {
  const runFetch = createMockFetch(() => ({
    status: 200,
    body: {
      status: "database",
      account: { id: "account-1", email: "sam.sample@example.test", name: "Sam Sample", edition: "nvconsult" },
      sessionToken: "SAMPLE-secret-token-xyz",
      expiresAt: SAMPLE_SESSION.expiresAt
    }
  }));
  const captured = [];
  const original = { log: console.log, warn: console.warn, error: console.error, info: console.info, debug: console.debug };
  console.log = (...args) => captured.push(args.join(" "));
  console.warn = (...args) => captured.push(args.join(" "));
  console.error = (...args) => captured.push(args.join(" "));
  console.info = (...args) => captured.push(args.join(" "));
  console.debug = (...args) => captured.push(args.join(" "));
  try {
    await serverLogin(runFetch, { email: "sam.sample@example.test", password: "SAMPLE-password-1" });
    await serverSignup(runFetch, { name: "Sam Sample", email: "sam.sample@example.test", password: "SAMPLE-password-1", confirmPassword: "SAMPLE-password-1", edition: "nvconsult" });
  } finally {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
    console.info = original.info;
    console.debug = original.debug;
  }
  assert.equal(captured.some((line) => line.includes("SAMPLE-secret-token-xyz")), false);
});

await check("serverSignup sends the edition from the caller, never a hard coded edition", async () => {
  const runFetch = createMockFetch(() => ({
    status: 200,
    body: {
      status: "database",
      account: { id: "account-1", email: "sam.sample@example.test", name: "Sam Sample", edition: "nvconsult" },
      sessionToken: SAMPLE_TOKEN,
      expiresAt: SAMPLE_SESSION.expiresAt
    }
  }));
  await serverSignup(runFetch, { name: "Sam Sample", email: "sam.sample@example.test", password: "SAMPLE-password-1", confirmPassword: "SAMPLE-password-1", edition: "nvconsult" });
  const sent = JSON.parse(runFetch.calls[0].body);
  assert.equal(sent.action, "signup");
  assert.equal(sent.edition, "nvconsult");
  await serverSignup(runFetch, { name: "Sam Sample", email: "sam.sample@example.test", password: "SAMPLE-password-1", confirmPassword: "SAMPLE-password-1", edition: "commercial" });
  assert.equal(JSON.parse(runFetch.calls[1].body).edition, "commercial");
});

await check("saveServerDocument posts the draft and returns the created document", async () => {
  const runFetch = createMockFetch(() => ({ status: 201, body: { status: "database", document: { id: "doc-9", title: "SAMPLE draft" } } }));
  const draft = { label: "SAMPLE draft", profile: { fullName: "Sam Sample" }, settings: { templateId: "ats-minimal", paperSize: "A4" } };
  const created = await saveServerDocument(runFetch, SAMPLE_SESSION, draft, "commercial");
  assert.equal(created.id, "doc-9");
  const sent = JSON.parse(runFetch.calls[0].body);
  assert.equal(sent.draft.label, "SAMPLE draft");
  assert.equal(sent.edition, "commercial");
  assert.equal(runFetch.calls[0].headers.Authorization, `Bearer ${SAMPLE_TOKEN}`);
});

await check("deleteServerDocument sends a DELETE with the document id", async () => {
  const runFetch = createMockFetch(() => ({ status: 200, body: { status: "database", deleted: true } }));
  const result = await deleteServerDocument(runFetch, SAMPLE_SESSION, "doc-9");
  assert.equal(result.deleted, true);
  assert.equal(runFetch.calls[0].method, "DELETE");
  assert.equal(runFetch.calls[0].path, "/api/documents");
  assert.equal(JSON.parse(runFetch.calls[0].body).documentId, "doc-9");
});

await check("readServerSession ignores local sessions and expired server sessions", async () => {
  const storage = createFakeStorage();
  storage.setItem(SESSION_KEY, JSON.stringify({ token: SAMPLE_TOKEN, email: "sam.sample@example.test", expiresAt: SAMPLE_SESSION.expiresAt, mode: "local" }));
  assert.equal(readServerSession(storage), null);
  storage.setItem(SESSION_KEY, JSON.stringify({ token: SAMPLE_TOKEN, email: "sam.sample@example.test", expiresAt: new Date(Date.now() - 1000).toISOString(), mode: "server" }));
  assert.equal(readServerSession(storage), null);
  clearServerSession(storage);
  assert.equal(storage.store[SESSION_KEY], undefined);
});

await check("readSignedInSession accepts a server session and a local session", async () => {
  const storage = createFakeStorage();
  storage.setItem(SESSION_KEY, JSON.stringify({ token: SAMPLE_TOKEN, email: "sam.sample@example.test", expiresAt: SAMPLE_SESSION.expiresAt, mode: "server" }));
  assert.equal(readSignedInSession(storage).email, "sam.sample@example.test");
  storage.setItem(SESSION_KEY, JSON.stringify({ token: SAMPLE_TOKEN, email: "sam.sample@example.test", expiresAt: SAMPLE_SESSION.expiresAt, mode: "local" }));
  assert.equal(readSignedInSession(storage).email, "sam.sample@example.test");
});

await check("readSignedInSession rejects expired, incomplete, and malformed sessions", async () => {
  const storage = createFakeStorage();
  storage.setItem(SESSION_KEY, JSON.stringify({ token: SAMPLE_TOKEN, email: "sam.sample@example.test", expiresAt: new Date(Date.now() - 1000).toISOString(), mode: "server" }));
  assert.equal(readSignedInSession(storage), null);
  storage.setItem(SESSION_KEY, JSON.stringify({ email: "sam.sample@example.test", expiresAt: SAMPLE_SESSION.expiresAt, mode: "local" }));
  assert.equal(readSignedInSession(storage), null);
  storage.setItem(SESSION_KEY, "{not json");
  assert.equal(readSignedInSession(storage), null);
  assert.equal(readSignedInSession(null), null);
});

await check("checkServerAvailable is true only when configured and the client is available", async () => {
  const okFetch = createMockFetch(() => ({ status: 200, body: { status: "configured", clientAvailable: true } }));
  assert.equal((await checkServerAvailable(okFetch)).available, true);
  const notReadyFetch = createMockFetch(() => ({ status: 200, body: { status: "client_not_available", clientAvailable: false } }));
  assert.equal((await checkServerAvailable(notReadyFetch)).available, false);
});

console.log(`Total: ${passed} passed, 0 failed.`);
