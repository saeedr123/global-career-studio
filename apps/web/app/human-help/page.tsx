"use client";

import { useState } from "react";
import { COUNTRY_PACKS } from "../../lib/packs-core.mjs";

// Human help funnel, Phase 2 increment 19. A public page, no
// sign-in required. Step 1 asks what the visitor needs: a free
// consultation call, a CV review only, or both. Step 2 asks for
// their details: name, email, target country from the country pack
// list, goal of study, work, or business, and one short optional
// line about what they need help with. After submit the routing
// follows the need. A consultation, or both, shows the booking link
// to the free 20-minute consultation, with the name and email
// carried as query parameters so the booking form is prefilled.
// The link is a plain visible link the visitor clicks, never an
// automatic redirect. A CV review only shows a confirmation that
// NVConsult has the request and will get back to them, with no
// reply time, price, or email promised, because no email is sent
// and the turnaround is not decided. Details are saved so
// NVConsult can arrange the help, nothing more. Branding uses the
// shared tokens and classes, navy and gold, uniform cards, subtle
// motion, 44px tap targets, one primary action per section.

const NEED_OPTIONS = [
  {
    id: "consultation",
    title: "Free consultation call",
    text: "Book a free 20-minute call with NVConsult about your route abroad."
  },
  {
    id: "review",
    title: "CV review only",
    text: "NVConsult reviews your CV and gets back to you, with no call first."
  },
  {
    id: "both",
    title: "Both",
    text: "A CV review and a free consultation call, starting with the call."
  }
];

const GOAL_OPTIONS = [
  { id: "study", label: "Study" },
  { id: "work", label: "Work" },
  { id: "business", label: "Business" }
];

const NEED_LABELS: Record<string, string> = {
  consultation: "Free consultation call",
  review: "CV review only",
  both: "Both"
};

export default function HumanHelpPage() {
  const [step, setStep] = useState<"need" | "details" | "done">("need");
  const [need, setNeed] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [goal, setGoal] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function chooseNeed(value: string) {
    setNeed(value);
    setError("");
    setStep("details");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/human-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, country, goal, need, message })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          data.error ||
            data.message ||
            "The request could not be saved. Please try again."
        );
        return;
      }
      setStep("done");
    } catch {
      setError("The request could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const bookingUrl = `https://cal.com/nvconsult?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
  const needsBooking = need === "consultation" || need === "both";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="eyebrow">Human help</p>
      <h1 className="page-title">Get human help</h1>
      <p className="lead mt-3 text-ink">
        Tell NVConsult what you need, and your details go with it, so the help starts from your
        situation, not from a blank booking.
      </p>
      <p className="mt-3 text-ink">
        Your details are saved so NVConsult can arrange the help. Nothing else happens with them.
      </p>

      {step === "need" && (
        <section className="reveal mt-8">
          <h2 className="section-title">Step 1 of 2: What do you need?</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {NEED_OPTIONS.map((option) => (
              <button key={option.id} type="button" className="card text-left" onClick={() => chooseNeed(option.id)}>
                <span className="card-title">{option.title}</span>
                <span className="mt-2 block text-ink">{option.text}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "details" && (
        <section className="reveal mt-8">
          <h2 className="section-title">Step 2 of 2: Your details</h2>
          <p className="mt-2 text-ink">
            You asked for: <strong>{NEED_LABELS[need] || need}</strong>
          </p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-ink">
              Name
              <input
                className="mt-1 input-field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
                placeholder="Your full name"
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Email
              <input
                className="mt-1 input-field"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Target country
              <select
                className="mt-1 input-field"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                required
              >
                <option value="">Choose a country</option>
                {COUNTRY_PACKS.map((pack: any) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Goal
              <select
                className="mt-1 input-field"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                required
              >
                <option value="">Choose a goal</option>
                {GOAL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              What do you need help with? (optional)
              <input
                className="mt-1 input-field"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="One short line, for example: review my CV for German jobs"
              />
            </label>
            {error ? <p className="notice text-ink">{error}</p> : null}
            <div className="flex flex-wrap items-center gap-4">
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving your request." : "Send my request"}
              </button>
              <button
                className="brand-link min-h-[44px]"
                type="button"
                onClick={() => setStep("need")}
              >
                Back to step 1
              </button>
            </div>
          </form>
        </section>
      )}

      {step === "done" && needsBooking && (
        <section className="reveal mt-8">
          <h2 className="section-title">Your request is saved</h2>
          <div className="notice-success mt-4">
            <p className="text-ink">
              Your details are saved for {name}. The next step is your free 20-minute
              consultation.
            </p>
            <p className="mt-3">
              <a className="btn-primary" href={bookingUrl} target="_blank" rel="noreferrer">
                Book your free consultation
              </a>
            </p>
            <p className="mt-3 text-ink">
              The link opens the booking in a new tab, and your name and email are already filled
              in.
            </p>
          </div>
          <p className="mt-4">
            <a className="brand-link" href="/">
              Back to the home page
            </a>
          </p>
        </section>
      )}

      {step === "done" && !needsBooking && (
        <section className="reveal mt-8">
          <h2 className="section-title">Your request is saved</h2>
          <div className="notice-success mt-4">
            <p className="text-ink">
              NVConsult has your request for {name} and will get back to you.
            </p>
          </div>
          <p className="mt-4">
            <a className="brand-link" href="/">
              Back to the home page
            </a>
          </p>
        </section>
      )}
    </main>
  );
}
