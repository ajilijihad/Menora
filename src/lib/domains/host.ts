const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

export const developmentPlatformHost = "local.menor.test";

const hostnamePattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function requestHost(header: string | null | undefined): string {
  const value = header?.trim().toLowerCase() ?? "";
  if (!value) {
    return "";
  }

  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end > 1 ? value.slice(1, end) : "";
  }

  return value.replace(/:\d+$/, "");
}

export function normalizeHostname(value: string): string | null {
  const host = value.trim().toLowerCase().replace(/\.$/, "");
  if (host.length < 4 || host.length > 253 || !hostnamePattern.test(host)) {
    return null;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return null;
  }

  if (localHosts.has(host) || host.endsWith(".local") || host.endsWith(".localhost")) {
    return null;
  }

  return host;
}

/**
 * Customer domains are looked up only when the request host is neither this
 * deployment nor a local or Vercel host. Preview URLs keep serving the app.
 */
export function shouldResolveCustomHost(host: string, appHost: string): boolean {
  const normalized = normalizeHostname(host);
  const platform = appHost.trim().toLowerCase();
  if (!normalized || !platform) {
    return false;
  }

  if (normalized === platform || normalized.endsWith(".vercel.app")) {
    return false;
  }

  return true;
}

export function registrablePlatformHost(hostname: string): string | null {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  const local = localHosts.has(host) || /^[0-9.]+$/.test(host) || host.endsWith(".local") || host.endsWith(".localhost");
  if (local) {
    return developmentPlatformHost;
  }

  if (host.length > 253 || !hostnamePattern.test(host)) {
    return null;
  }

  return host;
}

export function verificationName(hostname: string): string {
  return `_menor-verify.${hostname}`;
}
