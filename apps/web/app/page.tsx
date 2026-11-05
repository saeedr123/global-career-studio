import { editionConfig } from "../lib/config";
import { TEMPLATES, templateById } from "../lib/builder-core.mjs";
import { COUNTRY_PACKS } from "../lib/packs-core.mjs";
import { LETTER_TYPES } from "../lib/writer-core.mjs";
import { PLANS } from "../lib/billing-core.mjs";

// Landing page, Phase 2 increment 16. A real product landing page,
// not a project shell. The free entry leads, each section has one
// primary call to action, and the content is built in uniform card
// systems, dossier rules 3, 4, 10, 13 and 14. Every number on this
// page is counted from the code lists, never typed in by hand, and
// no counter, percentage, success rate, testimonial, or slider
// appears anywhere, dossier rules 2 and 18. The trust line is the
// checkable operator line in the NVConsult edition only, rule 8.

const FREE_PLAN = PLANS.find((plan: any) => plan.id === "free");
if (!FREE_PLAN) {
  throw new Error("The free plan is missing from the billing config.");
}
const FREE_TEMPLATE_COUNT = FREE_PLAN.templatesAllowed.length;
const FREE_DOCUMENT_LIMIT = FREE_PLAN.documentLimit;
const FREE_TEMPLATE_NAMES = ["ats-minimal", "modern-professional", "european"].map(
  (id) => templateById(id).name
);
const FEATURED_TEMPLATES = TEMPLATES.slice(0, 3).map((template: any) => template.name);
const FEATURED_PACKS = COUNTRY_PACKS.slice(0, 4).map((pack: any) => pack.name);

export default function Home() {
  const isNvconsult = editionConfig.edition === "nvconsult";
  const heroHeadline = isNvconsult
    ? "Your CV, built for the country you are applying to."
    : editionConfig.tagline;
  const heroLead = isNvconsult
    ? "Start free in the builder, export a PDF, and ask NVConsult for a human check before you apply."
    : "Start free in the builder and export a PDF. Human help from NVConsult is there when you need it.";
  return (
    <main>
      <section className="hero">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Free CV builder</p>
          <h1 className="hero-title mt-3">{heroHeadline}</h1>
          <div className="hero-rule mt-4" aria-hidden="true" />
          <p className="lead mt-4 max-w-2xl text-slate-200">{heroLead}</p>
          <p className="mt-6 flex flex-wrap items-center gap-4">
            <a className="btn-primary" href="/builder">
              Start building your CV, free
            </a>
            <a className="inline-flex min-h-[44px] items-center text-white underline underline-offset-2" href="/#how-it-works">
              See how it works
            </a>
          </p>
          <p className="mt-6 text-sm text-slate-300">
            {isNvconsult
              ? "NVConsult is a trading name of Saeed Rasul. IČO: 23038594, Brno, Czech Republic."
              : "Free tier for everyone. No card needed to start."}
          </p>
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="eyebrow">What you get</p>
        <h2 className="section-title mt-2">Everything you need to apply, in one place</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card">
            <h3 className="card-title">Templates</h3>
            <p className="mt-2 text-ink">
              {TEMPLATES.length} templates, including {FEATURED_TEMPLATES.join(", ")}, and{" "}
              {TEMPLATES.length - 3} more in the builder. Each one carries an honest ATS note, so you
              know which ones suit a portal upload.
            </p>
            <p className="mt-3">
              <a className="brand-link" href="/builder">
                Browse templates in the builder
              </a>
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">Country packs</h3>
            <p className="mt-2 text-ink">
              {COUNTRY_PACKS.length} country packs, including {FEATURED_PACKS.join(", ")}, and{" "}
              {COUNTRY_PACKS.length - 4} more in the builder. Each pack sets the paper size, section
              order, and photo guidance for its country.
            </p>
            <p className="mt-3">
              <a className="brand-link" href="/onboarding">
                Choose your country first
              </a>
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">Letters</h3>
            <p className="mt-2 text-ink">
              {LETTER_TYPES.length} letter types, from cover letters to resignation letters. You write
              the facts, the letter keeps the structure, and nothing is invented for you.
            </p>
            <p className="mt-3">
              <a className="brand-link" href="/letters">
                Open the letter studio
              </a>
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">ATS check</h3>
            <p className="mt-2 text-ink">
              A heuristic check only. It looks at keywords, sections, and text order. It is not a real
              ATS, not a score, and it guarantees nothing.
            </p>
            <p className="mt-3">
              <a className="brand-link" href="/ats">
                Run the ATS check
              </a>
            </p>
          </div>
        </div>
        <p className="mt-6">
          <a className="btn-primary" href="/builder">
            Open the builder
          </a>
        </p>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="eyebrow">How it works</p>
        <h2 className="section-title mt-2">Four steps, no retyping</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="text-sm font-bold text-navy">Step 1</p>
            <h3 className="card-title mt-1">Create your free account</h3>
            <p className="mt-2 text-ink">One account, on the server, so your work follows you across devices.</p>
          </div>
          <div className="card">
            <p className="text-sm font-bold text-navy">Step 2</p>
            <h3 className="card-title mt-1">Fill in your profile once</h3>
            <p className="mt-2 text-ink">Your master profile feeds every document, so you do not retype it.</p>
          </div>
          <div className="card">
            <p className="text-sm font-bold text-navy">Step 3</p>
            <h3 className="card-title mt-1">Pick a template and a country pack</h3>
            <p className="mt-2 text-ink">
              {TEMPLATES.length} templates and {COUNTRY_PACKS.length} country packs to choose from.
            </p>
          </div>
          <div className="card">
            <p className="text-sm font-bold text-navy">Step 4</p>
            <h3 className="card-title mt-1">Export a PDF or DOCX</h3>
            <p className="mt-2 text-ink">
              PDF export on the free tier, with selectable text. DOCX export is a genuinely editable
              document, not a picture inside Word.
            </p>
          </div>
        </div>
        <p className="mt-6">
          <a className="btn-primary" href="/auth">
            Create your free account
          </a>
        </p>
      </section>

      <section id="free" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="eyebrow">Free tier</p>
        <h2 className="section-title mt-2">Free means free, and the limits are stated</h2>
        <div className="card mt-6">
          <p className="text-ink">
            The free tier includes the CV builder, {FREE_TEMPLATE_COUNT} templates (
            {FREE_TEMPLATE_NAMES.join(", ")}), PDF export, and {FREE_DOCUMENT_LIMIT} documents.
            Cover letters and basic local rewriting are included. Premium and trial prices are not set
            yet, and no payment is taken in this app.
          </p>
          <p className="mt-3 text-ink">
            When you are ready for a second pair of eyes, ask NVConsult for a human check through the
            free consultation. The same free tier applies to everyone, in both editions.
          </p>
        </div>
        <p className="mt-6 flex flex-wrap items-center gap-4">
          <a className="btn-primary" href="/builder">
            Start free
          </a>
          <a className="brand-link" href="https://nvconsult.eu">
            {isNvconsult ? "Book a free consultation" : "Need human help?"}
          </a>
        </p>
      </section>
    </main>
  );
}
