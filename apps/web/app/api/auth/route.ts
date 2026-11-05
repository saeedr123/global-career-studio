// Auth API, Phase 2 increment 13.
// This route does NOT create a real server account yet, because no
// database is connected in this increment, and because the Prisma
// schema has no Session table yet, so a server session cannot be
// stored or revoked server side. Auth in this increment is local
// browser auth, implemented in lib/auth-core.mjs and used by
// app/auth/page.tsx, with passwords hashed in the browser and stored
// only in localStorage. The server data layer for accounts is ready
// in lib/database-core.mjs (createUserRecord, getUserByEmail, with
// the same account shapes), and this route now reports the real
// database status from lib/prisma.ts instead of hard coding a local
// only answer, so the day a database is connected the route can
// delegate to that layer. Until then it answers honestly instead of
// pretending to sign a user in on a server.
import { getDatabaseStatus } from "../../../lib/prisma";

export async function GET() {
  const database = await getDatabaseStatus();
  return Response.json(
    {
      status: "local_only",
      database: database.status,
      databaseProvider: database.provider,
      databaseRegion: database.region,
      message:
        "Auth is local only in this increment. No database is connected, and no server account is created here. Use the local account page, with a hashed password stored only in this browser. Server auth groundwork is ready in the data layer, but it needs a connected database and a session design before it can run."
    },
    { status: 501 }
  );
}

export async function POST(request: Request) {
  let action = "";
  try {
    const body = await request.json();
    action = String(body?.action || "");
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  if (!["signup", "login", "logout", "request-reset", "reset"].includes(action)) {
    return Response.json({ error: "Action must be signup, login, logout, request-reset, or reset." }, { status: 400 });
  }
  const database = await getDatabaseStatus();
  return Response.json(
    {
      status: "local_only",
      action,
      database: database.status,
      databaseProvider: database.provider,
      databaseRegion: database.region,
      message:
        "This action is handled locally in this increment, not on a server, because no database is connected. A future Prisma adapter will implement the same account and session shapes, once a database is connected and a session design is added."
    },
    { status: 501 }
  );
}
