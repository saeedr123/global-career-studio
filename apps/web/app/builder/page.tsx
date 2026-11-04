"use client";

import { useEffect, useRef, useState } from "react";
import {
  TEMPLATES,
  addCustomSection,
  buildPreviewSections,
  createDefaultSettings,
  createDraft,
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

// CV builder, Phase 2 increment 4: all 10 version 1 templates.
// Local draft only. No real sign in, no account, no payment, no AI, and
// no database in this increment. Drafts live in browser localStorage
// until Prisma validation passes and a real database is connected.
// Starting data is fictional and marked SAMPLE. User edits are draft
// edits, never presented as verified real history.
// PDF and DOCX import is planned, not implemented here. The working
// import path is guided paste import, with a correction step.

const DRAFT_KEY = "gcs-builder-draft";
const VERSIONS_KEY = "gcs-builder-versions";
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
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [message, setMessage] = useState("");
  const timer = useRef<any>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = parseDraft(saved);
        setProfile(draft.profile);
        setSettings(draft.settings);
        setSavedState(`Draft restored, saved ${draft.savedAt}`);
      }
      const savedVersions = window.localStorage.getItem(VERSIONS_KEY);
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions));
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

  async function exportFile(format: "pdf" | "docx") {
    setMessage(`Exporting ${format.toUpperCase()}...`);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, settings, format })
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        CV builder, local draft only
      </p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Build your CV</h1>
      <p className="mt-3 text-slate-700">
        Local draft account (placeholder, no real sign in). Starting data is
        fictional and marked SAMPLE. Drafts are saved in this browser only
        until a real database is connected. No price, payment, AI feature,
        or verified history is claimed here.
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
              <option key={template.id} value={template.id}>{template.name}</option>
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
        </div>
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
                  <span>{sectionTitle(profile, key)}</span>
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
              PDF and DOCX import is planned, not implemented in this increment.
              The working path is pasted structured text, or a plain text file.
              Nothing is imported until you check and correct it below.
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
                  {preview.filter((section: any) => ["skills", "languages"].includes(section.key)).map((section: any) => (
                    <section key={section.key} className="mt-5">
                      <h4 className="font-bold uppercase text-navy">{section.title}</h4>
                      {section.lines.map((line: string, index: number) => (
                        <p key={index} className="mt-2">{line}</p>
                      ))}
                    </section>
                  ))}
                </div>
                <div className={settings.templateId === "sidebar" ? "sm:order-2 sm:col-span-2" : "sm:order-1 sm:col-span-2"}>
                  {preview.filter((section: any) => !["skills", "languages"].includes(section.key)).map((section: any) => (
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
              preview.map((section: any) => (
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
