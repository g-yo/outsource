const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isAllowedOrigin(
  requestOrigin: string | null,
  requestUrl: string,
  appUrl: string,
  development: boolean,
) {
  if (!requestOrigin || requestOrigin === "null") return false;
  try {
    const origin = new URL(requestOrigin);
    const configured = new URL(appUrl);
    if (requestOrigin !== origin.origin) return false;
    if (origin.origin === configured.origin) return true;
    const destination = new URL(requestUrl);
    return (
      development &&
      loopback.has(origin.hostname) &&
      loopback.has(destination.hostname) &&
      loopback.has(configured.hostname) &&
      origin.protocol === destination.protocol &&
      origin.port === destination.port
    );
  } catch {
    return false;
  }
}
