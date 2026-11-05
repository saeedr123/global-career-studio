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

// Working dashboard, Phase 2 increment 15, server and local documents.
// This replaces the increment 6 local only dashboard. When signed in
// with a server session, it lists that user's documents from
// /api/documents, labelled server, with open in builder and delete
// through the server. Local browser documents are still listed,
// labelled local, and are never silently dropped or overwritten.
// Rename and duplicate stay local only, because the server API does
// not offer them yet. AI credits, subscription, and human review are
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
  const [sessionMode, setSessionMode] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [serverDocuments, setServerDocuments] = useState<any[]>([]);
  const [serverAvailable, setServerAvailable] = useState(false);
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
          ? "The server could not be reached, so server documents are not listed. Your local documents below are unchanged."
          : error?.message || "Server documents could not be loaded."
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
          setSessionMode("server");
        }
      } else if (isSessionValid(session)) {
        setSessionEmail(session.email);
        setSessionMode("local");
      }
    } catch {
      setSessionEmail("");
      setSessionMode("");
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
      setMessage("No server session was found, so the server document was not deleted.");
      return;
    }
    if (!window.confirm(`Delete "${label}" from the server? This removes the server copy. Your local drafts are not touched.`)) {
      setMessage("Delete cancelled. The server document was not removed.");
      return;
    }
    try {
      await deleteServerDocument(undefined, session, id);
      setServerDocuments((current: any[]) => current.filter((item: any) => item.id !== id));
      setMessage(`Server document deleted: ${label}.`);
    } catch (error: any) {
      setMessage(error?.message || "Server delete failed. The document was not removed.");
    }
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
    if (!window.confirm(`Delete "${label}" from the local list? This does not delete a server copy.`)) {
      setMessage("Delete cancelled. The document was not removed.");
      return;
    }
    persist(deleteDocument(documents, id, true));
    setMessage(`Document deleted locally: ${label}.`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <RequireAuth>
      <p className="eyebrow">Dashboard{sessionMode === "server" ? ", server and local documents" : ", local drafts only"}</p>
      <h1 className="page-title">Dashboard</h1>
      <p className="mt-3 text-ink">{editionConfig.dashboardIntro}</p>
      <p className="mt-4 notice text-ink">
        {siteConfig.status} {sessionEmail ? (sessionMode === "server" ? `Signed in on the server as ${sessionEmail}.` : `Signed in locally as ${sessionEmail}.`) : "Not signed in. The documents below are local browser drafts only, not server documents."} No payment or AI is connected here.
      </p>
      <p className="mt-4 flex flex-wrap gap-2">
        <a className="btn-primary" href="/builder">Open the CV builder</a>
        <a className="btn-secondary" href="/auth">Account</a>
        <a className="btn-secondary" href="/profile">Edit master profile</a>
        <a className="btn-secondary" href="/writer">Local writer</a>
        <a className="btn-secondary" href="/letters">Letter studio</a>
        <a className="btn-secondary" href="/ats">ATS check, heuristic only</a>
        <a className="btn-secondary" href="/subscription">Subscription, local only</a>
      </p>

      {serverAvailable && (
        <>
          <h2 className="mt-8 section-title">Your documents on the server</h2>
          {serverDocuments.length === 0 ? (
            <p className="mt-3 text-ink">No server documents yet. Open the builder and use Save to server to store a copy there.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {serverDocuments.map((document: any) => (
                <li key={document.id} className="card">
                  <p className="font-semibold">{document.title || "Untitled document"}</p>
                  <p className="text-sm text-muted">
                    Server document | Template: {document.templateId || "not set"} | Paper: {document.paperSize === "US_LETTER" ? "US Letter" : "A4"} | Updated: {document.updatedAt || "not set"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary" onClick={() => openServerInBuilder(document)}>Open in builder</button>
                    <button type="button" className="btn-danger" onClick={() => handleServerDelete(document.id, document.title || "Untitled document")}>Delete from server, with confirmation</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-muted">Server documents store the title, template, paper size, and section order. The full profile content is stored separately on the profile page, not inside a server document. Rename and duplicate are not offered for server documents yet.</p>
        </>
      )}

      <h2 className="mt-8 section-title">Your documents in this browser, local only</h2>
      {documents.length === 0 ? (
        <p className="mt-3 text-ink">No local documents yet. Open the builder to create a draft, or import a CV there.</p>
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
      {message && <p className="mt-4 text-ink">{message}</p>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <h3 className="font-semibold">Templates</h3>
          <p className="mt-2 text-ink">All 10 version 1 templates are in the builder, with an honest ATS note per template.</p>
          <p className="mt-2"><a className="brand-link" href="/builder">Open the builder</a></p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Local writer, letters, and ATS check</h3>
          <p className="mt-2 text-ink">Local drafting assistance, letter studio, and a heuristic ATS check are now working, in this browser only. No AI provider is connected, so no AI credits are shown.</p>
          <p className="mt-2"><a className="brand-link" href="/writer">Open the local writer</a></p>
        </div>
        <div className="card">
          <h3 className="font-semibold">AI credits</h3>
          <p className="mt-2 text-ink">Not yet connected. No connected AI generation and no credit balance is shown here, because no AI provider is connected.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Subscription, local only</h3>
          <p className="mt-2 text-ink">Local plan config only, in this browser. No payment, price, or Stripe account has been decided, and no checkout is working. Trial, entitlements, downgrade behaviour, and local cancel are shown on the subscription page.</p>
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
