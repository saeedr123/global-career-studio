import { siteConfig } from "../lib/config";

const docs = [
  { label: "Rewritten brief (PROMPT.md)", href: "https://github.com/saeedr123/global-career-studio/blob/main/PROMPT.md" },
  { label: "Project status (PROJECT_STATUS.md)", href: "https://github.com/saeedr123/global-career-studio/blob/main/PROJECT_STATUS.md" },
  { label: "Architecture", href: "https://github.com/saeedr123/global-career-studio/blob/main/docs/architecture.md" },
  { label: "Database design", href: "https://github.com/saeedr123/global-career-studio/blob/main/docs/database-design.md" },
  { label: "MVP scope and open decisions", href: "https://github.com/saeedr123/global-career-studio/blob/main/docs/mvp-scope-and-open-decisions.md" },
  { label: "Competitor research", href: "https://github.com/saeedr123/global-career-studio/blob/main/docs/competitor-research.md" }
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Scaffold and template proof
      </p>
      <h1 className="mt-2 text-4xl font-bold text-navy">{siteConfig.name}</h1>
      <p className="mt-4 text-lg text-slate-700">{siteConfig.tagline}</p>
      <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-4 text-slate-800">
        {siteConfig.status} This page has no accounts, no payments, no AI
        generation, no dashboard, and no letter studio yet. Those parts are
        later Phase 2 work, after the open decisions in PROJECT_STATUS.md
        are made. No price, trial offer, or limit is stated here, because
        none has been decided.
      </p>
      <h2 className="mt-10 text-2xl font-semibold">What increment 1 proves</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
        <li>A Prisma schema based on the Phase 1 database design.</li>
        <li>Two distinct templates only: ATS Minimal and Modern Professional.</li>
        <li>PDF export with selectable text and DOCX export with real headings, paragraphs, and lists.</li>
        <li>Automated export tests for a short sample and a long sample.</li>
      </ul>
      <h2 className="mt-10 text-2xl font-semibold">Project documents</h2>
      <ul className="mt-4 space-y-2">
        {docs.map((doc) => (
          <li key={doc.href}>
            <a className="text-blue-700 underline" href={doc.href}>
              {doc.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-slate-500">
        Sample data used in the template proof is fictional and marked SAMPLE.
        It is never presented as a real user.
      </p>
    </main>
  );
}
