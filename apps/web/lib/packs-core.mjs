// Country and language packs, Phase 2 increment 8.
// Pure JavaScript, no browser or database dependency, so the same
// logic can be tested with plain Node and used by the React pages.
// Guidance only, not legal advice. No fee, deadline, visa rule, or
// legal requirement is stated in any pack. Where a fact is not
// verified, the pack says so plainly instead of filling it in.
// lastVerified below is a project review date only. It is not an
// external legal verification, and no official source was rechecked
// in this increment. Translations are interface and heading
// translations only. They are not professionally verified, and user
// CV content is never auto translated without user confirmation.

export const STANDARD_SECTIONS = [
  "summary",
  "experience",
  "education",
  "skills",
  "languages"
];

const PACK_SOURCE_NOTE =
  "Guidance only, based on the template conventions already in this project (increments 1 and 4). No official source was rechecked in this increment.";
const PACK_LEGAL_NOTE =
  "No legal requirement is stated in this pack. Anything an employer or official body requires for a specific application must be checked in that posting or official source. Paper size and section order are formatting choices, not legal requirements.";
const TRANSLATION_NOTE =
  "Interface and heading translation only, not professionally verified. User CV content is never auto translated without user confirmation.";

export const COUNTRY_PACKS = [
  {
    id: "us",
    name: "United States",
    recommendedTemplates: ["us-resume", "ats-minimal"],
    paperSize: "US_LETTER",
    photoGuidance: "No photo, by US convention, as noted on the US Resume template. If a posting asks for a photo, follow the posting, not this pack.",
    sectionOrder: ["summary", "experience", "skills", "education", "languages"],
    conventions: [
      "Use the US Resume template section order: professional summary, experience, skills, education.",
      "Use US Letter paper size unless a posting asks for another size.",
      "For portal uploads, use ATS Minimal instead of a design first template."
    ],
    legalNote: PACK_LEGAL_NOTE,
    sourceNote: PACK_SOURCE_NOTE,
    lastVerified: "2026-11-04"
  },
  {
    id: "canada",
    name: "Canada",
    recommendedTemplates: ["ats-minimal", "modern-professional"],
    paperSize: "US_LETTER",
    photoGuidance: "No photo in this pack. If a posting asks for a photo, follow the posting, not this pack.",
    sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    conventions: [
      "Use a single column template for portal uploads.",
      "Use US Letter paper size unless a posting asks for another size."
    ],
    legalNote: PACK_LEGAL_NOTE,
    sourceNote: PACK_SOURCE_NOTE,
    lastVerified: "2026-11-04"
  },
  {
    id: "uk",
    name: "United Kingdom",
    recommendedTemplates: ["uk-cv", "ats-minimal"],
    paperSize: "A4",
    photoGuidance: "No photo, by UK convention, as noted on the UK CV template. If a posting asks for a photo, follow the posting, not this pack.",
    sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    conventions: [
      "Use the UK CV template section order: personal profile, experience, education, skills.",
      "Use A4 paper size unless a posting asks for another size.",
      "For portal uploads, use ATS Minimal instead of a design first template."
    ],
    legalNote: PACK_LEGAL_NOTE,
    sourceNote: PACK_SOURCE_NOTE,
    lastVerified: "2026-11-04"
  },
  {
    id: "germany",
    name: "Germany",
    recommendedTemplates: ["european", "modern-professional"],
    paperSize: "A4",
    photoGuidance: "Photo is optional in this pack. Do not add personal details an employer has not asked for. Check the posting first.",
    sectionOrder: ["experience", "education", "languages", "skills", "summary"],
    conventions: [
      "Use the European template section order, which follows the Europass style structure in this project.",
      "Use A4 paper size unless a posting asks for another size."
    ],
    legalNote: PACK_LEGAL_NOTE,
    sourceNote: PACK_SOURCE_NOTE,
    lastVerified: "2026-11-04"
  },
  {
    id: "europe",
    name: "Europe",
    recommendedTemplates: ["european", "ats-minimal"],
    paperSize: "A4",
    photoGuidance: "Photo is optional in this pack. Do not add personal details an employer has not asked for. Check the posting first.",
    sectionOrder: ["experience", "education", "languages", "skills", "summary"],
    conventions: [
      "Use the European template section order, which follows the Europass style structure in this project.",
      "Use A4 paper size unless a posting asks for another size.",
      "For portal uploads, use ATS Minimal instead of a design first template."
    ],
    legalNote: PACK_LEGAL_NOTE,
    sourceNote: PACK_SOURCE_NOTE,
    lastVerified: "2026-11-04"
  },
  {
    id: "australia",
    name: "Australia",
    recommendedTemplates: ["modern-professional", "ats-minimal"],
    paperSize: "A4",
    photoGuidance: "No photo in this pack. If a posting asks for a photo, follow the posting, not this pack.",
    sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    conventions: [
      "Use a single column template for portal uploads.",
      "Use A4 paper size unless a posting asks for another size."
    ],
    legalNote: PACK_LEGAL_NOTE,
    sourceNote: PACK_SOURCE_NOTE,
    lastVerified: "2026-11-04"
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    recommendedTemplates: ["modern-professional", "ats-minimal"],
    paperSize: "A4",
    photoGuidance: "No photo in this pack. If a posting asks for a photo, follow the posting, not this pack.",
    sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    conventions: [
      "Use a single column template for portal uploads.",
      "Use A4 paper size unless a posting asks for another size."
    ],
    legalNote: PACK_LEGAL_NOTE,
    sourceNote: PACK_SOURCE_NOTE,
    lastVerified: "2026-11-04"
  },
  {
    id: "global",
    name: "Global / Universal",
    recommendedTemplates: ["ats-minimal", "modern-professional"],
    paperSize: "A4",
    photoGuidance: "No photo in this pack. If a posting asks for a photo, follow the posting, not this pack.",
    sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    conventions: [
      "Use ATS Minimal for portal uploads, because its text order is parse friendly.",
      "Use A4 paper size unless a posting asks for another size."
    ],
    legalNote: PACK_LEGAL_NOTE,
    sourceNote: PACK_SOURCE_NOTE,
    lastVerified: "2026-11-04"
  }
];

export const LANGUAGE_PACKS = [
  {
    id: "en",
    name: "English",
    translationNote: TRANSLATION_NOTE,
    labels: {
      builder: "CV builder",
      template: "Template",
      paperSize: "Paper size",
      includePhoto: "Include photo",
      personalDetails: "Personal details",
      summary: "Summary",
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      languages: "Languages",
      exportPdf: "Export PDF",
      exportDocx: "Export DOCX",
      saveVersion: "Save version"
    },
    sectionTitles: {
      summary: "Summary",
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      languages: "Languages"
    }
  },
  {
    id: "de",
    name: "German",
    translationNote: TRANSLATION_NOTE,
    labels: {
      builder: "Lebenslauf erstellen",
      template: "Vorlage",
      paperSize: "Papierformat",
      includePhoto: "Foto einfügen",
      personalDetails: "Persönliche Angaben",
      summary: "Zusammenfassung",
      experience: "Berufserfahrung",
      education: "Ausbildung",
      skills: "Fähigkeiten",
      languages: "Sprachen",
      exportPdf: "PDF exportieren",
      exportDocx: "DOCX exportieren",
      saveVersion: "Version speichern"
    },
    sectionTitles: {
      summary: "Zusammenfassung",
      experience: "Berufserfahrung",
      education: "Ausbildung",
      skills: "Fähigkeiten",
      languages: "Sprachen"
    }
  },
  {
    id: "fr",
    name: "French",
    translationNote: TRANSLATION_NOTE,
    labels: {
      builder: "Créer un CV",
      template: "Modèle",
      paperSize: "Format de papier",
      includePhoto: "Inclure une photo",
      personalDetails: "Informations personnelles",
      summary: "Résumé",
      experience: "Expérience",
      education: "Formation",
      skills: "Compétences",
      languages: "Langues",
      exportPdf: "Exporter en PDF",
      exportDocx: "Exporter en DOCX",
      saveVersion: "Enregistrer une version"
    },
    sectionTitles: {
      summary: "Résumé",
      experience: "Expérience",
      education: "Formation",
      skills: "Compétences",
      languages: "Langues"
    }
  },
  {
    id: "es",
    name: "Spanish",
    translationNote: TRANSLATION_NOTE,
    labels: {
      builder: "Crear un CV",
      template: "Plantilla",
      paperSize: "Tamaño de papel",
      includePhoto: "Incluir foto",
      personalDetails: "Datos personales",
      summary: "Resumen",
      experience: "Experiencia",
      education: "Educación",
      skills: "Habilidades",
      languages: "Idiomas",
      exportPdf: "Exportar PDF",
      exportDocx: "Exportar DOCX",
      saveVersion: "Guardar versión"
    },
    sectionTitles: {
      summary: "Resumen",
      experience: "Experiencia",
      education: "Educación",
      skills: "Habilidades",
      languages: "Idiomas"
    }
  }
];

export function countryPackById(id) {
  return COUNTRY_PACKS.find((pack) => pack.id === id) || COUNTRY_PACKS.find((pack) => pack.id === "global");
}

export function languagePackById(id) {
  return LANGUAGE_PACKS.find((pack) => pack.id === id) || LANGUAGE_PACKS[0];
}

export function sectionTitleForLanguage(languageId, key, fallback) {
  const pack = languagePackById(languageId);
  if (pack.sectionTitles[key]) {
    return pack.sectionTitles[key];
  }
  return fallback || key;
}

// Apply a country pack to builder settings. Every applied setting can
// be changed by the user afterwards, because this returns a plain
// settings object and the builder keeps it editable. The photo flag
// is kept only when the new template allows a photo; otherwise it is
// turned off, so a no photo template never claims a photo.
export function applyCountryPack(settings, packId, templates) {
  const pack = countryPackById(packId);
  const templateId = pack.recommendedTemplates[0];
  let includePhoto = settings ? Boolean(settings.includePhoto) : false;
  if (templates) {
    const template = templates.find((item) => item.id === templateId);
    if (template && !template.photoAllowed) {
      includePhoto = false;
    }
  }
  return {
    ...(settings || {}),
    templateId,
    paperSize: pack.paperSize,
    sectionOrder: [...pack.sectionOrder],
    includePhoto,
    countryPackId: pack.id
  };
}

// Onboarding recommendation. This is a suggestion only. The caller
// must let the user change the template and the pack, and must never
// treat the recommendation as a forced choice. Occupation is free
// text from the user, never invented, and an empty occupation still
// returns a country based suggestion.
export function recommendOnboarding(countryId, occupation, goal) {
  const pack = countryPackById(countryId);
  const job = String(occupation || "").toLowerCase();
  let templateId = pack.recommendedTemplates[0];
  let reason = `Suggested from the ${pack.name} pack: ${templateId}. You can change the template and the pack in the builder.`;
  if (goal === "tailor") {
    templateId = "ats-minimal";
    reason = "Suggested for a job application: ATS Minimal, because its text order is parse friendly for portal uploads. You can change the template and the pack in the builder.";
  } else if (job.includes("executive") || job.includes("director") || job.includes("chief")) {
    templateId = "executive";
    reason = `Suggested for a senior role: Executive, with the ${pack.name} pack paper size and section order. You can change the template and the pack in the builder.`;
  }
  return {
    countryPackId: pack.id,
    countryName: pack.name,
    templateId,
    paperSize: pack.paperSize,
    sectionOrder: [...pack.sectionOrder],
    occupation: String(occupation || "").trim(),
    goal: goal || "cv",
    reason
  };
}
