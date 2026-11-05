// Prisma client setup, Phase 2 increment 13.
// Singleton loader for the Next.js app. The client is created only
// from the DATABASE_URL environment variable, never from a value in
// code, in a test, or in a log. No DATABASE_URL value is read, stored,
// returned, or logged anywhere in this module: only whether the
// variable is set is reported, as configured true or false.
// The chosen hosted Postgres is Neon, free plan, region AWS EU
// Central Frankfurt (eu-central-1). See docs/database-design.md.
// No live Neon database is connected in this increment, because no
// DATABASE_URL has been shared and no secret has been added yet.
// Until a database is configured and the generated client is
// available, getPrismaClient returns null and callers must keep the
// local browser fallback working, clearly labelled. That is the
// honest state, not a silent failure: databaseStatus explains which
// of the two pieces is missing, configured or clientAvailable.
// The client package is loaded through a variable specifier on
// purpose, so the app still builds and typechecks in this workspace
// where the Prisma engine download fails and the client cannot be
// generated yet. Do NOT change this to a static import until the
// generated client exists where the build runs. Do NOT fake a
// generated client, and do NOT claim the app is live on a real
// database while this loader returns null.

const CLIENT_SPECIFIER = "@prisma/client";

let cachedClient: any = null;
let cachedClientTried = false;

export function isDatabaseConfigured(env?: any) {
  const source = env || process.env || {};
  const value = source.DATABASE_URL;
  return Boolean(value && String(value).trim().length > 0);
}

export function getDatabaseProviderName() {
  return "neon";
}

export function getDatabaseRegion() {
  return "eu-central-1";
}

export async function getPrismaClient(env?: any) {
  if (cachedClientTried) {
    return cachedClient;
  }
  if (!isDatabaseConfigured(env)) {
    cachedClientTried = true;
    cachedClient = null;
    return null;
  }
  try {
    const mod = await import(CLIENT_SPECIFIER);
    const PrismaClient = mod.PrismaClient || mod.default;
    if (!PrismaClient) {
      cachedClientTried = true;
      cachedClient = null;
      return null;
    }
    cachedClient = new PrismaClient();
    cachedClientTried = true;
    return cachedClient;
  } catch {
    // The generated client is not available in this environment.
    // This is expected locally, where Prisma generate cannot run
    // because the engine download fails. Callers fall back to local
    // browser storage and say so plainly. Never throw here, and
    // never log the DATABASE_URL value.
    cachedClientTried = true;
    cachedClient = null;
    return null;
  }
}

export async function getDatabaseStatus(env?: any) {
  const configured = isDatabaseConfigured(env);
  if (!configured) {
    return {
      status: "not_configured",
      provider: getDatabaseProviderName(),
      region: getDatabaseRegion(),
      configured: false,
      clientAvailable: false,
      message:
        "No database is configured. DATABASE_URL is not set, so the app uses local browser storage only. Add the Neon DATABASE_URL as a repo secret and in the hosting environment to connect."
    };
  }
  const client = await getPrismaClient(env);
  if (!client) {
    return {
      status: "client_not_available",
      provider: getDatabaseProviderName(),
      region: getDatabaseRegion(),
      configured: true,
      clientAvailable: false,
      message:
        "DATABASE_URL is set, but the generated Prisma client is not available in this environment. Run prisma generate where the engine download works, then restart the app."
    };
  }
  return {
    status: "configured",
    provider: getDatabaseProviderName(),
    region: getDatabaseRegion(),
    configured: true,
    clientAvailable: true,
    message: "Database is configured and the Prisma client is available."
  };
}

export function resetPrismaClientForTests() {
  cachedClient = null;
  cachedClientTried = false;
}
