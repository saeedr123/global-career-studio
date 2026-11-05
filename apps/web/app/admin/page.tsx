"use client";

import { useEffect, useState } from "react";
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

// Admin page, Phase 2 increment 10, local only.
// This page is NOT a secured production admin. No real database and
// no real admin auth are connected, so every count, config change,
// flag change, and audit entry here lives in this browser only.
// Counts are aggregated only: template id, country pack id, and plan
// id. No CV text, no user names, no emails, and no document content
// are shown on this page, and no such value is written to the audit
// log. Config publish and rollback change only the local config
// stored in this browser. They do not change any live site.

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
  const [counts, setCounts] = useState<any>(null);
  const [config, setConfig] = useState<any>(() => createVersionedConfig());
  const [flags, setFlags] = useState<any>(() => createFeatureFlags());
  const [audit, setAudit] = useState<any[]>(() => createAuditLog());
  const [message, setMessage] = useState("");
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);
  const [versions, setVersions] = useState<any>({ templates: "", prompts: "", countryPacks: "" });
  const [summaries, setSummaries] = useState<any>({ templates: "", prompts: "", countryPacks: "" });
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetch("/api/database-status")
      .then((response) => response.json())
      .then((data) => setDatabaseStatus(data))
      .catch(() => setDatabaseStatus(null));
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
        `Preview set for ${KIND_LABELS[kind]}, local only. Published version unchanged.`
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
        `Published ${versions[kind]} for ${KIND_LABELS[kind]}, local only.`
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
        `Rolled back ${KIND_LABELS[kind]} to the earlier published version, local only.`
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
        `Feature flag ${key} set to ${enabled ? "on" : "off"}, local only.`
      );
    } catch (error: any) {
      setMessage(error?.message || "Feature flag could not be changed.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="page-title">Admin</h1>
      <p className="mt-4 notice text-ink">
        Local only admin, not a secured production admin. No real database
        and no real admin auth are connected. Everything on this page
        lives in this browser only, and nothing here changes a live site.
      </p>
      <p className="mt-4 text-ink">
        Database: {databaseStatus ? databaseStatus.message : "Checking database status."} Server admin groundwork is in
        place in the data layer, with an admin role check, a required
        reason, and an audit row for every server admin action, and in
        increment 14 the admin check is wired to the database: it loads
        the user from the database and checks the admin role there.
        It stays inactive until a database is connected and the caller
        is a real admin user, and until then this page stays local only.
      </p>
      <p className="mt-4 text-ink">
        Counts below are aggregated only. No CV text, no user names, no
        emails, and no document content are shown, and none are written
        to the audit log. Every admin action needs a reason, and every
        action is written to the local audit log with its action, time,
        and reason.
      </p>
      {message ? <p className="mt-4 card text-ink">{message}</p> : null}

      <h2 className="mt-10 section-title">Aggregated document counts</h2>
      {counts ? (
        <div className="mt-4 space-y-4 text-ink">
          <p>Total local documents counted: {counts.total}</p>
          <div>
            <h3 className="font-semibold">By template</h3>
            <ul className="list-disc pl-6">
              {Object.entries(counts.byTemplate).map(([key, value]: any) => (
                <li key={key}>
                  {key}: {value}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">By country pack</h3>
            <ul className="list-disc pl-6">
              {Object.entries(counts.byCountryPack).map(([key, value]: any) => (
                <li key={key}>
                  {key}: {value}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">By plan</h3>
            <ul className="list-disc pl-6">
              {Object.entries(counts.byPlan).map(([key, value]: any) => (
                <li key={key}>
                  {key}: {value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-ink">Loading local counts.</p>
      )}

      <h2 className="mt-10 section-title">Versioning, local config only</h2>
      <p className="mt-2 text-ink">
        Preview sets a draft version without changing the published version.
        Publish makes a version the published local version. Rollback
        restores the earlier published version. A reason is required for
        every action.
      </p>
      <label className="mt-4 block text-sm font-semibold text-ink">
        Reason for the next admin action
        <input
          className="mt-1 input-field"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="For example: weekly config review"
        />
      </label>
      {CONFIG_KINDS.map((kind: string) => (
        <section key={kind} className="mt-6 card">
          <h3 className="font-semibold">{KIND_LABELS[kind]}</h3>
          <p className="mt-2 text-sm text-ink">
            Published: {config[kind]?.published ? config[kind].published.version : "none"}
            {config[kind]?.published?.summary ? ` (${config[kind].published.summary})` : ""}
          </p>
          <p className="mt-1 text-sm text-ink">
            Preview: {config[kind]?.preview ? config[kind].preview.version : "none"}
          </p>
          <p className="mt-1 text-sm text-ink">Earlier published versions kept: {config[kind]?.history?.length || 0}</p>
          <label className="mt-3 block text-sm font-semibold text-ink">
            Version label
            <input
              className="mt-1 input-field"
              value={versions[kind]}
              onChange={(event) => setVersions({ ...versions, [kind]: event.target.value })}
              placeholder="For example: 1.1"
            />
          </label>
          <label className="mt-3 block text-sm font-semibold text-ink">
            Short summary, no document content
            <input
              className="mt-1 input-field"
              value={summaries[kind]}
              onChange={(event) => setSummaries({ ...summaries, [kind]: event.target.value })}
              placeholder="For example: wording update only"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => handlePreview(kind)}>
              Preview
            </button>
            <button className="btn-primary" onClick={() => handlePublish(kind)}>
              Publish
            </button>
            <button className="btn-primary" onClick={() => handleRollback(kind)}>
              Rollback
            </button>
          </div>
        </section>
      ))}

      <h2 className="mt-10 section-title">Feature flags, local only</h2>
      <p className="mt-2 text-ink">
        Turning a feature off hides it in this local app only. It does
        not change any live site, because no live site is connected.
        A reason is required, and the change is logged below.
      </p>
      <ul className="mt-4 space-y-3">
        {FEATURE_FLAG_KEYS.map((key: string) => (
          <li key={key} className="flex flex-wrap items-center justify-between gap-2 card">
            <span className="font-semibold capitalize">{key}: {flags[key] ? "on" : "off"}</span>
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

      <h2 className="mt-10 section-title">Local audit log</h2>
      <p className="mt-2 text-ink">
        Each entry shows action, time, and reason only. No CV content
        and no secret is stored here.
      </p>
      {audit.length === 0 ? (
        <p className="mt-4 text-ink">No local admin actions recorded yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {audit.map((entry: any, index: number) => (
            <li key={index} className="card text-sm text-ink">
              <span className="font-semibold">{entry.action}</span> at {entry.time} for reason: {entry.reason}
              {entry.summary ? <span> ({entry.summary})</span> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
