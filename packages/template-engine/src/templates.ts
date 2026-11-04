import type { TemplateDefinition, TemplateId } from "./types";

// Only two templates exist in increment 1. The remaining version 1
// templates are later Phase 2 work, not hidden here.
export const templates: Record<TemplateId, TemplateDefinition> = {
  "ats-minimal": {
    id: "ats-minimal",
    name: "ATS Minimal",
    layoutStructure:
      "Single column, standard headings in document order, plain typography, no photo, no colour accents, parse friendly text order.",
    typography: "Helvetica, plain, name 18pt bold, headings 11pt bold uppercase, body 10.5pt.",
    photoAllowed: false,
    defaultSectionOrder: ["summary", "experience", "education", "skills", "languages"]
  },
  "modern-professional": {
    id: "modern-professional",
    name: "Modern Professional",
    layoutStructure:
      "Single column with a navy header block, larger headings, and an accent line under each heading. Still parse friendly text order, distinct layout and typography from ATS Minimal, not only a colour change.",
    typography: "Helvetica, name 22pt bold in header, headings 13pt bold navy, body 11pt.",
    photoAllowed: true,
    defaultSectionOrder: ["summary", "experience", "education", "skills", "languages"]
  }
};

export function getTemplate(id: TemplateId): TemplateDefinition {
  return templates[id];
}
