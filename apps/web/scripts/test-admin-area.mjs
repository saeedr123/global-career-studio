// Admin area tests, 2026-11-05. Run with plain Node:
//   node scripts/test-admin-area.mjs
// Covers the admin overview data functions, the help request status,
// the admin-only routes, the role-gated header link, and the new
// migration. Mocked Prisma client only, no database, no live
// service. All sample data is fictional and marked SAMPLE.
import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HELP_REQUEST_STATUSES,
  getAdminOverview,
  listAccountsForAdmin,
  updateHumanHelpStatus
} from "../lib/database-core.mjs";

let passed = 0;
async function check(label, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const repoDir = path.resolve(webDir, "..", "..");
const read = (file) => readFileSync(path.join(webDir, file), "utf8");
const readRepo = (file) => readFileSync(path.join(repoDir, file), "utf8");

function createMockClient({ helpTableMissing = false } = {}) {
  const users = [
    { id: "user-1", name: "Sam Sample", email: "sam.sample@example.test", role: "user", edition: "nvconsult", createdAt: "2026-11-01T10:00:00.000Z", deletedAt: null, passwordHash: "scrypt$SAMPLE" },
    { id: "user-2", name: "Ana Admin", email: "ana.admin@example.test", role: "admin", edition: "nvconsult", createdAt: "2026-11-02T10:00:00.000Z", deletedAt: null, passwordHash: "scrypt$SAMPLE" }
  ];
  const help = [
    { id: "help-1", status: "new" },
    { id: "help-2", status: "done" },
    { id: "help-3", status: "contacted" }
  ];
  const missing = async () => {
    throw new Error('The table "HumanHelpRequest" does not exist');
  };
  return {
    users,
    help,
    user: {
      count: async () => users.filter((row) => row.deletedAt === null).length,
      findMany: async ({ select, take }) =>
        users.slice(0, take).map((row) => Object.fromEntries(Object.keys(select).map((key) => [key, row[key]])))
    },
    document: { count: async () => 4 },
    humanHelpRequest: helpTableMissing
      ? { count: missing, update: missing }
      : {
          count: async (args) =>
            args && args.where ? help.filter((row) => row.status !== args.where.status.not).length : help.length,
          update: async ({ where, data }) => {
            const row = help.find((item) => item.id === where.id);
            if (!row) {
              throw new Error("Record to update not found.");
            }
            Object.assign(row, data);
            return row;
          }
        }
  };
}

await check("overview counts accounts, documents, open and total help requests", async () => {
  const counts = await getAdminOverview(createMockClient());
  assert.deepStrictEqual(counts, { accounts: 2, documents: 4, helpOpen: 2, helpTotal: 3 });
});

await check("overview leaves help counts null when the help table is not migrated", async () => {
  const counts = await getAdminOverview(createMockClient({ helpTableMissing: true }));
  assert.equal(counts.accounts, 2);
  assert.equal(counts.helpOpen, null);
  assert.equal(counts.helpTotal, null);
});

await check("account list never includes a password hash", async () => {
  const accounts = await listAccountsForAdmin(createMockClient(), 50);
  assert.equal(accounts.length, 2);
  for (const account of accounts) {
    assert.equal("passwordHash" in account, false);
    assert.ok(account.email);
  }
});

await check("help status accepts only new, contacted, or done", async () => {
  const client = createMockClient();
  assert.deepStrictEqual(HELP_REQUEST_STATUSES, ["new", "contacted", "done"]);
  const updated = await updateHumanHelpStatus(client, "help-1", "contacted");
  assert.equal(updated.status, "contacted");
  await assert.rejects(updateHumanHelpStatus(client, "help-1", "deleted"), /new, contacted, or done/);
  await assert.rejects(updateHumanHelpStatus(client, "", "done"), /request id is required/);
  await assert.rejects(updateHumanHelpStatus(null, "help-1", "done"), /Database is not configured/);
});

await check("admin overview route checks the admin role before reading any data", () => {
  const route = read("app/api/admin/overview/route.ts");
  const adminCheck = route.indexOf("getAdminFromToken(client");
  assert.ok(adminCheck > 0, "overview does not check the admin session");
  assert.ok(route.includes("status: 401"), "overview does not answer 401");
  for (const reader of ["getAdminOverview(client", "listAccountsForAdmin(client", "listHumanHelpRequests(client"]) {
    assert.ok(route.indexOf(reader) > adminCheck, `${reader} runs before the admin check`);
  }
});

await check("help request status change (PATCH) is admin only", () => {
  const route = read("app/api/human-help/route.ts");
  const patch = route.slice(route.indexOf("export async function PATCH"), route.indexOf("export async function POST"));
  assert.ok(patch.includes("getAdminFromToken"), "PATCH does not check the admin session");
  assert.ok(patch.indexOf("getAdminFromToken") < patch.indexOf("updateHumanHelpStatus"), "PATCH updates before the admin check");
  assert.ok(patch.includes("status: 401"), "PATCH does not answer 401");
});

await check("/api/me returns the account without a password hash", () => {
  const route = read("app/api/me/route.ts");
  assert.ok(route.includes("getSessionUser"), "/api/me does not read the session user");
  assert.ok(!route.includes("passwordHash"), "/api/me mentions the password hash");
  assert.ok(route.includes("status: 401"), "/api/me does not answer 401 when signed out");
});

await check("header shows Admin only when /api/me reports the admin role", () => {
  const header = read("app/components/EditionHeader.tsx");
  assert.ok(header.includes('fetch("/api/me"'), "header does not ask /api/me");
  assert.ok(header.includes("...(isAdmin ? [ADMIN_NAV_LINK] : [])"), "header does not gate the admin link");
  assert.ok(!header.includes('PUBLIC_NAV_LINKS = [\n  { label: "Admin"'), "admin is in the public nav");
});

await check("admin page shows nothing until the server confirms the admin role", () => {
  const page = read("app/admin/page.tsx");
  assert.ok(page.includes('fetch("/api/admin/overview"'), "admin page does not load the admin overview");
  assert.ok(page.includes('setAccess("not-admin")'), "admin page has no not-admin state");
  assert.ok(page.includes("This page is for admin accounts only."), "admin page has no plain not-admin message");
  const gate = page.indexOf('if (access === "signed-out" || access === "not-admin"');
  const firstData = page.indexOf("Human help requests</h2>");
  assert.ok(gate > 0 && gate < firstData, "admin data renders before the access gate");
  assert.ok(page.includes('method: "PATCH"'), "admin page cannot change a request status");
});

await check("status migration adds the column with a new default and matches the schema", () => {
  const migration = readRepo("prisma/migrations/20261105140000_add_help_request_status/migration.sql");
  const schema = readRepo("prisma/schema.prisma");
  assert.ok(migration.includes('ALTER TABLE "HumanHelpRequest" ADD COLUMN "status" TEXT NOT NULL DEFAULT \'new\''));
  assert.ok(migration.includes('"HumanHelpRequest_status_idx"'));
  assert.ok(schema.includes('status    String   @default("new")'), "schema has no status field");
  assert.ok(schema.includes("@@index([status])"), "schema has no status index");
});

await check("changed files contain no em dash or en dash", () => {
  const files = [
    "lib/database-core.mjs",
    "lib/bearer.ts",
    "app/api/me/route.ts",
    "app/api/admin/overview/route.ts",
    "app/api/human-help/route.ts",
    "app/components/EditionHeader.tsx",
    "app/admin/page.tsx",
    "scripts/test-admin-area.mjs"
  ];
  const dashes = [String.fromCharCode(0x2013), String.fromCharCode(0x2014)];
  const bad = files.filter((file) => dashes.some((dash) => read(file).includes(dash)));
  assert.deepStrictEqual(bad, []);
});

console.log(`\n${passed} passed, 0 failed`);
