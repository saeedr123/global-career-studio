// Builder core, Phase 2 increment 3.
// Pure JavaScript, no browser or database dependency, so the same logic
// can be tested with plain Node and used by the React builder page.
// Sample data only. The starting profile is fictional and marked SAMPLE.
// User edits in the builder are local draft edits, not real history, and
// drafts are stored in the browser only in this increment, until a real
// database is connected after Prisma validation passes.

export const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "education",
  "skills",
  "languages"
];

export const SECTION_TITLES = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  languages: "Languages"
};

export const TEMPLATES = [
  { id: "ats-minimal", name: "ATS Minimal", photoAllowed: false, description: "Single column, plain, no photo. Best for portal uploads and parsing.", atsNote: "Parse friendly single column. Recommended for portal uploads." },
  { id: "modern-professional", name: "Modern Professional", photoAllowed: true, description: "Single column with a navy header block and accent lines. Clean and professional.", atsNote: "Single column, parse friendly text order." },
  { id: "executive", name: "Executive", photoAllowed: true, description: "Centered header, large name, skills before education. For senior roles.", atsNote: "Single column, parse friendly text order." },
  { id: "corporate", name: "Corporate", photoAllowed: true, description: "Formal band header, experience first, compact spacing. For corporate roles.", atsNote: "Single column, parse friendly text order." },
  { id: "elegant", name: "Elegant", photoAllowed: true, description: "Serif type, centered header, education before experience. For a refined look.", atsNote: "Single column, parse friendly text order." },
  { id: "european", name: "European", photoAllowed: true, description: "Europass style structure: personal information, work, education, language skills. Not a copy of the official Europass design.", atsNote: "Single column, parse friendly text order. Europass style structure only." },
  { id: "us-resume", name: "US Resume", photoAllowed: false, description: "US style: professional summary, experience, skills, then education. No photo by US convention.", atsNote: "Single column, parse friendly text order. No photo, by US convention." },
  { id: "uk-cv", name: "UK CV", photoAllowed: false, description: "UK style: personal profile, experience, education, skills. No photo by UK convention.", atsNote: "Single column, parse friendly text order. No photo, by UK convention." },
  { id: "sidebar", name: "Sidebar", photoAllowed: true, description: "Design first: narrow left sidebar for skills and languages, wide main column for the rest.", atsNote: "Design first, not ATS friendly. For portal uploads, use ATS Minimal instead." },
  { id: "two-column", name: "Two-column", photoAllowed: true, description: "Design first: wide main column on the left, narrow right column for skills and languages.", atsNote: "Design first, not ATS friendly. For portal uploads, use ATS Minimal instead." }
];

export function templateById(id) {
  return TEMPLATES.find((item) => item.id === id) || TEMPLATES[0];
}

export function photoIncluded(templateId, flag) {
  return Boolean(flag) && templateById(templateId).photoAllowed;
}

export function createSampleProfile() {
  return {
    sampleMarker: "SAMPLE",
    fullName: "Sam Sample",
    headline: "Sample Project Coordinator",
    email: "sam.sample@example.test",
    phone: "+00 000 000 000",
    city: "Sample City",
    summary:
      "SAMPLE: Fictional sample summary for layout testing only. Organised sample project coordinator with experience in planning, scheduling, and clear written updates for small teams.",
    experience: [
      {
        employer: "Sample Projects Ltd",
        jobTitle: "Sample Project Coordinator",
        location: "Sample City",
        period: "2022 to 2024",
        bullets: [
          "Coordinated sample project schedules and tracked sample milestones.",
          "Prepared sample status updates for a sample project team."
        ]
      }
    ],
    education: [
      {
        institution: "Sample College",
        qualification: "Sample Diploma in Project Support",
        period: "2018 to 2020"
      }
    ],
    skills: ["Planning", "Scheduling", "Written updates", "Spreadsheets"],
    languages: ["English (Fluent, sample level)"],
    customSections: []
  };
}

export function createDefaultSettings() {
  return {
    templateId: "ats-minimal",
    paperSize: "A4",
    includePhoto: false,
    sectionOrder: [...DEFAULT_SECTION_ORDER]
  };
}

export function sectionOrderFor(profile, requested) {
  const customKeys = (profile.customSections || []).map((item) => item.key);
  const effective = [...DEFAULT_SECTION_ORDER, ...customKeys];
  if (!requested || requested.length === 0) {
    return effective;
  }
  const seen = new Set();
  const ordered = [];
  for (const key of requested) {
    if (effective.includes(key) && !seen.has(key)) {
      ordered.push(key);
      seen.add(key);
    }
  }
  for (const key of effective) {
    if (!seen.has(key)) {
      ordered.push(key);
      seen.add(key);
    }
  }
  return ordered;
}

export function moveSection(order, key, direction) {
  const next = [...order];
  const index = next.indexOf(key);
  if (index === -1) {
    return next;
  }
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= next.length) {
    return next;
  }
  const item = next.splice(index, 1)[0];
  next.splice(target, 0, item);
  return next;
}

export function addCustomSection(profile, title, text) {
  const cleanTitle = String(title || "").trim() || "Custom section";
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const existing = profile.customSections || [];
  const key = `custom-${existing.length + 1}`;
  return {
    ...profile,
    customSections: [...existing, { key, title: cleanTitle, lines }]
  };
}

export function removeCustomSection(profile, key) {
  return {
    ...profile,
    customSections: (profile.customSections || []).filter((item) => item.key !== key)
  };
}

export function sectionTitle(profile, key) {
  if (SECTION_TITLES[key]) {
    return SECTION_TITLES[key];
  }
  const custom = (profile.customSections || []).find((item) => item.key === key);
  return custom ? custom.title : key;
}

// Preview sections, mirroring the template engine section builder, so
// the live preview shows the same order and content as the export.
export function buildPreviewSections(profile, sectionOrder) {
  const order = sectionOrderFor(profile, sectionOrder);
  const all = {
    summary: {
      key: "summary",
      title: "Summary",
      lines: [`SAMPLE: ${profile.summary || ""}`],
      bullets: []
    },
    experience: {
      key: "experience",
      title: "Experience",
      lines: [],
      bullets: (profile.experience || []).map((entry) => [
        `${entry.jobTitle}, ${entry.employer}, ${entry.location}, ${entry.period}`,
        ...(entry.bullets || [])
      ])
    },
    education: {
      key: "education",
      title: "Education",
      lines: (profile.education || []).map(
        (entry) => `${entry.qualification}, ${entry.institution}, ${entry.period}`
      ),
      bullets: []
    },
    skills: {
      key: "skills",
      title: "Skills",
      lines: [(profile.skills || []).join(", ")],
      bullets: []
    },
    languages: {
      key: "languages",
      title: "Languages",
      lines: [(profile.languages || []).join(", ")],
      bullets: []
    }
  };
  for (const custom of profile.customSections || []) {
    all[custom.key] = { key: custom.key, title: custom.title, lines: custom.lines, bullets: [] };
  }
  return order.map((key) => all[key]).filter(Boolean);
}

export function validateProfile(profile) {
  const missing = [];
  if (!profile.fullName || !profile.fullName.trim()) {
    missing.push("fullName");
  }
  if (!profile.headline || !profile.headline.trim()) {
    missing.push("headline");
  }
  if (!profile.summary || !profile.summary.trim()) {
    missing.push("summary");
  }
  return missing;
}

// Draft storage helpers. Drafts are plain JSON objects, so they can be
// stored in localStorage in the browser and in a file in tests.
export function createDraft(profile, settings, label) {
  return {
    label: label || "Draft",
    savedAt: new Date().toISOString(),
    profile: JSON.parse(JSON.stringify(profile)),
    settings: JSON.parse(JSON.stringify(settings))
  };
}

export function serialiseDraft(draft) {
  return JSON.stringify(draft);
}

export function parseDraft(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !parsed.profile || !parsed.settings) {
    throw new Error("Draft is missing profile or settings.");
  }
  return parsed;
}

export function pushVersion(history, draft, maxVersions) {
  const next = [draft, ...(history || [])];
  return next.slice(0, maxVersions || 10);
}

export function restoreVersion(history, index) {
  if (!history || index < 0 || index >= history.length) {
    return null;
  }
  return history[index];
}

// Guided paste import.
// Supported structured text format, documented on the builder page:
//   Name: ...
//   Headline: ...
//   Email: ...
//   Phone: ...
//   City: ...
//   Summary: ...
//   Experience: Employer | Job title | Location | Period
//   - bullet line
//   Education: Qualification | Institution | Period
//   Skills: item, item
//   Languages: item, item
//   Custom: Title
//   line of custom text
// Anything not recognised is reported in unparsedLines, never silently
// dropped into a profile field. The caller must show the parsed profile
// for correction before it becomes a document.
export function parseImport(text) {
  const profile = {
    sampleMarker: "SAMPLE",
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    city: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
    customSections: []
  };
  const warnings = [];
  const unparsedLines = [];
  let currentExperience = null;
  let currentCustom = null;

  const lines = String(text || "").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const field = (name) => {
      const prefix = `${name}:`;
      if (line.toLowerCase().startsWith(prefix.toLowerCase())) {
        return line.slice(prefix.length).trim();
      }
      return null;
    };
    let value;
    if ((value = field("Name")) !== null) {
      profile.fullName = value;
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("Headline")) !== null) {
      profile.headline = value;
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("Email")) !== null) {
      profile.email = value;
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("Phone")) !== null) {
      profile.phone = value;
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("City")) !== null) {
      profile.city = value;
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("Summary")) !== null) {
      profile.summary = value;
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("Experience")) !== null) {
      const parts = value.split("|").map((part) => part.trim());
      if (parts.length < 4) {
        warnings.push("Experience line needs Employer | Job title | Location | Period.");
        currentExperience = null;
      } else {
        currentExperience = {
          employer: parts[0],
          jobTitle: parts[1],
          location: parts[2],
          period: parts[3],
          bullets: []
        };
        profile.experience.push(currentExperience);
      }
      currentCustom = null;
    } else if (line.startsWith("- ") && currentExperience) {
      currentExperience.bullets.push(line.slice(2).trim());
    } else if ((value = field("Education")) !== null) {
      const parts = value.split("|").map((part) => part.trim());
      if (parts.length < 3) {
        warnings.push("Education line needs Qualification | Institution | Period.");
      } else {
        profile.education.push({
          qualification: parts[0],
          institution: parts[1],
          period: parts[2]
        });
      }
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("Skills")) !== null) {
      profile.skills = value.split(",").map((item) => item.trim()).filter(Boolean);
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("Languages")) !== null) {
      profile.languages = value.split(",").map((item) => item.trim()).filter(Boolean);
      currentExperience = null;
      currentCustom = null;
    } else if ((value = field("Custom")) !== null) {
      currentCustom = {
        key: `custom-${profile.customSections.length + 1}`,
        title: value || "Custom section",
        lines: []
      };
      profile.customSections.push(currentCustom);
      currentExperience = null;
    } else if (currentCustom) {
      currentCustom.lines.push(line);
    } else {
      unparsedLines.push(line);
    }
  }

  if (!profile.fullName) {
    warnings.push("No name was found in the pasted text.");
  }
  return { profile, warnings, unparsedLines };
}
