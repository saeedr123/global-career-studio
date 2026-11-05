// Human help funnel API, Phase 2 increment 19.
// Saves requests from the public /human-help funnel page, with no
// account and no sign-in required, and lists them for the admin
// page, newest first. POST validates the input: name, a valid
// email, a country from the country pack list, a goal of study,
// work, or business, and a need of consultation, review, or both.
// Only valid requests are saved. When no database is configured,
// or the generated Prisma client is not available in this
// environment, this route answers 501 local only. When the save
// fails, for example when the HumanHelpRequest table is not
// migrated yet, it answers a plain JSON error instead of an empty
// 500. Nothing here promises a reply time, a price, or an email,
// because no email is sent and the turnaround is not decided.
// The list endpoint is unprotected, the same posture as the
// unlinked admin page itself, which is not a secured production
// admin. Gating the list behind an admin session is a separate
// decision for the owner.
import { getDatabaseStatus, getPrismaClient } from "../../../lib/prisma";
import {
  createHumanHelpRequest,
  listHumanHelpRequests,
  validateHumanHelpRequest
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

function localOnlyResponse(database: any) {
  return Response.json(
    {
      status: "local_only",
      database: database.status,
      message:
        "Human help requests are saved in the database, which is not configured here, or the generated Prisma client is not available in this environment, so a request cannot be saved yet."
    },
    { status: 501 }
  );
}

export async function GET() {
  const { client, status } = await getClient();
  if (!client) {
    return localOnlyResponse(status);
  }
  try {
    const requests = await listHumanHelpRequests(client);
    return Response.json({ status: "database", requests }, { status: 200 });
  } catch {
    return Response.json({ error: "The human help requests could not be read." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { client, status } = await getClient();
  if (!client) {
    return localOnlyResponse(status);
  }
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  let input: any;
  try {
    input = validateHumanHelpRequest(body || {});
  } catch (error: any) {
    return Response.json({ error: error?.message || "The details are not complete." }, { status: 400 });
  }
  try {
    const created = await createHumanHelpRequest(client, input);
    return Response.json({ status: "database", request: created }, { status: 201 });
  } catch {
    return Response.json({ error: "The request could not be saved. Please try again." }, { status: 500 });
  }
}
