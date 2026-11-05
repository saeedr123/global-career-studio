// Design system tests, Phase 2 increment 16. Run with plain Node:
//   node scripts/test-design-system.mjs
// Checks the brand tokens, the shared shell, the landing page rules,
// and that no page file carries a hard-coded hex colour outside the
// token files. Reads source files only, no server or database is
// used, and no secret value appears here.

import assert from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const appDir = path.join(webDir, "app");

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${label}`);
}

function read(relative) {
  return readFileSync(path.join(webDir, relative), "utf8");
}

function listTsxFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...listTsxFiles(full));
    } else if (entry.endsWith(".tsx")) {
      found.push(full);
    }
  }
  return found;
}

// Files this increment changed, checked for dashes in copy.
const changedFiles = [
  "app/builder/page.tsx",
  "app/dashboard/page.tsx",
  "app/auth/page.tsx",
  "app/subscription/page.tsx",
  "app/writer/page.tsx",
  "app/letters/page.tsx",
  "app/ats/page.tsx",
  "app/onboarding/page.tsx",
  "app/profile/page.tsx",
  "app/admin/page.tsx",
  "app/components/PlaceholderCard.tsx",
  "app/components/EditionHeader.tsx",
  "app/components/SiteFooter.tsx",
  "app/components/RequireAuth.tsx",
  "app/layout.tsx",
  "app/page.tsx",
  "app/globals.css",
  "lib/design-tokens.ts",
  "lib/config.ts",
  "lib/builder-core.mjs",
  "lib/session-client.mjs",
  "scripts/test-rich-footer.mjs"
];

// App pages that require a sign-in, gated by RequireAuth.
const gatedPages = [
  "app/dashboard/page.tsx",
  "app/builder/page.tsx",
  "app/profile/page.tsx",
  "app/writer/page.tsx",
  "app/letters/page.tsx",
  "app/ats/page.tsx",
  "app/onboarding/page.tsx",
  "app/subscription/page.tsx"
];

function stripComments(text) {
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const tokens = read("lib/design-tokens.ts");

check("token file defines the navy values", () => {
  assert.ok(tokens.includes("#16294d"), "navy #16294d is missing");
  assert.ok(tokens.includes("#0f1e3a"), "navy-dark #0f1e3a is missing");
});

check("token file defines the gold values", () => {
  assert.ok(tokens.includes("#d9a441"), "gold #d9a441 is missing");
  assert.ok(tokens.includes("#f5e9c8"), "gold-soft #f5e9c8 is missing");
});

check("token file defines a type scale and a 44px tap target", () => {
  for (const key of ["hero:", "pageTitle:", "sectionTitle:", "body:", "small:"]) {
    assert.ok(tokens.includes(key), `typography key ${key} is missing`);
  }
  assert.ok(tokens.includes('tapTarget: "44px"'), "tap target 44px is missing");
});

check("token file defines motion values, Increment 18", () => {
  assert.ok(tokens.includes("motion:"), "motion tokens are missing");
  assert.ok(tokens.includes('fast: "150ms"'), "motion fast value is missing");
  assert.ok(tokens.includes('rise: "500ms"'), "motion rise value is missing");
  assert.ok(tokens.includes('lift: "-2px"'), "motion lift value is missing");
});

check("cards lift subtly on hover and focus with a gold border", () => {
  const css = read("app/globals.css");
  assert.ok(css.includes(".card:hover"), "no card hover rule");
  assert.ok(css.includes(".card:focus-within"), "no card focus rule");
  assert.ok(css.includes("translateY(var(--motion-lift))"), "card lift does not use the motion lift token");
  assert.ok(css.includes("border-color: var(--color-gold)"), "card hover has no gold border accent");
  assert.ok(css.includes("transition: transform var(--motion-base)"), "card has no transform transition");
});

check("buttons have smooth hover and press states", () => {
  const css = read("app/globals.css");
  assert.ok(css.includes(".btn-primary:active"), "no primary button press state");
  assert.ok(css.includes(".btn-secondary:active"), "no secondary button press state");
  assert.ok(css.includes("translateY(1px)"), "no button press shift");
  assert.ok(css.includes("transition: background-color var(--motion-fast)"), "primary button has no smooth transition");
});

check("hero carries a soft gold accent", () => {
  const css = read("app/globals.css");
  const hero = css.split(".hero {")[1].split("}")[0];
  assert.ok(hero.includes("radial-gradient"), "hero has no gold accent treatment");
  assert.ok(hero.includes("rgba(217, 164, 65"), "hero accent does not use the gold token colour");
});

check("entrance animation ends at full opacity and respects reduced motion", () => {
  const css = read("app/globals.css");
  assert.ok(css.includes("@keyframes rise"), "no rise keyframes");
  const keyframes = css.split("@keyframes rise")[1].split("\n}\n")[0];
  assert.ok(keyframes.includes("opacity: 1"), "rise keyframes do not end at full opacity");
  assert.ok(keyframes.includes("transform: translateY(0)"), "rise keyframes do not end at rest");
  assert.ok(css.includes(".reveal"), "no reveal class");
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "no reduced motion rule");
  const reduced = css.split("@media (prefers-reduced-motion: reduce)")[1];
  assert.ok(reduced.includes(".reveal"), "reduced motion does not switch the reveal class off");
  assert.ok(reduced.includes("animation: none"), "reduced motion does not disable the reveal animation");
  assert.ok(reduced.includes("transition-duration: 0.01ms"), "reduced motion does not neutralise transitions");
  const landingCopy = read("app/page.tsx");
  const reveals = (landingCopy.match(/reveal/g) || []).length;
  assert.ok(reveals >= 4, `landing page uses the reveal class ${reveals} times, expected at least 4`);
});

check("motion uses transform and opacity only, no new images or video", () => {
  const css = read("app/globals.css");
  assert.ok(!css.toLowerCase().includes("parallax"), "motion includes parallax");
  assert.ok(!css.includes("url("), "motion adds an image");
  assert.ok(!css.toLowerCase().includes("slider"), "motion adds a slider");
});

const layout = read("app/layout.tsx");

check("layout renders the header and footer landmarks", () => {
  assert.ok(layout.includes("<EditionHeader"), "layout does not render EditionHeader");
  assert.ok(layout.includes("<SiteFooter"), "layout does not render SiteFooter");
});

check("layout copy no longer says Shell or Not a finished product", () => {
  assert.ok(!layout.includes("Shell"), "layout still says Shell");
  assert.ok(!layout.includes("Not a finished product"), "layout still says Not a finished product");
});

const header = read("app/components/EditionHeader.tsx");
const footer = read("app/components/SiteFooter.tsx");

check("header takes its wordmark from the edition config, never hard coded", () => {
  assert.ok(header.includes("editionConfig.brandName"), "header does not read brandName from config");
  assert.ok(!header.includes("NVConsult CV Builder"), "header hard codes the nvconsult brand name");
  assert.ok(!header.includes("Global Career Studio"), "header hard codes the commercial brand name");
});

check("footer carries no operator line at all, Increment 18", () => {
  const footerCopy = stripComments(footer);
  assert.ok(!footerCopy.includes("23038594"), "footer still shows the operator IČO");
  assert.ok(!footerCopy.includes("IČO"), "footer still shows the IČO label");
  assert.ok(!footerCopy.includes("trading name of Saeed Rasul"), "footer still shows the trading name line");
  assert.ok(!footerCopy.includes("footerOperatorLine"), "footer still reads an operator line from config");
  assert.ok(!footerCopy.includes("Operator"), "footer still has an Operator column");
  assert.ok(footerCopy.includes('href="/builder"'), "footer lost the free builder link");
  assert.ok(footerCopy.includes('href="/auth"'), "footer lost the sign-in link");
  assert.ok(footerCopy.includes("https://nvconsult.eu"), "footer lost the nvconsult.eu trust link");
});

check("footer carries no sample-data line, Increment 20", () => {
  const footerCopy = stripComments(footer);
  assert.ok(!footerCopy.includes("Sample data is fictional"), "footer still shows the sample-data line");
  assert.ok(!footerCopy.includes("SAMPLE"), "footer still mentions SAMPLE");
  assert.ok(!footerCopy.includes("never presented as a real user"), "footer still carries the sample disclaimer");
});

check("config no longer defines a footer operator line", () => {
  const config = read("lib/config.ts");
  assert.ok(!config.includes("footerOperatorLine"), "config still defines footerOperatorLine");
  assert.ok(!config.includes("23038594"), "config still carries the operator IČO");
});

const landing = read("app/page.tsx");

check("landing page has one primary call to action per section", () => {
  const blocks = landing.split("<section").slice(1);
  assert.ok(blocks.length >= 4, `expected a hero plus 3 sections, found ${blocks.length} sections`);
  blocks.forEach((block, index) => {
    const count = (block.match(/btn-primary/g) || []).length;
    assert.strictEqual(count, 1, `section ${index} has ${count} primary buttons, expected 1`);
  });
});

check("landing page makes no counter or percentage claims", () => {
  // Comments are stripped first, so the header comment that names the
  // things this page avoids does not trip the check.
  const copy = landing.split("\n").filter((line) => !line.trim().startsWith("//")).join("\n");
  assert.ok(!copy.includes("%"), "landing page contains a percentage");
  assert.ok(!copy.toLowerCase().includes("testimonial"), "landing page contains a testimonial");
  assert.ok(!copy.toLowerCase().includes("success rate"), "landing page contains a success rate claim");
  assert.ok(!copy.toLowerCase().includes("counter"), "landing page contains a counter claim");
});

check("landing page counts come from the lists, never typed in by hand", () => {
  assert.ok(landing.includes("TEMPLATES.length"), "template count is not computed from TEMPLATES");
  assert.ok(landing.includes("COUNTRY_PACKS.length"), "country pack count is not computed from COUNTRY_PACKS");
  assert.ok(landing.includes("LETTER_TYPES.length"), "letter count is not computed from LETTER_TYPES");
});

check("no page file contains a hard-coded hex colour", () => {
  const bad = [];
  for (const file of listTsxFiles(appDir)) {
    const text = readFileSync(file, "utf8");
    if (/#[0-9a-fA-F]{3,8}\b/.test(text)) {
      bad.push(path.relative(webDir, file));
    }
  }
  assert.deepStrictEqual(bad, [], `hard-coded hex colour in: ${bad.join(", ")}`);
});

check("changed files contain no em dash or en dash", () => {
  const bad = [];
  for (const file of changedFiles) {
    const text = read(file);
    if (text.includes("\u2014") || text.includes("\u2013")) {
      bad.push(file);
    }
  }
  assert.deepStrictEqual(bad, [], `em or en dash in: ${bad.join(", ")}`);
});

check("public header nav shows public things only, never app pages or admin", () => {
  const headerCopy = stripComments(header);
  for (const href of ["/builder", "/profile", "/writer", "/letters", "/ats", "/onboarding", "/subscription", "/admin"]) {
    assert.ok(!headerCopy.includes(`"${href}"`), `header links to app page ${href}`);
  }
  assert.ok(!headerCopy.includes("Admin"), "header mentions Admin");
  const publicNav = headerCopy.split("const PUBLIC_NAV_LINKS = [")[1].split("];")[0];
  for (const href of ["/", "/#how-it-works", "/#templates", "/#free"]) {
    assert.ok(publicNav.includes(`"${href}"`), `public nav is missing ${href}`);
  }
  assert.ok(!publicNav.includes("/dashboard"), "public nav shows Dashboard to visitors");
  assert.ok(!publicNav.includes("/auth"), "public nav shows the account link to visitors");
  assert.ok(headerCopy.includes("signedIn"), "header does not gate Dashboard and Account on sign-in");
  assert.ok(headerCopy.includes("/dashboard"), "header never shows Dashboard to signed-in users");
  assert.ok(headerCopy.includes('"Sign in"'), "header never offers Sign in to visitors");
});

check("public header and footer carry no local only or not a finished product copy", () => {
  for (const file of ["app/components/EditionHeader.tsx", "app/components/SiteFooter.tsx", "app/page.tsx", "app/auth/page.tsx"]) {
    const copy = stripComments(read(file));
    assert.ok(!copy.toLowerCase().includes("local only"), `${file} still says local only in public copy`);
    assert.ok(!copy.includes("Not a finished product"), `${file} still says not a finished product`);
    assert.ok(!copy.includes("PROJECT_STATUS"), `${file} still mentions PROJECT_STATUS`);
  }
});

check("footer never links to admin or the dashboard", () => {
  const footerCopy = stripComments(footer);
  assert.ok(!footerCopy.includes("/admin"), "footer links to admin");
  assert.ok(!footerCopy.includes("/dashboard"), "footer links to the dashboard");
  assert.ok(!footerCopy.includes("Admin"), "footer mentions Admin");
  assert.ok(footerCopy.includes('href="/builder"'), "footer lost the free builder link");
  assert.ok(footerCopy.includes('href="/auth"'), "footer lost the sign-in link");
});

check("landing page links its sections by anchor and keeps how it works public", () => {
  assert.ok(landing.includes('id="templates"'), "landing page has no templates anchor");
  assert.ok(landing.includes('id="how-it-works"'), "landing page has no how-it-works anchor");
  assert.ok(landing.includes('id="free"'), "landing page has no free anchor");
  const hero = landing.split('<section className="hero">')[1].split("</section>")[0];
  assert.ok(hero.includes('href="/#how-it-works"'), "hero See how it works does not point at the public section");
  assert.ok(!hero.includes('href="/onboarding"'), "hero still sends See how it works to the gated wizard");
});

check("landing page carries no internal proof copy", () => {
  const copy = stripComments(landing);
  assert.ok(!copy.toLowerCase().includes("increment"), "landing page mentions an increment");
  assert.ok(!copy.includes("What increment"), "landing page still has an increment proof section");
  assert.ok(!copy.includes("Database layer ready"), "landing page still has the internal status box");
});

check("every app page is wrapped in the sign-in gate", () => {
  const bad = [];
  for (const file of gatedPages) {
    const text = read(file);
    if (!text.includes('import RequireAuth from "../components/RequireAuth";') || !text.includes("<RequireAuth>")) {
      bad.push(file);
    }
  }
  assert.deepStrictEqual(bad, [], `ungated app page: ${bad.join(", ")}`);
});

check("admin stays an unlinked route, never linked from any page", () => {
  const bad = [];
  for (const file of listTsxFiles(appDir)) {
    if (file.endsWith("app/admin/page.tsx")) {
      continue;
    }
    const text = readFileSync(file, "utf8");
    if (text.includes('"/admin"') || text.includes("'/admin'")) {
      bad.push(path.relative(webDir, file));
    }
  }
  assert.deepStrictEqual(bad, [], `admin linked from: ${bad.join(", ")}`);
});

console.log(`${passed} passed, 0 failed`);
