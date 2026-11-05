// Human help funnel tests, Phase 2 increment 19. Run with plain Node:
//   node scripts/test-human-help.mjs
// Checks the routing by need (consultation goes to booking with a
// prefilled name and email, review only shows the confirmation and
// no booking link), the validation (a missing name, a bad email, an
// unknown country, an unknown goal, and an unknown need are all
// rejected, and only valid requests are saved), the help links in
// the edition config, and the admin list. Reads source files and
// runs the data layer with a mocked client only. No real database
// is used, no Neon database is touched, and no password, secret,
// or session token value appears anywhere in this file.

import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COUNTRY_PACKS } from "../lib/packs-core.mjs";
import {
  createHumanHelpRequest,
  listHumanHelpRequests,
  validateHumanHelpRequest
} from "../lib/database-core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const repoDir = path.resolve(webDir, "..", "..");

let passed = 0;
async function check(label, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

function read(relative) {
  return readFileSync(path.join(webDir, relative), "utf8");
}

function createMockClient() {
  const calls = { create: [], findMany: [] };
  const rows = [];
  return {
    calls,
    humanHelpRequest: {
      create: async ({ data }) => {
        calls.create.push(data);
        const row = {
          id: `mock-${calls.create.length}`,
          ...data,
          createdAt: new Date("2026-11-05T10:00:00.000Z")
        };
        rows.push(row);
        return row;
      },
      findMany: async (args) => {
        calls.findMany.push(args);
        return [...rows];
      }
    }
  };
}

const validInput = {
  name: "  Sample Person  ",
  email: "Sample@Example.test",
  country: "germany",
  goal: "work",
  need: "both",
  message: "Review my CV for German jobs"
};

await check("validation accepts a valid request for every need and goal", () => {
  for (const need of ["consultation", "review", "both"]) {
    for (const goal of ["study", "work", "business"]) {
      const cleaned = validateHumanHelpRequest({ ...validInput, need, goal });
      assert.strictEqual(cleaned.name, "Sample Person", "name was not trimmed");
      assert.strictEqual(cleaned.email, "sample@example.test", "email was not lowercased");
      assert.strictEqual(cleaned.country, "germany");
      assert.strictEqual(cleaned.goal, goal);
      assert.strictEqual(cleaned.need, need);
      assert.strictEqual(cleaned.message, "Review my CV for German jobs");
    }
  }
});

await check("validation accepts every country pack id", () => {
  assert.strictEqual(COUNTRY_PACKS.length, 8, "expected 8 country packs");
  for (const pack of COUNTRY_PACKS) {
    const cleaned = validateHumanHelpRequest({ ...validInput, country: pack.id });
    assert.strictEqual(cleaned.country, pack.id, `pack ${pack.id} was rejected`);
  }
});

await check("validation accepts an empty optional message", () => {
  const cleaned = validateHumanHelpRequest({ ...validInput, message: "   " });
  assert.strictEqual(cleaned.message, null, "empty message was not stored as null");
  const missing = validateHumanHelpRequest({ ...validInput, message: undefined });
  assert.strictEqual(missing.message, null, "missing message was not stored as null");
});

await check("validation rejects a missing name", () => {
  assert.throws(() => validateHumanHelpRequest({ ...validInput, name: "   " }), /name is required/i);
  assert.throws(() => validateHumanHelpRequest({ ...validInput, name: undefined }), /name is required/i);
});

await check("validation rejects a bad email", () => {
  assert.throws(() => validateHumanHelpRequest({ ...validInput, email: "not-an-email" }), /valid email/i);
  assert.throws(() => validateHumanHelpRequest({ ...validInput, email: "name@" }), /valid email/i);
  assert.throws(() => validateHumanHelpRequest({ ...validInput, email: "" }), /valid email/i);
});

await check("validation rejects an unknown country", () => {
  assert.throws(() => validateHumanHelpRequest({ ...validInput, country: "atlantis" }), /target country/i);
  assert.throws(() => validateHumanHelpRequest({ ...validInput, country: "" }), /target country/i);
});

await check("validation rejects an unknown goal", () => {
  assert.throws(() => validateHumanHelpRequest({ ...validInput, goal: "travel" }), /study, work, or business/i);
  assert.throws(() => validateHumanHelpRequest({ ...validInput, goal: "" }), /study, work, or business/i);
});

await check("validation rejects an unknown need", () => {
  assert.throws(() => validateHumanHelpRequest({ ...validInput, need: "call-me" }), /free consultation, a CV review, or both/i);
  assert.throws(() => validateHumanHelpRequest({ ...validInput, need: "" }), /free consultation, a CV review, or both/i);
});

await check("create saves only valid requests, normalised", async () => {
  const client = createMockClient();
  const created = await createHumanHelpRequest(client, validInput);
  assert.strictEqual(client.calls.create.length, 1, "valid request was not saved");
  assert.strictEqual(client.calls.create[0].name, "Sample Person");
  assert.strictEqual(client.calls.create[0].email, "sample@example.test");
  assert.strictEqual(created.need, "both");
  await assert.rejects(
    createHumanHelpRequest(client, { ...validInput, email: "bad" }),
    /valid email/i
  );
  assert.strictEqual(client.calls.create.length, 1, "invalid request reached the database");
});

await check("list asks for newest first", async () => {
  const client = createMockClient();
  await createHumanHelpRequest(client, validInput);
  const rows = await listHumanHelpRequests(client);
  assert.strictEqual(rows.length, 1, "list did not return the saved request");
  assert.deepStrictEqual(client.calls.findMany[0], { orderBy: { createdAt: "desc" } });
});

await check("funnel page routes consultation and both to booking with prefilled details", () => {
  const page = read("app/human-help/page.tsx");
  assert.ok(page.includes("https://cal.com/nvconsult?name="), "booking link has no cal.com base with a name parameter");
  assert.ok(page.includes("encodeURIComponent(name)"), "booking link does not carry the name");
  assert.ok(page.includes("&email="), "booking link has no email parameter");
  assert.ok(page.includes("encodeURIComponent(email)"), "booking link does not carry the email");
  assert.ok(page.includes("needsBooking"), "page has no booking routing by need");
  assert.ok(page.includes('need === "consultation" || need === "both"'), "booking is not limited to consultation and both");
  assert.ok(page.includes("opens the booking in a new tab"), "page does not say the booking opens in a new tab");
  assert.ok(page.includes('target="_blank"'), "booking link does not open in a new tab");
});

await check("funnel page shows a plain confirmation for review only, with no booking link", () => {
  const page = read("app/human-help/page.tsx");
  assert.ok(page.includes("NVConsult has your request"), "review confirmation is missing");
  assert.ok(page.includes("will get back to you"), "review confirmation does not say NVConsult will get back to them");
  assert.ok(!page.includes("window.location"), "page redirects automatically with window.location");
  assert.ok(!page.includes("location.replace"), "page redirects automatically with location.replace");
  assert.ok(!page.includes("location.href"), "page redirects automatically with location.href");
  assert.ok(!page.includes("router.push"), "page redirects automatically with router.push");
  assert.ok(!page.includes("window.open"), "page opens the booking automatically with window.open");
});

await check("funnel page promises no reply time, price, or email", () => {
  const page = read("app/human-help/page.tsx")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  assert.ok(!page.toLowerCase().includes("turnaround"), "page promises a turnaround");
  assert.ok(!page.includes("24 hour"), "page promises a reply within 24 hours");
  assert.ok(!page.includes("within a day"), "page promises a reply within a day");
  assert.ok(!page.includes("EUR"), "page names a price in EUR");
  assert.ok(!page.toLowerCase().includes("price"), "page names a price");
  assert.ok(page.includes("Your details are saved so NVConsult can arrange the help"), "page does not say plainly what happens with the details");
});

await check("funnel page has three need choices and the required detail fields", () => {
  const page = read("app/human-help/page.tsx");
  for (const title of ["Free consultation call", "CV review only", "Both"]) {
    assert.ok(page.includes(title), `need choice missing: ${title}`);
  }
  assert.ok(page.includes("COUNTRY_PACKS"), "country select is not built from the country packs");
  assert.ok(!page.includes("atlantis"), "country list is typed by hand");
  for (const label of ["Name", "Email", "Target country", "Goal", "What do you need help with?"]) {
    assert.ok(page.includes(label), `detail field missing: ${label}`);
  }
  assert.ok(page.includes("Step 1 of 2"), "page has no step 1 label");
  assert.ok(page.includes("Step 2 of 2"), "page has no step 2 label");
});

await check("help links in the edition config point at the funnel", () => {
  const config = read("lib/config.ts");
  const headerMatches = config.match(/headerHelpHref: "\/human-help"/g) || [];
  const footerMatches = config.match(/footerHelpHref: "\/human-help"/g) || [];
  assert.strictEqual(headerMatches.length, 2, "header help link is not the funnel in both editions");
  assert.strictEqual(footerMatches.length, 2, "footer help link is not the funnel in both editions");
  assert.ok(!config.includes('headerHelpHref: "https://nvconsult.eu"'), "header help still points at nvconsult.eu");
  assert.ok(!config.includes('footerHelpHref: "https://nvconsult.eu"'), "footer help still points at nvconsult.eu");
});

await check("human help API route has a plain 501 local only fallback and a plain save error", () => {
  const route = read("app/api/human-help/route.ts");
  assert.ok(route.includes("local_only"), "route has no local only status");
  assert.ok(route.includes("501"), "route has no 501 local only answer");
  assert.ok(route.includes("humanHelpErrors"), "route does not use the shared error catalog");
  assert.ok(route.includes("saveFailed"), "route has no plain save error");
  assert.ok(route.includes("validateHumanHelpRequest"), "route does not validate the input");
  assert.ok(route.includes("export async function POST"), "route has no POST handler");
  assert.ok(route.includes("export async function GET"), "route has no GET handler for the admin list");
});

await check("admin page lists the funnel requests newest first", () => {
  const page = read("app/admin/page.tsx");
  assert.ok(page.includes("/api/human-help"), "admin page does not read the human help requests");
  assert.ok(page.includes("Human help requests"), "admin page has no human help requests section");
  for (const field of ["entry.name", "entry.email", "entry.country", "entry.goal", "entry.need", "entry.message", "entry.createdAt"]) {
    assert.ok(page.includes(field), `admin list does not show ${field}`);
  }
});

await check("migration matches the schema model field for field", () => {
  const migration = readFileSync(
    path.join(repoDir, "prisma/migrations/20261105110000_add_human_help_request/migration.sql"),
    "utf8"
  );
  const schema = readFileSync(path.join(repoDir, "prisma/schema.prisma"), "utf8");
  assert.ok(schema.includes("model HumanHelpRequest"), "schema has no HumanHelpRequest model");
  for (const field of ['"name"', '"email"', '"country"', '"goal"', '"need"', '"message"', '"createdAt"']) {
    assert.ok(migration.includes(field), `migration is missing ${field}`);
  }
  assert.ok(migration.includes('CREATE TABLE "HumanHelpRequest"'), "migration creates no HumanHelpRequest table");
  assert.ok(migration.includes("gen_random_uuid()"), "migration has no uuid default for the id");
  assert.ok(migration.includes("NOT claimed as generated"), "migration does not state it was authored, not generated");
});

await check("changed files contain no em dash or en dash", () => {
  const changedFiles = [
    "lib/database-core.mjs",
    "app/api/human-help/route.ts",
    "app/human-help/page.tsx",
    "lib/config.ts",
    "app/admin/page.tsx",
    "scripts/test-human-help.mjs"
  ];
  const changedRepoFiles = [
    "prisma/schema.prisma",
    "prisma/migrations/20261105110000_add_human_help_request/migration.sql"
  ];
  const bad = [];
  for (const file of changedFiles) {
    const text = read(file);
    if (text.includes("\u2014") || text.includes("\u2013")) {
      bad.push(file);
    }
  }
  for (const file of changedRepoFiles) {
    const text = readFileSync(path.join(repoDir, file), "utf8");
    if (text.includes("\u2014") || text.includes("\u2013")) {
      bad.push(file);
    }
  }
  assert.deepStrictEqual(bad, [], `em or en dash in: ${bad.join(", ")}`);
});

console.log(`${passed} passed, 0 failed`);
