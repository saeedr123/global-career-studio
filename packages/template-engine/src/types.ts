// Shared types for the template engine proof.
// This package renders document structure only. It has no accounts,
// payments, AI, or database access.

export type PaperSizeOption = "A4" | "US_LETTER";
export type TemplateId = "ats-minimal" | "modern-professional";

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

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  layoutStructure: string;
  typography: string;
  photoAllowed: boolean;
  defaultSectionOrder: string[];
}

export interface RenderedDocument {
  template: TemplateDefinition;
  profile: CandidateProfile;
  options: RenderOptions;
  photoIncluded: boolean;
  sections: RenderSection[];
}
