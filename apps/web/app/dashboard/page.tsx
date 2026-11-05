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
import {
  deleteServerDocument,
  fetchServerDocuments,
  readServerSession
} from "../../lib/session-client.mjs";
import { edition } from "../../lib/config";
import RequireAuth from "../components/RequireAuth";
import ErrorNotice from "../components/ErrorNotice";

// Working dashboard, Phase 2 increment 17, saved and browser documents.
// When signed in, it lists that user's saved documents from
// /api/documents, with open in builder and delete through the
// account. Drafts in this browser are still listed as well, and are
// never silently dropped or overwritten. Rename and duplicate stay
// in this browser only, because the saved document API does not
// offer them yet. AI credits, subscription, and human review are
// still clearly labelled not yet connected, and are not presented as
// working features. No payment or AI is connected here.

const DRAFT_KEY = "gcs-builder-draft";
const JOB_VERSIONS_KEY = "gcs-builder-job-versions";
const DOCUMENTS_KEY = "gcs-documents";
const SESSION_KEY = "gcs-session";
const OPEN_KEY = "gcs-open-document";
const MASTER_LABEL_KEY = "gcs-master-label";

export default function Dashboard() {
  const [sessionEmail, setSessionEmail] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [serverDocuments, setServerDocuments] = useState<any[]>([]);
  const [serverAvailable, setServerAvailable] = useState(false);
  const [renameId, setRenameId] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<any>(null);

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
      setMessage("Drafts in this browser could not be loaded.");
      setDocuments([]);
    }
  }

  async function loadServerDocuments() {
    const session = readServerSession(window.localStorage);
    if (!session) {
      setServerDocuments([]);
      setServerAvailable(false);
      return;
    }
    setServerAvailable(true);
    try {
      const listed = await fetchServerDocuments(undefined, session, edition);
      setServerDocuments(listed);
    } catch (error: any) {
      setServerDocuments([]);
      setMessage(
        error?.code === "local_only" || error?.code === "unreachable"
          ? "Your saved documents could not be loaded right now. Your drafts below are unchanged."
          : error?.message || "Saved documents could not be loaded."
      );
    }
  }

  useEffect(() => {
    try {
      const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
      if (session && session.mode === "server") {
        const serverSession = readServerSession(window.localStorage);
        if (serverSession) {
          setSessionEmail(serverSession.email);
        }
      } else if (isSessionValid(session)) {
        setSessionEmail(session.email);
      }
    } catch {
      setSessionEmail("");
    }
    loadDocuments();
    loadServerDocuments();
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

  function openServerInBuilder(document: any) {
    window.localStorage.setItem(OPEN_KEY, JSON.stringify({ ...document, serverDocument: true, label: document.title || "Untitled document" }));
    window.location.href = "/builder";
  }

  async function handleServerDelete(id: string, label: string) {
    const session = readServerSession(window.localStorage);
    if (!session) {
      setMessage("No signed-in session was found, so the saved document was not deleted.");
      return;
    }
    if (!window.confirm(`Delete "${label}" from your account? This removes the saved copy. Your drafts in this browser are not touched.`)) {
      setMessage("Delete cancelled. The saved document was not removed.");
      return;
    }
    try {
      await deleteServerDocument(undefined, session, id);
      setServerDocuments((current: any[]) => current.filter((item: any) => item.id !== id));
      setMessage(`Saved document deleted: ${label}.`);
    } catch (error: any) {
      setNotice({
        title: "Delete failed.",
        message: error?.message || "The document was not removed.",
        solution: error?.solution || "Check your connection and try again. Your drafts in this browser are unchanged."
      });
    }
  }

  function handleDuplicate(id: string) {
    try {
      persist(duplicateDocument(documents, id));
      setMessage("Document duplicated. The original was not changed.");
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
      setMessage("Document renamed.");
    } catch (error: any) {
      setMessage(error?.message || "Rename failed. A name is required.");
    }
  }

  function handleDelete(id: string, label: string) {
    if (!window.confirm(`Delete "${label}" from the drafts in this browser? This does not delete a saved copy.`)) {
      setMessage("Delete cancelled. The document was not removed.");
      return;
    }
    persist(deleteDocument(documents, id, true));
    setMessage(`Draft deleted: ${label}.`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <RequireAuth>
      <p className="eyebrow">Dashboard</p>
      <h1 className="page-title">Dashboard</h1>
      <p className="mt-3 text-ink">{editionConfig.dashboardIntro}</p>
      <p className="mt-4 notice text-ink">
        {siteConfig.status} {sessionEmail ? `Signed in as ${sessionEmail}.` : "Not signed in. The documents below are drafts in this browser."} No payment or AI is connected here.
      </p>
      <p className="mt-4 flex flex-wrap gap-2">
        <a className="btn-primary" href="/builder">Open the CV builder</a>
        <a className="btn-secondary" href="/auth">Account</a>
        <a className="btn-secondary" href="/profile">Edit master profile</a>
        <a className="btn-secondary" href="/writer">Writer</a>
        <a className="btn-secondary" href="/letters">Letter studio</a>
        <a className="btn-secondary" href="/ats">ATS check, heuristic only</a>
        <a className="btn-secondary" href="/subscription">Subscription</a>
      </p>

      {serverAvailable && (
        <>
          <h2 className="mt-8 section-title">Your documents saved with your account</h2>
          {serverDocuments.length === 0 ? (
            <p className="mt-3 text-ink">No saved documents yet. Open the builder and use Save to my account to store a copy there.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {serverDocuments.map((document: any) => (
                <li key={document.id} className="card">
                  <p className="font-semibold">{document.title || "Untitled document"}</p>
                  <p className="text-sm text-muted">
                    Saved document | Template: {document.templateId || "not set"} | Paper: {document.paperSize === "US_LETTER" ? "US Letter" : "A4"} | Updated: {document.updatedAt || "not set"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary" onClick={() => openServerInBuilder(document)}>Open in builder</button>
                    <button type="button" className="btn-danger" onClick={() => handleServerDelete(document.id, document.title || "Untitled document")}>Delete from my account, with confirmation</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-muted">Saved documents store the title, template, paper size, and section order. The full profile content is stored separately on the profile page, not inside a saved document. Rename and duplicate are not offered for saved documents yet.</p>
        </>
      )}

      <h2 className="mt-8 section-title">Your drafts in this browser</h2>
      {documents.length === 0 ? (
        <p className="mt-3 text-ink">No drafts yet. Open the builder to create a draft, or import a CV there.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {documents.map((document: any) => (
            <li key={document.id} className="card">
              <p className="font-semibold">{document.label}</p>
              <p className="text-sm text-muted">
                {document.kind === "master" ? "Master draft" : `Job version${document.jobTitle ? `: ${document.jobTitle}` : ""}${document.company ? ` at ${document.company}` : ""}`} | Template: {document.settings?.templateId || "ats-minimal"} | Paper: {document.settings?.paperSize || "A4"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => openInBuilder(document)}>Open in builder</button>
                <button type="button" className="btn-secondary" onClick={() => handleDuplicate(document.id)}>Duplicate</button>
                <button type="button" className="btn-secondary" onClick={() => { setRenameId(document.id); setRenameValue(document.label); }}>Rename</button>
                <button type="button" className="btn-danger" onClick={() => handleDelete(document.id, document.label)}>Delete, with confirmation</button>
              </div>
              {renameId === document.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input className="input-field" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} aria-label="New document name" />
                  <button type="button" className="btn-secondary" onClick={() => handleRename(document.id)}>Save name</button>
                  <button type="button" className="btn-secondary" onClick={() => { setRenameId(""); setRenameValue(""); }}>Cancel</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {notice && (
        <div className="mt-4">
          <ErrorNotice title={notice.title} message={notice.message} solution={notice.solution} />
        </div>
      )}
      {message && <p className="mt-4 text-ink">{message}</p>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <h3 className="font-semibold">Templates</h3>
          <p className="mt-2 text-ink">All 10 version 1 templates are in the builder, with an honest ATS note per template.</p>
          <p className="mt-2"><a className="brand-link" href="/builder">Open the builder</a></p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Writer, letters, and ATS check</h3>
          <p className="mt-2 text-ink">Drafting assistance, letter studio, and a heuristic ATS check are working, in this browser. No AI provider is connected, so no AI credits are shown.</p>
          <p className="mt-2"><a className="brand-link" href="/writer">Open the writer</a></p>
        </div>
        <div className="card">
          <h3 className="font-semibold">AI credits</h3>
          <p className="mt-2 text-ink">Not yet connected. No connected AI generation and no credit balance is shown here, because no AI provider is connected.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Subscription</h3>
          <p className="mt-2 text-ink">Plan settings only, in this browser. No payment, price, or Stripe account has been decided, and no checkout is working. Trial, entitlements, downgrade behaviour, and cancel are shown on the subscription page.</p>
          <p className="mt-2"><a className="brand-link" href="/subscription">Open the subscription page</a></p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Human review</h3>
          <p className="mt-2 text-ink">Not yet connected. {editionConfig.humanHelpNote}</p>
        </div>
      </div>
      <p className="mt-8 text-sm text-muted">
        Layout: one column on phones, two columns on tablets, three columns on desktops. Edition is selected by NEXT_PUBLIC_EDITION in lib/config.ts, not by hard coded copy.
      </p>
      </RequireAuth>
    </main>
  );
}
