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
  // Footer, Increment 16. The operator line is checkable trust
  // information and belongs to the NVConsult edition only. The
  // commercial edition leaves it empty and never shows NVConsult
  // operator details as its own.
  footerOperatorLine: string;
  footerHelpLabel: string;
  footerHelpHref: string;
  footerNote: string;
}

const editionConfigs: Record<Edition, EditionConfig> = {
  nvconsult: {
    edition: "nvconsult",
    brandName: "NVConsult Career Tools",
    shortName: "NVConsult",
    tagline: "Build a CV that fits your target country, with human help when you need it.",
    headerHelpLabel: "Get human help",
    headerHelpHref: "https://nvconsult.eu",
    dashboardIntro: "This is the NVConsult edition. Start with the free tier, then ask for a human check before you apply.",
    humanHelpNote: "Human review is offered through NVConsult. Ask for it through the free consultation, and it is arranged personally after the call. No payment is taken in this app.",
    footerOperatorLine: "NVConsult is a trading name of Saeed Rasul. IČO: 23038594, Brno, Czech Republic. info@nvconsult.eu",
    footerHelpLabel: "Free consultation",
    footerHelpHref: "https://nvconsult.eu",
    footerNote: "Free beta. No payment is taken in this app."
  },
  commercial: {
    edition: "commercial",
    brandName: "Global Career Studio",
    shortName: "Studio",
    tagline: "Build a clear, honest career document, one section at a time.",
    headerHelpLabel: "Need human help?",
    headerHelpHref: "https://nvconsult.eu",
    dashboardIntro: "This is the commercial edition. Start with the free tier, and upgrade only when premium features are needed.",
    humanHelpNote: "Human help is offered through NVConsult. Ask for it through the free consultation linked in the header. No payment is taken in this app.",
    footerOperatorLine: "",
    footerHelpLabel: "Need human help?",
    footerHelpHref: "https://nvconsult.eu",
    footerNote: "Free beta. No payment is taken in this app."
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
  status: "Free beta, live on tools.nvconsult.eu. Server accounts and documents work. No payment and no connected AI generation yet.",
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
