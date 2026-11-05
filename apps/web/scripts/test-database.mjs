// Database layer tests, Phase 2 increment 13. Run with plain Node:
//   node scripts/test-database.mjs
// Tests the server side data layer in lib/database-core.mjs with a
// mocked Prisma client only. No real database is used, no Neon
// database is touched, and no DATABASE_URL value appears anywhere
// in this file. All sample data here is fictional and marked SAMPLE
// where it is sample content, and no real user data is used.
// The Prisma client loader in lib/prisma.ts is TypeScript, so plain
// Node cannot import it here. Its behaviour is covered by the live
// server test instead: /api/database-status answers not_configured
// with no database set, and /api/auth answers 501 with the database
// status included. This file also checks that neither lib/prisma.ts
// nor lib/database-core.mjs contains a connection string value.

import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertOwnsDocument,
  createDocumentRecord,
  createDocumentVersion,
  createProfileRecord,
  createUserRecord,
  educationRowsFromLocal,
  experienceRowsFromLocal,
  getProfileByUserId,
  getUserByEmail,
  listDocumentVersions,
  listDocumentsForUser,
  localDraftToDocumentInput,
  localProfileFromPrisma,
  logAdminAction,
  paperSizeToSchema,
  profileScalarsFromLocal,
  publicUser,
  requireAdmin,
  requireClient,
  restoreDocumentVersion,
  saveProfileRecord
} from "../lib/database-core.mjs";

let passed = 0;
async function check(label, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

const here = path.dirname(fileURLToPath(import.meta.url));

function createMockClient() {
  const store = {
    users: [],
    profiles: [],
    education: [],
    experience: [],
    skills: [],
    languages: [],
    documents: [],
    versions: [],
    audit: []
  };
  const calls = [];
  let counter = 0;
  const nextId = (prefix) => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
  const client = {
    store,
    calls,
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
    profile: {
      create: async ({ data }) => {
        const row = { id: nextId("profile"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
        const nested = { education: [], experience: [], skills: [], languages: [] };
        for (const kind of ["education", "experience", "skills", "languages"]) {
          const items = (data[kind] && data[kind].create) || [];
          nested[kind] = items.map((item, index) => ({ id: nextId(kind), profileId: row.id, sortOrder: index, ...item }));
          store[kind].push(...nested[kind]);
        }
        const stored = { ...row, ...nested };
        delete stored.education;
        delete stored.experience;
        delete stored.skills;
        delete stored.languages;
        store.profiles.push({ ...stored, education: nested.education, experience: nested.experience, skills: nested.skills, languages: nested.languages });
        return { ...stored, ...nested };
      },
      findUnique: async ({ where }) => {
        const found = store.profiles.find((item) => item.userId === where.userId) || null;
        if (!found) {
          return null;
        }
        return found;
      },
      upsert: async ({ where, update, create }) => {
        let found = store.profiles.find((item) => item.userId === where.userId) || null;
        if (found) {
          Object.assign(found, update);
          return found;
        }
        const row = { id: nextId("profile"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...create };
        store.profiles.push(row);
        return row;
      }
    },
    document: {
      create: async ({ data }) => {
        const sections = (data.sections && data.sections.create) || [];
        const row = {
          id: nextId("doc"),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          ...data,
          sections: sections.map((item, index) => ({ id: nextId("section"), documentId: "pending", sortOrder: index, ...item }))
        };
        row.sections = row.sections.map((item) => ({ ...item, documentId: row.id }));
        store.documents.push(row);
        return row;
      },
      findMany: async ({ where }) => {
        let list = [...store.documents];
        if (where && where.userId) {
          list = list.filter((item) => item.userId === where.userId);
        }
        if (where && where.edition) {
          list = list.filter((item) => item.edition === where.edition);
        }
        if (where && "deletedAt" in where) {
          list = list.filter((item) => item.deletedAt === null);
        }
        return list.reverse();
      },
      findUnique: async ({ where }) => store.documents.find((item) => item.id === where.id) || null
    },
    documentVersion: {
      create: async ({ data }) => {
        const row = { id: nextId("version"), createdAt: new Date().toISOString(), ...data };
        store.versions.push(row);
        return row;
      },
      findMany: async ({ where }) => {
        let list = [...store.versions];
        if (where && where.documentId) {
          list = list.filter((item) => item.documentId === where.documentId);
        }
        return list.reverse();
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
  for (const table of ["profileEducation", "profileExperience", "profileSkill", "profileLanguage"]) {
    const storeKey = { profileEducation: "education", profileExperience: "experience", profileSkill: "skills", profileLanguage: "languages" }[table];
    client[table] = {
      deleteMany: async ({ where }) => {
        calls.push(`deleteMany ${table} for ${where.profileId}`);
        store[storeKey] = store[storeKey].filter((item) => item.profileId !== where.profileId);
        return { count: 0 };
      },
      createMany: async ({ data }) => {
        calls.push(`createMany ${table} with ${data.length} rows`);
        for (const item of data) {
          store[storeKey].push({ id: nextId(storeKey), ...item });
        }
        return { count: data.length };
      }
    };
  }
  return client;
}

const sampleProfile = {
  fullName: "Sam Sample",
  headline: "Sample Project Coordinator",
  email: "sam.sample@example.test",
  phone: "+00 000 000 000",
  city: "Sample City",
  summary: "SAMPLE: Fictional sample summary for mapping tests only.",
  experience: [
    {
      employer: "Sample Projects Ltd",
      jobTitle: "Sample Project Coordinator",
      location: "Sample City",
      period: "2022 to 2024",
      bullets: ["Coordinated sample project schedules."]
    }
  ],
  education: [
    { institution: "Sample College", qualification: "Sample Diploma in Project Support", period: "2018 to 2020" }
  ],
  skills: ["Planning", "Scheduling"],
  languages: ["English (Fluent, sample level)"],
  customSections: []
};

await check("requireClient throws plainly when no client is given", async () => {
  await assert.rejects(createUserRecord(null, { name: "Sam Sample", email: "sam.sample@example.test" }, "SAMPLE-hash"), /Database is not configured/);
});

await check("createUserRecord creates a user and returns no password hash", async () => {
  const client = createMockClient();
  const created = await createUserRecord(client, { name: "Sam Sample", email: "Sam.Sample@example.test" }, "SAMPLE-hash-value");
  assert.equal(created.email, "sam.sample@example.test");
  assert.equal(created.role, "user");
  assert.equal(created.edition, "commercial");
  assert.equal("passwordHash" in created, false);
  assert.equal(client.store.users[0].passwordHash, "SAMPLE-hash-value");
});

await check("createUserRecord rejects an invalid email", async () => {
  const client = createMockClient();
  await assert.rejects(createUserRecord(client, { name: "Sam Sample", email: "not-an-email" }, "SAMPLE-hash"), /valid email/);
});

await check("createUserRecord rejects a duplicate email, case insensitively", async () => {
  const client = createMockClient();
  await createUserRecord(client, { name: "Sam Sample", email: "sam.sample@example.test" }, "SAMPLE-hash-one");
  await assert.rejects(createUserRecord(client, { name: "Sam Sample", email: "SAM.SAMPLE@example.test" }, "SAMPLE-hash-two"), /already exists/);
});

await check("createUserRecord rejects a missing password hash", async () => {
  const client = createMockClient();
  await assert.rejects(createUserRecord(client, { name: "Sam Sample", email: "sam.sample@example.test" }, ""), /password hash is required/);
});

await check("createUserRecord keeps nvconsult edition when given", async () => {
  const client = createMockClient();
  const created = await createUserRecord(client, { name: "Sam Sample", email: "sam.sample@example.test", edition: "nvconsult" }, "SAMPLE-hash");
  assert.equal(created.edition, "nvconsult");
});

await check("getUserByEmail returns the public user, and null for an unknown email", async () => {
  const client = createMockClient();
  await createUserRecord(client, { name: "Sam Sample", email: "sam.sample@example.test" }, "SAMPLE-hash");
  const found = await getUserByEmail(client, "sam.sample@example.test");
  assert.equal(found.email, "sam.sample@example.test");
  assert.equal("passwordHash" in found, false);
  assert.equal(await getUserByEmail(client, "nobody@example.test"), null);
});

await check("publicUser strips the password hash and keeps the rest", async () => {
  const cleaned = publicUser({ id: "user-1", email: "sam.sample@example.test", passwordHash: "SAMPLE-hash", role: "user" });
  assert.equal(cleaned.email, "sam.sample@example.test");
  assert.equal("passwordHash" in cleaned, false);
  assert.equal(publicUser(null), null);
});

await check("requireAdmin passes for admin, throws for a plain user and for no user", async () => {
  assert.equal(requireAdmin({ id: "user-1", role: "admin" }), true);
  assert.throws(() => requireAdmin({ id: "user-2", role: "user" }), /Admin access requires/);
  assert.throws(() => requireAdmin(null), /Admin access requires/);
});

await check("assertOwnsDocument passes for the owner and throws for another user", async () => {
  assert.equal(assertOwnsDocument("user-1", { id: "doc-1", userId: "user-1" }), true);
  assert.throws(() => assertOwnsDocument("user-2", { id: "doc-1", userId: "user-1" }), /different user/);
  assert.throws(() => assertOwnsDocument("user-1", null), /not found/);
});

await check("profileScalarsFromLocal maps fields and leaves missing fields null", async () => {
  const scalars = profileScalarsFromLocal(sampleProfile);
  assert.equal(scalars.headline, "Sample Project Coordinator");
  assert.equal(scalars.city, "Sample City");
  assert.equal(scalars.country, null);
  assert.equal(scalars.website, null);
});

await check("experience rows keep bullets and sort order and never invent dates from a period string", async () => {
  const rows = experienceRowsFromLocal(sampleProfile, "profile-1");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].employer, "Sample Projects Ltd");
  assert.equal(rows[0].jobTitle, "Sample Project Coordinator");
  assert.deepEqual(rows[0].descriptionBullets, ["Coordinated sample project schedules."]);
  assert.equal(rows[0].startDate, null);
  assert.equal(rows[0].endDate, null);
  assert.equal(rows[0].sortOrder, 0);
  const education = educationRowsFromLocal(sampleProfile, "profile-1");
  assert.equal(education.length, 1);
  assert.equal(education[0].institution, "Sample College");
  assert.equal(education[0].startDate, null);
});

await check("createProfileRecord creates a profile with nested detail rows", async () => {
  const client = createMockClient();
  const created = await createProfileRecord(client, "user-1", sampleProfile);
  assert.equal(created.userId, "user-1");
  assert.equal(created.headline, "Sample Project Coordinator");
  assert.equal(client.store.education.length, 1);
  assert.equal(client.store.experience.length, 1);
  assert.equal(client.store.skills.length, 2);
  assert.equal(client.store.languages.length, 1);
});

await check("getProfileByUserId returns the profile with included details", async () => {
  const client = createMockClient();
  await createProfileRecord(client, "user-1", sampleProfile);
  const found = await getProfileByUserId(client, "user-1");
  assert.equal(found.userId, "user-1");
  assert.equal(found.skills.length, 2);
  assert.equal(found.experience[0].employer, "Sample Projects Ltd");
  assert.equal(await getProfileByUserId(client, "user-9"), null);
});

await check("saveProfileRecord upserts and replaces detail rows", async () => {
  const client = createMockClient();
  await createProfileRecord(client, "user-1", sampleProfile);
  const updated = { ...sampleProfile, headline: "Sample Senior Coordinator", skills: ["Planning"] };
  const saved = await saveProfileRecord(client, "user-1", updated);
  assert.equal(saved.headline, "Sample Senior Coordinator");
  assert.equal(client.store.skills.length, 1);
  assert.equal(client.store.skills[0].name, "Planning");
  assert.ok(client.calls.some((item) => item.startsWith("deleteMany profileSkill")));
  assert.ok(client.calls.some((item) => item.startsWith("createMany profileSkill with 1 rows")));
});

await check("localProfileFromPrisma round trip keeps headline, skills, and languages", async () => {
  const client = createMockClient();
  await createProfileRecord(client, "user-1", sampleProfile);
  const stored = await getProfileByUserId(client, "user-1");
  const back = localProfileFromPrisma(stored, { experience: stored.experience, education: stored.education, skills: stored.skills, languages: stored.languages });
  assert.equal(back.headline, "Sample Project Coordinator");
  assert.deepEqual(back.skills, ["Planning", "Scheduling"]);
  assert.deepEqual(back.languages, ["English (Fluent, sample level)"]);
  assert.equal(back.experience[0].employer, "Sample Projects Ltd");
  assert.equal(back.experience[0].period, "");
});

await check("paperSizeToSchema maps US Letter to US_LETTER and keeps A4", async () => {
  assert.equal(paperSizeToSchema("US Letter"), "US_LETTER");
  assert.equal(paperSizeToSchema("US_LETTER"), "US_LETTER");
  assert.equal(paperSizeToSchema("A4"), "A4");
  assert.equal(paperSizeToSchema(""), "A4");
});

await check("localDraftToDocumentInput maps a builder draft to a document input", async () => {
  const draft = {
    label: "SAMPLE master draft",
    profile: sampleProfile,
    settings: { templateId: "ats-minimal", paperSize: "US Letter", sectionOrder: ["summary", "experience"] }
  };
  const input = localDraftToDocumentInput(draft, "user-1", "nvconsult");
  assert.equal(input.title, "SAMPLE master draft");
  assert.equal(input.documentType, "cv");
  assert.equal(input.templateId, "ats-minimal");
  assert.equal(input.paperSize, "US_LETTER");
  assert.equal(input.edition, "nvconsult");
  assert.equal(input.sections.length, 2);
  assert.equal(input.sections[0].sectionKey, "summary");
  assert.throws(() => localDraftToDocumentInput(draft, "", "commercial"), /user id is required/);
});

await check("createDocumentRecord rejects an unknown document type and an unknown paper size", async () => {
  const client = createMockClient();
  await assert.rejects(createDocumentRecord(client, { userId: "user-1", documentType: "not-a-type" }), /Unknown document type/);
  await assert.rejects(createDocumentRecord(client, { userId: "user-1", documentType: "cv", paperSize: "A3" }), /Unknown paper size/);
});

await check("createDocumentRecord creates a document owned by the user, with sections", async () => {
  const client = createMockClient();
  const input = localDraftToDocumentInput({ label: "SAMPLE master draft", profile: sampleProfile, settings: { templateId: "european", paperSize: "A4", sectionOrder: ["summary", "skills"] } }, "user-1", "commercial");
  const created = await createDocumentRecord(client, input);
  assert.equal(created.userId, "user-1");
  assert.equal(created.templateId, "european");
  assert.equal(created.status, "draft");
  assert.equal(created.sections.length, 2);
});

await check("listDocumentsForUser returns only the owner documents, and filters by edition", async () => {
  const client = createMockClient();
  await createDocumentRecord(client, { userId: "user-1", documentType: "cv", edition: "commercial" });
  await createDocumentRecord(client, { userId: "user-1", documentType: "cv", edition: "nvconsult" });
  await createDocumentRecord(client, { userId: "user-2", documentType: "cv", edition: "commercial" });
  const all = await listDocumentsForUser(client, "user-1");
  assert.equal(all.length, 2);
  const nvconsultOnly = await listDocumentsForUser(client, "user-1", "nvconsult");
  assert.equal(nvconsultOnly.length, 1);
  assert.equal(nvconsultOnly[0].edition, "nvconsult");
  assert.deepEqual(await listDocumentsForUser(client, ""), []);
});

await check("createDocumentVersion rejects a document owned by another user", async () => {
  const client = createMockClient();
  const created = await createDocumentRecord(client, { userId: "user-1", documentType: "cv" });
  await assert.rejects(createDocumentVersion(client, "user-2", created.id, "v1", { label: "SAMPLE" }, "user-2"), /different user/);
  await assert.rejects(createDocumentVersion(client, "user-1", created.id, "v1", null, "user-1"), /snapshot object/);
});

await check("list and restore document versions: restore creates a new version, history is not overwritten", async () => {
  const client = createMockClient();
  const created = await createDocumentRecord(client, { userId: "user-1", documentType: "cv" });
  const first = await createDocumentVersion(client, "user-1", created.id, "v1", { title: "SAMPLE first" }, "user-1");
  const listed = await listDocumentVersions(client, "user-1", created.id);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].label, "v1");
  const restored = await restoreDocumentVersion(client, "user-1", created.id, first.id);
  assert.equal(restored.label, "Restored from v1");
  assert.deepEqual(restored.snapshotJson, { title: "SAMPLE first" });
  const after = await listDocumentVersions(client, "user-1", created.id);
  assert.equal(after.length, 2);
  await assert.rejects(restoreDocumentVersion(client, "user-1", created.id, "version-99"), /not found/);
});

await check("logAdminAction requires admin and reason, sanitises emails and secrets, and creates an audit row", async () => {
  const client = createMockClient();
  const admin = { id: "user-1", role: "admin" };
  await assert.rejects(logAdminAction(client, { id: "user-2", role: "user" }, "view", "Document", "doc-1", "support"), /Admin access requires/);
  await assert.rejects(logAdminAction(client, admin, "view", "Document", "doc-1", ""), /reason is required/);
  const entry = await logAdminAction(client, admin, "view", "Document", "doc-1", "Support check for sam.sample@example.test, token: SAMPLE-secret-value");
  assert.equal(entry.adminUserId, "user-1");
  assert.equal(entry.action, "view");
  assert.equal(entry.reason.includes("sam.sample@example.test"), false);
  assert.equal(entry.reason.includes("SAMPLE-secret-value"), false);
  assert.equal(client.store.audit.length, 1);
});

await check("prisma loader and data layer files contain no connection string value", async () => {
  const loader = readFileSync(path.resolve(here, "..", "lib", "prisma.ts"), "utf8");
  const core = readFileSync(path.resolve(here, "..", "lib", "database-core.mjs"), "utf8");
  assert.equal(loader.includes("postgresql://"), false);
  assert.equal(core.includes("postgresql://"), false);
  assert.equal(loader.includes("DATABASE_URL"), true);
  assert.equal(loader.includes("process.env"), true);
});

console.log(`Total: ${passed} passed, 0 failed.`);
