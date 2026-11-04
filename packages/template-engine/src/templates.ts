import type { TemplateDefinition, TemplateId } from "./types";

// All 10 version 1 templates. Each entry differs in layout structure,
// section order, and typography, not only in colour. Colour variants
// do not count as templates here. Sidebar and two-column are design
// first: their visual order differs from plain text extraction order,
// so they are never labelled ATS friendly in the builder.
export const templates: Record<TemplateId, TemplateDefinition> = {
  "ats-minimal": {
    id: "ats-minimal",
    name: "ATS Minimal",
    description: "Single column, plain, no photo. Best for portal uploads and parsing.",
    atsNote: "Parse friendly single column. Recommended for portal uploads.",
    layoutStructure:
      "Single column, standard headings in document order, plain typography, no photo, no colour accents, parse friendly text order.",
    typography: "Helvetica, plain, name 18pt bold, headings 11pt bold uppercase, body 10.5pt.",
    layoutKind: "flow",
    headerStyle: "plain",
    font: "Helvetica",
    nameSize: 18,
    headingSize: 11,
    bodySize: 10.5,
    headingUppercase: true,
    accentColor: "000000",
    photoAllowed: false,
    defaultSectionOrder: ["summary", "experience", "education", "skills", "languages"]
  },
  "modern-professional": {
    id: "modern-professional",
    name: "Modern Professional",
    description: "Single column with a navy header block and accent lines. Clean and professional.",
    atsNote: "Single column, parse friendly text order.",
    layoutStructure:
      "Single column with a navy header block, larger headings, and an accent line under each heading. Still parse friendly text order, distinct layout and typography from ATS Minimal, not only a colour change.",
    typography: "Helvetica, name 22pt bold in header, headings 13pt bold navy, body 11pt.",
    layoutKind: "flow",
    headerStyle: "band",
    font: "Helvetica",
    nameSize: 22,
    headingSize: 13,
    bodySize: 11,
    headingUppercase: false,
    accentColor: "16294D",
    photoAllowed: true,
    defaultSectionOrder: ["summary", "experience", "education", "skills", "languages"]
  },
  executive: {
    id: "executive",
    name: "Executive",
    description: "Centered header, large name, skills before education. For senior roles.",
    atsNote: "Single column, parse friendly text order.",
    layoutStructure:
      "Centered header with a rule below it, large name, headline, and contact line. Skills come before education, so senior strengths read first.",
    typography: "Helvetica, name 24pt bold centered, headings 12pt bold navy, body 11pt.",
    layoutKind: "flow",
    headerStyle: "centered",
    font: "Helvetica",
    nameSize: 24,
    headingSize: 12,
    bodySize: 11,
    headingUppercase: true,
    accentColor: "16294D",
    photoAllowed: true,
    defaultSectionOrder: ["summary", "experience", "skills", "education", "languages"],
    sectionTitles: { summary: "Executive Summary" }
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description: "Formal band header, experience first, compact spacing. For corporate roles.",
    atsNote: "Single column, parse friendly text order.",
    layoutStructure:
      "Navy band header with a thin gold rule, compact spacing, experience before the summary, so the work record leads a formal corporate document.",
    typography: "Helvetica, name 20pt bold in band, headings 11pt bold navy uppercase, body 10.5pt, compact spacing.",
    layoutKind: "flow",
    headerStyle: "band",
    font: "Helvetica",
    nameSize: 20,
    headingSize: 11,
    bodySize: 10.5,
    headingUppercase: true,
    accentColor: "16294D",
    photoAllowed: true,
    defaultSectionOrder: ["experience", "summary", "education", "skills", "languages"]
  },
  elegant: {
    id: "elegant",
    name: "Elegant",
    description: "Serif type, centered header, education before experience. For a refined look.",
    atsNote: "Single column, parse friendly text order.",
    layoutStructure:
      "Centered serif header with a thin rule, education before experience, generous spacing, and a refined look that still flows as one column.",
    typography: "Times, name 24pt bold centered, headings 13pt bold, body 11.5pt, generous spacing.",
    layoutKind: "flow",
    headerStyle: "centered",
    font: "Times",
    nameSize: 24,
    headingSize: 13,
    bodySize: 11.5,
    headingUppercase: false,
    accentColor: "333333",
    photoAllowed: true,
    defaultSectionOrder: ["summary", "education", "experience", "skills", "languages"]
  },
  european: {
    id: "european",
    name: "European",
    description: "Europass style structure: personal information, work, education, language skills. Not a copy of the official Europass design.",
    atsNote: "Single column, parse friendly text order. Europass style structure only.",
    layoutStructure:
      "Europass style structure, not a copy of the official Europass visual design. Personal information header, then work experience, education and training, language skills, skills, and additional information last.",
    typography: "Helvetica, name 20pt bold, headings 12pt bold navy, body 11pt, labelled contact lines.",
    layoutKind: "flow",
    headerStyle: "european",
    font: "Helvetica",
    nameSize: 20,
    headingSize: 12,
    bodySize: 11,
    headingUppercase: false,
    accentColor: "16294D",
    photoAllowed: true,
    defaultSectionOrder: ["experience", "education", "languages", "skills", "summary"],
    sectionTitles: {
      summary: "Additional Information",
      experience: "Work Experience",
      education: "Education and Training",
      skills: "Skills",
      languages: "Language Skills"
    }
  },
  "us-resume": {
    id: "us-resume",
    name: "US Resume",
    description: "US style: professional summary, experience, skills, then education. No photo by US convention.",
    atsNote: "Single column, parse friendly text order. No photo, by US convention.",
    layoutStructure:
      "US style single column: professional summary first, then experience, then skills, then education. Compact headings, no photo, no personal details beyond contact.",
    typography: "Helvetica, name 20pt bold, headings 12pt bold uppercase, body 11pt.",
    layoutKind: "flow",
    headerStyle: "plain",
    font: "Helvetica",
    nameSize: 20,
    headingSize: 12,
    bodySize: 11,
    headingUppercase: true,
    accentColor: "000000",
    photoAllowed: false,
    defaultSectionOrder: ["summary", "experience", "skills", "education", "languages"],
    sectionTitles: { summary: "Professional Summary" }
  },
  "uk-cv": {
    id: "uk-cv",
    name: "UK CV",
    description: "UK style: personal profile, experience, education, skills. No photo by UK convention.",
    atsNote: "Single column, parse friendly text order. No photo, by UK convention.",
    layoutStructure:
      "UK style single column: personal profile first, then experience, education, and skills. Plain headings, no photo, and no personal details beyond contact.",
    typography: "Helvetica, name 21pt bold, headings 12pt bold, body 11pt.",
    layoutKind: "flow",
    headerStyle: "plain",
    font: "Helvetica",
    nameSize: 21,
    headingSize: 12,
    bodySize: 11,
    headingUppercase: false,
    accentColor: "000000",
    photoAllowed: false,
    defaultSectionOrder: ["summary", "experience", "education", "skills", "languages"],
    sectionTitles: { summary: "Personal Profile" }
  },
  sidebar: {
    id: "sidebar",
    name: "Sidebar",
    description: "Design first: narrow left sidebar for skills and languages, wide main column for the rest.",
    atsNote: "Design first, not ATS friendly. For portal uploads, use ATS Minimal instead.",
    layoutStructure:
      "Two visual columns: a narrow left sidebar holding skills and languages, and a wide main column holding summary, experience, education, and custom sections. Visual order differs from plain text extraction order, so this is design first.",
    typography: "Helvetica, name 22pt bold in header, sidebar headings 10pt bold navy uppercase, main headings 12pt bold navy, body 11pt.",
    layoutKind: "sidebar",
    headerStyle: "band",
    font: "Helvetica",
    nameSize: 22,
    headingSize: 12,
    bodySize: 11,
    headingUppercase: false,
    accentColor: "16294D",
    photoAllowed: true,
    defaultSectionOrder: ["summary", "experience", "education", "skills", "languages"]
  },
  "two-column": {
    id: "two-column",
    name: "Two-column",
    description: "Design first: wide main column on the left, narrow right column for skills and languages.",
    atsNote: "Design first, not ATS friendly. For portal uploads, use ATS Minimal instead.",
    layoutStructure:
      "Two visual columns: a wide main column on the left holding summary, experience, education, and custom sections, and a narrow right column holding skills and languages. Visual order differs from plain text extraction order, so this is design first.",
    typography: "Helvetica, name 20pt bold, main headings 12pt bold, side headings 10pt bold uppercase, body 11pt.",
    layoutKind: "two-column",
    headerStyle: "plain",
    font: "Helvetica",
    nameSize: 20,
    headingSize: 12,
    bodySize: 11,
    headingUppercase: false,
    accentColor: "333333",
    photoAllowed: true,
    defaultSectionOrder: ["summary", "experience", "education", "skills", "languages"]
  }
};

export function getTemplate(id: TemplateId): TemplateDefinition {
  return templates[id];
}

export function templateIds(): TemplateId[] {
  return Object.keys(templates) as TemplateId[];
}
