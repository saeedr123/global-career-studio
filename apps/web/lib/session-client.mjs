// Client session helper, Phase 2 increment 15.
// Talks to the server auth, profile, and documents API routes from
// the browser, and keeps the local browser fallback working when the
// server is not available. The server session token is stored in
// localStorage under gcs-session, as an object with mode "server",
// and is sent back only as an Authorization Bearer header. The
// token is never logged, never displayed, and never stored anywhere
// else. No password is ever stored here. Storage and fetch are
// injected so the logic can be tested with fakes: pages pass
// window.localStorage and the global fetch, tests pass mocks.
// A 501 from the server means local only, and is reported as an
// error with code "local_only" so the caller can fall back to the
// local auth in lib/auth-core.mjs and say so plainly. A network
// failure is reported as code "unreachable".

export const SESSION_KEY = "gcs-session";
export const DATABASE_STATUS_PATH = "/api/database-status";
export const AUTH_PATH = "/api/auth";
export const PROFILE_PATH = "/api/profile";
export const DOCUMENTS_PATH = "/api/documents";

function fail(message, code, status, solution) {
  const error = new Error(message);
  error.code = code || "server_error";
  if (status) {
    error.status = status;
  }
  if (solution) {
    error.solution = solution;
  }
  return error;
}

function defaultFetch() {
  return globalThis.fetch;
}

async function callJson(fetchImpl, path, options) {
  const runFetch = fetchImpl || defaultFetch();
  let response;
  try {
    response = await runFetch(path, options);
  } catch {
    throw fail("The server could not be reached. Your work stays in this browser.", "unreachable");
  }
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (response.status === 501) {
    throw fail(
      data.message || "The server is not available here, so this stays local.",
      "local_only",
      501
    );
  }
  if (!response.ok) {
    throw fail(
      data.error || "The server request failed.",
      "server_error",
      response.status,
      data.solution || ""
    );
  }
  return data;
}

export async function checkServerAvailable(fetchImpl) {
  try {
    const data = await callJson(fetchImpl, DATABASE_STATUS_PATH, { method: "GET" });
    const available = data.status === "configured" && data.clientAvailable === true;
    return { available, status: data.status || "unknown", message: data.message || "" };
  } catch (error) {
    if (error.code === "local_only" || error.code === "unreachable") {
      return { available: false, status: error.code, message: error.message };
    }
    return { available: false, status: "unknown", message: error.message || "The server status could not be read." };
  }
}

export function storeServerSession(storage, session) {
  if (!storage || !session || !session.token) {
    throw new Error("A session token is required to store a server session.");
  }
  const stored = {
    token: session.token,
    email: session.email || "",
    accountId: session.accountId || "",
    expiresAt: session.expiresAt || "",
    mode: "server"
  };
  storage.setItem(SESSION_KEY, JSON.stringify(stored));
  return stored;
}

export function readServerSession(storage) {
  if (!storage) {
    return null;
  }
  let stored = null;
  try {
    stored = JSON.parse(storage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
  if (!stored || stored.mode !== "server" || !stored.token || !stored.email || !stored.expiresAt) {
    return null;
  }
  if (new Date(stored.expiresAt).getTime() <= Date.now()) {
    return null;
  }
  return stored;
}

export function readSignedInSession(storage) {
  if (!storage) {
    return null;
  }
  let stored = null;
  try {
    stored = JSON.parse(storage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
  if (!stored || !stored.token || !stored.email || !stored.expiresAt) {
    return null;
  }
  if (new Date(stored.expiresAt).getTime() <= Date.now()) {
    return null;
  }
  return stored;
}

export function clearServerSession(storage) {
  if (!storage) {
    return;
  }
  storage.removeItem(SESSION_KEY);
}

export function serverHeaders(session) {
  if (!session || !session.token) {
    throw new Error("A server session is required.");
  }
  return { Authorization: `Bearer ${session.token}` };
}

export async function serverSignup(fetchImpl, input) {
  const data = input || {};
  const result = await callJson(fetchImpl, AUTH_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "signup",
      name: data.name || "",
      email: data.email || "",
      password: data.password || "",
      confirmPassword: data.confirmPassword || "",
      edition: data.edition === "nvconsult" ? "nvconsult" : "commercial"
    })
  });
  if (!result.sessionToken || !result.account) {
    throw fail("The server signup did not return a session.", "server_error");
  }
  return { account: result.account, sessionToken: result.sessionToken, expiresAt: result.expiresAt || "" };
}

export async function serverLogin(fetchImpl, input) {
  const data = input || {};
  const result = await callJson(fetchImpl, AUTH_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email: data.email || "", password: data.password || "" })
  });
  if (!result.sessionToken || !result.account) {
    throw fail("The server login did not return a session.", "server_error");
  }
  return { account: result.account, sessionToken: result.sessionToken, expiresAt: result.expiresAt || "" };
}

export async function serverLogout(fetchImpl, storage) {
  const session = readServerSession(storage);
  clearServerSession(storage);
  if (!session) {
    return { revoked: false };
  }
  try {
    const result = await callJson(fetchImpl, AUTH_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...serverHeaders(session) },
      body: JSON.stringify({ action: "logout" })
    });
    return { revoked: result.revoked === true };
  } catch {
    return { revoked: false };
  }
}

export async function fetchServerDocuments(fetchImpl, session, edition) {
  const query = edition === "nvconsult" || edition === "commercial" ? `?edition=${edition}` : "";
  const result = await callJson(fetchImpl, `${DOCUMENTS_PATH}${query}`, {
    method: "GET",
    headers: serverHeaders(session)
  });
  return Array.isArray(result.documents) ? result.documents : [];
}

export async function saveServerDocument(fetchImpl, session, draft, edition) {
  const result = await callJson(fetchImpl, DOCUMENTS_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...serverHeaders(session) },
    body: JSON.stringify({
      draft: draft || {},
      edition: edition === "nvconsult" ? "nvconsult" : "commercial"
    })
  });
  if (!result.document) {
    throw fail("The server did not return a saved document.", "server_error");
  }
  return result.document;
}

export async function deleteServerDocument(fetchImpl, session, documentId) {
  if (!documentId) {
    throw new Error("A document id is required.");
  }
  const result = await callJson(fetchImpl, DOCUMENTS_PATH, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...serverHeaders(session) },
    body: JSON.stringify({ documentId: String(documentId) })
  });
  return { deleted: result.deleted === true };
}

export async function fetchServerProfile(fetchImpl, session) {
  const result = await callJson(fetchImpl, PROFILE_PATH, {
    method: "GET",
    headers: serverHeaders(session)
  });
  return result.profile || null;
}

export async function saveServerProfile(fetchImpl, session, profile) {
  const result = await callJson(fetchImpl, PROFILE_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...serverHeaders(session) },
    body: JSON.stringify({ profile: profile || {} })
  });
  return { profileId: result.profileId || "" };
}
