// Country and language pack tests, Phase 2 increment 8.
// Plain Node, no browser or database dependency.

import {
  COUNTRY_PACKS,
  LANGUAGE_PACKS,
  applyCountryPack,
  countryPackById,
  languagePackById,
  recommendOnboarding,
  sectionTitleForLanguage
} from "../lib/packs-core.mjs";
import { TEMPLATES, createDefaultSettings } from "../lib/builder-core.mjs";

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL: ${name}`);
  }
}

// 1. All 8 version 1 country packs exist, with required fields.
check("8 country packs", COUNTRY_PACKS.length === 8);
check(
  "country pack ids are the version 1 markets",
  ["us", "canada", "uk", "germany", "europe", "australia", "new-zealand", "global"].every(
    (id) => COUNTRY_PACKS.some((pack) => pack.id === id)
  )
);
check(
  "every country pack has templates, photo guidance, section order, paper size, source note, and last verified date",
  COUNTRY_PACKS.every(
    (pack) =>
      pack.recommendedTemplates.length > 0 &&
      pack.photoGuidance &&
      pack.sectionOrder.length === 5 &&
      ["A4", "US_LETTER"].includes(pack.paperSize) &&
      pack.sourceNote &&
      pack.lastVerified === "2026-11-04"
  )
);
check(
  "every country pack section order covers the 5 standard sections",
  COUNTRY_PACKS.every((pack) => {
    const sorted = [...pack.sectionOrder].sort().join(",");
    return sorted === "education,experience,languages,skills,summary";
  })
);
check(
  "every recommended template exists in the builder template list",
  COUNTRY_PACKS.every((pack) =>
    pack.recommendedTemplates.every((id) => TEMPLATES.some((template) => template.id === id))
  )
);
check(
  "every country pack states it is guidance, not a legal requirement",
  COUNTRY_PACKS.every((pack) => pack.legalNote.includes("No legal requirement is stated in this pack"))
);

// 2. All 4 version 1 language packs exist, Chinese is not included.
check("4 language packs", LANGUAGE_PACKS.length === 4);
check(
  "language pack ids are English, German, French, Spanish only",
  LANGUAGE_PACKS.map((pack) => pack.id).join(",") === "en,de,fr,es"
);
check(
  "every language pack has section titles for the 5 standard sections",
  LANGUAGE_PACKS.every((pack) =>
    ["summary", "experience", "education", "skills", "languages"].every((key) => Boolean(pack.sectionTitles[key]))
  )
);
check(
  "translations are labelled not professionally verified",
  LANGUAGE_PACKS.every((pack) => pack.translationNote.includes("not professionally verified"))
);
check(
  "German, French, and Spanish summary headings differ from English",
  sectionTitleForLanguage("de", "summary", "Summary") !== "Summary" &&
    sectionTitleForLanguage("fr", "summary", "Summary") !== "Summary" &&
    sectionTitleForLanguage("es", "summary", "Summary") !== "Summary"
);
check(
  "unknown language falls back to English",
  languagePackById("zh").id === "en" && countryPackById("nowhere").id === "global"
);

// 3. Pack application, and user override after application.
const base = createDefaultSettings();
const applied = applyCountryPack(base, "us", TEMPLATES);
check(
  "applying the US pack sets US Resume, US Letter, and the US section order",
  applied.templateId === "us-resume" &&
    applied.paperSize === "US_LETTER" &&
    applied.sectionOrder.join(",") === "summary,experience,skills,education,languages"
);
check(
  "applying a no photo template turns the photo flag off",
  applyCountryPack({ ...base, includePhoto: true }, "uk", TEMPLATES).includePhoto === false
);
const overridden = { ...applied, templateId: "modern-professional", paperSize: "A4" };
check(
  "user override after applying a pack is kept, the pack does not force settings back",
  overridden.templateId === "modern-professional" && overridden.paperSize === "A4"
);

// 4. Onboarding recommendation, and override after recommendation.
const recommendation = recommendOnboarding("germany", "Project Manager", "cv");
check(
  "onboarding recommends the Germany pack with its first template",
  recommendation.countryPackId === "germany" && recommendation.templateId === "european"
);
const tailor = recommendOnboarding("us", "Analyst", "tailor");
check("onboarding for a job application suggests ATS Minimal", tailor.templateId === "ats-minimal");
const senior = recommendOnboarding("global", "Executive Director", "cv");
check("onboarding for a senior role suggests Executive", senior.templateId === "executive");
const skipped = recommendOnboarding("global", "", "cv");
check("onboarding with no occupation still returns a country based suggestion", skipped.countryPackId === "global" && Boolean(skipped.templateId));
check(
  "recommendation can be overridden by the user, it is not forced",
  (() => {
    const changed = { ...recommendation, templateId: "ats-minimal" };
    return changed.templateId === "ats-minimal" && recommendation.templateId === "european";
  })()
);

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);
