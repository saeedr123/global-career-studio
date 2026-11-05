import { editionConfig } from "../../lib/config";

// Branded footer, Phase 2 increment 16, rebuilt in increment 20 to
// match the main nvconsult.eu footer: a rich multi-column footer
// with a brand block, an Explore column, a Company column, social
// links, and a Start here column. The operator line was removed in
// increment 18 and is not re-added here, and no phone number is
// shown either. The operator identity is not shown in this tool at
// all; the checkable trust path is the nvconsult.eu link, where the
// operator identity lives on About Us and the Privacy Policy. The
// sample-data line was removed in increment 20: sample content is
// still labelled SAMPLE inside the builder where it is genuinely
// sample data, never in the footer or any other chrome. No
// newsletter signup form is shown here, because there is no email
// backend yet and a dead form is worse than none. Branding comes
// from edition configuration only, not from hard coded copy here.
// The commercial edition shows its own tagline and never the
// NVConsult lived-journey line.

const EXPLORE_LINKS = [
  { label: "Templates", href: "/#templates" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Letters", href: "/letters" },
  { label: "ATS check", href: "/ats" },
  { label: "Get human help", href: "/human-help" }
];

const COMPANY_LINKS = [
  { label: "About NVConsult", href: "https://nvconsult.eu/about-us/" },
  { label: "Services", href: "https://nvconsult.eu/service/" },
  { label: "Consultation Plans", href: "https://nvconsult.eu/consultation-plans/" },
  { label: "Smart Destination Finder", href: "https://nvconsult.eu/ai-finder/" },
  { label: "Contact", href: "https://nvconsult.eu/contact/" }
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/nvconsultants" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/nvconsulteu" },
  { label: "X", href: "https://x.com/Vision_conrl" }
];

export default function SiteFooter() {
  return (
    <footer className="site-footer mt-12">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-white">{editionConfig.brandName}</p>
          <div className="hero-rule mt-2" aria-hidden="true" />
          <p className="mt-3 text-sm">{editionConfig.tagline}</p>
          {editionConfig.footerJourneyLine ? (
            <p className="mt-3 text-sm">{editionConfig.footerJourneyLine}</p>
          ) : null}
          <ul className="mt-4 flex flex-wrap gap-4 text-sm">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href + link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Start here</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="/builder">Build your CV, free</a>
            </li>
            <li>
              <a href="/auth">Sign in</a>
            </li>
            <li>
              <a href={editionConfig.footerHelpHref}>{editionConfig.footerHelpLabel}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-700">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm sm:px-6">
          <p>{editionConfig.footerNote}</p>
          <a href="https://nvconsult.eu">nvconsult.eu</a>
        </div>
      </div>
    </footer>
  );
}
