// Build the template engine before the Next.js build, Phase 2 increment 14 fix.
// The engine package declares main dist/index.js and types dist/index.d.ts,
// but dist/ is gitignored and never pushed to GitHub, so a fresh checkout,
// such as the one Vercel builds from, has no dist and the Next.js build
// fails with "Cannot find module '@global-career-studio/template-engine'".
// That exact failure was reproduced locally on 2026-11-05 by moving dist
// aside and running npm run build. This script compiles the engine from
// src with the TypeScript installed for the web app, so the build works
// from a fresh checkout. It must NEVER fail the build: if the compiler
// is missing or the compile fails, it prints a plain warning and exits 0,
// and the build continues. Where dist already exists, for example this
// workspace, a failed compile here leaves the existing dist in place.
// No secret or connection string is used here. No em dashes in this file.
import { spawnSync } from "node:child_process";
import { existsSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const repoRoot = path.resolve(webDir, "..", "..");
const engineDir = path.join(repoRoot, "packages", "template-engine");
const tsconfig = path.join(engineDir, "tsconfig.json");
const distIndex = path.join(engineDir, "dist", "index.js");
const distTypes = path.join(engineDir, "dist", "index.d.ts");

function newestSrcTime(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestSrcTime(full));
    } else if (entry.name.endsWith(".ts")) {
      newest = Math.max(newest, statSync(full).mtimeMs);
    }
  }
  return newest;
}

if (!existsSync(tsconfig)) {
  console.log("WARNING: template engine tsconfig not found, skipping engine build.");
  process.exit(0);
}

// Skip the compile when dist is already newer than every source file.
if (existsSync(distIndex) && existsSync(distTypes)) {
  const distTime = Math.min(statSync(distIndex).mtimeMs, statSync(distTypes).mtimeMs);
  const srcDir = path.join(engineDir, "src");
  if (existsSync(srcDir) && distTime >= newestSrcTime(srcDir)) {
    console.log("Template engine dist is up to date, skipping engine build.");
    process.exit(0);
  }
}

const tscCandidates = [
  path.join(repoRoot, "node_modules", "typescript", "bin", "tsc"),
  path.join(webDir, "node_modules", "typescript", "bin", "tsc"),
  path.join(engineDir, "node_modules", "typescript", "bin", "tsc")
];
let tsc = null;
for (const candidate of tscCandidates) {
  if (existsSync(candidate)) {
    tsc = candidate;
    break;
  }
}
if (!tsc) {
  console.log("WARNING: TypeScript compiler not found, skipping engine build. The Next.js build may fail if the engine dist is missing.");
  process.exit(0);
}

// The engine source imports fs, path, adm-zip and pdfkit, so it needs
// @types/node, @types/adm-zip and @types/pdfkit. With npm workspaces
// those are hoisted to the repo root node_modules/@types, which is an
// ancestor of the engine directory, so tsc finds them on its own. Point
// at the root first, and fall back to the web app node_modules/@types
// for a non-workspace install.
const typeRoots = existsSync(path.join(repoRoot, "node_modules", "@types"))
  ? path.join(repoRoot, "node_modules", "@types")
  : path.join(webDir, "node_modules", "@types");
const args = [tsc, "-p", tsconfig];
if (existsSync(typeRoots)) {
  args.push("--typeRoots", typeRoots);
}
const run = spawnSync(process.execPath, args, { cwd: webDir, encoding: "utf8", timeout: 120000 });
const output = `${run.stdout || ""}${run.stderr || ""}`;
if (run.status === 0 && existsSync(distIndex) && existsSync(distTypes)) {
  console.log("Template engine built.");
  process.exit(0);
}
console.log("WARNING: Template engine build failed in this environment, so dist was not created here. The build continues, and the Next.js build may fail if dist is missing.");
if (output.trim()) {
  console.log(output.trim().slice(0, 1000));
}
process.exit(0);
