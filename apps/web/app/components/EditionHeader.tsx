import { editionConfig } from "../../lib/config";

// Edition aware header, Phase 2 increment 2.
// Branding and help link come from edition configuration only, not from
// hard coded copy in this component. Switch editions with
// NEXT_PUBLIC_EDITION, see lib/config.ts. No link here starts a real
// account, payment, or booking flow in this shell.

export default function EditionHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-lg font-bold text-navy">{editionConfig.brandName}</p>
          <p className="text-sm text-slate-500">
            Edition: {editionConfig.edition} (local only, not a finished product)
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm" aria-label="Main">
          <a className="text-slate-700 underline" href="/">
            Home
          </a>
          <a className="text-slate-700 underline" href="/dashboard">
            Dashboard
          </a>
          <a className="text-slate-700 underline" href="/auth">
            Account
          </a>
          <a className="text-slate-700 underline" href="/profile">
            Profile
          </a>
          <a className="text-slate-700 underline" href="/writer">
            Writer
          </a>
          <a className="text-slate-700 underline" href="/letters">
            Letters
          </a>
          <a className="text-slate-700 underline" href="/ats">
            ATS check
          </a>
          <a className="text-blue-700 underline" href={editionConfig.headerHelpHref}>
            {editionConfig.headerHelpLabel}
          </a>
        </nav>
      </div>
    </header>
  );
}
