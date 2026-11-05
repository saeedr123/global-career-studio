"use client";

import { useState } from "react";
import { COUNTRY_PACKS, recommendOnboarding } from "../../lib/packs-core.mjs";
import RequireAuth from "../components/RequireAuth";

// Onboarding wizard, Phase 2 increment 8.
// Three questions only: country, occupation, and document goal.
// The result is a suggestion, never a forced choice. The user can
// change the template and the pack in the builder. Back and Skip
// controls are on every step, and the layout is a single column on
// phones. Country packs are guidance only, not legal advice.
// Occupation is free text from the user, never invented.

const GOALS = [
  { id: "cv", label: "Create a CV" },
  { id: "tailor", label: "Tailor for a job" },
  { id: "improve", label: "Improve wording" },
  { id: "check", label: "Check ATS fit" }
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [countryId, setCountryId] = useState("global");
  const [occupation, setOccupation] = useState("");
  const [goal, setGoal] = useState("cv");
  const [message, setMessage] = useState("");

  const recommendation = recommendOnboarding(countryId, occupation, goal);

  function skip() {
    setStep(4);
    setMessage("Skipped. A Global suggestion is shown below. You can change it in the builder.");
  }

  function useInBuilder() {
    try {
      window.localStorage.setItem("gcs-onboarding-choice", JSON.stringify(recommendation));
      setMessage("Suggestion saved. Open the builder to apply it. You can change every setting there.");
    } catch {
      setMessage("Suggestion could not be saved in this browser. You can still choose the same template and pack in the builder.");
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <RequireAuth>
      <p className="eyebrow">
        Onboarding, suggestion only
      </p>
      <h1 className="page-title">Start your document</h1>
      <p className="mt-3 text-ink">
        Three questions, then a suggestion. Nothing here is forced. You can
        change the template, the country pack, the paper size, and the
        section order in the builder. Country packs are guidance only,
        not legal advice.
      </p>
      <p className="mt-3 text-sm text-muted">Step {step} of 4.</p>
      {message && (
        <p className="mt-4 card">{message}</p>
      )}

      {step === 1 && (
        <section className="mt-6 card">
          <h2 className="font-semibold">Where are you applying?</h2>
          <label className="mt-3 block text-sm">Country or market
            <select
              className="mt-1 input-field"
              value={countryId}
              onChange={(event) => setCountryId(event.target.value)}
            >
              {COUNTRY_PACKS.map((pack: any) => (
                <option key={pack.id} value={pack.id}>{pack.name}</option>
              ))}
            </select>
          </label>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6 card">
          <h2 className="font-semibold">What is your occupation?</h2>
          <p className="mt-1 text-sm text-muted">Type it in your own words. Leave it blank if you prefer.</p>
          <label className="mt-3 block text-sm">Occupation
            <input
              className="mt-1 input-field"
              value={occupation}
              onChange={(event) => setOccupation(event.target.value)}
              placeholder="For example: Project Manager"
            />
          </label>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6 card">
          <h2 className="font-semibold">What do you want to do?</h2>
          <div className="mt-3 space-y-2">
            {GOALS.map((item) => (
              <label key={item.id} className="block btn-secondary">
                <input
                  type="radio"
                  name="goal"
                  checked={goal === item.id}
                  onChange={() => setGoal(item.id)}
                />{" "}
                {item.label}
              </label>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="mt-6 card">
          <h2 className="font-semibold">Suggested starting point</h2>
          <p className="mt-2 text-sm text-ink">{recommendation.reason}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink">
            <li>Country pack: {recommendation.countryName}</li>
            <li>Template: {recommendation.templateId}</li>
            <li>Paper size: {recommendation.paperSize === "US_LETTER" ? "US Letter" : "A4"}</li>
            <li>Section order: {recommendation.sectionOrder.join(", ")}</li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            This is a suggestion only. The builder lets you change every setting above.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={useInBuilder}>
              Save suggestion for the builder
            </button>
            <a className="btn-secondary" href="/builder">
              Open the builder
            </a>
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {step > 1 && (
          <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 4 && (
          <>
            <button type="button" className="btn-primary" onClick={() => setStep(step + 1)}>
              Next
            </button>
            <button type="button" className="btn-secondary" onClick={skip}>
              Skip
            </button>
          </>
        )}
        {step === 4 && (
          <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
            Start again
          </button>
        )}
      </div>
      </RequireAuth>
    </main>
  );
}
