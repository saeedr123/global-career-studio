// Auth API structure, Phase 2 increment 6.
// This route does NOT create a real server account, because no
// database is connected in this increment. Auth in this increment is
// local browser auth, implemented in lib/auth-core.mjs and used by
// app/auth/page.tsx, with passwords hashed in the browser and stored
// only in localStorage. This route exists so the API shape is clear
// for the future Prisma adapter, and it answers honestly instead of
// pretending to sign a user in on a server.
export async function GET() {
  return Response.json(
    {
      status: "local_only",
      message: "Auth is local only in this increment. No database is connected, and no server account is created here. Use the local account page, with a hashed password stored only in this browser."
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
  return Response.json(
    {
      status: "local_only",
      action,
      message: "This action is handled locally in this increment, not on a server, because no database is connected. A future Prisma adapter will implement the same account and session shapes."
    },
    { status: 501 }
  );
}
