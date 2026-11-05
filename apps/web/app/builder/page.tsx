"use client";

import { useEffect, useRef, useState } from "react";
import {
  TEMPLATES,
  addCustomSection,
  buildPreviewSections,
  compareJobVersions,
  createDefaultSettings,
  createDraft,
  createJobVersion,
  createSampleProfile,
  moveSection,
  parseDraft,
  parseImport,
  photoIncluded,
  pushVersion,
  removeCustomSection,
  sectionOrderFor,
  sectionTitle,
  serialiseDraft,
  templateById,
  validateProfile
} from "../../lib/builder-core.mjs";

// CV builder, Phase 2 increment 6: all 10 version 1 templates, with
// a local account and master profile link.
// Local draft only. No real server sign in, no payment, no AI, and
// no database in this increment. Drafts live in browser localStorage
// until Prisma validation passes and a real database is connected.
// Starting data is fictional and marked SAMPLE. User edits are draft
// edits, never presented as verified real history. A document opened
// from the dashboard is loaded here through gcs-open-document, and a
// draft can be saved back to the master profile only after a
// confirmation prompt, so editing a document never silently changes
// the master profile.

import { createEmptyProfile, saveDraftToProfile } from "../../lib/auth-core.mjs";
import { readServerSession, saveServerDocument } from "../../lib/session-client.mjs";
import { edition } from "../../lib/config";
import {
  COUNTRY_PACKS,
  LANGUAGE_PACKS,
  applyCountryPack,
  countryPackById,
  languagePackById,
  sectionTitleForLanguage
} from "../../lib/packs-core.mjs";
import {
  canExportDocument,
  effectivePlan,
  isTemplateAllowed
} from "../../lib/billing-core.mjs";

const DRAFT_KEY = "gcs-builder-draft";
const VERSIONS_KEY = "gcs-builder-versions";
const JOB_VERSIONS_KEY = "gcs-builder-job-versions";
const OPEN_KEY = "gcs-open-document";
const PROFILE_KEY = "gcs-profile";
const SAMPLE_IMPORT = [
  "Name: Imported Sample",
  "Headline: Sample Analyst",
  "Email: imported@example.test",
  "Summary: Sample imported summary.",
  "Experience: Sample Firm | Sample Analyst | Sample City | 2021 to 2023",
  "- Sample bullet one.",
  "Education: Sample Degree | Sample University | 2017 to 2021",
  "Skills: Analysis, Reporting",
  "Languages: English (Fluent, sample level)"
].join("\n");

function clone(value: any) {
  return JSON.parse(JSON.stringify(value));
}

export default function BuilderPage() {
  const [profile, setProfile] = useState<any>(() => createSampleProfile());
  const [settings, setSettings] = useState<any>(() => createDefaultSettings());
  const [savedState, setSavedState] = useState("Draft not saved yet");
  const [versions, setVersions] = useState<any[]>([]);
  const [importText, setImportText] = useState(SAMPLE_IMPORT);
  const [parsed, setParsed] = useState<any>(null);
  const [fileParsed, setFileParsed] = useState<any>(null);
  const [fileStatus, setFileStatus] = useState("");
  const [linkedinParsed, setLinkedinParsed] = useState<any>(null);
  const [linkedinStatus, setLinkedinStatus] = useState("");
  const [jobVersions, setJobVersions] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [activeJobVersionId, setActiveJobVersionId] = useState("");
  const [compareFirst, setCompareFirst] = useState("master");
  const [compareSecond, setCompareSecond] = useState("");
  const [compareResult, setCompareResult] = useState<any>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [countryPackId, setCountryPackId] = useState("global");
  const [languageId, setLanguageId] = useState("en");
  const [message, setMessage] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [subscriptionTrialEnd, setSubscriptionTrialEnd] = useState("");
  const [existingDocument, setExistingDocument] = useState(false);
  const [serverSession, setServerSession] = useState<any>(null);
  const [serverDocumentTitle, setServerDocumentTitle] = useState("");
  const timer = useRef<any>(null);

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
      const onboarding = window.localStorage.getItem("gcs-onboarding-choice");
      if (onboarding) {
        window.localStorage.removeItem("gcs-onboarding-choice");
        const choice = JSON.parse(onboarding);
        if (choice && choice.countryPackId) {
          setCountryPackId(choice.countryPackId);
          setSettings((current: any) => applyCountryPack(current, choice.countryPackId, TEMPLATES));
          setMessage("Onboarding suggestion applied. You can change the template, paper size, and section order below.");
        }
      }
    } catch {
      // An unreadable onboarding choice is ignored, the draft is unchanged.
    }
    try {
      const session = readServerSession(window.localStorage);
      if (session) {
        setServerSession(session);
      }
    } catch {
      setServerSession(null);
    }
    try {
      const opened = window.localStorage.getItem(OPEN_KEY);
      if (opened) {
        window.localStorage.removeItem(OPEN_KEY);
        const document = JSON.parse(opened);
        if (document && document.serverDocument) {
          const nextSettings = createDefaultSettings();
          let templateApplied = false;
          if (document.templateId && templateById(document.templateId)) {
            nextSettings.templateId = document.templateId;
            templateApplied = true;
          }
          if (document.paperSize === "US_LETTER" || document.paperSize === "A4") {
            nextSettings.paperSize = document.paperSize;
          }
          if (Array.isArray(document.sections) && document.sections.length > 0) {
            const ordered = [...document.sections].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
            nextSettings.sectionOrder = ordered.map((item: any) => item.sectionKey).filter(Boolean);
          }
          setSettings(nextSettings);
          setExistingDocument(true);
          setServerDocumentTitle(document.title || document.label || "Untitled document");
          setSavedState(`Opened server document: ${document.title || document.label || "document"}.`);
          setMessage(
            templateApplied
              ? "Server document opened. Its template, paper size, and section order were applied. The profile fields below stay local, because a server document stores settings only, not the full profile. Load the server profile from the profile page to fill them in."
              : "Server document opened. Its paper size and section order were applied, but no template was stored on the server for it, so the default template is shown. Pick the template you want below. The profile fields stay local, because a server document stores settings only, not the full profile. Load the server profile from the profile page to fill them in."
          );
          setActiveJobVersionId("");
        } else if (document && document.profile) {
          setProfile(document.profile);
          setSettings(document.settings || createDefaultSettings());
          setExistingDocument(true);
          setSavedState(`Opened from dashboard: ${document.label || "document"}.`);
          if (document.kind === "job" && document.id) {
            setActiveJobVersionId(document.id);
          } else {
            setActiveJobVersionId("");
          }
        }
      } else {
        const saved = window.localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = parseDraft(saved);
          setProfile(draft.profile);
          setSettings(draft.settings);
          setSavedState(`Draft restored, saved ${draft.savedAt}`);
        }
      }
      const savedVersions = window.localStorage.getItem(VERSIONS_KEY);
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions));
      }
      const savedJobVersions = window.localStorage.getItem(JOB_VERSIONS_KEY);
      if (savedJobVersions) {
        setJobVersions(JSON.parse(savedJobVersions));
      }
    } catch {
      setSavedState("Local draft could not be restored, starting from sample.");
    }
  }, []);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setSavedState("Unsaved changes");
    timer.current = setTimeout(() => {
      try {
        const draft = createDraft(profile, settings, "Autosaved draft");
        window.localStorage.setItem(DRAFT_KEY, serialiseDraft(draft));
        setSavedState(`Saved draft, ${draft.savedAt}`);
      } catch {
        setSavedState("Draft could not be saved in this browser.");
      }
    }, 800);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [profile, settings]);

  const order = sectionOrderFor(profile, settings.sectionOrder);
  const preview = buildPreviewSections(profile, settings.sectionOrder);
  const languagePack: any = languagePackById(languageId);
  const selectedCountryPack: any = countryPackById(countryPackId);
  const displayTitle = (key: string, fallback: string) =>
    languagePack.sectionTitles[key] ? sectionTitleForLanguage(languageId, key, fallback) : fallback;
  const previewDisplay = preview.map((section: any) => ({
    ...section,
    title: displayTitle(section.key, section.title)
  }));
  const missing = validateProfile(profile);
  const selectedTemplate = templateById(settings.templateId);
  const isBand = ["modern-professional", "corporate", "sidebar"].includes(settings.templateId);
  const isCentered = ["executive", "elegant"].includes(settings.templateId);
  const isTwoColumnPreview = ["sidebar", "two-column"].includes(settings.templateId);
  const photoNote = !selectedTemplate.photoAllowed
    ? `Photo is not included for ${selectedTemplate.name} by design.`
    : settings.includePhoto
      ? "Photo is included for this template."
      : "Photo is not included, because the photo box is unchecked.";

  function updateProfile(patch: any) {
    setProfile((current: any) => ({ ...current, ...patch }));
  }

  function saveVersion() {
    const draft = createDraft(profile, settings, `Version ${versions.length + 1}`);
    const next = pushVersion(versions, draft, 10);
    setVersions(next);
    try {
      window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
    } catch {
      setMessage("Version could not be stored in this browser.");
      return;
    }
    setMessage(`Version saved: ${draft.label}.`);
  }

  function restoreVersion(index: number) {
    const draft = versions[index];
    if (!draft) {
      return;
    }
    setProfile(clone(draft.profile));
    setSettings(clone(draft.settings));
    setMessage(`Restored ${draft.label}, saved ${draft.savedAt}.`);
  }

  async function saveToServer() {
    if (!serverSession) {
      setMessage("No server session was found. Sign in on the server first, on the account page. Your draft is still autosaved in this browser.");
      return;
    }
    let label = serverDocumentTitle || "Master draft";
    try {
      label = window.localStorage.getItem("gcs-master-label") || label;
    } catch {
      label = serverDocumentTitle || "Master draft";
    }
    setMessage("Saving this draft to the server...");
    try {
      const draft = createDraft(profile, settings, label);
      const saved = await saveServerDocument(undefined, serverSession, draft, edition);
      setServerDocumentTitle(saved.title || label);
      setMessage(`Saved to the server as "${saved.title || label}". The local autosaved draft is unchanged, and nothing was uploaded automatically before you pressed this button.`);
    } catch (error: any) {
      setMessage(
        error?.code === "local_only" || error?.code === "unreachable"
          ? "The server could not be reached, so nothing was saved to the server. Your draft is still autosaved in this browser."
          : error?.message || "Save to server failed. Your local draft was not changed."
      );
    }
  }

  async function exportFile(format: "pdf" | "docx") {
    const entitlement = canExportDocument({ planId: subscriptionPlan, templateId: settings.templateId, format, existingDocument });
    if (!entitlement.allowed) {
      setMessage(entitlement.reason);
      return;
    }
    setMessage(`Exporting ${format.toUpperCase()}...`);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, settings, format, subscriptionPlan, existingDocument })
      });
      if (!response.ok) {
        throw new Error("Export request failed.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${settings.templateId}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setMessage(`${format.toUpperCase()} export downloaded.`);
    } catch {
      setMessage("Export failed. Your draft was not changed. Please try again.");
    }
  }

  function runImport() {
    const result = parseImport(importText);
    setParsed(result);
    setMessage(
      result.warnings.length > 0
        ? `Import parsed with notes: ${result.warnings.join(" ")}`
        : "Import parsed. Check the fields below, correct them, then use this import."
    );
  }

  function useImport() {
    if (!parsed) {
      return;
    }
    setProfile(clone(parsed.profile));
    setSettings((current: any) => ({
      ...current,
      sectionOrder: sectionOrderFor(parsed.profile, current.sectionOrder)
    }));
    setParsed(null);
    setMessage("Import applied as a draft. It is not a verified real CV until you check it.");
  }

  function handleImportFile(file: File | undefined) {
    if (!file) {
      return;
    }
    file.text().then((text) => setImportText(text));
  }

  async function handleFileImport(file: File | undefined) {
    if (!file) {
      return;
    }
    setFileStatus("Reading file, please wait...");
    setFileParsed(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/import", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "File import failed.");
      }
      setFileParsed(data);
      setFileStatus(
        data.empty
          ? "No readable text was found in this file. It may be a scanned image. No content was invented."
          : "File parsed. Check the fields below, correct them, then use this import."
      );
    } catch {
      setFileStatus("File import failed. Your draft was not changed. Please check the file and try again.");
    }
  }

  function useFileImport() {
    if (!fileParsed) {
      return;
    }
    setProfile(clone(fileParsed.profile));
    setSettings((current: any) => ({
      ...current,
      sectionOrder: sectionOrderFor(fileParsed.profile, current.sectionOrder)
    }));
    setActiveJobVersionId("");
    setFileParsed(null);
    setMessage("File import applied as a draft. It is not a verified real CV until you check it.");
  }

  async function handleLinkedInImport(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    setLinkedinStatus("Reading LinkedIn export files, please wait...");
    setLinkedinParsed(null);
    try {
      const form = new FormData();
      for (const file of Array.from(fileList)) {
        form.append("file", file);
      }
      const response = await fetch("/api/linkedin-import", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "LinkedIn export import failed.");
      }
      setLinkedinParsed(data);
      setLinkedinStatus(
        data.empty
          ? "No expected LinkedIn export CSV files were found. Check the files and try again. Your draft was not changed."
          : "LinkedIn export parsed. Check the fields below, correct them, then use this import."
      );
    } catch {
      setLinkedinStatus("LinkedIn export import failed. Your draft was not changed. Please check the files and try again.");
    }
  }

  function useLinkedInImport() {
    if (!linkedinParsed) {
      return;
    }
    setProfile(clone(linkedinParsed.profile));
    setSettings((current: any) => ({
      ...current,
      sectionOrder: sectionOrderFor(linkedinParsed.profile, current.sectionOrder)
    }));
    setActiveJobVersionId("");
    setLinkedinParsed(null);
    setMessage("LinkedIn export import applied as a draft. It is not a verified real CV until you check it.");
  }

  function createJobVersionFromMaster() {
    try {
      const version = createJobVersion({ profile, settings, label: "Master draft" }, jobTitle, jobCompany);
      const next = [...jobVersions, version];
      setJobVersions(next);
      try {
        window.localStorage.setItem(JOB_VERSIONS_KEY, JSON.stringify(next));
      } catch {
        setMessage("Job version could not be stored in this browser.");
        return;
      }
      setCompareSecond(version.id);
      setJobTitle("");
      setJobCompany("");
      setMessage(`Job version created: ${version.label}. Editing it does not change the master draft.`);
    } catch {
      setMessage("Job title and company are both required for a job version. They are never invented.");
    }
  }

  function loadJobVersion(id: string) {
    const version = jobVersions.find((item: any) => item.id === id);
    if (!version) {
      return;
    }
    setProfile(clone(version.profile));
    setSettings(clone(version.settings));
    setActiveJobVersionId(id);
    setMessage(`Editing job version: ${version.label}. The master draft is unchanged until you save back.`);
  }

  function saveJobVersionBack() {
    const version = jobVersions.find((item: any) => item.id === activeJobVersionId);
    if (!version) {
      return;
    }
    const next = jobVersions.map((item: any) =>
      item.id === activeJobVersionId ? { ...item, profile: clone(profile), settings: clone(settings) } : item
    );
    setJobVersions(next);
    try {
      window.localStorage.setItem(JOB_VERSIONS_KEY, JSON.stringify(next));
    } catch {
      setMessage("Job version could not be stored in this browser.");
      return;
    }
    setMessage(`Saved this edit back to job version: ${version.label}. Use the master draft separately if you want the master to change.`);
  }

  function saveVersionToMaster() {
    setActiveJobVersionId("");
    setMessage("Now editing the master draft. The job versions above are unchanged.");
  }

  async function exportJobVersion(version: any, format: "pdf" | "docx") {
    const entitlement = canExportDocument({ planId: subscriptionPlan, templateId: version.settings.templateId, format, existingDocument: true });
    if (!entitlement.allowed) {
      setMessage(entitlement.reason);
      return;
    }
    setMessage(`Exporting job version ${format.toUpperCase()}...`);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: version.profile, settings: version.settings, format, subscriptionPlan, existingDocument: true })
      });
      if (!response.ok) {
        throw new Error("Export request failed.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${version.settings.templateId}-${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setMessage(`Job version ${format.toUpperCase()} export downloaded.`);
    } catch {
      setMessage("Job version export failed. Your drafts were not changed. Please try again.");
    }
  }

  function runCompare() {
    const master = { label: "Master draft", profile, settings };
    const first = compareFirst === "master" ? master : jobVersions.find((item: any) => item.id === compareFirst);
    const second = compareSecond === "master" ? master : jobVersions.find((item: any) => item.id === compareSecond);
    if (!first || !second) {
      setMessage("Choose two versions to compare.");
      return;
    }
    setCompareResult(compareJobVersions(first, second));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        CV builder{serverSession ? ", signed in on the server" : ", local draft only"}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Build your CV</h1>
      <p className="mt-3 text-slate-700">
        {serverSession
          ? `Signed in on the server as ${serverSession.email}. Starting data is fictional and marked SAMPLE. Drafts autosave in this browser, and Save to server below stores a copy on the server only when you press it.`
          : "Local draft account. Starting data is fictional and marked SAMPLE. Drafts are saved in this browser only until you sign in on the server. No price, payment, AI feature, or verified history is claimed here."}
      </p>
      <p className="mt-4 rounded border border-slate-300 bg-white p-4">
        Current local plan: {subscriptionPlan === "trial" ? `Trial, ends ${subscriptionTrialEnd || "date not set"}` : subscriptionPlan === "premium" ? "Premium, local only" : "Free, local only"}. Entitlements are local browser state only, until a real database and Stripe are connected. No checkout or payment is shown here.
        {!isTemplateAllowed(subscriptionPlan, settings.templateId) && !existingDocument && (
          <span className="mt-2 block"> This template is locked on the Free plan. It is a premium template. Choose a free template for a new document, or open the subscription page to check your local plan. A document you already created stays viewable here.</span>
        )}
        {existingDocument && (
          <span className="mt-2 block"> This document was opened from the dashboard, so it stays viewable and downloadable here, even if its template is locked for a new document.</span>
        )}
        {subscriptionPlan === "free" && (
          <span className="mt-2 block"> DOCX export is a premium export on Free. Standard PDF export is included on Free. <a className="text-blue-700 underline" href="/subscription">Open the subscription page</a></span>
        )}
      </p>
      {missing.length > 0 && (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-4">
          Missing for a complete draft: {missing.join(", ")}. You can still
          edit and export, but check these fields before you use the document.
        </p>
      )}
      {message && (
        <p className="mt-4 rounded border border-slate-300 bg-white p-4">{message}</p>
      )}

      <section className="mt-6 grid grid-cols-1 gap-4 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-sm font-semibold">Template</span>
          <select
            className="mt-1 w-full rounded border border-slate-300 p-2"
            value={settings.templateId}
            onChange={(event) => setSettings({ ...settings, templateId: event.target.value })}
          >
            {TEMPLATES.map((template: any) => (
              <option key={template.id} value={template.id}>{template.name}{isTemplateAllowed(subscriptionPlan, template.id) ? "" : " (Premium, locked on Free)"}</option>
            ))}
          </select>
          <span className="mt-1 block text-sm text-slate-500">{selectedTemplate.description}</span>
          <span className="block text-sm text-slate-500">{selectedTemplate.atsNote}</span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Paper size</span>
          <select
            className="mt-1 w-full rounded border border-slate-300 p-2"
            value={settings.paperSize}
            onChange={(event) => setSettings({ ...settings, paperSize: event.target.value })}
          >
            <option value="A4">A4</option>
            <option value="US_LETTER">US Letter</option>
          </select>
        </label>
        <label className="mt-6 block">
          <input
            type="checkbox"
            checked={settings.includePhoto}
            onChange={(event) => setSettings({ ...settings, includePhoto: event.target.checked })}
          />{" "}
          Include photo
          <span className="block text-sm text-slate-500">{photoNote}</span>
        </label>
        <div>
          <p className="text-sm font-semibold">Draft status</p>
          <p className="mt-1 text-sm">{savedState}</p>
          <button
            type="button"
            className="mt-2 rounded bg-navy px-3 py-2 text-sm text-white"
            onClick={saveVersion}
          >
            Save version
          </button>
          {serverSession && (
            <button
              type="button"
              className="mt-2 ml-2 rounded bg-navy px-3 py-2 text-sm text-white"
              onClick={saveToServer}
            >
              Save to server
            </button>
          )}
        </div>
      </section>

      <section className="mt-6 rounded border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Country pack and language, guidance only</h2>
        <p className="mt-1 text-sm text-slate-500">
          Country packs are guidance only, not legal advice. No fee, deadline,
          visa rule, or legal requirement is stated in a pack. Applying a pack
          sets the template, paper size, and section order, and you can change
          every setting afterwards. Language packs translate interface labels
          and preview section headings only. They are not professionally
          verified, and your CV content is never auto translated.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-sm">Country pack
            <select
              className="mt-1 w-full rounded border border-slate-300 p-2"
              value={countryPackId}
              onChange={(event) => setCountryPackId(event.target.value)}
            >
              {COUNTRY_PACKS.map((pack: any) => (
                <option key={pack.id} value={pack.id}>{pack.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">Language
            <select
              className="mt-1 w-full rounded border border-slate-300 p-2"
              value={languageId}
              onChange={(event) => setLanguageId(event.target.value)}
            >
              {LANGUAGE_PACKS.map((pack: any) => (
                <option key={pack.id} value={pack.id}>{pack.name}</option>
              ))}
            </select>
          </label>
          <div>
            <button
              type="button"
              className="mt-6 rounded bg-navy px-3 py-2 text-sm text-white"
              onClick={() => {
                setSettings(applyCountryPack(settings, countryPackId, TEMPLATES));
                setMessage(`Country pack applied: ${selectedCountryPack.name}. You can change the template, paper size, and section order below.`);
              }}
            >
              Apply country pack
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">Pack: {selectedCountryPack.name}. Recommended templates: {selectedCountryPack.recommendedTemplates.join(", ")}. Photo: {selectedCountryPack.photoGuidance}</p>
        <p className="mt-1 text-sm text-slate-500">Source: {selectedCountryPack.sourceNote} Last reviewed in this project: {selectedCountryPack.lastVerified}. {selectedCountryPack.legalNote}</p>
        <p className="mt-1 text-sm text-slate-500">Language: {languagePack.name}. {languagePack.translationNote} Chinese (Simplified) is not in this version. It stays behind its demand gate.</p>
        <a className="mt-3 inline-block text-sm text-blue-700 underline" href="/onboarding">Open the onboarding wizard</a>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="rounded bg-gold px-4 py-2 font-semibold text-navy" onClick={() => exportFile("pdf")}>
          Export PDF
        </button>
        <button type="button" className="rounded bg-navy px-4 py-2 text-white" onClick={() => exportFile("docx")}>
          Export DOCX
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-4 py-2"
          onClick={() => {
            setProfile(createSampleProfile());
            setSettings(createDefaultSettings());
            setMessage("Reset to sample draft.");
          }}
        >
          Reset to sample
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-4 py-2"
          onClick={() => {
            if (!window.confirm("Save this draft over the master profile? This replaces the profile fields with the draft fields.")) {
              setMessage("Save back cancelled. The master profile was not changed.");
              return;
            }
            try {
              const saved = window.localStorage.getItem(PROFILE_KEY);
              const current = saved ? JSON.parse(saved) : createEmptyProfile();
              const next = saveDraftToProfile(current, profile, true);
              window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
              setMessage("Draft saved back to the master profile, after your confirmation.");
            } catch {
              setMessage("Save back failed. The master profile was not changed.");
            }
          }}
        >
          Save draft back to master profile, with confirmation
        </button>
        <a className="rounded border border-slate-300 px-4 py-2" href="/profile">
          Edit master profile
        </a>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-navy">Edit</h2>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Personal details</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">Full name
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={profile.fullName} onChange={(e) => updateProfile({ fullName: e.target.value })} />
              </label>
              <label className="block text-sm">Headline
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={profile.headline} onChange={(e) => updateProfile({ headline: e.target.value })} />
              </label>
              <label className="block text-sm">Email
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={profile.email} onChange={(e) => updateProfile({ email: e.target.value })} />
              </label>
              <label className="block text-sm">Phone
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} />
              </label>
              <label className="block text-sm sm:col-span-2">City
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={profile.city} onChange={(e) => updateProfile({ city: e.target.value })} />
              </label>
            </div>
            <label className="mt-3 block text-sm">Summary
              <textarea className="mt-1 w-full rounded border border-slate-300 p-2" rows={4} value={profile.summary} onChange={(e) => updateProfile({ summary: e.target.value })} />
            </label>
          </section>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Experience</h3>
            {profile.experience.map((entry: any, index: number) => (
              <div key={index} className="mt-3 rounded border border-slate-100 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input className="rounded border border-slate-300 p-2" aria-label="Employer" value={entry.employer} onChange={(e) => { const next = clone(profile.experience); next[index].employer = e.target.value; updateProfile({ experience: next }); }} />
                  <input className="rounded border border-slate-300 p-2" aria-label="Job title" value={entry.jobTitle} onChange={(e) => { const next = clone(profile.experience); next[index].jobTitle = e.target.value; updateProfile({ experience: next }); }} />
                  <input className="rounded border border-slate-300 p-2" aria-label="Location" value={entry.location} onChange={(e) => { const next = clone(profile.experience); next[index].location = e.target.value; updateProfile({ experience: next }); }} />
                  <input className="rounded border border-slate-300 p-2" aria-label="Period" value={entry.period} onChange={(e) => { const next = clone(profile.experience); next[index].period = e.target.value; updateProfile({ experience: next }); }} />
                </div>
                <textarea className="mt-2 w-full rounded border border-slate-300 p-2" rows={3} aria-label="Bullets, one per line" value={(entry.bullets || []).join("\n")} onChange={(e) => { const next = clone(profile.experience); next[index].bullets = e.target.value.split("\n").map((line: string) => line.trim()).filter(Boolean); updateProfile({ experience: next }); }} />
                <button type="button" className="mt-2 text-sm text-red-700" onClick={() => updateProfile({ experience: profile.experience.filter((_: any, i: number) => i !== index) })}>Remove this job</button>
              </div>
            ))}
            <button type="button" className="mt-3 rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => updateProfile({ experience: [...profile.experience, { employer: "", jobTitle: "", location: "", period: "", bullets: [] }] })}>Add job</button>
          </section>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Education, skills, languages</h3>
            {profile.education.map((entry: any, index: number) => (
              <div key={index} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input className="rounded border border-slate-300 p-2" aria-label="Qualification" value={entry.qualification} onChange={(e) => { const next = clone(profile.education); next[index].qualification = e.target.value; updateProfile({ education: next }); }} />
                <input className="rounded border border-slate-300 p-2" aria-label="Institution" value={entry.institution} onChange={(e) => { const next = clone(profile.education); next[index].institution = e.target.value; updateProfile({ education: next }); }} />
                <input className="rounded border border-slate-300 p-2" aria-label="Period" value={entry.period} onChange={(e) => { const next = clone(profile.education); next[index].period = e.target.value; updateProfile({ education: next }); }} />
              </div>
            ))}
            <button type="button" className="mt-3 rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => updateProfile({ education: [...profile.education, { institution: "", qualification: "", period: "" }] })}>Add education</button>
            <label className="mt-4 block text-sm">Skills, comma separated
              <input className="mt-1 w-full rounded border border-slate-300 p-2" value={profile.skills.join(", ")} onChange={(e) => updateProfile({ skills: e.target.value.split(",").map((item: string) => item.trim()).filter(Boolean) })} />
            </label>
            <label className="mt-3 block text-sm">Languages, comma separated
              <input className="mt-1 w-full rounded border border-slate-300 p-2" value={profile.languages.join(", ")} onChange={(e) => updateProfile({ languages: e.target.value.split(",").map((item: string) => item.trim()).filter(Boolean) })} />
            </label>
          </section>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Section order, move up or down</h3>
            <p className="mt-1 text-sm text-slate-500">Buttons work on phones too. Drag and drop is not required.</p>
            <ul className="mt-3 space-y-2">
              {order.map((key: string) => (
                <li key={key} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2">
                  <span>{displayTitle(key, sectionTitle(profile, key))}</span>
                  <span className="flex gap-2">
                    <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={() => setSettings({ ...settings, sectionOrder: moveSection(order, key, "up") })}>Move up</button>
                    <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={() => setSettings({ ...settings, sectionOrder: moveSection(order, key, "down") })}>Move down</button>
                    {key.startsWith("custom-") && (
                      <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm text-red-700" onClick={() => { const nextProfile = removeCustomSection(profile, key); setProfile(nextProfile); setSettings({ ...settings, sectionOrder: sectionOrderFor(nextProfile, order.filter((item: string) => item !== key)) }); }}>Remove</button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <h4 className="mt-4 font-semibold">Add a custom section</h4>
            <input className="mt-2 w-full rounded border border-slate-300 p-2" placeholder="Custom section title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
            <textarea className="mt-2 w-full rounded border border-slate-300 p-2" rows={3} placeholder="One line per line" value={customText} onChange={(e) => setCustomText(e.target.value)} />
            <button type="button" className="mt-2 rounded bg-navy px-3 py-2 text-sm text-white" onClick={() => { const next = addCustomSection(profile, customTitle, customText); setProfile(next); setSettings({ ...settings, sectionOrder: sectionOrderFor(next, order) }); setCustomTitle(""); setCustomText(""); }}>Add custom section</button>
          </section>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Version history, local drafts only</h3>
            {versions.length === 0 && <p className="mt-2 text-sm text-slate-500">No saved versions yet. Use Save version above.</p>}
            <ul className="mt-2 space-y-2">
              {versions.map((version: any, index: number) => (
                <li key={index} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2 text-sm">
                  <span>{version.label}, saved {version.savedAt}</span>
                  <button type="button" className="rounded border border-slate-300 px-2 py-1" onClick={() => restoreVersion(index)}>Restore</button>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Import, guided paste with correction</h3>
            <p className="mt-1 text-sm text-slate-500">
              The working path is pasted structured text, or a plain text file.
              PDF and DOCX file import is in the section below, also with a
              correction step. LinkedIn export import is in the section
              below, also with a correction step. Nothing is imported
              until you check and correct it below.
            </p>
            <textarea className="mt-3 w-full rounded border border-slate-300 p-2 font-mono text-sm" rows={10} value={importText} onChange={(e) => setImportText(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="rounded border border-slate-300 px-3 py-2 text-sm">Upload plain text file
                <input type="file" accept=".txt,text/plain" className="ml-2" onChange={(e) => handleImportFile(e.target.files?.[0])} />
              </label>
              <button type="button" className="rounded bg-navy px-3 py-2 text-sm text-white" onClick={runImport}>Parse import</button>
            </div>
            {parsed && (
              <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3">
                <p className="font-semibold">Check and correct this import before use</p>
                {parsed.warnings.length > 0 && <p className="mt-1 text-sm">Notes: {parsed.warnings.join(" ")}</p>}
                {parsed.unparsedLines.length > 0 && <p className="mt-1 text-sm">Unparsed lines, not imported: {parsed.unparsedLines.join(" | ")}</p>}
                <label className="mt-3 block text-sm">Name
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={parsed.profile.fullName} onChange={(e) => setParsed({ ...parsed, profile: { ...parsed.profile, fullName: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Headline
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={parsed.profile.headline} onChange={(e) => setParsed({ ...parsed, profile: { ...parsed.profile, headline: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Summary
                  <textarea className="mt-1 w-full rounded border border-slate-300 bg-white p-2" rows={3} value={parsed.profile.summary} onChange={(e) => setParsed({ ...parsed, profile: { ...parsed.profile, summary: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Skills, comma separated
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={parsed.profile.skills.join(", ")} onChange={(e) => setParsed({ ...parsed, profile: { ...parsed.profile, skills: e.target.value.split(",").map((item: string) => item.trim()).filter(Boolean) } })} />
                </label>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="rounded bg-navy px-3 py-2 text-sm text-white" onClick={useImport}>Use this import as a draft</button>
                  <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => setParsed(null)}>Discard import</button>
                </div>
              </div>
            )}
          </section>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Import PDF or DOCX, with correction</h3>
            <p className="mt-1 text-sm text-slate-500">
              Upload a PDF or DOCX file, up to 5 MB. Its text is parsed into
              profile fields, and unparsed lines are shown, never silently
              dropped. If the file has no readable text, for example a
              scanned image, it is reported as empty and no content is
              invented. Only after you check and correct the fields below
              does the import become a draft.
            </p>
            <label className="mt-3 block rounded border border-slate-300 px-3 py-2 text-sm">Upload PDF or DOCX file
              <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="ml-2" onChange={(e) => handleFileImport(e.target.files?.[0])} />
            </label>
            {fileStatus && <p className="mt-2 text-sm">{fileStatus}</p>}
            {fileParsed && !fileParsed.empty && (
              <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3">
                <p className="font-semibold">Check and correct this file import before use</p>
                <p className="mt-1 text-sm">File: {fileParsed.fileName}, format: {fileParsed.format}{fileParsed.pageCount ? `, pages: ${fileParsed.pageCount}` : ""}</p>
                {fileParsed.warnings.length > 0 && <p className="mt-1 text-sm">Notes: {fileParsed.warnings.join(" ")}</p>}
                {fileParsed.unparsedLines.length > 0 && <p className="mt-1 text-sm">Unparsed lines, not imported: {fileParsed.unparsedLines.join(" | ")}</p>}
                <label className="mt-3 block text-sm">Name
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={fileParsed.profile.fullName} onChange={(e) => setFileParsed({ ...fileParsed, profile: { ...fileParsed.profile, fullName: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Headline
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={fileParsed.profile.headline} onChange={(e) => setFileParsed({ ...fileParsed, profile: { ...fileParsed.profile, headline: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Summary
                  <textarea className="mt-1 w-full rounded border border-slate-300 bg-white p-2" rows={3} value={fileParsed.profile.summary} onChange={(e) => setFileParsed({ ...fileParsed, profile: { ...fileParsed.profile, summary: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Skills, comma separated
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={fileParsed.profile.skills.join(", ")} onChange={(e) => setFileParsed({ ...fileParsed, profile: { ...fileParsed.profile, skills: e.target.value.split(",").map((item: string) => item.trim()).filter(Boolean) } })} />
                </label>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="rounded bg-navy px-3 py-2 text-sm text-white" onClick={useFileImport}>Use this import as a draft</button>
                  <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => setFileParsed(null)}>Discard import</button>
                </div>
              </div>
            )}
          </section>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Import LinkedIn export, with correction</h3>
            <p className="mt-1 text-sm text-slate-500">
              Official data export import only. Studio does not contact
              LinkedIn, does not scrape LinkedIn, and does not use an
              unofficial API. LinkedIn API import is not built.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              How to get your export: on LinkedIn on desktop, open Settings
              and Privacy, then Data Privacy, then Get a copy of your data,
              pick at least Profile, Positions, Education, Skills,
              Certifications, and Languages, request the archive, unzip it,
              and upload the CSV files here. You can upload the CSV files
              one by one, or upload the ZIP file and Studio will read the
              CSV files inside it. Each file must be 5 MB or smaller.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Note: the export contains your own data. The profile photo is
              not in the export, so no photo is imported. Dates in Month
              YYYY form are kept as written for correction. An empty
              Finished On in Positions.csv means a current role. Missing
              files and missing columns are warned about, never filled in.
              Unknown columns are warned about and not used. Only after you
              check and correct the fields below does the import become a
              draft.
            </p>
            <label className="mt-3 block rounded border border-slate-300 px-3 py-2 text-sm">Upload LinkedIn export CSV files or ZIP file
              <input type="file" accept=".csv,.zip,text/csv,application/zip" multiple className="ml-2" onChange={(e) => handleLinkedInImport(e.target.files)} />
            </label>
            {linkedinStatus && <p className="mt-2 text-sm">{linkedinStatus}</p>}
            {linkedinParsed && !linkedinParsed.empty && (
              <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3">
                <p className="font-semibold">Check and correct this LinkedIn export before use</p>
                <p className="mt-1 text-sm">Files used: {linkedinParsed.filesParsed.join(", ") || "none"}</p>
                {linkedinParsed.filesMissing.length > 0 && <p className="mt-1 text-sm">Files not supplied: {linkedinParsed.filesMissing.join(", ")}</p>}
                {linkedinParsed.warnings.length > 0 && <p className="mt-1 text-sm">Notes: {linkedinParsed.warnings.join(" ")}</p>}
                {linkedinParsed.unparsedLines.length > 0 && <p className="mt-1 text-sm">Unparsed items, not imported: {linkedinParsed.unparsedLines.join(" | ")}</p>}
                <label className="mt-3 block text-sm">Name
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={linkedinParsed.profile.fullName} onChange={(e) => setLinkedinParsed({ ...linkedinParsed, profile: { ...linkedinParsed.profile, fullName: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Headline
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={linkedinParsed.profile.headline} onChange={(e) => setLinkedinParsed({ ...linkedinParsed, profile: { ...linkedinParsed.profile, headline: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Summary
                  <textarea className="mt-1 w-full rounded border border-slate-300 bg-white p-2" rows={3} value={linkedinParsed.profile.summary} onChange={(e) => setLinkedinParsed({ ...linkedinParsed, profile: { ...linkedinParsed.profile, summary: e.target.value } })} />
                </label>
                <label className="mt-2 block text-sm">Skills, comma separated
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={linkedinParsed.profile.skills.join(", ")} onChange={(e) => setLinkedinParsed({ ...linkedinParsed, profile: { ...linkedinParsed.profile, skills: e.target.value.split(",").map((item: string) => item.trim()).filter(Boolean) } })} />
                </label>
                <label className="mt-2 block text-sm">Languages, comma separated
                  <input className="mt-1 w-full rounded border border-slate-300 bg-white p-2" value={linkedinParsed.profile.languages.join(", ")} onChange={(e) => setLinkedinParsed({ ...linkedinParsed, profile: { ...linkedinParsed.profile, languages: e.target.value.split(",").map((item: string) => item.trim()).filter(Boolean) } })} />
                </label>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="rounded bg-navy px-3 py-2 text-sm text-white" onClick={useLinkedInImport}>Use this LinkedIn import as a draft</button>
                  <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => setLinkedinParsed(null)}>Discard import</button>
                </div>
              </div>
            )}
          </section>

          <section className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Job specific versions, local drafts only</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create a named copy of the master draft for one job. Editing a
              job version does not change the master draft, and editing the
              master does not change a saved version, unless you save a
              version back on purpose. Job title and company are typed by
              you, never invented.
            </p>
            {activeJobVersionId && (
              <p className="mt-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
                Editing a job version now. Use Save back to job version to keep
                this edit in that version, or Return to master draft to edit
                the master instead.
              </p>
            )}
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block text-sm">Job title
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </label>
              <label className="block text-sm">Company
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={jobCompany} onChange={(e) => setJobCompany(e.target.value)} />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded bg-navy px-3 py-2 text-sm text-white" onClick={createJobVersionFromMaster}>Create job version from master draft</button>
              {activeJobVersionId && (
                <>
                  <button type="button" className="rounded bg-gold px-3 py-2 text-sm font-semibold text-navy" onClick={saveJobVersionBack}>Save back to job version</button>
                  <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={saveVersionToMaster}>Return to master draft</button>
                </>
              )}
            </div>
            {jobVersions.length === 0 && <p className="mt-3 text-sm text-slate-500">No job versions yet.</p>}
            <ul className="mt-3 space-y-2">
              {jobVersions.map((version: any) => (
                <li key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-100 px-3 py-2 text-sm">
                  <span>{version.label}, created {version.createdAt}</span>
                  <span className="flex flex-wrap gap-2">
                    <button type="button" className="rounded border border-slate-300 px-2 py-1" onClick={() => loadJobVersion(version.id)}>Edit version</button>
                    <button type="button" className="rounded border border-slate-300 px-2 py-1" onClick={() => exportJobVersion(version, "pdf")}>Export PDF</button>
                    <button type="button" className="rounded border border-slate-300 px-2 py-1" onClick={() => exportJobVersion(version, "docx")}>Export DOCX</button>
                  </span>
                </li>
              ))}
            </ul>
            <h4 className="mt-4 font-semibold">Compare two versions, structure only</h4>
            <p className="mt-1 text-sm text-slate-500">This compares template, paper size, photo, section order, and field counts. It does not claim a quality score.</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block text-sm">First
                <select className="mt-1 w-full rounded border border-slate-300 p-2" value={compareFirst} onChange={(e) => setCompareFirst(e.target.value)}>
                  <option value="master">Master draft</option>
                  {jobVersions.map((version: any) => (
                    <option key={version.id} value={version.id}>{version.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">Second
                <select className="mt-1 w-full rounded border border-slate-300 p-2" value={compareSecond} onChange={(e) => setCompareSecond(e.target.value)}>
                  <option value="">Choose a version</option>
                  <option value="master">Master draft</option>
                  {jobVersions.map((version: any) => (
                    <option key={version.id} value={version.id}>{version.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" className="mt-2 rounded bg-navy px-3 py-2 text-sm text-white" onClick={runCompare}>Compare versions</button>
            {compareResult && (
              <div className="mt-3 rounded border border-slate-200 p-3 text-sm">
                <p className="font-semibold">{compareResult.firstLabel} compared with {compareResult.secondLabel}</p>
                {compareResult.same ? (
                  <p className="mt-1">No structural differences were found.</p>
                ) : (
                  <ul className="mt-1 list-disc pl-5">
                    {compareResult.differences.map((difference: string, index: number) => (
                      <li key={index}>{difference}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>

        <div>
          <h2 className="text-xl font-bold text-navy">Live preview, structure only</h2>
          <p className="mt-1 text-sm text-slate-500">
            This preview shows section order and content. The PDF and DOCX
            exports use the real template engine and may paginate differently.
          </p>
          <article className="mt-4 rounded border border-slate-200 bg-white p-6">
            {isBand ? (
              <header className="rounded bg-navy p-4 text-white">
                <h3 className="text-2xl font-bold">{profile.fullName}</h3>
                <p>{profile.headline}</p>
              </header>
            ) : isCentered ? (
              <header className="text-center">
                <h3 className="text-2xl font-bold">{profile.fullName}</h3>
                <p>{profile.headline}</p>
              </header>
            ) : (
              <header>
                <h3 className="text-xl font-bold">{profile.fullName}</h3>
                <p>{profile.headline}</p>
              </header>
            )}
            <p className="mt-3 text-sm text-slate-600">
              SAMPLE: {profile.email} | {profile.phone} | {profile.city}
              {photoIncluded(settings.templateId, settings.includePhoto) ? " | [SAMPLE photo placeholder]" : ""}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Template: {selectedTemplate.name}, paper: {settings.paperSize === "US_LETTER" ? "US Letter" : "A4"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{selectedTemplate.atsNote}</p>
            {isTwoColumnPreview ? (
              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className={settings.templateId === "sidebar" ? "sm:order-1" : "sm:order-2"}>
                  {previewDisplay.filter((section: any) => ["skills", "languages"].includes(section.key)).map((section: any) => (
                    <section key={section.key} className="mt-5">
                      <h4 className="font-bold uppercase text-navy">{section.title}</h4>
                      {section.lines.map((line: string, index: number) => (
                        <p key={index} className="mt-2">{line}</p>
                      ))}
                    </section>
                  ))}
                </div>
                <div className={settings.templateId === "sidebar" ? "sm:order-2 sm:col-span-2" : "sm:order-1 sm:col-span-2"}>
                  {previewDisplay.filter((section: any) => !["skills", "languages"].includes(section.key)).map((section: any) => (
                    <section key={section.key} className="mt-5">
                      <h4 className="font-bold text-navy">{section.title}</h4>
                      {section.lines.map((line: string, index: number) => (
                        <p key={index} className="mt-2">{line}</p>
                      ))}
                      {section.bullets.map((group: string[], groupIndex: number) => (
                        <div key={groupIndex} className="mt-3">
                          {group.map((line: string, lineIndex: number) => (
                            <p key={lineIndex} className={lineIndex === 0 ? "font-semibold" : "ml-3"}>{lineIndex === 0 ? line : `- ${line}`}</p>
                          ))}
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              </div>
            ) : (
              previewDisplay.map((section: any) => (
                <section key={section.key} className="mt-5">
                  <h4 className={`font-bold ${isBand ? "text-navy" : isCentered ? "text-center" : "uppercase"}`}>{section.title}</h4>
                  {isBand && <hr className="mt-1 border-t-2 border-gold" />}
                  {section.lines.map((line: string, index: number) => (
                    <p key={index} className="mt-2">{line}</p>
                  ))}
                  {section.bullets.map((group: string[], groupIndex: number) => (
                    <div key={groupIndex} className="mt-3">
                      {group.map((line: string, lineIndex: number) => (
                        <p key={lineIndex} className={lineIndex === 0 ? "font-semibold" : "ml-3"}>{lineIndex === 0 ? line : `- ${line}`}</p>
                      ))}
                    </div>
                  ))}
                </section>
              ))
            )}
          </article>
        </div>
      </div>
    </main>
  );
}
