import type {
  CandidateProfile,
  RenderedDocument,
  RenderOptions,
  RenderSection,
  TemplateId
} from "./types";
import { getTemplate } from "./templates";

function buildSections(profile: CandidateProfile): Record<string, RenderSection> {
  return {
    summary: {
      key: "summary",
      title: "Summary",
      lines: [`SAMPLE: ${profile.summary}`],
      bullets: []
    },
    experience: {
      key: "experience",
      title: "Experience",
      lines: [],
      bullets: profile.experience.map((entry) => [
        `${entry.jobTitle}, ${entry.employer}, ${entry.location}, ${entry.period}`,
        ...entry.bullets
      ])
    },
    education: {
      key: "education",
      title: "Education",
      lines: profile.education.map(
        (entry) => `${entry.qualification}, ${entry.institution}, ${entry.period}`
      ),
      bullets: []
    },
    skills: {
      key: "skills",
      title: "Skills",
      lines: [profile.skills.join(", ")],
      bullets: []
    },
    languages: {
      key: "languages",
      title: "Languages",
      lines: [profile.languages.join(", ")],
      bullets: []
    }
  };
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
  const all = buildSections(profile);
  const keys = orderSections(template.defaultSectionOrder, options.sectionOrder);
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
