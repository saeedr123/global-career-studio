"use client";

import { useEffect, useState } from "react";
import { parseDraft } from "../../lib/builder-core.mjs";
import {
  applyRewrite,
  missingFields,
  suggestBulletRewrite,
  suggestSkillRewrite,
  suggestSummaryRewrite
} from "../../lib/writer-core.mjs";
import { effectivePlan, isAdvancedAiAllowed } from "../../lib/billing-core.mjs";
import RequireAuth from "../components/RequireAuth";

// Local drafting assistance, Phase 2 increment 7, local only, with the
// Phase 2 increment 11 provider status. Selected provider: Muse AI.
// Connected Muse AI is ready for a key and is NOT live until the owner
// adds a key and sets a budget cap, so this page falls back to the
// local writer and no text is sent anywhere until then. This page
// rewrites only text the user already supplied, using local rules.
// No qualification, employer, date, or achievement is invented. A
// suggestion is shown beside the original and is applied only after
// the user clicks Apply. Missing fields are prompts, never filled in.

const DRAFT_KEY = "gcs-builder-draft";
const PROFILE_KEY = "gcs-profile";

export default function WriterPage() {
  const [profile, setProfile] = useState<any>(null);
  const [summarySuggestion, setSummarySuggestion] = useState("");
  const [bulletInput, setBulletInput] = useState("");
  const [bulletSuggestion, setBulletSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [subscriptionTrialEnd, setSubscriptionTrialEnd] = useState("");
  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/ai-status")
      .then((response) => response.json())
      .then((data) => setAiStatus(data))
      .catch(() => setAiStatus(null));
    try {
      const subscriptionRaw = window.localStorage.getItem("gcs-subscription");
      if (subscriptionRaw) {
        const subscription = JSON.parse(subscriptionRaw);
        setSubscriptionPlan(effectivePlan(subscription));
        setSubscriptionTrialEnd(subscription.trialEnd || "");
      }
    } catch {
      // An unreadable subscription is ignored, the plan stays Free.
    }
    try {
      const draftRaw = window.localStorage.getItem(DRAFT_KEY);
      if (draftRaw) {
        setProfile(parseDraft(draftRaw).profile);
        return;
      }
      const profileRaw = window.localStorage.getItem(PROFILE_KEY);
      if (profileRaw) {
        setProfile(JSON.parse(profileRaw));
      }
    } catch {
      setMessage("Local draft could not be loaded in this browser.");
    }
  }, []);

  function saveProfile(next: any) {
    setProfile(next);
    let settings = { templateId: "ats-minimal", paperSize: "A4", includePhoto: false, sectionOrder: ["summary", "experience", "education", "skills", "languages"] };
    try {
      const existing = window.localStorage.getItem(DRAFT_KEY);
      if (existing) {
        settings = parseDraft(existing).settings || settings;
      }
    } catch {
      // Keep the default settings above if the existing draft cannot be read.
    }
    const draft = { label: "Draft", savedAt: new Date().toISOString(), profile: next, settings };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <RequireAuth>
        <h1 className="page-title">Local writer</h1>
        <p className="mt-3 text-ink">No local draft was found. Open the builder first, then return here to improve text you already wrote.</p>
        <p className="mt-4"><a className="brand-link" href="/builder">Open the builder</a></p>
        {message && <p className="mt-4 text-ink">{message}</p>}
      </RequireAuth>
      </main>
    );
  }

  const missing = missingFields(profile);
  const summaryResult = suggestSummaryRewrite(profile.summary || "");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <RequireAuth>
      <p className="eyebrow">Local drafting assistance, not a connected AI model</p>
      <h1 className="page-title">Local writer</h1>
      <p className="mt-3 notice text-ink">
        Selected provider: Muse AI. Connected Muse AI is ready for a key and is NOT live until the owner adds a key and sets a budget cap, so this writer runs in your browser only for now. No text is sent anywhere, and it only rephrases words you already supplied. It never adds an employer, a job title, a date, a certification, or an achievement.
      </p>
      <section className="mt-6 card">
        <h2 className="font-semibold">AI provider status</h2>
        {aiStatus ? (
          <div className="mt-2 text-ink">
            <p>Provider selected: {aiStatus.providerSelected || "Muse AI"}</p>
            <p>Mode: {aiStatus.mode === "connected" ? "Connected" : "Local fallback"}</p>
            <p>{aiStatus.statusText}</p>
            <p className="mt-2 text-sm">No budget cap has been set yet, so the owner must set one before enabling live calls. No key is shown on this page.</p>
          </div>
        ) : (
          <p className="mt-2 text-ink">Provider selected: Muse AI. Connected Muse AI is NOT live yet. Local writer is used, and no text is sent anywhere.</p>
        )}
      </section>
      <section className="mt-6 card">
        <h2 className="font-semibold">AI access, local plan: {subscriptionPlan === "trial" ? `Trial, ends ${subscriptionTrialEnd || "date not set"}` : subscriptionPlan}</h2>
        {isAdvancedAiAllowed(subscriptionPlan) ? (
          <p className="mt-2 text-ink">Advanced AI is included in your local plan in config, but connected Muse AI is NOT live yet, so only the local rewriting below runs here. Nothing here is presented as a live connected AI call.</p>
        ) : (
          <p className="mt-2 text-ink">Advanced AI features, including job specific tailoring, are locked on the Free plan. Basic local rewriting below is still available on Free. No checkout or payment is shown here.</p>
        )}
        <p className="mt-2"><a className="brand-link" href="/subscription">Open the subscription page</a></p>
      </section>

      {missing.length > 0 && (
        <section className="mt-6 card">
          <h2 className="font-semibold">Missing fields, to fill in yourself</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
            {missing.map((item: any) => (
              <li key={item.field}>{item.prompt}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">Nothing here is filled in for you, because filling it in would invent your history.</p>
        </section>
      )}

      <section className="mt-6 card">
        <h2 className="font-semibold">Summary rewrite</h2>
        <label className="mt-3 block text-sm">Your summary
          <textarea className="mt-1 input-field" rows={4} value={profile.summary || ""} onChange={(event) => setProfile((current: any) => ({ ...current, summary: event.target.value }))} />
        </label>
        <button type="button" className="mt-3 btn-primary" onClick={() => setSummarySuggestion(summaryResult.suggested)}>Suggest rewrite</button>
        {summaryResult.prompt && <p className="mt-3 text-ink">{summaryResult.prompt}</p>}
        {summarySuggestion && (
          <div className="mt-4">
            <p className="text-sm font-semibold">Suggested rewrite, original kept beside it until you apply:</p>
            <p className="mt-2 rounded border bg-background p-3 text-ink">{summarySuggestion}</p>
            <button type="button" className="mt-3 btn-secondary" onClick={() => { saveProfile({ ...profile, summary: applyRewrite(profile.summary, summarySuggestion, true) }); setSummarySuggestion(""); setMessage("Summary rewrite applied, after your confirmation. Check it before you export."); }}>Apply this rewrite</button>
            <button type="button" className="mt-3 ml-2 btn-secondary" onClick={() => setSummarySuggestion("")}>Keep original</button>
          </div>
        )}
      </section>

      <section className="mt-6 card">
        <h2 className="font-semibold">Experience bullet rewrite</h2>
        <p className="mt-2 text-sm text-ink">Paste or type one bullet you already wrote, then check the suggestion before you use it.</p>
        <label className="mt-3 block text-sm">Your bullet
          <input className="mt-1 input-field" value={bulletInput} onChange={(event) => setBulletInput(event.target.value)} />
        </label>
        <button type="button" className="mt-3 btn-primary" onClick={() => setBulletSuggestion(suggestBulletRewrite(bulletInput).suggested)}>Suggest rewrite</button>
        {bulletSuggestion && (
          <div className="mt-4">
            <p className="text-sm font-semibold">Suggested rewrite:</p>
            <p className="mt-2 rounded border bg-background p-3 text-ink">{bulletSuggestion}</p>
            <p className="mt-2 text-sm text-muted">Copy it into the builder only if it still says what you did, in your own facts.</p>
          </div>
        )}
        <p className="mt-4 text-sm text-ink">Your current experience bullets, for reference:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
          {(profile.experience || []).flatMap((entry: any) => entry.bullets || []).map((bullet: string, index: number) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 card">
        <h2 className="font-semibold">Skills wording</h2>
        <p className="mt-2 text-sm text-ink">Skills are tidied only, never added. A skill you did not list will not appear here.</p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
          {(profile.skills || []).map((skill: string, index: number) => (
            <li key={index}>{suggestSkillRewrite(skill)}</li>
          ))}
        </ul>
      </section>

      {message && <p className="mt-4 text-ink">{message}</p>}
      <p className="mt-4"><a className="brand-link" href="/builder">Back to the builder</a> | <a className="ml-2 brand-link" href="/letters">Letter studio</a> | <a className="ml-2 brand-link" href="/ats">ATS check</a></p>
      </RequireAuth>
    </main>
  );
}
