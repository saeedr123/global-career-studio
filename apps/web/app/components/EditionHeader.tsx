"use client";

import { useEffect, useState } from "react";
import { editionConfig } from "../../lib/config";
import { readSignedInSession } from "../../lib/session-client.mjs";

// Branded header, Phase 2 increment 16. Navy header with a gold
// wordmark rule, white navigation, and one gold primary action, the
// human help link. Branding and help link come from edition
// configuration only, not from hard coded copy in this component.
// Switch editions with NEXT_PUBLIC_EDITION, see lib/config.ts.
// Navigation links are at least 44px tall, dossier rule 14.
// The public nav shows public things only: Home, How it works,
// Templates, the free offer, and Get human help. App pages are for
// signed-in users only, so Dashboard and Account appear only when a
// session is stored in this browser, server or local. Admin is never
// linked here, it stays an unlinked route only.

const PUBLIC_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Templates", href: "/#templates" },
  { label: "Free offer", href: "/#free" }
];

export default function EditionHeader() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setSignedIn(readSignedInSession(window.localStorage) !== null);
  }, []);
  const navLinks = signedIn
    ? [
        ...PUBLIC_NAV_LINKS,
        { label: "Dashboard", href: "/dashboard" },
        { label: "Account", href: "/auth" }
      ]
    : [...PUBLIC_NAV_LINKS, { label: "Sign in", href: "/auth" }];
  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-white">{editionConfig.brandName}</p>
            <div className="hero-rule mt-1" aria-hidden="true" />
            <p className="mt-1 text-sm text-slate-300">
              {editionConfig.edition === "nvconsult" ? "NVConsult edition" : "Commercial edition"} | Free beta
            </p>
          </div>
          <a className="btn-primary" href={editionConfig.headerHelpHref}>
            {editionConfig.headerHelpLabel}
          </a>
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Main">
          {navLinks.map((link) => (
            <a key={link.href + link.label} className="site-nav-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
