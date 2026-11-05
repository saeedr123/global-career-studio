// Reads the Bearer session token from a request, or "" when there is
// none. Shared by the routes added with the admin area, 2026-11-05.
export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}
