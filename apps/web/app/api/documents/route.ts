// Documents API, Phase 2 increment 14.
// Server document persistence through the database layer in
// lib/database-core.mjs. The caller sends a session token as a
// Bearer token, created by the auth API. GET lists only the
// documents owned by that session user, with an optional edition
// filter, and POST creates a document from a local builder draft
// for that user only, keeping the edition tag. Ownership is
// checked by the data layer on every read. When no database is
// configured, or the generated Prisma client is not available in
// this environment, this route answers 501 local only, and the
// local browser documents keep working, clearly labelled.
import { getDatabaseStatus, getPrismaClient } from "../../../lib/prisma";
import {
  createDocumentRecord,
  deleteDocumentRecord,
  getSessionUser,
  listDocumentsForUser,
  localDraftToDocumentInput
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
        "Documents are local only here. No database is configured, or the generated Prisma client is not available in this environment, so documents stay in this browser only."
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
    return Response.json({ error: "A session token is required." }, { status: 401 });
  }
  const user = await getSessionUser(client, token);
  if (!user) {
    return Response.json({ error: "That session is not valid or has expired." }, { status: 401 });
  }
  const url = new URL(request.url);
  const edition = url.searchParams.get("edition") || undefined;
  const documents = await listDocumentsForUser(client, user.id, edition);
  return Response.json({ status: "database", documents }, { status: 200 });
}

export async function POST(request: Request) {
  const { client, status } = await getClient();
  if (!client) {
    return localOnlyResponse(status);
  }
  const token = bearerToken(request);
  if (!token) {
    return Response.json({ error: "A session token is required." }, { status: 401 });
  }
  const user = await getSessionUser(client, token);
  if (!user) {
    return Response.json({ error: "That session is not valid or has expired." }, { status: 401 });
  }
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const input = localDraftToDocumentInput(body?.draft || {}, user.id, body?.edition || user.edition);
  const created = await createDocumentRecord(client, input);
  return Response.json({ status: "database", document: created }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { client, status } = await getClient();
  if (!client) {
    return localOnlyResponse(status);
  }
  const token = bearerToken(request);
  if (!token) {
    return Response.json({ error: "A session token is required." }, { status: 401 });
  }
  const user = await getSessionUser(client, token);
  if (!user) {
    return Response.json({ error: "That session is not valid or has expired." }, { status: 401 });
  }
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const url = new URL(request.url);
  const documentId = body?.documentId || url.searchParams.get("documentId") || "";
  if (!documentId) {
    return Response.json({ error: "A document id is required." }, { status: 400 });
  }
  const result = await deleteDocumentRecord(client, user.id, String(documentId));
  if (!result.deleted) {
    return Response.json({ error: "That document was not found." }, { status: 404 });
  }
  return Response.json({ status: "database", deleted: true }, { status: 200 });
}
