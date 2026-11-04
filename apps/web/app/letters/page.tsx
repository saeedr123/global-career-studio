"use client";

import { useEffect, useState } from "react";
import { parseDraft } from "../../lib/builder-core.mjs";
import { LETTER_TYPES, generateLetter } from "../../lib/writer-core.mjs";
import { canExportLetter, effectivePlan, isLetterTypeAllowed, lockMessage } from "../../lib/billing-core.mjs";

// Letter studio, Phase 2 increment 7, local drafts only.
// Letters use only fields the user supplied. Optional fields not
// supplied appear as bracket placeholders to fill in, never as
// invented names, dates, or companies. A letter is generated, then
// shown as editable text, and only the edited text is exported.

const DRAFT_KEY = "gcs-builder-draft";
const PROFILE_KEY = "gcs-profile";
const LETTERS_KEY = "gcs-letters";

async function exportLetter(title: string, paragraphs: string[], format: string, subscriptionPlan: string) {
  const response = await fetch("/api/letter-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, paragraphs, format, subscriptionPlan })
  });
  if (!response.ok) {
    throw new Error("Letter export failed.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = format === "pdf" ? "letter.pdf" : "letter.docx";
  link.click();
  URL.revokeObjectURL(url);
}

export default function LettersPage() {
  const [fields, setFields] = useState<any>({ fullName: "", headline: "", summary: "", jobTitle: "", company: "", recipientName: "", senderName: "", date: "", lastWorkingDay: "" });
  const [typeId, setTypeId] = useState("cover");
  const [letterText, setLetterText] = useState("");
  const [letterTitle, setLetterTitle] = useState("Cover letter");
  const [message, setMessage] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [subscriptionTrialEnd, setSubscriptionTrialEnd] = useState("");

  useEffect(() => {
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
      const profile = draftRaw ? parseDraft(draftRaw).profile : null;
      const profileRaw = window.localStorage.getItem(PROFILE_KEY);
      const saved = profileRaw ? JSON.parse(profileRaw) : null;
      const base = profile || saved || {};
      setFields((current: any) => ({
        ...current,
        fullName: base.fullName || "",
        headline: base.headline || "",
        summary: base.summary || ""
      }));
    } catch {
      setMessage("Local profile could not be loaded in this browser.");
    }
  }, []);

  function updateField(name: string, value: string) {
    setFields((current: any) => ({ ...current, [name]: value }));
  }

  function handleGenerate() {
    if (!isLetterTypeAllowed(subscriptionPlan, typeId)) {
      setLetterText("");
      setMessage(lockMessage("letter"));
      return;
    }
    const result = generateLetter(typeId, fields);
    setLetterTitle(result.title);
    if (result.missing.length > 0) {
      setLetterText("");
      setMessage(result.prompt);
      return;
    }
    setLetterText(result.paragraphs.join("\n\n"));
    setMessage("Letter generated from your fields only. Check it and edit it before you export or send it.");
  }

  function handleSave() {
    if (!letterText.trim()) {
      setMessage("Generate a letter first, then save it.");
      return;
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem(LETTERS_KEY) || "[]");
      saved.push({ title: letterTitle, type: typeId, text: letterText, savedAt: new Date().toISOString() });
      window.localStorage.setItem(LETTERS_KEY, JSON.stringify(saved));
      setMessage("Letter saved locally, in this browser only, until a real database is connected.");
    } catch {
      setMessage("Letter could not be saved locally.");
    }
  }

  async function handleExport(format: string) {
    const entitlement = canExportLetter({ planId: subscriptionPlan, format, existingDocument: false });
    if (!entitlement.allowed) {
      setMessage(entitlement.reason);
      return;
    }
    try {
      const paragraphs = letterText.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
      await exportLetter(letterTitle, paragraphs, format, subscriptionPlan);
      setMessage(`Letter exported as ${format.toUpperCase()} from the text shown above.`);
    } catch {
      setMessage("Letter export failed. Your draft was not changed.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Letter studio, local drafts only</p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Letter studio</h1>
      <p className="mt-3 text-slate-700">Choose a letter type, fill in only what is true, and check the generated text before you use it. Bracket placeholders mean a field still needs filling in, not a guessed value.</p>
      <p className="mt-4 rounded border border-slate-300 bg-white p-4">
        Current local plan: {subscriptionPlan === "trial" ? `Trial, ends ${subscriptionTrialEnd || "date not set"}` : subscriptionPlan}. Entitlements are local browser state only, until a real database and Stripe are connected. No checkout or payment is shown here.
        {!isLetterTypeAllowed(subscriptionPlan, typeId) && (
          <span className="mt-2 block"> {lockMessage("letter")} A letter you already created stays viewable here.</span>
        )}
        {subscriptionPlan === "free" && (
          <span className="mt-2 block"> DOCX export is a premium export on Free. Standard PDF export is included on Free. <a className="text-blue-700 underline" href="/subscription">Open the subscription page</a></span>
        )}
      </p>

      <section className="mt-6 rounded border border-slate-200 bg-white p-4">
        <label className="block text-sm">Letter type
          <select className="mt-1 block w-full rounded border p-2" value={typeId} onChange={(event) => setTypeId(event.target.value)}>
            {LETTER_TYPES.map((type: any) => (
              <option key={type.id} value={type.id}>{type.name}: {type.description}{isLetterTypeAllowed(subscriptionPlan, type.id) ? "" : " (Premium, locked on Free)"}</option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">Full name<input className="mt-1 w-full rounded border p-2" value={fields.fullName} onChange={(event) => updateField("fullName", event.target.value)} /></label>
          <label className="block text-sm">Headline<input className="mt-1 w-full rounded border p-2" value={fields.headline} onChange={(event) => updateField("headline", event.target.value)} /></label>
          <label className="block text-sm">Job title<input className="mt-1 w-full rounded border p-2" value={fields.jobTitle} onChange={(event) => updateField("jobTitle", event.target.value)} /></label>
          <label className="block text-sm">Company<input className="mt-1 w-full rounded border p-2" value={fields.company} onChange={(event) => updateField("company", event.target.value)} /></label>
          <label className="block text-sm">Recipient name, optional<input className="mt-1 w-full rounded border p-2" value={fields.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} /></label>
          <label className="block text-sm">Sender name, optional<input className="mt-1 w-full rounded border p-2" value={fields.senderName} onChange={(event) => updateField("senderName", event.target.value)} /></label>
          <label className="block text-sm">Date, optional<input className="mt-1 w-full rounded border p-2" value={fields.date} onChange={(event) => updateField("date", event.target.value)} /></label>
          <label className="block text-sm">Last working day, for resignation only<input className="mt-1 w-full rounded border p-2" value={fields.lastWorkingDay} onChange={(event) => updateField("lastWorkingDay", event.target.value)} /></label>
        </div>
        <label className="mt-3 block text-sm">Summary, used by motivation, LinkedIn About, and personal statement
          <textarea className="mt-1 block w-full rounded border p-2" rows={3} value={fields.summary} onChange={(event) => updateField("summary", event.target.value)} />
        </label>
        <button type="button" className="mt-4 rounded bg-navy px-4 py-2 text-white" onClick={handleGenerate}>Generate letter</button>
      </section>

      {letterText && (
        <section className="mt-6 rounded border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">{letterTitle}, editable</h2>
          <textarea className="mt-3 block w-full rounded border p-2" rows={14} value={letterText} onChange={(event) => setLetterText(event.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded border border-slate-300 px-3 py-2" onClick={handleSave}>Save letter locally</button>
            <button type="button" className="rounded bg-navy px-3 py-2 text-white" onClick={() => handleExport("pdf")}>Export PDF</button>
            <button type="button" className="rounded bg-navy px-3 py-2 text-white" onClick={() => handleExport("docx")}>Export DOCX</button>
          </div>
          <p className="mt-3 text-sm text-slate-500">Reference and recommendation letters must be checked and signed by the sender before use. Employment verification letters state no dates or duties that were not supplied.</p>
        </section>
      )}

      {message && <p className="mt-4 text-slate-800">{message}</p>}
      <p className="mt-4"><a className="text-blue-700 underline" href="/builder">Back to the builder</a> | <a className="ml-2 text-blue-700 underline" href="/writer">Local writer</a> | <a className="ml-2 text-blue-700 underline" href="/ats">ATS check</a></p>
    </main>
  );
}
