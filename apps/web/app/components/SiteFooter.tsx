import { editionConfig } from "../../lib/config";

// Branded footer, Phase 2 increment 16, operator line removed in
// increment 18. Navy dark footer with the brand, the free
// consultation link, and the nvconsult.eu link. The operator
// identity is no longer shown here; the checkable trust path is
// the nvconsult.eu link, where the operator identity lives on
// About Us and the Privacy Policy. The commercial edition never
// shows NVConsult operator details as its own. Branding comes
// from edition configuration only, not from hard coded copy here.

export default function SiteFooter() {
  return (
    <footer className="site-footer mt-12">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6">
        <div>
          <p className="text-lg font-bold text-white">{editionConfig.brandName}</p>
          <p className="mt-2 text-sm">{editionConfig.tagline}</p>
          <p className="mt-2 text-sm">{editionConfig.footerNote}</p>
        </div>
        <div>
          <p className="font-semibold text-white">Start here</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <a href="/builder">Build your CV, free</a>
            </li>
            <li>
              <a href="/auth">Sign in</a>
            </li>
            <li>
              <a href={editionConfig.footerHelpHref}>{editionConfig.footerHelpLabel}</a>
            </li>
            <li>
              <a href="https://nvconsult.eu">nvconsult.eu</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-700">
        <p className="mx-auto max-w-5xl px-4 py-4 text-sm sm:px-6">
          Sample data is fictional and marked SAMPLE. It is never presented as a real user.
        </p>
      </div>
    </footer>
  );
}
