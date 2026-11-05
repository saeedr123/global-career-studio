import type {
  CandidateProfile,
  RenderedDocument,
  RenderOptions,
  RenderSection,
  TemplateDefinition,
  TemplateId
} from "./types";
import { getTemplate } from "./templates";

function buildSections(
  profile: CandidateProfile,
  template: TemplateDefinition
): Record<string, RenderSection> {
  const titleFor = (key: string, fallback: string): string =>
    template.sectionTitles?.[key] ?? fallback;
  const sections: Record<string, RenderSection> = {
    summary: {
      key: "summary",
      title: titleFor("summary", "Summary"),
      lines: [profile.summary ? (profile.sampleMarker === "SAMPLE" ? `SAMPLE: ${profile.summary}` : profile.summary) : ""],
      bullets: []
    },
    experience: {
      key: "experience",
      title: titleFor("experience", "Experience"),
      lines: [],
      bullets: profile.experience.map((entry) => [
        `${entry.jobTitle}, ${entry.employer}, ${entry.location}, ${entry.period}`,
        ...entry.bullets
      ])
    },
    education: {
      key: "education",
      title: titleFor("education", "Education"),
      lines: profile.education.map(
        (entry) => `${entry.qualification}, ${entry.institution}, ${entry.period}`
      ),
      bullets: []
    },
    skills: {
      key: "skills",
      title: titleFor("skills", "Skills"),
      lines: [profile.skills.join(", ")],
      bullets: []
    },
    languages: {
      key: "languages",
      title: titleFor("languages", "Languages"),
      lines: [profile.languages.join(", ")],
      bullets: []
    }
  };
  for (const custom of profile.customSections || []) {
    if (custom.key && !sections[custom.key]) {
      sections[custom.key] = {
        key: custom.key,
        title: custom.title,
        lines: custom.lines,
        bullets: []
      };
    }
  }
  return sections;
}

// Apply a custom section order. Requested keys come first, in requested
// order. Remaining template default keys follow. Unknown keys are ignored.
export function orderSections(
  defaultOrder: string[],
  requested?: string[]
): string[] {
  if (!requested || requested.length === 0) {
    return [...defaultOrder];
  }
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const key of requested) {
    if (defaultOrder.includes(key) && !seen.has(key)) {
      ordered.push(key);
      seen.add(key);
    }
  }
  for (const key of defaultOrder) {
    if (!seen.has(key)) {
      ordered.push(key);
    }
  }
  return ordered;
}

export function renderDocument(
  profile: CandidateProfile,
  templateId: TemplateId,
  options: RenderOptions
): RenderedDocument {
  const template = getTemplate(templateId);
  const all = buildSections(profile, template);
  const customKeys = (profile.customSections || []).map((item) => item.key);
  const effectiveOrder = [...template.defaultSectionOrder, ...customKeys];
  const keys = orderSections(effectiveOrder, options.sectionOrder);
  const sections = keys.map((key) => all[key]);
  return {
    template,
    profile,
    options,
    // ATS Minimal does not allow a photo by design, so a photo request
    // is honoured only where the template allows it. The flag is never
    // silently ignored for Modern Professional.
    photoIncluded: options.includePhoto && template.photoAllowed,
    sections
  };
}
