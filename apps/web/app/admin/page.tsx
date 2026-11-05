"use client";

import { useEffect, useState } from "react";
import { COUNTRY_PACKS } from "../../lib/packs-core.mjs";
import {
  CONFIG_KINDS,
  FEATURE_FLAG_KEYS,
  aggregateCounts,
  appendAuditLog,
  createAuditLog,
  createFeatureFlags,
  createVersionedConfig,
  previewConfig,
  publishConfig,
  rollbackConfig,
  setFeatureFlag
} from "../../lib/admin-core.mjs";
import { readServerSession, serverHeaders } from "../../lib/session-client.mjs";

// Admin area, rebuilt 2026-11-05. The page loads its data from
// /api/admin/overview, which checks the admin role on the server from
// the signed in session; anyone else gets 401 and sees no data here.
// Live data: account and document counts, open help requests, the
// help request list with a status an admin can change, and the newest
// accounts. Names and emails appear only in the help requests and the
// account list, because NVConsult needs them to reply; no CV text, no
// document content, and no password hash is ever shown. The older
// browser-only tools (local counts, config versioning, feature flags,
// local audit log) are kept at the bottom, folded away, because they
// change nothing outside this browser.

const DOCUMENTS_KEY = "gcs-documents";
const DRAFT_KEY = "gcs-builder-draft";
const SUBSCRIPTION_KEY = "gcs-subscription";
const ADMIN_CONFIG_KEY = "gcs-admin-config";
const ADMIN_FLAGS_KEY = "gcs-admin-flags";
const ADMIN_AUDIT_KEY = "gcs-admin-audit";

const KIND_LABELS: any = {
  templates: "Templates",
  prompts: "Prompts",
  countryPacks: "Country packs"
};

const HELP_GOAL_LABELS: any = {
  study: "Study",
  work: "Work",
  business: "Business"
};

const HELP_NEED_LABELS: any = {
  consultation: "Free consultation call",
  review: "CV review only",
  both: "Both"
};

const HELP_STATUS_LABELS: any = {
  new: "New",
  contacted: "Contacted",
  done: "Done"
};

function helpCountryName(slug: string) {
  const pack = COUNTRY_PACKS.find((item: any) => item.id === slug);
  return pack ? pack.name : slug;
}

function helpDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return String(value || "");
  }
}

function countText(value: any) {
  return typeof value === "number" ? String(value) : "Not available";
}

function readJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: any) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A failed local save is reported by the caller message.
  }
}

export default function AdminPage() {
  // Access: "checking", "admin", "signed-out", "not-admin", or "no-database".
  const [access, setAccess] = useState("checking");
  const [overview, setOverview] = useState<any>(null);
  const [helpRequests, setHelpRequests] = useState<any[] | null>(null);
  const [helpRequestsNote, setHelpRequestsNote] = useState("");
  const [helpFilter, setHelpFilter] = useState("open");
  const [savingId, setSavingId] = useState("");

  const [counts, setCounts] = useState<any>(null);
  const [config, setConfig] = useState<any>(() => createVersionedConfig());
  const [flags, setFlags] = useState<any>(() => createFeatureFlags());
  const [audit, setAudit] = useState<any[]>(() => createAuditLog());
  const [message, setMessage] = useState("");
  const [versions, setVersions] = useState<any>({ templates: "", prompts: "", countryPacks: "" });
  const [summaries, setSummaries] = useState<any>({ templates: "", prompts: "", countryPacks: "" });
  const [reason, setReason] = useState("");

  useEffect(() => {
    // The admin data needs a signed in admin session, checked on the server.
    const session = readServerSession(window.localStorage);
    if (!session) {
      setAccess("signed-out");
    } else {
      fetch("/api/admin/overview", { headers: serverHeaders(session) })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (response.status === 401) {
            setAccess("not-admin");
            return;
          }
          if (response.status === 501) {
            setAccess("no-database");
            return;
          }
          if (!response.ok) {
            setAccess("admin");
            setMessage(data.error || "The admin data could not be read. Try again in a minute.");
            return;
          }
          setAccess("admin");
          setOverview(data);
          setHelpRequests(Array.isArray(data.helpRequests) ? data.helpRequests : null);
          setHelpRequestsNote(data.helpNote || "");
        })
        .catch(() => {
          setAccess("admin");
          setMessage("The admin data could not be read. Check your connection and reload the page.");
        });
    }

    const storedDocuments = readJson(DOCUMENTS_KEY);
    const documents = Array.isArray(storedDocuments) ? storedDocuments : [];
    if (documents.length === 0) {
      const draft = readJson(DRAFT_KEY);
      if (draft && draft.settings) {
        documents.push({ settings: draft.settings });
      }
    }
    const subscription = readJson(SUBSCRIPTION_KEY);
    const planId = subscription && subscription.planId ? subscription.planId : "";
    setCounts(aggregateCounts(documents, planId));
    const storedConfig = readJson(ADMIN_CONFIG_KEY);
    if (storedConfig) {
      setConfig(storedConfig);
    }
    const storedFlags = readJson(ADMIN_FLAGS_KEY);
    if (storedFlags) {
      setFlags(storedFlags);
    }
    const storedAudit = readJson(ADMIN_AUDIT_KEY);
    if (Array.isArray(storedAudit)) {
      setAudit(storedAudit);
    }
  }, []);

  async function changeHelpStatus(id: string, status: string) {
    const session = readServerSession(window.localStorage);
    if (!session) {
      setMessage("Your sign-in has ended. Sign in again to change a request.");
      return;
    }
    setSavingId(id);
    try {
      const response = await fetch("/api/human-help", {
        method: "PATCH",
        headers: { ...serverHeaders(session), "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "The status could not be saved.");
        return;
      }
      setHelpRequests((current) =>
        (current || []).map((entry: any) => (entry.id === id ? { ...entry, status } : entry))
      );
      setMessage(`Marked as ${HELP_STATUS_LABELS[status].toLowerCase()}.`);
    } catch {
      setMessage("The status could not be saved. Check your connection and try again.");
    } finally {
      setSavingId("");
    }
  }

  function record(nextAudit: any[], note: string) {
    setAudit(nextAudit);
    writeJson(ADMIN_AUDIT_KEY, nextAudit);
    setMessage(note);
  }

  function handlePreview(kind: string) {
    try {
      const next = previewConfig(config, kind, versions[kind], summaries[kind], reason);
      setConfig(next);
      writeJson(ADMIN_CONFIG_KEY, next);
      record(
        appendAuditLog(audit, `preview ${kind}`, reason, `Previewed version ${versions[kind]}.`),
        `Preview set for ${KIND_LABELS[kind]}, in this browser only.`
      );
    } catch (error: any) {
      setMessage(error?.message || "Preview could not be set.");
    }
  }

  function handlePublish(kind: string) {
    try {
      const next = publishConfig(config, kind, versions[kind], summaries[kind], reason);
      setConfig(next);
      writeJson(ADMIN_CONFIG_KEY, next);
      record(
        appendAuditLog(audit, `publish ${kind}`, reason, `Published version ${versions[kind]}.`),
        `Published ${versions[kind]} for ${KIND_LABELS[kind]}, in this browser only.`
      );
    } catch (error: any) {
      setMessage(error?.message || "Publish could not be completed.");
    }
  }

  function handleRollback(kind: string) {
    try {
      const next = rollbackConfig(config, kind, reason);
      setConfig(next);
      writeJson(ADMIN_CONFIG_KEY, next);
      record(
        appendAuditLog(audit, `rollback ${kind}`, reason, `Rolled back to the earlier published version.`),
        `Rolled back ${KIND_LABELS[kind]}, in this browser only.`
      );
    } catch (error: any) {
      setMessage(error?.message || "Rollback could not be completed.");
    }
  }

  function handleFlag(key: string, enabled: boolean) {
    try {
      const next = setFeatureFlag(flags, key, enabled, reason);
      setFlags(next);
      writeJson(ADMIN_FLAGS_KEY, next);
      record(
        appendAuditLog(audit, `feature flag ${key}`, reason, `Set ${key} to ${enabled ? "on" : "off"}.`),
        `Feature flag ${key} set to ${enabled ? "on" : "off"}, in this browser only.`
      );
    } catch (error: any) {
      setMessage(error?.message || "Feature flag could not be changed.");
    }
  }

  if (access === "checking") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="page-title">Admin</h1>
        <p className="mt-4 text-ink">Checking your access...</p>
      </main>
    );
  }

  if (access === "signed-out" || access === "not-admin" || access === "no-database") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="page-title">Admin</h1>
        <div className="mt-4 card text-ink">
          {access === "signed-out" ? (
            <>
              <p>Sign in with an admin account to use this page.</p>
              <p className="mt-3">
                <a className="brand-link" href="/auth?next=%2Fadmin">
                  Go to sign in
                </a>
              </p>
            </>
          ) : null}
          {access === "not-admin" ? <p>This page is for admin accounts only.</p> : null}
          {access === "no-database" ? (
            <p>No database is connected here, so there is no admin data to show.</p>
          ) : null}
        </div>
      </main>
    );
  }

  const visibleHelp = (helpRequests || []).filter((entry: any) =>
    helpFilter === "all" ? true : (entry.status || "new") !== "done"
  );
  const overviewCounts = overview?.counts || {};

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="page-title">Admin</h1>
      {overview?.admin?.email ? (
        <p className="mt-2 text-sm text-muted">Signed in as {overview.admin.email}</p>
      ) : null}
      {message ? (
        <p className="mt-4 notice text-ink" role="status">
          {message}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Overview">
        <div className="card">
          <p className="text-sm text-muted">Accounts</p>
          <p className="mt-1 text-3xl font-bold text-ink">{countText(overviewCounts.accounts)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Saved documents</p>
          <p className="mt-1 text-3xl font-bold text-ink">{countText(overviewCounts.documents)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Open help requests</p>
          <p className="mt-1 text-3xl font-bold text-ink">{countText(overviewCounts.helpOpen)}</p>
          {typeof overviewCounts.helpTotal === "number" ? (
            <p className="mt-1 text-sm text-muted">{overviewCounts.helpTotal} in total</p>
          ) : null}
        </div>
      </section>

      <h2 className="mt-10 section-title">Human help requests</h2>
      <p className="mt-2 text-ink">Newest first. Mark each one as you reply, so nothing gets missed.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Show requests">
        <button
          className={helpFilter === "open" ? "btn-primary" : "btn-secondary"}
          onClick={() => setHelpFilter("open")}
          aria-pressed={helpFilter === "open"}
        >
          Open
        </button>
        <button
          className={helpFilter === "all" ? "btn-primary" : "btn-secondary"}
          onClick={() => setHelpFilter("all")}
          aria-pressed={helpFilter === "all"}
        >
          All
        </button>
      </div>
      {helpRequestsNote ? <p className="mt-4 notice text-ink">{helpRequestsNote}</p> : null}
      {helpRequests !== null && visibleHelp.length === 0 ? (
        <p className="mt-4 text-ink">
          {helpFilter === "open" ? "No open help requests." : "No human help requests yet."}
        </p>
      ) : null}
      {visibleHelp.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {visibleHelp.map((entry: any) => (
            <li key={entry.id} className="card text-sm text-ink">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p>
                    <span className="font-semibold">{entry.name}</span>{" "}
                    <a className="brand-link break-all" href={`mailto:${entry.email}`}>
                      {entry.email}
                    </a>
                  </p>
                  <p className="mt-1">
                    {helpCountryName(entry.country)} | {HELP_GOAL_LABELS[entry.goal] || entry.goal} |{" "}
                    {HELP_NEED_LABELS[entry.need] || entry.need}
                  </p>
                  {entry.message ? <p className="mt-1">{entry.message}</p> : null}
                  <p className="mt-1 text-muted">{helpDate(entry.createdAt)}</p>
                </div>
                <label className="text-sm font-semibold">
                  Status
                  <select
                    className="mt-1 input-field"
                    value={entry.status || "new"}
                    disabled={savingId === entry.id}
                    onChange={(event) => changeHelpStatus(entry.id, event.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="done">Done</option>
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <h2 className="mt-10 section-title">Accounts</h2>
      <p className="mt-2 text-ink">The newest 200 accounts. To make someone an admin, change their role in Neon.</p>
      {Array.isArray(overview?.accounts) && overview.accounts.length > 0 ? (
        <div className="mt-4 overflow-x-auto card p-0">
          <table className="w-full min-w-[560px] text-left text-sm text-ink">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Edition</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {overview.accounts.map((account: any) => (
                <tr key={account.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">{account.name || "No name"}</td>
                  <td className="px-4 py-3 break-all">{account.email}</td>
                  <td className="px-4 py-3">{account.role === "admin" ? "Admin" : "User"}</td>
                  <td className="px-4 py-3">{account.edition === "nvconsult" ? "NVConsult" : "Commercial"}</td>
                  <td className="px-4 py-3">{helpDate(account.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-ink">{overview?.accounts === null ? "Accounts could not be read." : "No accounts yet."}</p>
      )}

      <details className="mt-12 card">
        <summary className="cursor-pointer font-semibold text-ink">Browser-only tools</summary>
        <p className="mt-3 text-sm text-ink">
          These tools save to this browser only and change nothing on the live site. Counts here cover the drafts in
          this browser, not every user.
        </p>

        <h3 className="mt-6 font-semibold text-ink">Document counts in this browser</h3>
        {counts ? (
          <div className="mt-2 space-y-3 text-sm text-ink">
            <p>Total: {counts.total}</p>
            <p>
              By template:{" "}
              {Object.entries(counts.byTemplate)
                .map(([key, value]: any) => `${key} ${value}`)
                .join(", ") || "none"}
            </p>
            <p>
              By country pack:{" "}
              {Object.entries(counts.byCountryPack)
                .map(([key, value]: any) => `${key} ${value}`)
                .join(", ") || "none"}
            </p>
            <p>
              By plan:{" "}
              {Object.entries(counts.byPlan)
                .map(([key, value]: any) => `${key} ${value}`)
                .join(", ") || "none"}
            </p>
          </div>
        ) : null}

        <h3 className="mt-6 font-semibold text-ink">Config versions</h3>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Reason for the next change
          <input
            className="mt-1 input-field"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="For example: weekly config review"
          />
        </label>
        {CONFIG_KINDS.map((kind: string) => (
          <section key={kind} className="mt-4 border-t border-slate-200 pt-4">
            <h4 className="font-semibold text-ink">{KIND_LABELS[kind]}</h4>
            <p className="mt-1 text-sm text-ink">
              Published: {config[kind]?.published ? config[kind].published.version : "none"} | Preview:{" "}
              {config[kind]?.preview ? config[kind].preview.version : "none"} | Earlier versions:{" "}
              {config[kind]?.history?.length || 0}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink">
                Version label
                <input
                  className="mt-1 input-field"
                  value={versions[kind]}
                  onChange={(event) => setVersions({ ...versions, [kind]: event.target.value })}
                  placeholder="For example: 1.1"
                />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Short summary
                <input
                  className="mt-1 input-field"
                  value={summaries[kind]}
                  onChange={(event) => setSummaries({ ...summaries, [kind]: event.target.value })}
                  placeholder="For example: wording update"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => handlePreview(kind)}>
                Preview
              </button>
              <button className="btn-secondary" onClick={() => handlePublish(kind)}>
                Publish
              </button>
              <button className="btn-secondary" onClick={() => handleRollback(kind)}>
                Roll back
              </button>
            </div>
          </section>
        ))}

        <h3 className="mt-6 font-semibold text-ink">Feature flags</h3>
        <ul className="mt-2 space-y-2">
          {FEATURE_FLAG_KEYS.map((key: string) => (
            <li key={key} className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink">
              <span className="font-semibold capitalize">
                {key}: {flags[key] ? "on" : "off"}
              </span>
              <span className="flex gap-2">
                <button className="btn-secondary" onClick={() => handleFlag(key, true)}>
                  Turn on
                </button>
                <button className="btn-secondary" onClick={() => handleFlag(key, false)}>
                  Turn off
                </button>
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-semibold text-ink">Change log in this browser</h3>
        {audit.length === 0 ? (
          <p className="mt-2 text-sm text-ink">No changes recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {audit.map((entry: any, index: number) => (
              <li key={index}>
                <span className="font-semibold">{entry.action}</span> at {entry.time}, reason: {entry.reason}
                {entry.summary ? <span> ({entry.summary})</span> : null}
              </li>
            ))}
          </ul>
        )}
      </details>
    </main>
  );
}
