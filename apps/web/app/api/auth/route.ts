// Auth API, Phase 2 increment 14.
// Server sessions are stored in the database when DATABASE_URL is
// configured and the generated Prisma client is available, using
// the Session table added in this increment. Only a hash of the
// session token is stored, never the plain token, and the plain
// token is returned once, at signup or login, to be sent back as a
// Bearer token. Passwords are stored only as a salted SHA-256 hash
// in the "salt:hash" form, never in plain text, and no password
// hash is ever returned. When no database is configured, or the
// generated client is not available in this workspace, this route
// answers 501 local only, exactly as before, and the local browser
// auth in lib/auth-core.mjs keeps working, clearly labelled.
// Password reset is NOT available on the server yet, because no
// email is sent, so request-reset and reset answer 501 with that
// plain message instead of pretending to send a reset email. The
// Session table is not applied to the live Neon database yet: it
// needs the owner to run the manual Neon migrate deploy workflow
// on GitHub once, after this increment is pushed.
import { getDatabaseStatus, getPrismaClient } from "../../../lib/prisma";
import {
  createSessionRecord,
  createUserRecord,
  getUserByEmail,
  getUserRecordByEmail,
  hashServerPassword,
  isValidEmail,
  revokeSessionRecord,
  verifyServerPassword
} from "../../../lib/database-core.mjs";

export const dynamic = "force-dynamic";

async function getClient() {
  const status = await getDatabaseStatus();
  if (!status.configured || !status.clientAvailable) {
    return { client: null, status };
  }
  const client = await getPrismaClient();
  if (!client) {
    return { client: null, status };
  }
  return { client, status };
}

function localOnlyResponse(action: string, database: any) {
  return Response.json(
    {
      status: "local_only",
      action,
      database: database.status,
      databaseProvider: database.provider,
      databaseRegion: database.region,
      message:
        "Auth is local only here. No database is configured, or the generated Prisma client is not available in this environment, so no server account is created here. Use the local account page, with a hashed password stored only in this browser."
    },
    { status: 501 }
  );
}

function bearerToken(request: Request, body: any) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return body && body.sessionToken ? String(body.sessionToken) : "";
}

export async function GET() {
  const { client, status } = await getClient();
  if (!client) {
    return localOnlyResponse("status", status);
  }
  return Response.json(
    {
      status: "database",
      database: status.status,
      databaseProvider: status.provider,
      databaseRegion: status.region,
      message:
        "Server auth is available. Signup and login create a server session in the database, stored as a token hash only. Password reset is not available on the server yet, because no email is sent."
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const action = String(body?.action || "");
  if (!["signup", "login", "logout", "request-reset", "reset"].includes(action)) {
    return Response.json({ error: "Action must be signup, login, logout, request-reset, or reset." }, { status: 400 });
  }
  const { client, status } = await getClient();
  if (!client) {
    return localOnlyResponse(action, status);
  }
  if (action === "request-reset" || action === "reset") {
    return Response.json(
      {
        status: "not_available",
        action,
        database: status.status,
        message: "Password reset is not available on the server yet, because no email is sent. No reset email was sent and no password was changed."
      },
      { status: 501 }
    );
  }
  if (action === "logout") {
    const token = bearerToken(request, body);
    if (!token) {
      return Response.json({ error: "A session token is required to log out." }, { status: 400 });
    }
    const revoked = await revokeSessionRecord(client, token);
    return Response.json({ status: "database", action, revoked }, { status: 200 });
  }
  if (action === "signup") {
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");
    const confirmPassword = String(body?.confirmPassword || "");
    if (!name) {
      return Response.json({ error: "A name is required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "The password must be at least 8 characters." }, { status: 400 });
    }
    if (confirmPassword && password !== confirmPassword) {
      return Response.json({ error: "The passwords do not match." }, { status: 400 });
    }
    const existing = await getUserByEmail(client, email);
    if (existing) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const hashed = hashServerPassword(password);
    const account = await createUserRecord(
      client,
      { name, email, edition: body?.edition === "nvconsult" ? "nvconsult" : "commercial" },
      hashed.passwordHash
    );
    const created = await createSessionRecord(client, account.id);
    return Response.json(
      {
        status: "database",
        action,
        account,
        sessionToken: created.token,
        expiresAt: created.session.expiresAt,
        message: "Server account created. Keep the session token safe: it is shown once, only the hash is stored."
      },
      { status: 201 }
    );
  }
  const email = String(body?.email || "").trim();
  const password = String(body?.password || "");
  if (!isValidEmail(email) || !password) {
    return Response.json({ error: "A valid email and a password are required." }, { status: 400 });
  }
  const record = await getUserRecordByEmail(client, email);
  if (!record || !verifyServerPassword(password, record.passwordHash)) {
    return Response.json({ error: "The email or password does not match." }, { status: 401 });
  }
  const created = await createSessionRecord(client, record.id);
  const { passwordHash, ...account } = record;
  void passwordHash;
  return Response.json(
    {
      status: "database",
      action,
      account,
      sessionToken: created.token,
      expiresAt: created.session.expiresAt
    },
    { status: 200 }
  );
}
