// Prisma client generation at deploy time, Phase 2 increment 14.
// Run with plain Node, or as the prebuild step of npm run build:
//   node scripts/prisma-generate.mjs
// Tries to run prisma generate against prisma/schema.prisma, so the
// generated client exists where the app is built and deployed.
// This step must NEVER fail the build: in this workspace the Prisma
// engine download fails with ECONNRESET, so generation cannot run
// here, and the app must still build and run with the local browser
// fallback. A missing Prisma CLI, a failed generation, or any other
// error therefore prints a plain warning and exits 0. Where the
// engine download works, in CI or on hosting, the same script runs
// the real generation. No DATABASE_URL value is used here: dummy
// localhost values are set for the generate child process only,
// because generate does not connect to a database, it only reads
// the schema, and the real DATABASE_URL must come from the hosting
// environment, never from a file or a log.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const repoRoot = path.resolve(webDir, "..", "..");
const schema = path.join(repoRoot, "prisma", "schema.prisma");

const candidates = [
  path.join(repoRoot, "node_modules", ".bin", "prisma"),
  path.join(webDir, "node_modules", ".bin", "prisma"),
  path.join(webDir, "node_modules", "prisma", "build", "index.js")
];

let prismaBinary = null;
for (const candidate of candidates) {
  if (existsSync(candidate)) {
    prismaBinary = candidate;
    break;
  }
}

// No local Prisma CLI: try npx, which downloads the CLI package
// from the npm registry where the network allows it. This is the
// path that makes generation work on hosting, where prisma is not
// a dependency of this app. If the download or the generation
// fails, for example the engine download from binaries.prisma.sh,
// the warning below is printed and the build still continues.
let args;
let command;
if (!prismaBinary) {
  console.log("No local Prisma CLI found, trying npx prisma@6.14.0 generate.");
  args = ["--yes", "prisma@6.14.0", "generate", "--schema", schema];
  command = "npx";
} else if (prismaBinary.endsWith("index.js")) {
  args = [prismaBinary, "generate", "--schema", schema];
  command = process.execPath;
} else {
  args = ["generate", "--schema", schema];
  command = prismaBinary;
}
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://gcs_test:gcs_test_password@localhost:5432/gcs_test",
  DIRECT_URL: process.env.DIRECT_URL || "postgresql://gcs_test:gcs_test_password@localhost:5432/gcs_test"
};
const run = spawnSync(command, args, { cwd: webDir, env, encoding: "utf8", timeout: 120000 });
const output = `${run.stdout || ""}${run.stderr || ""}`;
if (run.status === 0) {
  console.log("Prisma client generated.");
  if (output.trim()) {
    console.log(output.trim());
  }
  process.exit(0);
}
console.log("WARNING: Prisma generate failed in this environment, so the generated client was not created here. This is expected where the Prisma engine download fails. The build continues, and the app keeps using local browser storage until the client is generated where the engine download works.");
if (output.trim()) {
  console.log(output.trim().slice(0, 1000));
}
process.exit(0);
