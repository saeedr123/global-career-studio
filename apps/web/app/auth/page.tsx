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
import {
  checkServerAvailable,
  clearServerSession,
  readServerSession,
  serverLogin,
  serverLogout,
  serverSignup,
  storeServerSession
} from "../../lib/session-client.mjs";
import { edition } from "../../lib/config";

// Account page, Phase 2 increment 15.
// When the server is available, signup and login go through
// /api/auth and the returned session token is stored in
// localStorage under gcs-session, mode server, so the account and
// documents sync across devices. The token is never displayed and
// never logged. When the server answers 501, or cannot be reached,
// the page falls back to the local browser auth in
// lib/auth-core.mjs and says so plainly, and local accounts stay
// local. Password reset is not available on the server yet, because
// no email is sent, so reset stays local only. No password is ever
// stored in plain text, on the server or in this browser.

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
  const [mode, setMode] = useState<"signup" | "login" | "reset-request" | "reset">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [shownResetToken, setShownResetToken] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [sessionMode, setSessionMode] = useState("");
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [accountMode, setAccountMode] = useState<"server" | "local">("server");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = readStoredSession();
    if (stored && stored.mode === "server") {
      const serverSession = readServerSession(window.localStorage);
      if (serverSession) {
        setSessionEmail(serverSession.email);
        setSessionMode("server");
      }
    } else if (isSessionValid(stored)) {
      setSessionEmail(stored.email);
      setSessionMode("local");
    }
    checkServerAvailable().then((result) => {
      setServerAvailable(result.available);
      if (!result.available) {
        setAccountMode("local");
      }
    });
  }, []);

  async function handleSignup(event: any) {
    event.preventDefault();
    const errors = validateSignup({ name, email, password, confirmPassword });
    if (errors.length > 0) {
      setMessage(`Please fix: ${errors.join(", ")}. Password must be at least 8 characters.`);
      return;
    }
    if (accountMode === "server" && serverAvailable) {
      try {
        const result = await serverSignup(undefined, { name, email, password, confirmPassword, edition });
        storeServerSession(window.localStorage, {
          token: result.sessionToken,
          email: result.account.email,
          accountId: result.account.id,
          expiresAt: result.expiresAt
        });
        setSessionEmail(result.account.email);
        setSessionMode("server");
        setMessage("Server account created and signed in. Your account syncs across devices, and documents you save to the server are stored there.");
        return;
      } catch (error: any) {
        if (error?.code === "local_only" || error?.code === "unreachable") {
          setMessage("The server was not available, so a local account was created instead, in this browser only.");
        } else {
          setMessage(error?.message || "Server signup failed.");
          return;
        }
      }
    }
    try {
      const result = await createAccount(readAccounts(), { name, email, password, confirmPassword }, edition);
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(result.accounts));
      const loginResult = await login(result.accounts, email, password);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...loginResult.session, mode: "local" }));
      setSessionEmail(loginResult.session.email);
      setSessionMode("local");
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
    if (accountMode === "server" && serverAvailable) {
      try {
        const result = await serverLogin(undefined, { email, password });
        storeServerSession(window.localStorage, {
          token: result.sessionToken,
          email: result.account.email,
          accountId: result.account.id,
          expiresAt: result.expiresAt
        });
        setSessionEmail(result.account.email);
        setSessionMode("server");
        setMessage("Signed in on the server. Your documents on the server are listed on the dashboard.");
        return;
      } catch (error: any) {
        if (error?.code === "local_only" || error?.code === "unreachable") {
          setMessage("The server was not available, so signing in locally instead, in this browser only.");
        } else {
          setMessage(error?.message || "Server login failed.");
          return;
        }
      }
    }
    try {
      const result = await login(readAccounts(), email, password);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...result.session, mode: "local" }));
      setSessionEmail(result.session.email);
      setSessionMode("local");
      setMessage("Signed in locally, in this browser only.");
    } catch (error: any) {
      setMessage(error?.message || "Login failed in this browser.");
    }
  }

  async function handleLogout() {
    if (sessionMode === "server") {
      await serverLogout(undefined, window.localStorage);
      setSessionEmail("");
      setSessionMode("");
      setMessage("Signed out on the server. Your local drafts are still in this browser.");
      return;
    }
    clearServerSession(window.localStorage);
    setSessionEmail("");
    setSessionMode("");
    setMessage("Signed out locally. Your local drafts are still in this browser.");
  }

  function handleResetRequest(event: any) {
    event.preventDefault();
    if (accountMode === "server") {
      setMessage("Password reset is not available on the server yet, because no email is sent. Use a local account to reset a local password, or sign in on the server with your existing password.");
      return;
    }
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

  const signedInLabel = sessionMode === "server" ? "Server account" : "Local account, not a server account";

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{signedInLabel}</p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Account</h1>
      <p className="mt-3 text-slate-700">
        {serverAvailable === null
          ? "Checking whether the server is available..."
          : serverAvailable
            ? "Server accounts are available. A server account syncs across devices. A local account lives only in this browser."
            : "The server is not available here, so accounts are local browser accounts only, until a real database is connected."}
        {" "}Passwords are hashed, never stored in plain text, and no payment, AI, or real email is connected here.
      </p>
      {sessionEmail ? (
        <div className="mt-4 rounded border border-green-300 bg-green-50 p-4">
          <p>Signed in {sessionMode === "server" ? "on the server" : "locally"} as {sessionEmail}.</p>
          <button type="button" className="mt-3 rounded bg-navy px-4 py-2 text-white" onClick={handleLogout}>Sign out{sessionMode === "server" ? " on the server" : " locally"}</button>
          <p className="mt-3"><a className="text-blue-700 underline" href="/dashboard">Go to the dashboard</a></p>
          <p className="mt-2"><a className="text-blue-700 underline" href="/profile">Edit your profile</a></p>
        </div>
      ) : (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-4">Not signed in. Your builder drafts are still available in this browser, but they are not tied to a server account yet.</p>
      )}
      {serverAvailable && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="rounded border border-slate-300 px-3 py-2" onClick={() => setAccountMode("server")}>Use a server account</button>
          <button type="button" className="rounded border border-slate-300 px-3 py-2" onClick={() => setAccountMode("local")}>Use a local browser account instead</button>
          <span className="self-center text-sm text-slate-600">Now using: {accountMode === "server" ? "server account" : "local browser account"}.</span>
        </div>
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
          <button type="submit" className="rounded bg-navy px-4 py-2 text-white">Create {accountMode === "server" ? "server" : "local"} account</button>
        </form>
      )}
      {mode === "login" && (
        <form className="mt-6 space-y-3" onSubmit={handleLogin}>
          <label className="block">Email<input className="mt-1 block w-full rounded border p-2" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="block">Password<input type="password" className="mt-1 block w-full rounded border p-2" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button type="submit" className="rounded bg-navy px-4 py-2 text-white">Sign in {accountMode === "server" ? "on the server" : "locally"}</button>
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
