// Placeholder configuration for the web app only.
// These values are configurable and are NOT prices, limits, or final offers.
// Real plan, trial, and entitlement values will come from the Plan and Trial
// tables and from admin configuration in later phases. Do not treat any
// placeholder here as a published price or limit.
//
// Edition selection, Phase 2 increment 2, combined now, split later:
// Set NEXT_PUBLIC_EDITION to "nvconsult" for the NVConsult edition, or to
// "commercial" (the default) for the commercial Global Career Studio edition.
// The edition changes branding, header copy, and help links only. It does
// not change the template engine, the documents, or the free tier, and it
// does not create a second copy of the builder. A later split would use
// this edition value, plus the edition tag in the database, to partition
// users and documents. See docs/architecture.md for the split ready rules.

export type Edition = "nvconsult" | "commercial";

export interface EditionConfig {
  edition: Edition;
  brandName: string;
  shortName: string;
  tagline: string;
  headerHelpLabel: string;
  headerHelpHref: string;
  dashboardIntro: string;
  humanHelpNote: string;
  // Footer, Increment 16, line removed in Increment 18. The footer
  // no longer shows the operator identity. The checkable trust path
  // is now the nvconsult.eu link in the footer, where the operator
  // identity lives on About Us and the Privacy Policy.
  footerHelpLabel: string;
  footerHelpHref: string;
  footerNote: string;
  // Footer brand block, Increment 20. The lived-journey line is
  // the NVConsult edition only, matching the main site footer. The
  // commercial edition leaves it empty and shows its own tagline.
  footerJourneyLine: string;
}

const editionConfigs: Record<Edition, EditionConfig> = {
  nvconsult: {
    edition: "nvconsult",
    brandName: "NVConsult CV Builder",
    shortName: "NVConsult",
    tagline: "Build a CV or resume that fits your target country, with human help when you need it.",
    headerHelpLabel: "Get human help",
    headerHelpHref: "/human-help",
    dashboardIntro: "This is the NVConsult edition. Start with the free tier, then ask for a human check before you apply.",
    humanHelpNote: "Human review is offered through NVConsult. Ask for it through the human help form, with a free consultation or on its own. No payment is taken in this app.",
    footerHelpLabel: "Free consultation",
    footerHelpHref: "/human-help",
    footerNote: "Free beta. No payment is taken in this app.",
    footerJourneyLine: "Guidance for students and workers, from someone who has lived the journey from work visa to permanent residence."
  },
  commercial: {
    edition: "commercial",
    brandName: "Global Career Studio",
    shortName: "Studio",
    tagline: "Build a clear, honest career document, one section at a time.",
    headerHelpLabel: "Need human help?",
    headerHelpHref: "/human-help",
    dashboardIntro: "This is the commercial edition. Start with the free tier, and upgrade only when premium features are needed.",
    humanHelpNote: "Human help is offered through NVConsult. Ask for it through the human help form linked in the header. No payment is taken in this app.",
    footerHelpLabel: "Need human help?",
    footerHelpHref: "/human-help",
    footerNote: "Free beta. No payment is taken in this app.",
    footerJourneyLine: ""
  }
};

function resolveEdition(): Edition {
  const raw = process.env.NEXT_PUBLIC_EDITION;
  return raw === "nvconsult" ? "nvconsult" : "commercial";
}

export const edition: Edition = resolveEdition();
export const editionConfig: EditionConfig = editionConfigs[edition];

export const siteConfig = {
  name: editionConfig.brandName,
  tagline: editionConfig.tagline,
  status: "Free beta, live on tools.nvconsult.eu. Accounts and documents work. No payment and no connected AI generation yet.",
  edition: editionConfig.edition,
  features: {
    accountsEnabled: true,
    accountsLocalOnlyEnabled: false,
    paymentsEnabled: false,
    aiEnabled: false,
    templateProofEnabled: true,
    dashboardShellEnabled: true,
    dashboardWorkingLocalEnabled: true
  }
};
