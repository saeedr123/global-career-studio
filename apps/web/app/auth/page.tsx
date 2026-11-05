"use client";

import { useEffect, useState } from "react";
import {
  createAccount,
  isSessionValid,
  login,
  validateLogin,
  validateSignup
} from "../../lib/auth-core.mjs";
import {
  checkServerAvailable,
  clearServerSession,
  readServerSession,
  serverLogin,
  serverLogout,
  serverSignup,
  storeServerSession
} from "../../lib/session-client.mjs";
import { edition, editionConfig } from "../../lib/config";
import ErrorNotice from "../components/ErrorNotice";

// Account page, Phase 2 increment 17.
// One flow only: sign up and sign in with an email address and a
// password, name on sign up, password at least 8 characters. There
// is no choice between account types any more. When the server is
// available, signup and login go through /api/auth and the returned
// session token is stored in localStorage under gcs-session, so the
// account and documents are saved with the account. The token is
// never displayed and never logged. When the server answers 501, or
// cannot be reached, the page falls back silently to the browser
// account in lib/auth-core.mjs, and says only that drafts are saved
// in this browser. No password is ever stored in plain text.
// Password reset by email is not set up yet, because no email is
// sent, so the Forgot password view says so plainly and points to
// the free consultation instead of promising a reset email.

const ACCOUNTS_KEY = "gcs-accounts";
const SESSION_KEY = "gcs-session";

function readAccounts() {
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function readStoredSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login" | "reset-request">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<any>(null);

  function safeNextPath() {
    try {
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/") && !next.startsWith("//") && next !== "/auth") {
        return next;
      }
    } catch {
      return "";
    }
    return "";
  }

  function redirectAfterSignIn() {
    const next = safeNextPath();
    if (next) {
      window.location.assign(next);
      return true;
    }
    return false;
  }

  useEffect(() => {
    const stored = readStoredSession();
    if (stored && stored.mode === "server") {
      const serverSession = readServerSession(window.localStorage);
      if (serverSession) {
        setSessionEmail(serverSession.email);
        redirectAfterSignIn();
      }
    } else if (isSessionValid(stored)) {
      setSessionEmail(stored.email);
      redirectAfterSignIn();
    }
    checkServerAvailable().then((result) => {
      setServerAvailable(result.available);
    });
  }, []);

  async function createBrowserAccount() {
    const result = await createAccount(readAccounts(), { name, email, password, confirmPassword }, edition);
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(result.accounts));
    const loginResult = await login(result.accounts, email, password);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...loginResult.session, mode: "local" }));
    setSessionEmail(loginResult.session.email);
  }

  async function handleSignup(event: any) {
    event.preventDefault();
    const errors = validateSignup({ name, email, password, confirmPassword });
    if (errors.length > 0) {
      setNotice({
        title: "Please check the details.",
        message: `Please fix: ${errors.join(", ")}.`,
        solution: "Use a valid email and a password of at least 8 characters, then try again."
      });
      return;
    }
    if (serverAvailable !== false) {
      try {
        const result = await serverSignup(undefined, { name, email, password, confirmPassword, edition });
        storeServerSession(window.localStorage, {
          token: result.sessionToken,
          email: result.account.email,
          accountId: result.account.id,
          expiresAt: result.expiresAt
        });
        setSessionEmail(result.account.email);
        setMessage("Account created and signed in. Your documents are saved with your account.");
        redirectAfterSignIn();
        return;
      } catch (error: any) {
        if (error?.code !== "local_only" && error?.code !== "unreachable") {
          setNotice({
            title: "Sign up failed.",
            message: error?.message || "Signup failed.",
            solution: error?.solution || "Check your details and try again."
          });
          return;
        }
      }
    }
    try {
      await createBrowserAccount();
      setMessage("Account created and signed in. Your drafts are saved in this browser.");
      redirectAfterSignIn();
    } catch (error: any) {
      setNotice({
        title: "Sign up failed.",
        message: error?.message || "Signup failed in this browser.",
        solution: "Check your details and try again. Your drafts are saved in this browser."
      });
    }
  }

  async function handleLogin(event: any) {
    event.preventDefault();
    const errors = validateLogin({ email, password });
    if (errors.length > 0) {
      setNotice({
        title: "Please check the details.",
        message: `Please fix: ${errors.join(", ")}.`,
        solution: "Use a valid email and your password, then try again."
      });
      return;
    }
    if (serverAvailable !== false) {
      try {
        const result = await serverLogin(undefined, { email, password });
        storeServerSession(window.localStorage, {
          token: result.sessionToken,
          email: result.account.email,
          accountId: result.account.id,
          expiresAt: result.expiresAt
        });
        setSessionEmail(result.account.email);
        setMessage("Signed in. Your saved documents are listed on the dashboard.");
        redirectAfterSignIn();
        return;
      } catch (error: any) {
        if (error?.code !== "local_only" && error?.code !== "unreachable") {
          setNotice({
            title: "Sign in failed.",
            message: error?.message || "Login failed.",
            solution: error?.solution || "Check your email and password and try again."
          });
          return;
        }
      }
    }
    try {
      const result = await login(readAccounts(), email, password);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...result.session, mode: "local" }));
      setSessionEmail(result.session.email);
      setMessage("Signed in. Your drafts in this browser are unchanged.");
      redirectAfterSignIn();
    } catch (error: any) {
      setNotice({
        title: "Sign in failed.",
        message: error?.message || "Login failed in this browser.",
        solution: "Check your email and password and try again."
      });
    }
  }

  async function handleLogout() {
    if (readServerSession(window.localStorage)) {
      await serverLogout(undefined, window.localStorage);
    } else {
      clearServerSession(window.localStorage);
    }
    setSessionEmail("");
    setMessage("Signed out. Your drafts are still in this browser.");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="page-title">Account</h1>
      <p className="mt-3 text-ink">
        {serverAvailable === null
          ? "Checking your account..."
          : "Create your account with your email address and a password, at least 8 characters. Your documents are saved with your account. Passwords are hashed, never stored in plain text, and no payment, AI, or real email is connected here."}
      </p>
      {sessionEmail ? (
        <div className="mt-4 notice-success">
          <p>Signed in as {sessionEmail}.</p>
          <button type="button" className="mt-3 btn-secondary" onClick={handleLogout}>Sign out</button>
          <p className="mt-3"><a className="brand-link" href="/dashboard">Go to the dashboard</a></p>
          <p className="mt-2"><a className="brand-link" href="/profile">Edit your profile</a></p>
        </div>
      ) : (
        <p className="mt-4 notice">Not signed in. Your builder drafts are still available in this browser.</p>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setMode("signup")}>Sign up</button>
        <button type="button" className="btn-secondary" onClick={() => setMode("login")}>Sign in</button>
        <button type="button" className="btn-secondary" onClick={() => setMode("reset-request")}>Forgot password</button>
      </div>
      {mode === "signup" && (
        <form className="mt-6 space-y-3" onSubmit={handleSignup}>
          <label className="block">Name<input className="mt-1 input-field" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="block">Email<input className="mt-1 input-field" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="block">Password, at least 8 characters<input type="password" className="mt-1 input-field" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label className="block">Confirm password<input type="password" className="mt-1 input-field" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <button type="submit" className="btn-primary">Create account</button>
        </form>
      )}
      {mode === "login" && (
        <form className="mt-6 space-y-3" onSubmit={handleLogin}>
          <label className="block">Email<input className="mt-1 input-field" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="block">Password<input type="password" className="mt-1 input-field" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button type="submit" className="btn-primary">Sign in</button>
        </form>
      )}
      {mode === "reset-request" && (
        <div className="mt-6 card">
          <h2 className="font-semibold">Forgot your password</h2>
          <p className="mt-2 text-ink">Password reset by email is not set up yet. No reset email is sent, so there is no reset link to request here.</p>
          <p className="mt-2 text-ink">If you cannot sign in, book a free consultation and we will help you get back into your account.</p>
          <p className="mt-3"><a className="brand-link" href={editionConfig.footerHelpHref}>{editionConfig.footerHelpLabel}</a></p>
        </div>
      )}
      {notice && (
        <div className="mt-4">
          <ErrorNotice title={notice.title} message={notice.message} solution={notice.solution} />
        </div>
      )}
      {message && <p className="mt-4 text-ink">{message}</p>}
    </main>
  );
}
