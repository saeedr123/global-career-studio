// Auth, profile, and dashboard core, Phase 2 increment 6.
// Pure logic with no browser or database dependency, except for the
// Web Crypto API used for password hashing, which is available in
// modern browsers and in Node 24 as globalThis.crypto.subtle.
// This is a modular auth service: the storage adapter is the caller.
// In this increment the adapter is browser localStorage, clearly
// labelled local and temporary. A future Prisma adapter will
// implement the same account and session shapes, so switching to a
// real database is a data layer change, not a UI rewrite.
// No database is connected in this increment. Do not present local
// accounts as real server accounts, and never store a plain password.

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function validateSignup(input) {
  const errors = [];
  const data = input || {};
  if (!data.name || !String(data.name).trim()) {
    errors.push("name");
  }
  if (!isValidEmail(data.email)) {
    errors.push("email");
  }
  if (!data.password || String(data.password).length < MIN_PASSWORD_LENGTH) {
    errors.push("password");
  }
  if (data.password !== data.confirmPassword) {
    errors.push("confirmPassword");
  }
  return errors;
}

export function validateLogin(input) {
  const errors = [];
  const data = input || {};
  if (!isValidEmail(data.email)) {
    errors.push("email");
  }
  if (!data.password) {
    errors.push("password");
  }
  return errors;
}

function toHex(bytes) {
  return Array.from(bytes).map((item) => item.toString(16).padStart(2, "0")).join("");
}

function randomHex(length) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashPassword(password, salt) {
  const useSalt = salt || randomHex(16);
  const encoder = new TextEncoder();
  const data = encoder.encode(`${useSalt}:${String(password)}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return { salt: useSalt, passwordHash: toHex(new Uint8Array(digest)) };
}

export async function verifyPassword(password, account) {
  if (!account || !account.salt || !account.passwordHash) {
    return false;
  }
  const result = await hashPassword(password, account.salt);
  return result.passwordHash === account.passwordHash;
}

export function publicAccount(account) {
  if (!account) {
    return null;
  }
  const { passwordHash, salt, resetToken, resetExpiresAt, ...rest } = account;
  return rest;
}

export function createAccountId() {
  return `account-${Date.now().toString(36)}-${randomHex(4)}`;
}

export async function createAccount(accounts, input, edition) {
  const errors = validateSignup(input);
  if (errors.length > 0) {
    throw new Error(`Signup is missing or invalid: ${errors.join(", ")}.`);
  }
  const email = normaliseEmail(input.email);
  const existing = (accounts || []).find((item) => normaliseEmail(item.email) === email);
  if (existing) {
    throw new Error("An account with this email already exists locally.");
  }
  const hashed = await hashPassword(input.password);
  const account = {
    id: createAccountId(),
    name: String(input.name).trim(),
    email,
    edition: edition === "nvconsult" ? "nvconsult" : "commercial",
    salt: hashed.salt,
    passwordHash: hashed.passwordHash,
    createdAt: new Date().toISOString(),
    resetToken: null,
    resetExpiresAt: null
  };
  return { accounts: [...(accounts || []), account], account: publicAccount(account) };
}

export async function login(accounts, email, password) {
  const errors = validateLogin({ email, password });
  if (errors.length > 0) {
    throw new Error(`Login is missing or invalid: ${errors.join(", ")}.`);
  }
  const found = (accounts || []).find((item) => normaliseEmail(item.email) === normaliseEmail(email));
  if (!found) {
    throw new Error("No local account was found for this email.");
  }
  const ok = await verifyPassword(password, found);
  if (!ok) {
    throw new Error("The password does not match this local account.");
  }
  const session = {
    token: randomHex(32),
    email: found.email,
    accountId: found.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  return { account: publicAccount(found), session };
}

export function isSessionValid(session) {
  if (!session || !session.token || !session.email || !session.expiresAt) {
    return false;
  }
  return new Date(session.expiresAt).getTime() > Date.now();
}

export function requestPasswordReset(accounts, email) {
  const found = (accounts || []).find((item) => normaliseEmail(item.email) === normaliseEmail(email));
  if (!found) {
    return { accounts: accounts || [], token: null, found: false };
  }
  const token = randomHex(24);
  const updated = (accounts || []).map((item) =>
    item.id === found.id
      ? { ...item, resetToken: token, resetExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() }
      : item
  );
  return { accounts: updated, token, found: true };
}

export async function resetPassword(accounts, token, password, confirmPassword) {
  if (!token) {
    throw new Error("A reset token is required.");
  }
  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    throw new Error("The new password must be at least 8 characters.");
  }
  if (password !== confirmPassword) {
    throw new Error("The new passwords do not match.");
  }
  const found = (accounts || []).find((item) => item.resetToken === token);
  if (!found) {
    throw new Error("This reset token is not valid.");
  }
  if (!found.resetExpiresAt || new Date(found.resetExpiresAt).getTime() <= Date.now()) {
    throw new Error("This reset token has expired.");
  }
  const hashed = await hashPassword(password);
  const updated = (accounts || []).map((item) =>
    item.id === found.id
      ? { ...item, salt: hashed.salt, passwordHash: hashed.passwordHash, resetToken: null, resetExpiresAt: null }
      : item
  );
  return { accounts: updated, account: publicAccount(found) };
}

// Profile handling. One profile per account in this design. A profile
// uses the same fields as a builder draft profile, so profile reuse
// is a copy, not a new format. Editing a document must not silently
// change the master profile: saveDraftToProfile returns the old
// profile unchanged unless confirmed is true.
export function createEmptyProfile() {
  return {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    city: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
    customSections: []
  };
}

export function profileFromDraft(draft) {
  if (!draft || !draft.profile) {
    return createEmptyProfile();
  }
  const profile = JSON.parse(JSON.stringify(draft.profile));
  delete profile.sampleMarker;
  return profile;
}

export function draftFromProfile(profile, settings) {
  return {
    label: "Draft from profile",
    savedAt: new Date().toISOString(),
    profile: JSON.parse(JSON.stringify(profile || createEmptyProfile())),
    settings: JSON.parse(JSON.stringify(settings || {}))
  };
}

export function saveDraftToProfile(currentProfile, draftProfile, confirmed) {
  if (!confirmed) {
    return JSON.parse(JSON.stringify(currentProfile || createEmptyProfile()));
  }
  const next = JSON.parse(JSON.stringify(draftProfile || createEmptyProfile()));
  delete next.sampleMarker;
  return next;
}

export function loadProfileIntoDraft(draft, profile) {
  if (!draft) {
    return null;
  }
  return {
    ...draft,
    profile: JSON.parse(JSON.stringify(profile || createEmptyProfile())),
    savedAt: new Date().toISOString()
  };
}

// Dashboard document list. Documents are plain objects with an id, a
// label, a kind (master or job), a profile, and settings. This list
// is the dashboard view of local drafts and job versions. It does not
// replace the builder draft keys; the dashboard page seeds it from
// those keys on first load, and opening a document writes it back
// to the builder draft for editing.
export function createDocumentId() {
  return `doc-${Date.now().toString(36)}-${randomHex(4)}`;
}

export function listDocuments(documents) {
  const list = [...(documents || [])];
  list.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return list;
}

export function duplicateDocument(documents, id) {
  const found = (documents || []).find((item) => item.id === id);
  if (!found) {
    throw new Error("That document was not found in the local list.");
  }
  const copy = JSON.parse(JSON.stringify(found));
  copy.id = createDocumentId();
  copy.label = `${found.label} (copy)`;
  copy.updatedAt = new Date().toISOString();
  return [...(documents || []), copy];
}

export function renameDocument(documents, id, newLabel) {
  const clean = String(newLabel || "").trim();
  if (!clean) {
    throw new Error("A document name is required.");
  }
  const found = (documents || []).find((item) => item.id === id);
  if (!found) {
    throw new Error("That document was not found in the local list.");
  }
  return (documents || []).map((item) => (item.id === id ? { ...item, label: clean } : item));
}

export function deleteDocument(documents, id, confirmed) {
  if (!confirmed) {
    return [...(documents || [])];
  }
  return (documents || []).filter((item) => item.id !== id);
}

export function seedDocumentsFromBuilder(masterDraft, masterLabel, jobVersions) {
  const documents = [];
  if (masterDraft && masterDraft.profile) {
    documents.push({
      id: "master",
      kind: "master",
      label: masterLabel || "Master draft",
      profile: JSON.parse(JSON.stringify(masterDraft.profile)),
      settings: JSON.parse(JSON.stringify(masterDraft.settings || {})),
      updatedAt: masterDraft.savedAt || new Date().toISOString()
    });
  }
  for (const version of jobVersions || []) {
    documents.push({
      id: version.id || createDocumentId(),
      kind: "job",
      label: version.label || "Job version",
      jobTitle: version.jobTitle || "",
      company: version.company || "",
      profile: JSON.parse(JSON.stringify(version.profile || {})),
      settings: JSON.parse(JSON.stringify(version.settings || {})),
      updatedAt: version.createdAt || new Date().toISOString()
    });
  }
  return listDocuments(documents);
}
