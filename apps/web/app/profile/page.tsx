"use client";

import { useEffect, useState } from "react";
import {
  createEmptyProfile,
  draftFromProfile,
  loadProfileIntoDraft,
  profileFromDraft,
  saveDraftToProfile
} from "../../lib/auth-core.mjs";
import { fetchServerProfile, readServerSession, saveServerProfile } from "../../lib/session-client.mjs";
import { createDefaultSettings, parseDraft, validateProfile } from "../../lib/builder-core.mjs";
import RequireAuth from "../components/RequireAuth";
import ErrorNotice from "../components/ErrorNotice";

// Master profile editor, Phase 2 increment 17.
// One profile per account, reused across documents. When signed in,
// the profile is loaded from and saved to /api/profile, and a copy
// is kept in this browser as well, so the page keeps working when
// the account cannot be reached. When there is no signed-in
// session with the account, the profile is stored in this browser.
// The profile uses the same fields as a builder draft, so it can be
// reused across documents. Editing a document in the builder does
// not change this master profile, unless the user confirms a save
// back here or in the builder. Starting data is empty, not sample
// data, because a real profile must not be presented as sample
// history.

const PROFILE_KEY = "gcs-profile";
const DRAFT_KEY = "gcs-builder-draft";
const OPEN_KEY = "gcs-open-document";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(() => createEmptyProfile());
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<any>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [serverSession, setServerSession] = useState<any>(null);

  useEffect(() => {
    let localProfile: any = null;
    try {
      const saved = window.localStorage.getItem(PROFILE_KEY);
      if (saved) {
        localProfile = JSON.parse(saved);
        setProfile(localProfile);
      }
    } catch {
      setMessage("Profile in this browser could not be restored, starting from an empty profile.");
    }
    const session = readServerSession(window.localStorage);
    if (session) {
      setServerSession(session);
      fetchServerProfile(undefined, session)
        .then((serverProfile) => {
          if (serverProfile) {
            setProfile(serverProfile);
            setMissing(validateProfile(serverProfile));
            window.localStorage.setItem(PROFILE_KEY, JSON.stringify(serverProfile));
            setMessage("Master profile loaded. A copy is kept in this browser as well.");
          } else if (localProfile) {
            setMessage("No saved profile was found yet, so the profile in this browser is shown. Save to store it with your account.");
          }
        })
        .catch((error: any) => {
          setMessage(
            error?.code === "local_only" || error?.code === "unreachable"
              ? "Your saved profile could not be loaded right now, so the profile in this browser is shown. Your changes are saved in this browser."
              : error?.message || "Saved profile could not be loaded. The profile in this browser is shown."
          );
        });
    }
  }, []);

  async function saveProfile(next: any, quiet?: boolean) {
    setProfile(next);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setMissing(validateProfile(next));
    if (!serverSession) {
      if (!quiet) {
        setMessage("Master profile saved in this browser.");
      }
      return;
    }
    try {
      await saveServerProfile(undefined, serverSession, next);
      if (!quiet) {
        setMessage("Master profile saved with your account and in this browser.");
      }
    } catch (error: any) {
      if (!quiet) {
        setNotice({
          title: "Save failed.",
          message:
            error?.code === "local_only" || error?.code === "unreachable"
              ? "Your profile could not be saved with your account right now, so it was saved in this browser."
              : error?.message || "The master profile was saved in this browser.",
          solution: error?.solution || "Check your connection and try again. Your profile stays saved in this browser."
        });
      }
    }
  }

  function handleSave(event: any) {
    event.preventDefault();
    saveProfile(profile);
  }

  function loadFromBuilderDraft() {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (!saved) {
        setMessage("No builder draft was found in this browser to load into the profile.");
        return;
      }
      const draft = parseDraft(saved);
      const next = profileFromDraft(draft);
      saveProfile(next, true);
      setMessage("Builder draft loaded into the master profile. Check it before you use it as real history.");
    } catch {
      setMessage("Builder draft could not be loaded into the profile.");
    }
  }

  function saveDraftBackToProfile() {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (!saved) {
        setMessage("No builder draft was found to save back to the profile.");
        return;
      }
      const draft = parseDraft(saved);
      if (!window.confirm("Save the current builder draft over the master profile? This replaces the profile fields with the draft fields.")) {
        setMessage("Save back cancelled. The master profile was not changed.");
        return;
      }
      const next = saveDraftToProfile(profile, draft.profile, true);
      saveProfile(next, true);
      setMessage("Builder draft saved back to the master profile, after your confirmation.");
    } catch {
      setMessage("Save back failed. The master profile was not changed.");
    }
  }

  function useProfileInBuilder() {
    try {
      const document = draftFromProfile(profile, createDefaultSettings());
      window.localStorage.setItem(OPEN_KEY, JSON.stringify({ ...document, id: "master", kind: "master", label: "Draft from profile" }));
      setMessage("Profile sent to the builder. Open the builder to edit it as a draft. The master profile is unchanged until you save back with confirmation.");
      window.location.href = "/builder";
    } catch {
      setMessage("Profile could not be sent to the builder.");
    }
  }

  function updateField(field: string, value: string) {
    setProfile((current: any) => ({ ...current, [field]: value }));
  }

  function updateList(field: string, value: string) {
    setProfile((current: any) => ({ ...current, [field]: value.split(",").map((item: string) => item.trim()).filter(Boolean) }));
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <RequireAuth>
      <p className="eyebrow">Master profile</p>
      <h1 className="page-title">Profile</h1>
      <p className="mt-3 text-ink">
        One profile per account, reused across documents. {serverSession ? `Signed in as ${serverSession.email}. Saving stores the profile with your account and keeps a copy in this browser.` : "Saving stores the profile in this browser."} It is empty by default, so nothing here is sample history. Editing a builder document does not change this profile, unless you confirm a save back.
      </p>
      <form className="mt-6 space-y-3" onSubmit={handleSave}>
        <label className="block">Full name<input className="mt-1 input-field" value={profile.fullName || ""} onChange={(event) => updateField("fullName", event.target.value)} /></label>
        <label className="block">Headline<input className="mt-1 input-field" value={profile.headline || ""} onChange={(event) => updateField("headline", event.target.value)} /></label>
        <label className="block">Email<input className="mt-1 input-field" value={profile.email || ""} onChange={(event) => updateField("email", event.target.value)} /></label>
        <label className="block">Phone<input className="mt-1 input-field" value={profile.phone || ""} onChange={(event) => setProfile((current: any) => ({ ...current, phone: event.target.value }))} /></label>
        <label className="block">City<input className="mt-1 input-field" value={profile.city || ""} onChange={(event) => updateField("city", event.target.value)} /></label>
        <label className="block">Summary<textarea className="mt-1 input-field" rows={4} value={profile.summary || ""} onChange={(event) => updateField("summary", event.target.value)} /></label>
        <label className="block">Skills, comma separated<input className="mt-1 input-field" value={(profile.skills || []).join(", ")} onChange={(event) => updateList("skills", event.target.value)} /></label>
        <label className="block">Languages, comma separated<input className="mt-1 input-field" value={(profile.languages || []).join(", ")} onChange={(event) => updateList("languages", event.target.value)} /></label>
        <button type="submit" className="btn-primary">Save master profile</button>
      </form>
      {missing.length > 0 && <p className="mt-3 text-ink">Missing for a complete profile: {missing.join(", ")}.</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={loadFromBuilderDraft}>Load builder draft into profile</button>
        <button type="button" className="btn-secondary" onClick={saveDraftBackToProfile}>Save builder draft back to profile, with confirmation</button>
        <button type="button" className="btn-secondary" onClick={useProfileInBuilder}>Use this profile in the builder</button>
      </div>
      <p className="mt-4 text-sm text-muted">Experience, education, and custom sections are edited in the builder for now. The profile fields above are the reusable core, and the full profile copy is preserved when a draft is loaded.</p>
      {notice && (
        <div className="mt-4">
          <ErrorNotice title={notice.title} message={notice.message} solution={notice.solution} />
        </div>
      )}
      {message && <p className="mt-4 text-ink">{message}</p>}
      <p className="mt-4"><a className="brand-link" href="/dashboard">Back to the dashboard</a></p>
      </RequireAuth>
    </main>
  );
}
