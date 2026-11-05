// Database status API, Phase 2 increment 13.
// GET returns only whether a database is configured and whether the
// generated Prisma client is available, plus the chosen provider
// name and region. It never returns, logs, or echoes any part of
// DATABASE_URL. The chosen hosted Postgres is Neon, free plan,
// region AWS EU Central Frankfurt (eu-central-1). No live Neon
// database is connected in this increment, because no DATABASE_URL
// has been shared and no repo secret has been added yet, so this
// route normally answers not_configured until that changes.
import { getDatabaseStatus } from "../../../lib/prisma";

export async function GET() {
  const status = await getDatabaseStatus();
  return Response.json(status, { status: 200 });
}
