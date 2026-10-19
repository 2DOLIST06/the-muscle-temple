/** Verify browser writes against the external Host, including behind Next's internal URL. */
export function isSameOriginAdminRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Non-browser API clients still require admin authentication.
  const url = new URL(request.url);
  const host = request.headers.get('host') ?? url.host;
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? url.protocol.replace(':', '');
  if (protocol !== 'http' && protocol !== 'https') return false;
  try {
    return origin === new URL(`${protocol}://${host}`).origin;
  } catch {
    return false;
  }
}
