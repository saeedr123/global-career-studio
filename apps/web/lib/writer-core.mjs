// Writer core, Phase 2 increment 7.
// Pure JavaScript, no browser, database, or network dependency, so the
// same logic can be tested with plain Node. This is local drafting
// assistance only. No connected AI model is used, no user CV text is
// sent anywhere, and no provider is called. A connected AI provider
// will replace this local module later, once the provider is chosen.
// Guardrail, stated plainly: a rewrite only rephrases words the user
// already supplied. It never adds an employer, a job title, a date, a
// certification, a qualification, or an achievement. Where a field is
// missing, the caller gets a plain prompt, never invented content.
// A rewrite is only applied after the user confirms it in the UI.

import { sectionOrderFor } from "./builder-core.mjs";

const VERB_MAP = {
  coordinating: "Coordinated",
  preparing: "Prepared",
  managing: "Managed",
  supporting: "Supported",
  handling: "Handled",
  tracking: "Tracked",
  planning: "Planned",
  scheduling: "Scheduled",
  organising: "Organised",
  organizing: "Organized",
  communicating: "Communicated",
  delivering: "Delivered",
  improving: "Improved",
  reviewing: "Reviewed",
  writing: "Wrote",
  creating: "Created",
  updating: "Updated",
  monitoring: "Monitored"
};

function cleanSentence(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalise(text) {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function finishSentence(text) {
  if (!text) {
    return text;
  }
  if (/[.!?]$/.test(text)) {
    return text;
  }
  return `${text}.`;
}

// Rephrase one sentence using only its own words, apart from a mapped
// verb form and generic sentence punctuation. Filler words are removed,
// never replaced with a new claim.
export function rewriteSentence(text) {
  let out = cleanSentence(text);
  if (!out) {
    return "";
  }
  out = out.replace(/^(i was responsible for|i am responsible for|responsible for)\s+/i, "");
  out = out.replace(/^i\s+/i, "");
  const firstWordMatch = out.match(/^([A-Za-z]+ing)\b\s+(.*)$/);
  if (firstWordMatch && VERB_MAP[firstWordMatch[1].toLowerCase()]) {
    out = `${VERB_MAP[firstWordMatch[1].toLowerCase()]} ${firstWordMatch[2]}`;
  }
  out = out.replace(/\b(very|really|just)\s+/gi, "");
  out = capitalise(out);
  return finishSentence(out);
}

export function suggestSummaryRewrite(summary) {
  const clean = cleanSentence(summary);
  if (!clean) {
    return { suggested: "", missing: ["summary"], prompt: "Add a summary first. A rewrite cannot be suggested for an empty summary, and no summary will be invented." };
  }
  return { suggested: rewriteSentence(clean), missing: [], prompt: "" };
}

export function suggestBulletRewrite(bullet) {
  const clean = cleanSentence(bullet);
  if (!clean) {
    return { suggested: "", missing: ["bullet"], prompt: "Add a bullet first. A rewrite cannot be suggested for an empty bullet, and no achievement will be invented." };
  }
  return { suggested: rewriteSentence(clean), missing: [], prompt: "" };
}

export function suggestSkillRewrite(skill) {
  const clean = cleanSentence(skill);
  if (!clean) {
    return "";
  }
  return capitalise(clean);
}

// Apply a rewrite only after confirmation. Without confirmation, the
// original text is returned unchanged, even if a suggestion exists.
export function applyRewrite(original, suggested, confirmed) {
  if (confirmed && suggested) {
    return suggested;
  }
  return original;
}

// Missing fields are reported as prompts, never filled in.
export function missingFields(profile) {
  const p = profile || {};
  const missing = [];
  if (!p.fullName || !String(p.fullName).trim()) {
    missing.push({ field: "fullName", prompt: "Add your full name." });
  }
  if (!p.headline || !String(p.headline).trim()) {
    missing.push({ field: "headline", prompt: "Add your headline or job title." });
  }
  if (!p.summary || !String(p.summary).trim()) {
    missing.push({ field: "summary", prompt: "Add a summary in your own words." });
  }
  if (!p.email || !String(p.email).trim()) {
    missing.push({ field: "email", prompt: "Add your email address." });
  }
  if (!p.phone || !String(p.phone).trim()) {
    missing.push({ field: "phone", prompt: "Add your phone number." });
  }
  if (!p.experience || p.experience.length === 0) {
    missing.push({ field: "experience", prompt: "Add at least one experience entry, or leave experience out on purpose." });
  }
  if (!p.education || p.education.length === 0) {
    missing.push({ field: "education", prompt: "Add at least one education entry, or leave education out on purpose." });
  }
  if (!p.skills || p.skills.length === 0) {
    missing.push({ field: "skills", prompt: "Add your skills." });
  }
  if (!p.languages || p.languages.length === 0) {
    missing.push({ field: "languages", prompt: "Add your languages." });
  }
  return missing;
}

// Letter studio, Phase 2 increment 7.
// Letters use only fields the user supplied. Optional fields the user
// did not supply appear as bracket placeholders to fill in, never as
// invented names, dates, or companies. Required fields that are
// missing are reported in missing, and no letter text is generated
// for that letter until the user supplies them.

export const LETTER_TYPES = [
  { id: "cover", name: "Cover letter", description: "For a specific job application.", required: ["fullName", "jobTitle", "company"] },
  { id: "motivation", name: "Motivation letter", description: "Why this role and this organisation, in your own words.", required: ["fullName", "jobTitle", "company"] },
  { id: "reference", name: "Reference letter", description: "A reference about the person named, for the sender to check and sign.", required: ["fullName"] },
  { id: "recommendation", name: "Recommendation letter", description: "A recommendation about the person named, for the sender to check and sign.", required: ["fullName"] },
  { id: "employment-verification", name: "Employment verification letter", description: "Confirms a job held, from the fields supplied only.", required: ["fullName", "jobTitle", "company"] },
  { id: "resignation", name: "Resignation letter", description: "Resignation from a role, with a last working day to fill in.", required: ["fullName", "company"] },
  { id: "follow-up", name: "Follow up letter", description: "Follow up after an application or interview.", required: ["fullName", "jobTitle", "company"] },
  { id: "thank-you", name: "Thank you letter", description: "Thank you after an interview or a meeting.", required: ["fullName", "jobTitle", "company"] },
  { id: "job-application-email", name: "Job application email", description: "Short email to send with a CV.", required: ["fullName", "jobTitle", "company"] },
  { id: "linkedin-about", name: "LinkedIn About", description: "Short About section from the profile summary.", required: ["fullName", "summary"] },
  { id: "bio", name: "Bio", description: "Short professional bio from the profile fields.", required: ["fullName", "headline"] },
  { id: "personal-statement", name: "Personal statement", description: "Personal statement from the profile summary.", required: ["fullName", "summary"] }
];

export function letterTypeById(id) {
  return LETTER_TYPES.find((item) => item.id === id) || LETTER_TYPES[0];
}

function fieldPresent(fields, name) {
  const value = fields ? fields[name] : "";
  return Boolean(value && String(value).trim());
}

function orPlaceholder(value, label) {
  const clean = value ? String(value).trim() : "";
  return clean || `[${label}, to fill in]`;
}

export function generateLetter(typeId, fields) {
  const type = letterTypeById(typeId);
  const f = fields || {};
  const missing = type.required.filter((name) => !fieldPresent(f, name));
  if (missing.length > 0) {
    return { type: type.id, title: type.name, paragraphs: [], missing, prompt: `Add ${missing.join(", ")} first. This letter cannot be generated without them, and no value will be invented.` };
  }
  const name = String(f.fullName).trim();
  const jobTitle = f.jobTitle ? String(f.jobTitle).trim() : "";
  const company = f.company ? String(f.company).trim() : "";
  const headline = f.headline ? String(f.headline).trim() : "";
  const summary = f.summary ? String(f.summary).trim() : "";
  const recipient = orPlaceholder(f.recipientName, "Recipient name");
  const sender = orPlaceholder(f.senderName, "Sender name");
  const date = orPlaceholder(f.date, "Date");
  const greeting = `Dear ${recipient},`;
  const signOff = `Kind regards, ${orPlaceholder(f.senderName, "Your name")}`;
  let paragraphs = [];
  if (type.id === "cover") {
    paragraphs = [date, greeting, `I am writing to apply for the ${jobTitle} role at ${company}.`, headline ? `My background is: ${headline}.` : "My background is described in my CV.", "Please find my CV attached. I would welcome the chance to discuss this role further.", signOff];
  } else if (type.id === "motivation") {
    paragraphs = [date, greeting, `I am motivated to apply for the ${jobTitle} role at ${company}.`, summary || headline, "I would welcome the chance to discuss how my background fits this role.", signOff];
  } else if (type.id === "reference") {
    paragraphs = [date, greeting, `This letter is a reference for ${name}.`, headline ? `In the role of ${headline}, ${name} worked as described in the CV supplied.` : `${name} is described in the CV supplied.`, "This draft must be checked and signed by the sender before use.", `Kind regards, ${sender}`];
  } else if (type.id === "recommendation") {
    paragraphs = [date, greeting, `I recommend ${name} for consideration.`, headline ? `${name} has the background of ${headline}, as described in the CV supplied.` : `${name} is described in the CV supplied.`, "This draft must be checked and signed by the sender before use.", `Kind regards, ${sender}`];
  } else if (type.id === "employment-verification") {
    paragraphs = [date, greeting, `This letter confirms that ${name} held the role of ${jobTitle} at ${company}, as supplied for this letter.`, "Dates and duties are not stated here, because they were not supplied for this letter. Add them only from a verified record.", `Kind regards, ${sender}`];
  } else if (type.id === "resignation") {
    paragraphs = [date, greeting, `I am writing to resign from my role at ${company}.`, `My last working day will be ${orPlaceholder(f.lastWorkingDay, "Last working day")}.`, "Thank you for the opportunity to work here.", signOff];
  } else if (type.id === "follow-up") {
    paragraphs = [date, greeting, `I am following up on my application for the ${jobTitle} role at ${company}.`, "I would welcome any update when one is available.", signOff];
  } else if (type.id === "thank-you") {
    paragraphs = [date, greeting, `Thank you for speaking with me about the ${jobTitle} role at ${company}.`, "I appreciated the conversation and remain interested in the role.", signOff];
  } else if (type.id === "job-application-email") {
    paragraphs = [`Subject: Application for ${jobTitle} at ${company}`, greeting, `I am applying for the ${jobTitle} role at ${company}. My CV is attached.`, headline ? `My background is: ${headline}.` : "My background is described in my CV.", signOff];
  } else if (type.id === "linkedin-about") {
    paragraphs = [`${name}`, headline, summary];
  } else if (type.id === "bio") {
    paragraphs = [`${name} is ${headline}.`];
  } else if (type.id === "personal-statement") {
    paragraphs = [summary];
  }
  return { type: type.id, title: type.name, paragraphs: paragraphs.filter(Boolean), missing: [], prompt: "" };
}

// Heuristic ATS analysis, Phase 2 increment 7.
// This is a measured check only, not a real ATS, and it never claims a
// pass, a fail, or a guaranteed result. It reports keyword overlap
// with a job description the user pastes, section presence, contact
// presence, template parse friendliness, and text order. The job
// description is used for this check only and is not stored or sent.

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "are", "our", "this",
  "that", "from", "into", "will", "have", "has", "had", "who", "whom",
  "per", "via", "etc", "job", "role", "work", "team", "also", "able",
  "about", "after", "before", "between", "under", "over", "than", "then"
]);

export function extractKeywords(text) {
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
  return [...new Set(words)];
}

export function buildCvText(profile, settings) {
  const p = profile || {};
  const order = sectionOrderFor(p, settings ? settings.sectionOrder : undefined);
  const parts = [];
  parts.push(p.fullName || "", p.headline || "", p.email || "", p.phone || "", p.city || "");
  for (const key of order) {
    if (key === "summary") {
      parts.push(p.summary || "");
    } else if (key === "experience") {
      for (const entry of p.experience || []) {
        parts.push(entry.jobTitle || "", entry.employer || "", entry.location || "", entry.period || "", ...(entry.bullets || []));
      }
    } else if (key === "education") {
      for (const entry of p.education || []) {
        parts.push(entry.qualification || "", entry.institution || "", entry.period || "");
      }
    } else if (key === "skills") {
      parts.push((p.skills || []).join(" "));
    } else if (key === "languages") {
      parts.push((p.languages || []).join(" "));
    } else {
      const custom = (p.customSections || []).find((item) => item.key === key);
      if (custom) {
        parts.push(custom.title || "", ...(custom.lines || []));
      }
    }
  }
  return parts.join("\n");
}

export function analyzeAts(profile, settings, jobDescription) {
  const p = profile || {};
  const s = settings || {};
  const keywords = extractKeywords(jobDescription);
  const cvText = buildCvText(p, s);
  const cvLower = cvText.toLowerCase();
  const matched = [];
  const missing = [];
  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const found = new RegExp(`\\b${escaped}\\b`).test(cvLower);
    if (found) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }
  const coverage = keywords.length === 0 ? 0 : Math.round((matched.length / keywords.length) * 100);
  const sectionPresence = {
    summary: Boolean(p.summary && String(p.summary).trim()),
    experience: Boolean(p.experience && p.experience.length > 0),
    education: Boolean(p.education && p.education.length > 0),
    skills: Boolean(p.skills && p.skills.length > 0),
    languages: Boolean(p.languages && p.languages.length > 0)
  };
  const contactPresence = {
    email: Boolean(p.email && String(p.email).trim()),
    phone: Boolean(p.phone && String(p.phone).trim()),
    city: Boolean(p.city && String(p.city).trim())
  };
  const templateId = s.templateId || "ats-minimal";
  const parseFriendly = templateId !== "sidebar" && templateId !== "two-column";
  return {
    disclaimer: "Heuristic check only. This is not a real ATS, not a score, and not a pass or fail result. It only reports what was measured below.",
    keywords,
    matched,
    missing,
    keywordCoveragePercent: coverage,
    sectionPresence,
    contactPresence,
    templateId,
    parseFriendly,
    parseNote: parseFriendly
      ? "Single column template. Text order follows the section order."
      : "Design first template. Visual order differs from plain text extraction order, so use ATS Minimal for portal uploads.",
    textOrder: sectionOrderFor(p, s.sectionOrder)
  };
}
