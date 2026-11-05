// Admin overview, 2026-11-05. Admins only, checked on the server from
// the Bearer session token: anyone else gets 401 and no data. Returns
// live counts, the newest accounts (no password hashes), and the
// human help requests. A part whose table is not migrated yet comes
// back null with a note, so the rest of the page still works.
import { getDatabaseStatus, getPrismaClient } from "../../../../lib/prisma";
import {
  getAdminFromToken,
  getAdminOverview,
  listAccountsForAdmin,
  listHumanHelpRequests
} from "../../../../lib/database-core.mjs";
import { bearerToken } from "../../../../lib/bearer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const status = await getDatabaseStatus();
  const client = status.configured && status.clientAvailable ? await getPrismaClient() : null;
  if (!client) {
    return Response.json(
      { status: "local_only", message: "No database is connected here, so there is no admin data to show." },
      { status: 501 }
    );
  }
  let admin: any = null;
  try {
    admin = await getAdminFromToken(client, bearerToken(request));
  } catch {
    admin = null;
  }
  if (!admin) {
    return Response.json({ error: "This page is for admin accounts only." }, { status: 401 });
  }
  const counts = await getAdminOverview(client);
  let accounts: any[] | null = null;
  try {
    accounts = await listAccountsForAdmin(client, 200);
  } catch {
    accounts = null;
  }
  let helpRequests: any[] | null = null;
  let helpNote = "";
  try {
    helpRequests = await listHumanHelpRequests(client);
  } catch {
    helpNote = "Help requests can't be read yet. Run the Neon migrate deploy workflow on GitHub to create their table.";
  }
  return Response.json(
    { status: "database", admin: { name: admin.name || "", email: admin.email }, counts, accounts, helpRequests, helpNote },
    { status: 200 }
  );
}
