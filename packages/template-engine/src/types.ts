// Shared types for the template engine.
// This package renders document structure only. It has no accounts,
// payments, AI, or database access.

export type PaperSizeOption = "A4" | "US_LETTER";
export type TemplateId =
  | "ats-minimal"
  | "modern-professional"
  | "executive"
  | "corporate"
  | "elegant"
  | "european"
  | "us-resume"
  | "uk-cv"
  | "sidebar"
  | "two-column";

export interface ExperienceEntry {
  employer: string;
  jobTitle: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  qualification: string;
  period: string;
}

export interface CustomSection {
  key: string;
  title: string;
  lines: string[];
}

export interface CandidateProfile {
  // SAMPLE marker: every sample profile in sample-data.ts is fictional.
  sampleMarker: "SAMPLE";
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  languages: string[];
  // Added in increment 3 for the builder. Optional, so increment 1
  // profiles still render unchanged. Custom sections are rendered in
  // section order, after the standard sections unless reordered.
  customSections?: CustomSection[];
}

export interface RenderSection {
  key: string;
  title: string;
  // Plain text lines. Bullets are lines in a bullet section.
  lines: string[];
  bullets: string[][];
}

export interface RenderOptions {
  paperSize: PaperSizeOption;
  pageCountTarget: 1 | 2;
  includePhoto: boolean;
  // Keys in the order the caller wants. Missing keys are appended in
  // template default order. Unknown keys are ignored.
  sectionOrder?: string[];
}

// Layout kind drives the PDF and DOCX renderers. "flow" is a single
// column flow. "sidebar" is a narrow left column for skills and
// languages with a wide main column. "two-column" is a wide main column
// on the left with a narrow right column for skills and languages.
// Sidebar and two-column are design first templates, not ATS friendly
// templates, because their visual order differs from the plain text
// extraction order. The builder says so plainly, and recommends ATS
// Minimal for portal uploads.
export type LayoutKind = "flow" | "sidebar" | "two-column";
export type HeaderStyle = "plain" | "band" | "centered" | "european";
export type FontFamily = "Helvetica" | "Times";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  // Short honest description shown in the builder. No ATS claim is
  // made here unless the template is a single column parse friendly
  // flow template.
  description: string;
  // Plain language ATS note shown in the builder. Design first
  // templates say so, and recommend ATS Minimal for portal uploads.
  atsNote: string;
  layoutStructure: string;
  typography: string;
  layoutKind: LayoutKind;
  headerStyle: HeaderStyle;
  font: FontFamily;
  nameSize: number;
  headingSize: number;
  bodySize: number;
  headingUppercase: boolean;
  // Hex colour without a leading hash, used for headings and accents.
  accentColor: string;
  photoAllowed: boolean;
  defaultSectionOrder: string[];
  // Optional per template section titles, for example European
  // "Work Experience" and UK "Personal Profile". Missing keys fall
  // back to the standard titles in render.ts.
  sectionTitles?: Record<string, string>;
}

export interface RenderedDocument {
  template: TemplateDefinition;
  profile: CandidateProfile;
  options: RenderOptions;
  photoIncluded: boolean;
  sections: RenderSection[];
}
