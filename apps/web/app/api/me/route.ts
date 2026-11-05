// Who am I, 2026-11-05, admin area. Returns the signed in account
// for the Bearer session token: name, email, role, and edition, never
// the password hash. The header uses the role to show the Admin link
// to admins only. The role shown here is only a display hint: every
// admin route checks the role again on the server.
import { getDatabaseStatus, getPrismaClient } from "../../../lib/prisma";
import { getSessionUser } from "../../../lib/database-core.mjs";
import { bearerToken } from "../../../lib/bearer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const status = await getDatabaseStatus();
  const client = status.configured && status.clientAvailable ? await getPrismaClient() : null;
  if (!client) {
    return Response.json({ status: "local_only", signedIn: false }, { status: 501 });
  }
  const token = bearerToken(request);
  let user: any = null;
  try {
    user = token ? await getSessionUser(client, token) : null;
  } catch {
    user = null;
  }
  if (!user) {
    return Response.json({ signedIn: false }, { status: 401 });
  }
  return Response.json(
    {
      signedIn: true,
      account: { name: user.name || "", email: user.email, role: user.role, edition: user.edition }
    },
    { status: 200 }
  );
}
