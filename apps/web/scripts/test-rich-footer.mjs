// Rich footer tests, Phase 2 increment 20. Run with plain Node:
//   node scripts/test-rich-footer.mjs
// Checks the footer rebuilt to match the main nvconsult.eu footer:
// a brand block, an Explore column, a Company column, social links,
// and a Start here column, with no sample-data line, no operator
// line, and no phone number. Every footer link must point at a real
// route in this app or at one of the listed main-site or social
// URLs. Also checks the landing page booking strip and the richer
// hero and card styles. Reads source files only, no server or
// database is used, and no secret value appears here.

import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
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

function stripComments(text) {
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const footer = read("app/components/SiteFooter.tsx");
const footerCopy = stripComments(footer);
const config = read("lib/config.ts");
const landing = read("app/page.tsx");
const css = read("app/globals.css");

const COMPANY_URLS = [
  "https://nvconsult.eu/about-us/",
  "https://nvconsult.eu/service/",
  "https://nvconsult.eu/consultation-plans/",
  "https://nvconsult.eu/ai-finder/",
  "https://nvconsult.eu/contact/"
];

const SOCIAL_URLS = [
  "https://www.facebook.com/nvconsultants",
  "https://www.linkedin.com/company/nvconsulteu",
  "https://x.com/Vision_conrl"
];

// Real routes in this app, plus in-page anchors on the landing page.
const APP_ROUTES = [
  "/",
  "/builder",
  "/dashboard",
  "/auth",
  "/profile",
  "/writer",
  "/letters",
  "/ats",
  "/onboarding",
  "/subscription",
  "/human-help",
  "/#templates",
  "/#how-it-works",
  "/#free"
];

check("footer has no sample-data line and no SAMPLE anywhere", () => {
  assert.ok(!footerCopy.includes("Sample data is fictional"), "footer still shows the sample-data line");
  assert.ok(!footerCopy.includes("SAMPLE"), "footer still mentions SAMPLE");
  assert.ok(!footerCopy.includes("never presented as a real user"), "footer still carries the sample disclaimer");
});

check("footer has no operator line and no phone number", () => {
  assert.ok(!footerCopy.includes("23038594"), "footer still shows the operator IČO");
  assert.ok(!footerCopy.includes("IČO"), "footer still shows the IČO label");
  assert.ok(!footerCopy.includes("trading name of Saeed Rasul"), "footer still shows the trading name line");
  assert.ok(!footerCopy.includes("Bystrcká"), "footer still shows the street address");
  assert.ok(!footerCopy.includes("tel:"), "footer links a phone number");
});

check("footer brand block uses the edition config and the journey line is NVConsult only", () => {
  assert.ok(footerCopy.includes("editionConfig.brandName"), "footer does not read brandName from config");
  assert.ok(footerCopy.includes("editionConfig.tagline"), "footer does not read tagline from config");
  assert.ok(footerCopy.includes("editionConfig.footerJourneyLine"), "footer does not read the journey line from config");
  assert.ok(
    config.includes("from someone who has lived the journey from work visa to permanent residence"),
    "nvconsult config lost the lived-journey line"
  );
  const commercial = config.split("commercial: {")[1];
  assert.ok(commercial.includes('footerJourneyLine: ""'), "commercial edition still carries a journey line");
});

check("footer Explore column links to real Studio pages", () => {
  assert.ok(footerCopy.includes("Explore"), "footer has no Explore column");
  for (const href of ["/#templates", "/#how-it-works", "/letters", "/ats", "/human-help"]) {
    assert.ok(footerCopy.includes(`"${href}"`), `Explore column is missing ${href}`);
  }
});

check("footer Company column links to the exact main-site URLs", () => {
  assert.ok(footerCopy.includes("Company"), "footer has no Company column");
  for (const url of COMPANY_URLS) {
    assert.ok(footerCopy.includes(`"${url}"`), `Company column is missing ${url}`);
  }
});

check("footer social links use the exact main-site social URLs", () => {
  for (const url of SOCIAL_URLS) {
    assert.ok(footerCopy.includes(`"${url}"`), `footer is missing social link ${url}`);
  }
});

check("footer keeps Start here links, the free beta note, and the nvconsult.eu link", () => {
  assert.ok(footerCopy.includes("Start here"), "footer has no Start here column");
  assert.ok(footerCopy.includes('href="/builder"'), "footer lost the free builder link");
  assert.ok(footerCopy.includes('href="/auth"'), "footer lost the sign-in link");
  assert.ok(footerCopy.includes("editionConfig.footerHelpHref"), "footer does not read the help link from config");
  assert.ok(footerCopy.includes("editionConfig.footerNote"), "footer lost the free beta note");
  assert.ok(footerCopy.includes('href="https://nvconsult.eu"'), "footer lost the nvconsult.eu site link");
});

check("every footer link points at a real route or a listed main-site or social URL", () => {
  const allowed = new Set([...APP_ROUTES, ...COMPANY_URLS, ...SOCIAL_URLS, "https://nvconsult.eu"]);
  const hrefs = [
    ...[...footerCopy.matchAll(/href="([^"]+)"/g)].map((match) => match[1]),
    ...[...footerCopy.matchAll(/href: "([^"]+)"/g)].map((match) => match[1])
  ];
  assert.ok(hrefs.length >= 12, `footer has only ${hrefs.length} links, expected at least 12`);
  const bad = hrefs.filter((href) => !allowed.has(href));
  assert.deepStrictEqual(bad, [], `footer links to an unlisted destination: ${bad.join(", ")}`);
  for (const href of hrefs) {
    if (href.startsWith("/") && !href.startsWith("/#")) {
      const pagePath = path.join(appDir, href.slice(1), "page.tsx");
      assert.ok(existsSync(pagePath), `footer links to ${href} but no page exists at ${pagePath}`);
    }
  }
});

check("footer has no newsletter signup form", () => {
  assert.ok(!footerCopy.toLowerCase().includes("newsletter"), "footer mentions a newsletter");
  assert.ok(!footerCopy.includes("<form"), "footer contains a form");
  assert.ok(!footerCopy.toLowerCase().includes("subscribe"), "footer asks visitors to subscribe");
});

check("landing page has a booking strip that sends visitors to the human help funnel", () => {
  const strip = landing.split('className="hero booking-strip"')[1];
  assert.ok(strip, "landing page has no booking strip");
  const stripSection = strip.split("</section>")[0];
  assert.ok(stripSection.includes("Not sure where to start?"), "booking strip has no heading");
  assert.ok(stripSection.includes('href="/human-help"'), "booking strip does not link to the funnel");
  assert.ok((stripSection.match(/btn-primary/g) || []).length === 1, "booking strip must have exactly one primary button");
  assert.ok(!stripSection.includes("cal.com"), "booking strip links straight to booking instead of the funnel");
});

check("landing page free section booking link goes to the funnel, not the homepage", () => {
  const freeSection = landing.split('id="free"')[1].split("</section>")[0];
  assert.ok(freeSection.includes('href="/human-help"'), "free section still links booking to the nvconsult.eu homepage");
  assert.ok(!freeSection.includes('href="https://nvconsult.eu"'), "free section still links to the nvconsult.eu homepage");
});

check("hero has the richer gold and navy gradient treatment", () => {
  const hero = css.split(".hero {")[1].split("}")[0];
  const gradients = (hero.match(/radial-gradient/g) || []).length;
  assert.ok(gradients >= 2, `hero has ${gradients} radial gradients, expected at least 2`);
  assert.ok(hero.includes("linear-gradient"), "hero has no navy gradient");
  assert.ok(hero.includes("border-bottom: 3px solid var(--color-gold)"), "hero has no gold bottom rule");
});

check("card titles carry a gold rule and sections are divided by gold rules", () => {
  assert.ok(css.includes(".card-title::after"), "no gold rule under card titles");
  const rule = css.split(".card-title::after")[1].split("}")[0];
  assert.ok(rule.includes("background: var(--color-gold)"), "card title rule does not use the gold token");
  assert.ok(css.includes(".section-divider"), "no section divider class");
  const divider = css.split(".section-divider")[1].split("}")[0];
  assert.ok(divider.includes("linear-gradient"), "section divider is not a gold gradient line");
  assert.ok(landing.includes('className="section-divider'), "landing page uses no section divider");
});

check("changed files contain no em dash or en dash", () => {
  const bad = [];
  for (const file of [
    "app/components/SiteFooter.tsx",
    "app/page.tsx",
    "app/globals.css",
    "lib/config.ts",
    "scripts/test-rich-footer.mjs"
  ]) {
    const text = read(file);
    if (text.includes("\u2014") || text.includes("\u2013")) {
      bad.push(file);
    }
  }
  assert.deepStrictEqual(bad, [], `em or en dash in: ${bad.join(", ")}`);
});

console.log(`${passed} passed, 0 failed`);
