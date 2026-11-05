"use client";

import { useEffect, useState } from "react";
import { parseDraft } from "../../lib/builder-core.mjs";
import { analyzeAts } from "../../lib/writer-core.mjs";
import RequireAuth from "../components/RequireAuth";

// Heuristic ATS check, Phase 2 increment 7, local only.
// This page measures keyword overlap, section presence, contact
// presence, template parse friendliness, and text order. It is not a
// real ATS, it gives no pass or fail result, and it claims no
// guaranteed outcome. The job description is used for this check only:
// it is kept in page state, never saved to localStorage, and never sent.

const DRAFT_KEY = "gcs-builder-draft";

export default function AtsPage() {
  const [draft, setDraft] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setDraft(parseDraft(saved));
      }
    } catch {
      setMessage("Local draft could not be loaded in this browser.");
    }
  }, []);

  function handleCheck() {
    if (!draft) {
      setMessage("Open the builder first, then return here with a draft to check.");
      return;
    }
    if (!jobDescription.trim()) {
      setMessage("Paste a job description first. Without it, keyword overlap cannot be measured, and nothing will be guessed.");
      return;
    }
    setResult(analyzeAts(draft.profile, draft.settings, jobDescription));
    setMessage("Check complete. Read the disclaimer below before you act on any number here.");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <RequireAuth>
      <p className="eyebrow">Heuristic check only, not a real ATS</p>
      <h1 className="page-title">ATS check</h1>
      <p className="mt-3 notice text-ink">
        This is a measured check only. It is not a real applicant tracking system, not a score, and not a pass or fail result. It reports keyword overlap with a job description you paste, which sections are present, which contact fields are present, whether the template is parse friendly, and the text order. No guaranteed outcome is claimed.
      </p>
      {!draft && (
        <p className="mt-4 text-ink">No local draft was found. Open the builder first, then return here.</p>
      )}
      <section className="mt-6 card">
        <label className="block text-sm">Job description to compare against, pasted here only, not saved
          <textarea className="mt-1 input-field" rows={6} value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
        </label>
        <button type="button" className="mt-3 btn-primary" onClick={handleCheck}>Run heuristic check</button>
      </section>

      {result && (
        <section className="mt-6 space-y-4">
          <p className="card text-ink">{result.disclaimer}</p>
          <div className="card">
            <h2 className="font-semibold">Keyword overlap, measured only</h2>
            <p className="mt-2 text-ink">Keywords found in the job description: {result.keywords.length}. Keywords present in your CV text: {result.matched.length}. Keywords not present: {result.missing.length}. Coverage of the measured keywords: {result.keywordCoveragePercent}%.</p>
            <p className="mt-3 text-sm font-semibold">Present in your CV:</p>
            <p className="mt-1 text-ink">{result.matched.length > 0 ? result.matched.join(", ") : "None of the measured keywords were found."}</p>
            <p className="mt-3 text-sm font-semibold">Not present in your CV:</p>
            <p className="mt-1 text-ink">{result.missing.length > 0 ? result.missing.join(", ") : "All measured keywords were found."}</p>
            <p className="mt-3 text-sm text-muted">Missing here means the word was not found in your CV text. It does not mean you lack the skill, and adding a word you do not have would be inventing history.</p>
          </div>
          <div className="card">
            <h2 className="font-semibold">Section presence</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
              {Object.entries(result.sectionPresence).map(([key, value]: any) => (
                <li key={key}>{key}: {value ? "present" : "not present"}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2 className="font-semibold">Contact presence and template</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
              {Object.entries(result.contactPresence).map(([key, value]: any) => (
                <li key={key}>{key}: {value ? "present" : "not present"}</li>
              ))}
            </ul>
            <p className="mt-3 text-ink">Template: {result.templateId}. Parse friendly: {result.parseFriendly ? "yes, single column" : "no, design first"}. {result.parseNote}</p>
            <p className="mt-3 text-ink">Text order: {result.textOrder.join(", ")}.</p>
          </div>
        </section>
      )}

      {message && <p className="mt-4 text-ink">{message}</p>}
      <p className="mt-4"><a className="brand-link" href="/builder">Back to the builder</a> | <a className="ml-2 brand-link" href="/writer">Local writer</a> | <a className="ml-2 brand-link" href="/letters">Letter studio</a></p>
      </RequireAuth>
    </main>
  );
}
