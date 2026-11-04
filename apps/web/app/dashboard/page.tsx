import { editionConfig, siteConfig } from "../../lib/config";
import PlaceholderCard from "../components/PlaceholderCard";

// Dashboard shell, Phase 2 increment 2 only.
// No real auth, no real billing, no real document editing, no AI, and no
// human review request is connected here. Every card is a placeholder with
// its future purpose stated plainly. Later increments replace each card
// with a working feature, in the order in PROJECT_STATUS.md.

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Dashboard shell
      </p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Dashboard</h1>
      <p className="mt-3 text-slate-700">{editionConfig.dashboardIntro}</p>
      <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-4 text-slate-800">
        {siteConfig.status} This page has no accounts, no payments, no AI
        generation, and no document editing yet. No price, trial offer, or
        limit is stated here, because none has been decided for launch.
      </p>
      <p className="mt-4">
        <a className="rounded bg-navy px-4 py-2 text-white" href="/builder">
          Open the CV builder (local draft only)
        </a>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard title="Profile">
          <p>Future: one candidate profile, reused across documents.</p>
          <p className="mt-2">Placeholder: no profile data is stored or shown here.</p>
        </PlaceholderCard>
        <PlaceholderCard title="Saved documents">
          <p>Future: saved CVs and letters, with job specific versions.</p>
          <p className="mt-2">Placeholder: no documents exist in this shell.</p>
        </PlaceholderCard>
        <PlaceholderCard title="Templates">
          <p>Future: version 1 templates, starting with ATS Minimal and Modern Professional.</p>
          <p className="mt-2">Placeholder: template selection is not connected here.</p>
        </PlaceholderCard>
        <PlaceholderCard title="AI credits">
          <p>Future: monthly AI credit count, shown from configuration.</p>
          <p className="mt-2">Placeholder: no AI generation and no credit balance here.</p>
        </PlaceholderCard>
        <PlaceholderCard title="Subscription">
          <p>Future: free tier, premium, trial status, and cancel in account.</p>
          <p className="mt-2">Placeholder: no payment and no subscription here.</p>
        </PlaceholderCard>
        <PlaceholderCard title="Human review">
          <p>Future: NVConsult free CV review and paid CV creation, with a real turnaround note.</p>
          <p className="mt-2">{editionConfig.humanHelpNote}</p>
        </PlaceholderCard>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Layout note: one column on phones, two columns on tablets, three columns on desktops.
        Edition is selected by NEXT_PUBLIC_EDITION in lib/config.ts, not by hard coded copy.
      </p>
    </main>
  );
}
