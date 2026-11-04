"use client";

import { useEffect, useState } from "react";
import {
  createAccount,
  isSessionValid,
  login,
  requestPasswordReset,
  resetPassword,
  validateLogin,
  validateSignup
} from "../../lib/auth-core.mjs";
import { edition } from "../../lib/config";

// Local account page, Phase 2 increment 6.
// Accounts are local browser accounts only, with passwords hashed
// with SHA-256 and a random salt, never stored in plain text, and
// stored only in this browser localStorage. No server account, no
// email, and no database is connected in this increment. The reset
// token is shown on this page for local testing only, because no
// email is sent. A future Prisma adapter will use the same account
// and session shapes, so this page can switch to server auth without
// a UI rewrite.

const ACCOUNTS_KEY = "gcs-accounts";
const SESSION_KEY = "gcs-session";

function readAccounts() {
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login" | "reset-request" | "reset">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [shownResetToken, setShownResetToken] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
      if (isSessionValid(session)) {
        setSessionEmail(session.email);
      }
    } catch {
      setSessionEmail("");
    }
  }, []);

  async function handleSignup(event: any) {
    event.preventDefault();
    const errors = validateSignup({ name, email, password, confirmPassword });
    if (errors.length > 0) {
      setMessage(`Please fix: ${errors.join(", ")}. Password must be at least 8 characters.`);
      return;
    }
    try {
      const result = await createAccount(readAccounts(), { name, email, password, confirmPassword }, edition);
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(result.accounts));
      const loginResult = await login(result.accounts, email, password);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(loginResult.session));
      setSessionEmail(loginResult.session.email);
      setMessage("Local account created and signed in, in this browser only. No server account was created.");
    } catch (error: any) {
      setMessage(error?.message || "Signup failed in this browser.");
    }
  }

  async function handleLogin(event: any) {
    event.preventDefault();
    const errors = validateLogin({ email, password });
    if (errors.length > 0) {
      setMessage(`Please fix: ${errors.join(", ")}.`);
      return;
    }
    try {
      const result = await login(readAccounts(), email, password);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(result.session));
      setSessionEmail(result.session.email);
      setMessage("Signed in locally, in this browser only.");
    } catch (error: any) {
      setMessage(error?.message || "Login failed in this browser.");
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(SESSION_KEY);
    setSessionEmail("");
    setMessage("Signed out locally. Your local drafts are still in this browser.");
  }

  function handleResetRequest(event: any) {
    event.preventDefault();
    const result = requestPasswordReset(readAccounts(), email);
    if (!result.found) {
      setShownResetToken("");
      setMessage("No local account was found for this email, so no reset token was created. This avoids confirming which emails have local accounts.");
      return;
    }
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(result.accounts));
    setShownResetToken(result.token || "");
    setMode("reset");
    setMessage("Local reset token created. No email was sent, because no email service is connected. The token below is shown here for local testing only, and it expires in 1 hour.");
  }

  async function handleReset(event: any) {
    event.preventDefault();
    try {
      const result = await resetPassword(readAccounts(), resetToken, password, confirmPassword);
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(result.accounts));
      setShownResetToken("");
      setMode("login");
      setMessage("Local password reset. Sign in with the new password, in this browser only.");
    } catch (error: any) {
      setMessage(error?.message || "Password reset failed in this browser.");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Local account, not a server account</p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Account</h1>
      <p className="mt-3 text-slate-700">
        Local auth only, until Prisma validation passes and a real database is connected. Passwords are hashed, never stored in plain text, and accounts live only in this browser. No payment, AI, or real email is connected here.
      </p>
      {sessionEmail ? (
        <div className="mt-4 rounded border border-green-300 bg-green-50 p-4">
          <p>Signed in locally as {sessionEmail}.</p>
          <button type="button" className="mt-3 rounded bg-navy px-4 py-2 text-white" onClick={handleLogout}>Sign out locally</button>
          <p className="mt-3"><a className="text-blue-700 underline" href="/dashboard">Go to the dashboard</a></p>
          <p className="mt-2"><a className="text-blue-700 underline" href="/profile">Edit your profile</a></p>
        </div>
      ) : (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-4">Not signed in locally. Your builder drafts are still available in this browser, but they are not tied to a server account yet.</p>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="rounded border border-slate-300 px-3 py-2" onClick={() => setMode("signup")}>Sign up</button>
        <button type="button" className="rounded border border-slate-300 px-3 py-2" onClick={() => setMode("login")}>Sign in</button>
        <button type="button" className="rounded border border-slate-300 px-3 py-2" onClick={() => setMode("reset-request")}>Forgot password</button>
      </div>
      {mode === "signup" && (
        <form className="mt-6 space-y-3" onSubmit={handleSignup}>
          <label className="block">Name<input className="mt-1 block w-full rounded border p-2" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="block">Email<input className="mt-1 block w-full rounded border p-2" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="block">Password, at least 8 characters<input type="password" className="mt-1 block w-full rounded border p-2" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label className="block">Confirm password<input type="password" className="mt-1 block w-full rounded border p-2" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <button type="submit" className="rounded bg-navy px-4 py-2 text-white">Create local account</button>
        </form>
      )}
      {mode === "login" && (
        <form className="mt-6 space-y-3" onSubmit={handleLogin}>
          <label className="block">Email<input className="mt-1 block w-full rounded border p-2" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="block">Password<input type="password" className="mt-1 block w-full rounded border p-2" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button type="submit" className="rounded bg-navy px-4 py-2 text-white">Sign in locally</button>
        </form>
      )}
      {mode === "reset-request" && (
        <form className="mt-6 space-y-3" onSubmit={handleResetRequest}>
          <label className="block">Email<input className="mt-1 block w-full rounded border p-2" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <button type="submit" className="rounded bg-navy px-4 py-2 text-white">Request local reset token</button>
        </form>
      )}
      {mode === "reset" && (
        <form className="mt-6 space-y-3" onSubmit={handleReset}>
          {shownResetToken && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">Local reset token, shown here only because no email is sent: {shownResetToken}</p>}
          <label className="block">Reset token<input className="mt-1 block w-full rounded border p-2" value={resetToken} onChange={(event) => setResetToken(event.target.value)} /></label>
          <label className="block">New password, at least 8 characters<input type="password" className="mt-1 block w-full rounded border p-2" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label className="block">Confirm new password<input type="password" className="mt-1 block w-full rounded border p-2" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <button type="submit" className="rounded bg-navy px-4 py-2 text-white">Reset local password</button>
        </form>
      )}
      {message && <p className="mt-4 text-slate-800">{message}</p>}
    </main>
  );
}
