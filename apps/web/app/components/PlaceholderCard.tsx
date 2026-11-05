import type { ReactNode } from "react";

// Placeholder card for the dashboard shell only.
// Every card states that it is a placeholder, so a visitor never mistakes
// the shell for a working profile, document, template, credit, subscription,
// or human review feature. Real features arrive in later increments.

export default function PlaceholderCard({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="text-base font-semibold text-navy">{title}</h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Placeholder only
      </p>
      <div className="mt-3 text-sm text-ink">{children}</div>
    </section>
  );
}
