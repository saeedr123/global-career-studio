// Server side data layer, Phase 2 increment 13, extended in
// increment 14 with server sessions and server password handling.
// Ready for Neon, the chosen hosted Postgres, free plan, region AWS
// EU Central Frankfurt (eu-central-1). See docs/database-design.md.
// The live Neon database has the initial migration applied, 33
// public tables, migration 20261105000000_init, User rows 0.
// The Session table from increment 14 is NOT applied to the live
// database yet: it needs the owner to run the manual Neon migrate
// deploy workflow on GitHub once, after this increment is pushed.
// Until then the session functions below throw the plain database
// not configured error through requireClient, or the session table
// error from the database, and callers keep the local browser
// fallback working, clearly labelled.
// Every function that talks to the database takes the Prisma client
// as its first argument, so tests can pass a mocked client and no
// test ever touches a real database. When the client is null, the
// function throws a plain database not configured error, and the
// caller must keep the local browser fallback working, clearly
// labelled. Nothing here silently falls back, and nothing here
// invents a value: a missing field stays missing, and a period
// string from a local draft is never converted into a start or end
// date, because that date would be invented.
// Shapes match prisma/schema.prisma: User, Profile and profile
// detail rows, Document, DocumentSection, DocumentVersion, and
// AdminAuditLog. Passwords are never returned: publicUser strips
// passwordHash, and no function returns it. Audit entries never
// contain CV text, names, emails, or secrets.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { COUNTRY_PACKS } from "./packs-core.mjs";

export const EDITIONS = ["nvconsult", "commercial"];

// Server sessions live 24 hours, the same length as the local
// browser session in lib/auth-core.mjs.
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export const DOCUMENT_TYPES = [
  "cv",
  "coverLetter",
  "motivationLetter",
  "otherLetter",
  "linkedinAbout",
  "bio",
  "personalStatement"
];

export const PAPER_SIZES = ["A4", "US_LETTER"];

export function isValidEdition(value) {
  return EDITIONS.includes(value);
}

export function isValidDocumentType(value) {
  return DOCUMENT_TYPES.includes(value);
}

export function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function requireClient(client) {
  if (!client) {
    throw new Error(
      "Database is not configured. No Prisma client is available, so this server action cannot run. The app keeps using local browser storage until a database is connected."
    );
  }
  return client;
}

export function publicUser(user) {
  if (!user) {
    return null;
  }
  const { passwordHash, ...rest } = user;
  return rest;
}

export function requireAdmin(user) {
  if (!user || user.role !== "admin") {
    throw new Error("Admin access requires a signed in admin user. Local browser admin is not a secured production admin.");
  }
  return true;
}

// Real admin auth groundwork, wired to the database. Loads the
// user from the database by id, checks the admin role, and returns
// the public user, never the password hash. Until a real admin user
// exists in the database, this throws, and the admin page stays
// clearly labelled not a secured production admin.
export async function assertAdminUser(client, userId) {
  requireClient(client);
  const user = await getUserById(client, userId);
  requireAdmin(user);
  return user;
}

export function assertOwnsDocument(userId, document) {
  if (!document) {
    throw new Error("That document was not found.");
  }
  if (document.userId !== userId) {
    throw new Error("That document belongs to a different user.");
  }
  return true;
}

export function sanitiseAuditText(text) {
  let clean = String(text || "");
  clean = clean.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[removed]");
  clean = clean.replace(/(password|token|secret|apiKey|api_key)\s*[:=]\s*\S+/gi, "$1 [removed]");
  return clean;
}

export async function createUserRecord(client, input, passwordHash) {
  requireClient(client);
  const data = input || {};
  if (!data.name || !String(data.name).trim()) {
    throw new Error("A name is required.");
  }
  if (!isValidEmail(data.email)) {
    throw new Error("A valid email is required.");
  }
  if (!passwordHash || !String(passwordHash).trim()) {
    throw new Error("A password hash is required. A plain password is never stored.");
  }
  const email = normaliseEmail(data.email);
  const edition = isValidEdition(data.edition) ? data.edition : "commercial";
  const existing = await client.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const created = await client.user.create({
    data: {
      email,
      name: String(data.name).trim(),
      passwordHash: String(passwordHash),
      role: data.role === "admin" ? "admin" : "user",
      edition
    }
  });
  return publicUser(created);
}

export async function getUserByEmail(client, email) {
  requireClient(client);
  if (!isValidEmail(email)) {
    return null;
  }
  const found = await client.user.findUnique({ where: { email: normaliseEmail(email) } });
  return publicUser(found);
}

export async function getUserById(client, id) {
  requireClient(client);
  if (!id) {
    return null;
  }
  const found = await client.user.findUnique({ where: { id: String(id) } });
  return publicUser(found);
}

// Server password handling, hardened 2026-11-05. New passwords are
// stored with scrypt, a slow, memory hard key derivation function
// built into Node, in the form "scrypt$N$r$p$salt$hash". A single
// SHA-256 round, used before, is fast enough to brute force if the
// database ever leaked, so it is only accepted for old rows: the
// "salt:hash" form and a bare unsalted hex hash still verify, so no
// earlier account is locked out, and passwordNeedsRehash tells the
// login route to replace such a row with scrypt on the next
// successful sign in. Every comparison is constant time.
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

function scryptHex(password, salt, n, r, p) {
  return scryptSync(String(password), salt, SCRYPT_KEYLEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }).toString("hex");
}

function sameHex(a, b) {
  const left = Buffer.from(String(a), "hex");
  const right = Buffer.from(String(b), "hex");
  if (left.length === 0 || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function hashServerPassword(password, salt) {
  if (!password || String(password).length < 8) {
    throw new Error("The password must be at least 8 characters.");
  }
  const useSalt = salt || randomBytes(16).toString("hex");
  const hash = scryptHex(password, useSalt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return { salt: useSalt, passwordHash: `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${useSalt}$${hash}` };
}

export function verifyServerPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }
  const stored = String(storedHash);
  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (parts.length !== 6) {
      return false;
    }
    const [, n, r, p, salt, hash] = parts;
    try {
      return sameHex(scryptHex(password, salt, Number(n), Number(r), Number(p)), hash);
    } catch {
      return false;
    }
  }
  if (stored.includes(":")) {
    const [salt, hash] = stored.split(":");
    const candidate = createHash("sha256").update(`${salt}:${String(password)}`).digest("hex");
    return sameHex(candidate, hash);
  }
  const candidate = createHash("sha256").update(String(password)).digest("hex");
  return sameHex(candidate, stored);
}

// True when a stored hash uses an old SHA-256 form, so the login
// route should store a fresh scrypt hash after a successful sign in.
export function passwordNeedsRehash(storedHash) {
  return !String(storedHash || "").startsWith("scrypt$");
}

export async function updateUserPasswordHash(client, userId, passwordHash) {
  requireClient(client);
  if (!userId || !passwordHash) {
    throw new Error("A user id and a password hash are required.");
  }
  await client.user.update({ where: { id: String(userId) }, data: { passwordHash: String(passwordHash) } });
  return true;
}

// Admin check for a server route. Reads the Bearer session token,
// loads the session user, and requires the admin role. Returns the
// public admin user, or null when the caller is not a signed in
// admin, so the route can answer 401 without saying why.
export async function getAdminFromToken(client, token) {
  requireClient(client);
  if (!token) {
    return null;
  }
  const user = await getSessionUser(client, token);
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

// Returns the full user row, including passwordHash. This is for
// server login only, inside this module and the auth API route.
// It must never be returned to a client: callers use publicUser.
export async function getUserRecordByEmail(client, email) {
  requireClient(client);
  if (!isValidEmail(email)) {
    return null;
  }
  return client.user.findUnique({ where: { email: normaliseEmail(email) } });
}

// Server sessions. Only a SHA-256 hash of the token is stored, so
// a leaked session row cannot be used to sign in. The plain token
// is returned once, at creation, inside createSessionRecord, and
// the caller must send it back as a Bearer token. An expired
// session is treated as missing, never as valid.
export function hashSessionToken(token) {
  if (!token || !String(token).trim()) {
    throw new Error("A session token is required.");
  }
  return createHash("sha256").update(String(token)).digest("hex");
}

export function sessionExpiryFrom(nowMs) {
  return new Date((nowMs || Date.now()) + SESSION_TTL_MS);
}

export function publicSession(session) {
  if (!session) {
    return null;
  }
  const { tokenHash, ...rest } = session;
  return rest;
}

export async function createSessionRecord(client, userId, token) {
  requireClient(client);
  if (!userId) {
    throw new Error("A user id is required for a session.");
  }
  const plainToken = token || randomBytes(32).toString("hex");
  const expiresAt = sessionExpiryFrom(Date.now());
  const created = await client.session.create({
    data: {
      userId: String(userId),
      tokenHash: hashSessionToken(plainToken),
      expiresAt
    }
  });
  return { token: plainToken, session: publicSession(created) };
}

export async function getSessionByToken(client, token) {
  requireClient(client);
  if (!token) {
    return null;
  }
  const found = await client.session.findUnique({ where: { tokenHash: hashSessionToken(token) } });
  if (!found) {
    return null;
  }
  if (new Date(found.expiresAt).getTime() <= Date.now()) {
    return null;
  }
  return publicSession(found);
}

export async function getSessionUser(client, token) {
  const session = await getSessionByToken(client, token);
  if (!session) {
    return null;
  }
  return getUserById(client, session.userId);
}

export async function revokeSessionRecord(client, token) {
  requireClient(client);
  if (!token) {
    return false;
  }
  const found = await client.session.findUnique({ where: { tokenHash: hashSessionToken(token) } });
  if (!found) {
    return false;
  }
  await client.session.delete({ where: { id: found.id } });
  return true;
}

export async function revokeAllSessionsForUser(client, userId) {
  requireClient(client);
  if (!userId) {
    return 0;
  }
  const result = await client.session.deleteMany({ where: { userId: String(userId) } });
  return result ? result.count || 0 : 0;
}

// Profile mapping. A local builder profile keeps experience periods
// as a plain string, for example "2022 to 2024", while the Prisma
// ProfileExperience row keeps startDate and endDate as dates. This
// mapping never converts a period string into dates, because that
// would invent dates. Dates are stored only when the local entry
// already supplies startDate or endDate. The period string stays in
// the document snapshot, not in the profile date columns.
export function profileScalarsFromLocal(localProfile) {
  const profile = localProfile || {};
  return {
    headline: profile.headline ? String(profile.headline) : null,
    summary: profile.summary ? String(profile.summary) : null,
    phone: profile.phone ? String(profile.phone) : null,
    city: profile.city ? String(profile.city) : null,
    country: profile.country ? String(profile.country) : null,
    website: profile.website ? String(profile.website) : null,
    linkedinUrl: profile.linkedinUrl ? String(profile.linkedinUrl) : null
  };
}

export function educationRowsFromLocal(localProfile, profileId) {
  return (localProfile.education || []).map((entry, index) => ({
    profileId,
    institution: entry.institution ? String(entry.institution) : null,
    qualification: entry.qualification ? String(entry.qualification) : null,
    field: entry.field ? String(entry.field) : null,
    startDate: entry.startDate ? new Date(entry.startDate) : null,
    endDate: entry.endDate ? new Date(entry.endDate) : null,
    isCurrent: Boolean(entry.isCurrent),
    grade: entry.grade ? String(entry.grade) : null,
    description: entry.description ? String(entry.description) : null,
    sortOrder: index
  }));
}

export function experienceRowsFromLocal(localProfile, profileId) {
  return (localProfile.experience || []).map((entry, index) => ({
    profileId,
    employer: entry.employer ? String(entry.employer) : null,
    jobTitle: entry.jobTitle ? String(entry.jobTitle) : null,
    location: entry.location ? String(entry.location) : null,
    startDate: entry.startDate ? new Date(entry.startDate) : null,
    endDate: entry.endDate ? new Date(entry.endDate) : null,
    isCurrent: Boolean(entry.isCurrent),
    descriptionBullets: Array.isArray(entry.bullets) ? [...entry.bullets] : null,
    sortOrder: index
  }));
}

export function skillRowsFromLocal(localProfile, profileId) {
  const skills = localProfile.skills || [];
  return skills.map((item, index) => {
    const skill = typeof item === "string" ? { name: item } : item || {};
    return {
      profileId,
      name: skill.name ? String(skill.name) : null,
      level: skill.level ? String(skill.level) : null,
      sortOrder: index
    };
  });
}

export function languageRowsFromLocal(localProfile, profileId) {
  const languages = localProfile.languages || [];
  return languages.map((item, index) => {
    const language = typeof item === "string" ? { language: item } : item || {};
    return {
      profileId,
      language: language.language ? String(language.language) : null,
      proficiency: language.proficiency ? String(language.proficiency) : null,
      sortOrder: index
    };
  });
}

export function localProfileFromPrisma(profileRecord, details) {
  const record = profileRecord || {};
  const rows = details || {};
  const datePart = (value) => (value ? String(value).slice(0, 10) : "");
  return {
    fullName: "",
    headline: record.headline || "",
    email: "",
    phone: record.phone || "",
    city: record.city || "",
    country: record.country || "",
    summary: record.summary || "",
    experience: (rows.experience || []).map((entry) => ({
      employer: entry.employer || "",
      jobTitle: entry.jobTitle || "",
      location: entry.location || "",
      period: entry.startDate || entry.endDate ? `${datePart(entry.startDate)} to ${entry.isCurrent ? "Present" : datePart(entry.endDate)}` : "",
      bullets: Array.isArray(entry.descriptionBullets) ? [...entry.descriptionBullets] : []
    })),
    education: (rows.education || []).map((entry) => ({
      institution: entry.institution || "",
      qualification: entry.qualification || "",
      period: entry.startDate || entry.endDate ? `${datePart(entry.startDate)} to ${entry.isCurrent ? "Present" : datePart(entry.endDate)}` : ""
    })),
    skills: (rows.skills || []).map((entry) => entry.name || ""),
    languages: (rows.languages || []).map((entry) => entry.language || ""),
    customSections: []
  };
}

export async function createProfileRecord(client, userId, localProfile) {
  requireClient(client);
  if (!userId) {
    throw new Error("A user id is required for a profile.");
  }
  const profile = localProfile || {};
  const created = await client.profile.create({
    data: {
      userId: String(userId),
      ...profileScalarsFromLocal(profile),
      education: { create: educationRowsFromLocal(profile, undefined).map(({ profileId, ...rest }) => rest) },
      experience: { create: experienceRowsFromLocal(profile, undefined).map(({ profileId, ...rest }) => rest) },
      skills: { create: skillRowsFromLocal(profile, undefined).map(({ profileId, ...rest }) => rest) },
      languages: { create: languageRowsFromLocal(profile, undefined).map(({ profileId, ...rest }) => rest) }
    }
  });
  return created;
}

export async function getProfileByUserId(client, userId) {
  requireClient(client);
  if (!userId) {
    return null;
  }
  return client.profile.findUnique({
    where: { userId: String(userId) },
    include: { education: true, experience: true, skills: true, languages: true }
  });
}

export async function saveProfileRecord(client, userId, localProfile) {
  requireClient(client);
  if (!userId) {
    throw new Error("A user id is required for a profile.");
  }
  const profile = localProfile || {};
  const saved = await client.profile.upsert({
    where: { userId: String(userId) },
    update: profileScalarsFromLocal(profile),
    create: { userId: String(userId), ...profileScalarsFromLocal(profile) }
  });
  const profileId = saved.id;
  const detailTables = [
    ["profileEducation", educationRowsFromLocal(profile, profileId)],
    ["profileExperience", experienceRowsFromLocal(profile, profileId)],
    ["profileSkill", skillRowsFromLocal(profile, profileId)],
    ["profileLanguage", languageRowsFromLocal(profile, profileId)]
  ];
  for (const [table, rows] of detailTables) {
    await client[table].deleteMany({ where: { profileId } });
    if (rows.length > 0) {
      await client[table].createMany({ data: rows });
    }
  }
  return saved;
}

// Document mapping. A local builder draft becomes a Document row
// plus DocumentSection rows for its section order. The draft label
// becomes the document title, the settings template id is stored as
// templateId only when it is a plain string, and the paper size
// "US Letter" from the builder maps to the schema value US_LETTER.
// A document is never created without an owner user id.
export function paperSizeToSchema(value) {
  if (value === "US_LETTER" || value === "US Letter") {
    return "US_LETTER";
  }
  return "A4";
}

export function localDraftToDocumentInput(draft, userId, edition) {
  if (!userId) {
    throw new Error("A user id is required for a document.");
  }
  const settings = (draft && draft.settings) || {};
  const profile = (draft && draft.profile) || {};
  return {
    userId: String(userId),
    title: draft && draft.label ? String(draft.label) : "Untitled document",
    documentType: "cv",
    templateId: settings.templateId ? String(settings.templateId) : null,
    countryPackId: settings.countryPackId ? String(settings.countryPackId) : null,
    language: "en",
    paperSize: paperSizeToSchema(settings.paperSize),
    pageCountTarget: 1,
    status: "draft",
    edition: isValidEdition(edition) ? edition : "commercial",
    sections: (settings.sectionOrder || []).map((key, index) => ({
      sectionKey: String(key),
      title: null,
      contentJson: null,
      sortOrder: index,
      isVisible: true
    })),
    profileSummary: profile.summary ? String(profile.summary) : ""
  };
}

// The builder sends template and country pack ids as slugs, for
// example ats-minimal and us, because that is how they are known in
// the code. Document.templateId and Document.countryPackId are
// foreign keys to Template.id and CountryPack.id, so a slug only
// works when a row with that id exists. Resolve the slug to the row
// id here, and store null when no such row exists yet, instead of
// failing the whole save with a foreign key error. Once the
// reference rows are seeded, with the slug as the id, the lookup
// finds them and the template and pack survive the round trip.
async function resolveReferenceId(client, model, slug) {
  if (!slug) {
    return null;
  }
  try {
    const table = client ? client[model] : null;
    if (!table || typeof table.findUnique !== "function") {
      return null;
    }
    const found = await table.findUnique({ where: { slug: String(slug) } });
    return found ? found.id : null;
  } catch {
    return null;
  }
}

export async function createDocumentRecord(client, input) {
  requireClient(client);
  const data = input || {};
  if (!data.userId) {
    throw new Error("A user id is required for a document.");
  }
  if (!isValidDocumentType(data.documentType || "cv")) {
    throw new Error(`Unknown document type: ${data.documentType}.`);
  }
  if (data.paperSize && !PAPER_SIZES.includes(data.paperSize)) {
    throw new Error(`Unknown paper size: ${data.paperSize}.`);
  }
  const templateId = await resolveReferenceId(client, "template", data.templateId);
  const countryPackId = await resolveReferenceId(client, "countryPack", data.countryPackId);
  const created = await client.document.create({
    data: {
      userId: String(data.userId),
      profileId: data.profileId ? String(data.profileId) : null,
      title: data.title ? String(data.title) : null,
      documentType: data.documentType || "cv",
      templateId,
      countryPackId,
      language: data.language ? String(data.language) : "en",
      paperSize: data.paperSize || "A4",
      pageCountTarget: data.pageCountTarget || 1,
      status: data.status || "draft",
      edition: isValidEdition(data.edition) ? data.edition : "commercial",
      sections: data.sections && data.sections.length > 0 ? { create: data.sections } : undefined
    }
  });
  return created;
}

export async function listDocumentsForUser(client, userId, edition) {
  requireClient(client);
  if (!userId) {
    return [];
  }
  const where = { userId: String(userId), deletedAt: null };
  if (isValidEdition(edition)) {
    where.edition = edition;
  }
  return client.document.findMany({ where, orderBy: { updatedAt: "desc" } });
}

export async function getDocumentForUser(client, userId, documentId) {
  requireClient(client);
  if (!documentId) {
    return null;
  }
  const found = await client.document.findUnique({ where: { id: String(documentId) } });
  if (!found) {
    return null;
  }
  assertOwnsDocument(userId, found);
  return found;
}

export async function deleteDocumentRecord(client, userId, documentId) {
  requireClient(client);
  const found = await getDocumentForUser(client, userId, documentId);
  if (!found) {
    return { deleted: false };
  }
  await client.document.update({
    where: { id: String(documentId) },
    data: { deletedAt: new Date() }
  });
  return { deleted: true };
}

export async function createDocumentVersion(client, userId, documentId, label, snapshot, createdBy) {
  requireClient(client);
  await getDocumentForUser(client, userId, documentId);
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("A document version needs a snapshot object.");
  }
  return client.documentVersion.create({
    data: {
      documentId: String(documentId),
      label: label ? String(label) : null,
      snapshotJson: snapshot,
      createdBy: createdBy ? String(createdBy) : null
    }
  });
}

export async function listDocumentVersions(client, userId, documentId) {
  requireClient(client);
  await getDocumentForUser(client, userId, documentId);
  return client.documentVersion.findMany({
    where: { documentId: String(documentId) },
    orderBy: { createdAt: "desc" }
  });
}

export async function restoreDocumentVersion(client, userId, documentId, versionId) {
  requireClient(client);
  await getDocumentForUser(client, userId, documentId);
  const versions = await client.documentVersion.findMany({ where: { documentId: String(documentId) } });
  const found = (versions || []).find((item) => item.id === versionId);
  if (!found) {
    throw new Error("That document version was not found.");
  }
  // Restore creates a new version from the snapshot, it does not
  // overwrite history, per docs/database-design.md.
  return client.documentVersion.create({
    data: {
      documentId: String(documentId),
      label: `Restored from ${found.label || found.id}`,
      snapshotJson: found.snapshotJson,
      createdBy: String(userId)
    }
  });
}

// Human help funnel requests, Phase 2 increment 19. A visitor asks
// for human help through the /human-help funnel, with no account and
// no sign-in required. Goal is study, work, or business, need is
// consultation, review, or both, country is a country pack id from
// packs-core.mjs, never a typed list. The message is optional.
// Nothing here promises a reply time, a price, or an email, because
// no email is sent and the turnaround is not decided. The request is
// saved only, and Ali reads it on the admin page, newest first.
export const HELP_GOALS = ["study", "work", "business"];
export const HELP_NEEDS = ["consultation", "review", "both"];

export function isValidHelpGoal(value) {
  return HELP_GOALS.includes(value);
}

export function isValidHelpNeed(value) {
  return HELP_NEEDS.includes(value);
}

export function isValidHelpCountry(value) {
  return COUNTRY_PACKS.some((pack) => pack.id === String(value));
}

export function validateHumanHelpRequest(input) {
  const data = input || {};
  const name = String(data.name || "").trim();
  if (!name) {
    throw new Error("A name is required.");
  }
  if (!isValidEmail(data.email)) {
    throw new Error("A valid email is required.");
  }
  const country = String(data.country || "").trim();
  if (!isValidHelpCountry(country)) {
    throw new Error("Choose a target country from the list.");
  }
  const goal = String(data.goal || "").trim();
  if (!isValidHelpGoal(goal)) {
    throw new Error("Choose a goal: study, work, or business.");
  }
  const need = String(data.need || "").trim();
  if (!isValidHelpNeed(need)) {
    throw new Error("Choose what you need: a free consultation, a CV review, or both.");
  }
  const message = String(data.message || "").trim();
  return {
    name,
    email: normaliseEmail(data.email),
    country,
    goal,
    need,
    message: message || null
  };
}

export async function createHumanHelpRequest(client, input) {
  requireClient(client);
  const data = validateHumanHelpRequest(input);
  return client.humanHelpRequest.create({ data });
}

export async function listHumanHelpRequests(client) {
  requireClient(client);
  return client.humanHelpRequest.findMany({ orderBy: { createdAt: "desc" } });
}

// Admin groundwork. A server admin action needs a signed in admin
// user, a reason, and an audit row. This replaces the local only
// admin page only when a database is connected and the caller is a
// real admin user. Until then the admin page stays local only and
// says so plainly. No CV text, no user name, no email, and no secret
// is ever written to an audit entry.
export async function logAdminAction(client, adminUser, action, targetType, targetId, reason) {
  requireClient(client);
  requireAdmin(adminUser);
  if (!action || !String(action).trim()) {
    throw new Error("An audit action name is required.");
  }
  if (!reason || !String(reason).trim()) {
    throw new Error("A reason is required for this admin action.");
  }
  return client.adminAuditLog.create({
    data: {
      adminUserId: String(adminUser.id),
      action: String(action).trim(),
      targetType: targetType ? String(targetType) : null,
      targetId: targetId ? String(targetId) : null,
      reason: sanitiseAuditText(String(reason).trim())
    }
  });
}
