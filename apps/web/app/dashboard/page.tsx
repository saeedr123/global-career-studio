"use client";

import { useEffect, useState } from "react";
import { editionConfig, siteConfig } from "../../lib/config";
import {
  deleteDocument,
  duplicateDocument,
  isSessionValid,
  listDocuments,
  renameDocument,
  seedDocumentsFromBuilder
} from "../../lib/auth-core.mjs";
import { parseDraft } from "../../lib/builder-core.mjs";

// Working dashboard, Phase 2 increment 6, local drafts only.
// This replaces the increment 2 placeholder shell. It lists local
// drafts and job versions, with create, open in builder, duplicate,
// rename, and delete with confirmation. AI credits, subscription, and
// human review are still clearly labelled not yet connected, and are
// not presented as working features. No database, payment, or AI is
// connected in this increment, and drafts live in this browser only.

const DRAFT_KEY = "gcs-builder-draft";
const JOB_VERSIONS_KEY = "gcs-builder-job-versions";
const DOCUMENTS_KEY = "gcs-documents";
const SESSION_KEY = "gcs-session";
const OPEN_KEY = "gcs-open-document";
const MASTER_LABEL_KEY = "gcs-master-label";

export default function Dashboard() {
  const [sessionEmail, setSessionEmail] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [renameId, setRenameId] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [message, setMessage] = useState("");

  function loadDocuments() {
    try {
      const stored = window.localStorage.getItem(DOCUMENTS_KEY);
      if (stored) {
        setDocuments(listDocuments(JSON.parse(stored)));
        return;
      }
      const masterRaw = window.localStorage.getItem(DRAFT_KEY);
      const master = masterRaw ? parseDraft(masterRaw) : null;
      const jobRaw = window.localStorage.getItem(JOB_VERSIONS_KEY);
      const jobVersions = jobRaw ? JSON.parse(jobRaw) : [];
      const masterLabel = window.localStorage.getItem(MASTER_LABEL_KEY) || "Master draft";
      const seeded = seedDocumentsFromBuilder(master, masterLabel, jobVersions);
      window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(seeded));
      setDocuments(seeded);
    } catch {
      setMessage("Local documents could not be loaded in this browser.");
      setDocuments([]);
    }
  }

  useEffect(() => {
    try {
      const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
      if (isSessionValid(session)) {
        setSessionEmail(session.email);
      }
    } catch {
      setSessionEmail("");
    }
    loadDocuments();
  }, []);

  function persist(next: any[]) {
    const ordered = listDocuments(next);
    window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(ordered));
    setDocuments(ordered);
  }

  function openInBuilder(document: any) {
    window.localStorage.setItem(OPEN_KEY, JSON.stringify(document));
    window.location.href = "/builder";
  }

  function handleDuplicate(id: string) {
    try {
      persist(duplicateDocument(documents, id));
      setMessage("Document duplicated locally. The original was not changed.");
    } catch (error: any) {
      setMessage(error?.message || "Duplicate failed.");
    }
  }

  function handleRename(id: string) {
    try {
      persist(renameDocument(documents, id, renameValue));
      if (id === "master") {
        window.localStorage.setItem(MASTER_LABEL_KEY, renameValue.trim());
      }
      setRenameId("");
      setRenameValue("");
      setMessage("Document renamed locally.");
    } catch (error: any) {
      setMessage(error?.message || "Rename failed. A name is required.");
    }
  }

  function handleDelete(id: string, label: string) {
    if (!window.confirm(`Delete "${label}" from the local list? This does not delete a server copy, because no database is connected yet.`)) {
      setMessage("Delete cancelled. The document was not removed.");
      return;
    }
    persist(deleteDocument(documents, id, true));
    setMessage(`Document deleted locally: ${label}.`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dashboard, local drafts only</p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Dashboard</h1>
      <p className="mt-3 text-slate-700">{editionConfig.dashboardIntro}</p>
      <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-4 text-slate-800">
        {siteConfig.status} {sessionEmail ? `Signed in locally as ${sessionEmail}.` : "Not signed in locally. The documents below are local browser drafts only, not server documents."} No payment, AI, or real database is connected here.
      </p>
      <p className="mt-4 flex flex-wrap gap-2">
        <a className="rounded bg-navy px-4 py-2 text-white" href="/builder">Open the CV builder</a>
        <a className="rounded border border-slate-300 px-4 py-2" href="/auth">Account, local only</a>
        <a className="rounded border border-slate-300 px-4 py-2" href="/profile">Edit master profile</a>
      </p>

      <h2 className="mt-8 text-2xl font-semibold">Your documents, local only</h2>
      {documents.length === 0 ? (
        <p className="mt-3 text-slate-700">No local documents yet. Open the builder to create a draft, or import a CV there.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {documents.map((document: any) => (
            <li key={document.id} className="rounded border border-slate-200 bg-white p-4">
              <p className="font-semibold">{document.label}</p>
              <p className="text-sm text-slate-500">
                {document.kind === "master" ? "Master draft" : `Job version${document.jobTitle ? `: ${document.jobTitle}` : ""}${document.company ? ` at ${document.company}` : ""}`} | Template: {document.settings?.templateId || "ats-minimal"} | Paper: {document.settings?.paperSize || "A4"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded bg-navy px-3 py-2 text-sm text-white" onClick={() => openInBuilder(document)}>Open in builder</button>
                <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => handleDuplicate(document.id)}>Duplicate</button>
                <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => { setRenameId(document.id); setRenameValue(document.label); }}>Rename</button>
                <button type="button" className="rounded border border-red-300 px-3 py-2 text-sm" onClick={() => handleDelete(document.id, document.label)}>Delete, with confirmation</button>
              </div>
              {renameId === document.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input className="rounded border p-2" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} aria-label="New document name" />
                  <button type="button" className="rounded bg-navy px-3 py-2 text-sm text-white" onClick={() => handleRename(document.id)}>Save name</button>
                  <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => { setRenameId(""); setRenameValue(""); }}>Cancel</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-4 text-slate-800">{message}</p>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">Templates</h3>
          <p className="mt-2 text-slate-700">All 10 version 1 templates are in the builder, with an honest ATS note per template.</p>
          <p className="mt-2"><a className="text-blue-700 underline" href="/builder">Open the builder</a></p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">AI credits</h3>
          <p className="mt-2 text-slate-700">Not yet connected. No AI generation and no credit balance is shown here, because no AI provider is connected.</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">Subscription</h3>
          <p className="mt-2 text-slate-700">Not yet connected. No payment, price, trial, or subscription status is shown here, because no price or Stripe account has been decided.</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">Human review</h3>
          <p className="mt-2 text-slate-700">Not yet connected. {editionConfig.humanHelpNote}</p>
        </div>
      </div>
      <p className="mt-8 text-sm text-slate-500">
        Layout: one column on phones, two columns on tablets, three columns on desktops. Edition is selected by NEXT_PUBLIC_EDITION in lib/config.ts, not by hard coded copy.
      </p>
    </main>
  );
}
