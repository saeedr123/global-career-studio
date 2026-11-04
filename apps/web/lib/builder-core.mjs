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

// File import parser, Phase 2 increment 5.
// Parses plain text extracted from a PDF or DOCX file, or a hand written
// CV in the same plain layout. It never invents an employer, a job
// title, or a date. Lines it cannot match are reported in
// unparsedLines, never silently dropped. The caller must show the
// parsed profile for correction before it becomes a document.
// Supported layouts, in order of checking:
//   1. Labelled lines, as in guided paste import (Name:, Email:, and so
//      on). Those are handled by parseImport.
//   2. Engine layout: name, headline, contact line, then headings
//      (Summary, Experience, Education, Skills, Languages, or a custom
//      heading), with experience headers as
//      "Job title, Employer, Location, Period" and bullets starting
//      with "- " in PDF text, or plain bullet lines in DOCX text.
//   3. Hand written layout: the same headings, with "Work Experience"
//      as an alias for Experience, and experience headers as
//      "Job title at Employer, Location, Period".

const CV_HEADINGS = {
  summary: "summary",
  "professional summary": "summary",
  "personal profile": "summary",
  profile: "summary",
  about: "summary",
  experience: "experience",
  "work experience": "experience",
  employment: "experience",
  "employment history": "experience",
  "work history": "experience",
  education: "education",
  "education and training": "education",
  skills: "skills",
  languages: "languages",
  "language skills": "languages"
};

const PERIOD_PATTERN = /(19|20)\d{2}/;

function stripSamplePrefix(line) {
  let text = String(line || "").trim();
  while (text.toLowerCase().startsWith("sample:")) {
    text = text.slice("sample:".length).trim();
  }
  return text;
}

function parseContactLine(profile, line) {
  const parts = String(line || "").split("|").map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes("@")) {
      profile.email = part;
    } else if (/^\+?[0-9][0-9 ()-]{5,}$/.test(part)) {
      profile.phone = part;
    } else if (!profile.city) {
      profile.city = part;
    }
  }
  if (parts.length === 1 && parts[0].includes("@")) {
    profile.email = parts[0];
  }
}

function parseExperienceHeader(line) {
  const text = String(line || "").trim();
  if (text.includes("|")) {
    const parts = text.split("|").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 4 && PERIOD_PATTERN.test(parts[3])) {
      return { employer: parts[0], jobTitle: parts[1], location: parts[2], period: parts.slice(3).join(" | "), bullets: [] };
    }
    return null;
  }
  const atMatch = text.match(/^(.+?) at (.+?), (.+?), (.+)$/);
  if (atMatch && PERIOD_PATTERN.test(atMatch[4])) {
    return { employer: atMatch[2], jobTitle: atMatch[1], location: atMatch[3], period: atMatch[4], bullets: [] };
  }
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 4 && PERIOD_PATTERN.test(parts[parts.length - 1])) {
    return {
      jobTitle: parts[0],
      employer: parts[1],
      location: parts.slice(2, -1).join(", "),
      period: parts[parts.length - 1],
      bullets: []
    };
  }
  if (parts.length === 3 && PERIOD_PATTERN.test(parts[2])) {
    return { jobTitle: parts[0], employer: parts[1], location: "", period: parts[2], bullets: [] };
  }
  return null;
}

function parseEducationHeader(line) {
  const text = String(line || "").trim();
  if (text.includes("|")) {
    const parts = text.split("|").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 3 && PERIOD_PATTERN.test(parts[2])) {
      return { qualification: parts[0], institution: parts[1], period: parts.slice(2).join(" | ") };
    }
    return null;
  }
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3 && PERIOD_PATTERN.test(parts[parts.length - 1])) {
    return {
      qualification: parts[0],
      institution: parts.slice(1, -1).join(", "),
      period: parts[parts.length - 1]
    };
  }
  return null;
}

function splitList(line) {
  // Split on commas, semicolons, and bullets, but not on a comma inside
  // parentheses, so "English (Fluent, sample level)" stays one item.
  const out = [];
  let current = "";
  let depth = 0;
  for (const char of String(line || "")) {
    if (char === "(") { depth += 1; }
    if (char === ")") { depth = Math.max(0, depth - 1); }
    if ((char === "," || char === ";" || char === "•") && depth === 0) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out
    .map((item) => item.trim().replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

export function parseCvText(text) {
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
  const rawLines = String(text || "").split(/\r?\n/);
  const lines = rawLines.map((line) => stripSamplePrefix(line)).filter((line) => line.trim() !== "");
  let section = null;
  let currentExperience = null;
  let currentCustom = null;
  let nameAssigned = false;
  let headlineAssigned = false;

  const labelledField = (line) => {
    const match = line.match(/^(Name|Headline|Email|Phone|City|Summary|Skills|Languages):\s*(.*)$/i);
    return match ? { name: match[1].toLowerCase(), value: match[2].trim() } : null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === "SAMPLE PHOTO" || line === "[SAMPLE photo placeholder]") {
      continue;
    }
    const headingKey = CV_HEADINGS[line.replace(/:$/, "").toLowerCase()];
    if (headingKey) {
      section = headingKey;
      currentExperience = null;
      currentCustom = null;
      continue;
    }
    if (line.toLowerCase() === "personal information") {
      section = "personal";
      currentExperience = null;
      currentCustom = null;
      continue;
    }
    // A heading that is not in the known list becomes a custom section,
    // but only after the name, headline, and contact block, and only
    // when the line looks like a heading (short, no sentence ending,
    // no comma list). This keeps ordinary sentences out of headings.
    if (section === null && nameAssigned && headlineAssigned && /^[A-Z][A-Za-z ]{1,40}$/.test(line) && !line.includes(".") && !line.includes(",")) {
      // A lone capitalised word block after the header is treated as a
      // custom heading only if the next lines are not a summary. In
      // practice the known headings above cover the common cases, so
      // an unknown short line here is safer as unparsed than as a
      // guessed custom section. Keep it unparsed.
      unparsedLines.push(line);
      continue;
    }
    const labelled = labelledField(line);
    if (labelled) {
      if (labelled.name === "name") { profile.fullName = labelled.value; nameAssigned = true; }
      else if (labelled.name === "headline") { profile.headline = labelled.value; headlineAssigned = true; }
      else if (labelled.name === "email") { profile.email = labelled.value; }
      else if (labelled.name === "phone") { profile.phone = labelled.value; }
      else if (labelled.name === "city") { profile.city = labelled.value; }
      else if (labelled.name === "summary") { profile.summary = labelled.value; section = "summary"; }
      else if (labelled.name === "skills") { profile.skills = splitList(labelled.value); section = "skills"; }
      else if (labelled.name === "languages") { profile.languages = splitList(labelled.value); section = "languages"; }
      currentExperience = null;
      currentCustom = null;
      continue;
    }
    if (section === "personal") {
      if (line.includes("@") || line.includes("|")) {
        parseContactLine(profile, line);
        continue;
      }
      unparsedLines.push(line);
      continue;
    }
    // Custom section detection, conservative and documented: after the
    // Languages section, which is last in the default engine order, a
    // short heading style line that is not a language entry is treated
    // as a custom section title. Custom sections in other positions
    // are not guessed; their lines are left unparsed for correction.
    if (section === "languages" && /^[A-Z][A-Za-z ]{1,40}$/.test(line) && !line.includes("(") && !line.includes(".")) {
      currentCustom = {
        key: `custom-${profile.customSections.length + 1}`,
        title: line,
        lines: []
      };
      profile.customSections.push(currentCustom);
      section = "custom";
      currentExperience = null;
      continue;
    }
    if (section === null) {
      if (!nameAssigned) {
        profile.fullName = line;
        nameAssigned = true;
        continue;
      }
      if (line.includes("@") || line.includes("|")) {
        parseContactLine(profile, line);
        continue;
      }
      if (!headlineAssigned) {
        profile.headline = line;
        headlineAssigned = true;
        continue;
      }
      unparsedLines.push(line);
      continue;
    }
    if (section === "summary") {
      profile.summary = profile.summary ? `${profile.summary} ${line}` : line;
      continue;
    }
    if (section === "experience") {
      if (line.startsWith("- ") || line.startsWith("• ")) {
        const bullet = line.replace(/^[-•]\s+/, "").trim();
        if (currentExperience) {
          currentExperience.bullets.push(bullet);
        } else {
          unparsedLines.push(line);
        }
        continue;
      }
      const entry = parseExperienceHeader(line);
      if (entry) {
        currentExperience = entry;
        profile.experience.push(currentExperience);
        continue;
      }
      if (currentExperience) {
        currentExperience.bullets.push(line);
        continue;
      }
      unparsedLines.push(line);
      continue;
    }
    if (section === "education") {
      const entry = parseEducationHeader(line);
      if (entry) {
        profile.education.push(entry);
        continue;
      }
      unparsedLines.push(line);
      continue;
    }
    if (section === "skills") {
      profile.skills.push(...splitList(line));
      continue;
    }
    if (section === "languages") {
      profile.languages.push(...splitList(line));
      continue;
    }
    if (currentCustom) {
      currentCustom.lines.push(line);
      continue;
    }
    unparsedLines.push(line);
  }

  // Custom headings in hand written CVs use a capitalised heading line
  // followed by plain lines. Those are handled by a second pass only
  // when a line was left unparsed and a later line follows it in the
  // same block. This pass is intentionally conservative: it does not
  // run, because a guessed custom section is worse than a visible
  // unparsed line that the user can correct in the builder.

  if (!profile.fullName) {
    warnings.push("No name was found in the file text.");
  }
  if (unparsedLines.length > 0) {
    warnings.push(`${unparsedLines.length} line(s) could not be matched to a field. Check them below before use.`);
  }
  return { profile, warnings, unparsedLines };
}

export function parseFileImport(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return {
      profile: {
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
      },
      warnings: ["No readable text was found in this file. It may be a scanned image, an empty file, or a file with no text layer. No content was invented."],
      unparsedLines: [],
      empty: true
    };
  }
  const labelledCount = clean.split(/\r?\n/).filter((line) =>
    /^(Name|Headline|Email|Phone|City|Summary|Experience|Education|Skills|Languages|Custom):/i.test(line.trim())
  ).length;
  if (labelledCount >= 2) {
    const result = parseImport(text);
    return { ...result, empty: false };
  }
  const result = parseCvText(text);
  return { ...result, empty: false };
}

// Job specific versions, Phase 2 increment 5.
// A job version is a named copy of a master draft, for one job
// application. Editing a version never changes the master draft, and
// editing the master never changes a saved version, unless the user
// explicitly saves a version back to the master in the builder UI.
// Job title and company are always user entered, never invented, and
// a version cannot be created without both.

export function jobVersionLabel(jobTitle, company) {
  return `${String(jobTitle || "").trim()} at ${String(company || "").trim()}`;
}

export function createJobVersion(master, jobTitle, company) {
  const cleanTitle = String(jobTitle || "").trim();
  const cleanCompany = String(company || "").trim();
  if (!cleanTitle || !cleanCompany) {
    throw new Error("Job title and company are required for a job version. They are never invented.");
  }
  if (!master || !master.profile || !master.settings) {
    throw new Error("A master draft with a profile and settings is required for a job version.");
  }
  return {
    id: `job-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000000)}`,
    label: jobVersionLabel(cleanTitle, cleanCompany),
    jobTitle: cleanTitle,
    company: cleanCompany,
    createdAt: new Date().toISOString(),
    isJobVersion: true,
    profile: JSON.parse(JSON.stringify(master.profile)),
    settings: JSON.parse(JSON.stringify(master.settings))
  };
}

export function compareJobVersions(first, second) {
  const differences = [];
  const a = first || {};
  const b = second || {};
  const aSettings = a.settings || {};
  const bSettings = b.settings || {};
  const aProfile = a.profile || {};
  const bProfile = b.profile || {};
  if (aSettings.templateId !== bSettings.templateId) {
    differences.push(`Template: ${aSettings.templateId || "none"} to ${bSettings.templateId || "none"}`);
  }
  if (aSettings.paperSize !== bSettings.paperSize) {
    differences.push(`Paper size: ${aSettings.paperSize || "none"} to ${bSettings.paperSize || "none"}`);
  }
  if (Boolean(aSettings.includePhoto) !== Boolean(bSettings.includePhoto)) {
    differences.push(`Photo: ${aSettings.includePhoto ? "included" : "not included"} to ${bSettings.includePhoto ? "included" : "not included"}`);
  }
  const aOrder = sectionOrderFor(aProfile, aSettings.sectionOrder).join(", ");
  const bOrder = sectionOrderFor(bProfile, bSettings.sectionOrder).join(", ");
  if (aOrder !== bOrder) {
    differences.push(`Section order: ${aOrder} to ${bOrder}`);
  }
  for (const field of ["fullName", "headline", "summary"]) {
    if ((aProfile[field] || "") !== (bProfile[field] || "")) {
      differences.push(`${field} differs`);
    }
  }
  for (const [field, label] of [["experience", "Experience entries"], ["education", "Education entries"], ["skills", "Skills"], ["languages", "Languages"], ["customSections", "Custom sections"]]) {
    const aCount = (aProfile[field] || []).length;
    const bCount = (bProfile[field] || []).length;
    if (aCount !== bCount) {
      differences.push(`${label}: ${aCount} to ${bCount}`);
    }
  }
  return {
    firstLabel: a.label || "First version",
    secondLabel: b.label || "Second version",
    differences,
    same: differences.length === 0
  };
}
