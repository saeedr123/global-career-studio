"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { readSignedInSession } from "../../lib/session-client.mjs";

// Sign-in gate, Phase 2 increment 17. Wrap the content of an app
// page in this component, and an unauthenticated visitor is sent to
// the sign-in page instead of seeing the app. A signed-in user
// keeps working exactly as before, including the browser fallback
// when the account cannot be reached. The landing page and the
// sign-in page are not wrapped, they stay open without login. The
// check reads the stored session only, it never asks the server, so
// it works the same with and without a database connection. The
// redirect carries the page the visitor wanted as ?next=, so the
// sign-in page can send them back after they sign in.

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const session = readSignedInSession(window.localStorage);
    if (session) {
      setSignedIn(true);
      return;
    }
    setSignedIn(false);
    const next = window.location.pathname + window.location.search;
    window.location.assign(`/auth?next=${encodeURIComponent(next)}`);
  }, []);
  if (signedIn === null) {
    return <p className="mt-4 text-ink">Checking your sign in...</p>;
  }
  if (!signedIn) {
    return (
      <div className="mt-4 card">
        <p className="text-ink">Sign in to use this part of the app.</p>
        <p className="mt-3">
          <a className="brand-link" href="/auth">
            Go to the sign-in page
          </a>
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
