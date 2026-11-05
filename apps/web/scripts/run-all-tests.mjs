// Single test runner, Phase 2 increment 14. Run with plain Node:
//   node scripts/run-all-tests.mjs
// Runs every test suite in order: template engine, builder, import,
// auth, writer, packs, billing, admin, AI provider, LinkedIn import,
// database, session, session client, auth simplified, design system,
// rich footer, human help, security, and the end to end smoke test. Reports pass and fail counts per
// non zero on any failure. No test output file, database, payment,
// or live service is used here.

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const engineDir = path.resolve(webDir, "..", "..", "packages", "template-engine");

const suites = [
  { name: "template engine", command: "npm", args: ["test"], cwd: engineDir },
  { name: "builder", command: process.execPath, args: ["scripts/test-builder.mjs"], cwd: webDir },
  { name: "import", command: process.execPath, args: ["scripts/test-import.mjs"], cwd: webDir },
  { name: "auth", command: process.execPath, args: ["scripts/test-auth.mjs"], cwd: webDir },
  { name: "writer", command: process.execPath, args: ["scripts/test-writer.mjs"], cwd: webDir },
  { name: "packs", command: process.execPath, args: ["scripts/test-packs.mjs"], cwd: webDir },
  { name: "billing", command: process.execPath, args: ["scripts/test-billing.mjs"], cwd: webDir },
  { name: "admin", command: process.execPath, args: ["scripts/test-admin.mjs"], cwd: webDir },
  { name: "ai provider", command: process.execPath, args: ["scripts/test-ai-provider.mjs"], cwd: webDir },
  { name: "linkedin import", command: process.execPath, args: ["scripts/test-linkedin.mjs"], cwd: webDir },
  { name: "database", command: process.execPath, args: ["scripts/test-database.mjs"], cwd: webDir },
  { name: "session", command: process.execPath, args: ["scripts/test-session.mjs"], cwd: webDir },
  { name: "session client", command: process.execPath, args: ["scripts/test-session-client.mjs"], cwd: webDir },
  { name: "auth simplified", command: process.execPath, args: ["scripts/test-auth-simplified.mjs"], cwd: webDir },
  { name: "design system", command: process.execPath, args: ["scripts/test-design-system.mjs"], cwd: webDir },
  { name: "rich footer", command: process.execPath, args: ["scripts/test-rich-footer.mjs"], cwd: webDir },
  { name: "human help", command: process.execPath, args: ["scripts/test-human-help.mjs"], cwd: webDir },
  { name: "security", command: process.execPath, args: ["scripts/test-security.mjs"], cwd: webDir },
  { name: "end to end smoke", command: process.execPath, args: ["scripts/test-e2e-smoke.mjs"], cwd: webDir }
];

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

const results = [];
let anyFailed = false;

for (const suite of suites) {
  console.log(`\n=== Suite: ${suite.name} ===`);
  // On Windows npm is npm.cmd, which spawnSync only finds through a shell.
  const useShell = suite.command === "npm" && process.platform === "win32";
  const run = spawnSync(suite.command, suite.args, { cwd: suite.cwd, encoding: "utf8", shell: useShell });
  const output = `${run.stdout || ""}${run.stderr || ""}`;
  if (output.trim()) {
    console.log(output.trim());
  }
  if (run.error) {
    console.log(`ERROR: ${run.error.message}`);
  }
  let passed = countMatches(output, /^PASS:/gm);
  let failed = countMatches(output, /^FAIL:/gm);
  const totalMatch = output.match(/(\d+) passed, (\d+) failed/);
  if (totalMatch) {
    passed = Number(totalMatch[1]);
    failed = Number(totalMatch[2]);
  } else {
    const totalOnlyMatch = output.match(/Total: (\d+) passed, 0 failed/);
    if (totalOnlyMatch) {
      passed = Number(totalOnlyMatch[1]);
      failed = 0;
    }
  }
  const exitCode = run.status === null ? 1 : run.status;
  if (exitCode !== 0 && failed === 0) {
    failed = 1;
  }
  const ok = exitCode === 0 && failed === 0;
  if (!ok) {
    anyFailed = true;
  }
  results.push({ name: suite.name, passed, failed, exitCode, ok });
  console.log(`--- ${suite.name}: ${passed} passed, ${failed} failed, exit ${exitCode} (${ok ? "PASS" : "FAIL"}) ---`);
}

console.log("\n=== All suites summary ===");
for (const result of results) {
  console.log(`${result.name}: ${result.passed} passed, ${result.failed} failed, exit ${result.exitCode}`);
}
const totalPassed = results.reduce((sum, item) => sum + item.passed, 0);
const totalFailed = results.reduce((sum, item) => sum + item.failed, 0);
console.log(`Total: ${totalPassed} passed, ${totalFailed} failed across ${results.length} suites.`);
if (anyFailed) {
  console.log("RESULT: FAILED. At least one suite failed, see above.");
  process.exit(1);
}
console.log("RESULT: PASSED. Every suite passed.");
