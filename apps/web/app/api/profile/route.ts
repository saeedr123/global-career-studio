// Profile API, Phase 2 increment 14.
// Server profile persistence through the database layer in
// lib/database-core.mjs. The caller sends a session token as a
// Bearer token, created by the auth API, and the profile is read
// from, or saved to, the database for that session user only.
// When no database is configured, or the generated Prisma client
// is not available in this environment, this route answers 501
// local only, and the local browser profile in lib/auth-core.mjs
// keeps working, clearly labelled. Profile dates are stored only
// when the local entry already supplies them; a period string is
// never converted into invented dates. No password hash is ever
// returned here.
import { getDatabaseStatus, getPrismaClient } from "../../../lib/prisma";
import { profileErrors } from "../../../lib/error-format.mjs";
import {
  getProfileByUserId,
  getSessionUser,
  localProfileFromPrisma,
  saveProfileRecord
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

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}

function localOnlyResponse(database: any) {
  return Response.json(
    {
      status: "local_only",
      database: database.status,
      message:
        "Profile is local only here. No database is configured, or the generated Prisma client is not available in this environment, so the profile stays in this browser only.",
      solution:
        "Try again later, when the server is available. Your profile stays saved in this browser in the meantime."
    },
    { status: 501 }
  );
}

export async function GET(request: Request) {
  const { client, status } = await getClient();
  if (!client) {
    return localOnlyResponse(status);
  }
  const token = bearerToken(request);
  if (!token) {
    return Response.json(profileErrors().tokenRequired(), { status: 401 });
  }
  const user = await getSessionUser(client, token);
  if (!user) {
    return Response.json(profileErrors().sessionInvalid(), { status: 401 });
  }
  const stored = await getProfileByUserId(client, user.id);
  if (!stored) {
    return Response.json({ status: "database", profile: null }, { status: 200 });
  }
  const profile = localProfileFromPrisma(stored, {
    experience: stored.experience,
    education: stored.education,
    skills: stored.skills,
    languages: stored.languages
  });
  return Response.json({ status: "database", profile }, { status: 200 });
}

export async function POST(request: Request) {
  const { client, status } = await getClient();
  if (!client) {
    return localOnlyResponse(status);
  }
  const token = bearerToken(request);
  if (!token) {
    return Response.json(profileErrors().tokenRequired(), { status: 401 });
  }
  const user = await getSessionUser(client, token);
  if (!user) {
    return Response.json(profileErrors().sessionInvalid(), { status: 401 });
  }
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json(profileErrors().bodyNotJson(), { status: 400 });
  }
  try {
    const saved = await saveProfileRecord(client, user.id, body?.profile || {});
    return Response.json({ status: "database", profileId: saved.id }, { status: 200 });
  } catch {
    return Response.json(profileErrors().saveFailed(), { status: 500 });
  }
}
