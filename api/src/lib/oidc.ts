import { z } from "zod";

import type { Env } from "../env";
import { base64Url } from "./session";

/**
 * OpenID Connect authorization code flow with PKCE, as a confidential client.
 * The identity comes from the userinfo endpoint, called with the access token
 * the token endpoint returned over TLS, so no ID token has to be verified.
 */

export type OidcConfig = { issuer: string; clientId: string; clientSecret: string; name: string };

export type OidcIdentity = {
  issuer: string;
  subject: string;
  /** Only an email the provider says it verified; null otherwise. */
  email: string | null;
  name: string | null;
};

const REQUEST_TIMEOUT_MS = 10_000;

export function oidcConfig(env: Env): OidcConfig | null {
  const settings = {
    OIDC_ISSUER: env.OIDC_ISSUER,
    OIDC_CLIENT_ID: env.OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET: env.OIDC_CLIENT_SECRET,
  };
  const missing = Object.entries(settings).filter(([, value]) => !value);
  if (missing.length === 3) return null;
  if (missing.length > 0) {
    throw new Error(`OIDC is partly configured; missing ${missing.map(([k]) => k).join(", ")}`);
  }
  return {
    issuer: settings.OIDC_ISSUER!.replace(/\/+$/, ""),
    clientId: settings.OIDC_CLIENT_ID!,
    clientSecret: settings.OIDC_CLIENT_SECRET!,
    name: env.OIDC_PROVIDER_NAME?.trim() || "OIDC",
  };
}

const httpsUrl = z.string().url().startsWith("https://");

const discoverySchema = z.object({
  issuer: z.string(),
  authorization_endpoint: httpsUrl,
  token_endpoint: httpsUrl,
  userinfo_endpoint: httpsUrl,
});

const tokenSchema = z.object({ access_token: z.string().min(1) });

const userinfoSchema = z.object({
  sub: z.string().min(1).max(255),
  email: z.string().email().max(254).optional(),
  // Some providers send the string "true".
  email_verified: z.union([z.boolean(), z.string()]).optional(),
  name: z.string().optional(),
});

async function fetchJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    headers: { accept: "application/json", ...init.headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(
      `OIDC ${new URL(url).pathname} answered ${res.status}: ${(await res.text()).slice(0, 300)}`,
    );
  }
  return res.json();
}

let discovered: { issuer: string; doc: z.infer<typeof discoverySchema> } | null = null;

async function discover(config: OidcConfig) {
  if (discovered?.issuer === config.issuer) return discovered.doc;
  const doc = discoverySchema.parse(
    await fetchJson(`${config.issuer}/.well-known/openid-configuration`),
  );
  if (doc.issuer.replace(/\/+$/, "") !== config.issuer) {
    throw new Error(`OIDC discovery issuer ${doc.issuer} does not match ${config.issuer}`);
  }
  discovered = { issuer: config.issuer, doc };
  return doc;
}

export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export async function authorizationUrl(
  config: OidcConfig,
  redirectUri: string,
  state: string,
  verifier: string,
): Promise<string> {
  const url = new URL((await discover(config)).authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
    state,
    code_challenge: await codeChallenge(verifier),
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

export async function fetchIdentity(
  config: OidcConfig,
  redirectUri: string,
  code: string,
  verifier: string,
): Promise<OidcIdentity> {
  const doc = await discover(config);
  const token = tokenSchema.parse(
    await fetchJson(doc.token_endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code_verifier: verifier,
      }),
    }),
  );
  const info = userinfoSchema.parse(
    await fetchJson(doc.userinfo_endpoint, {
      headers: { authorization: `Bearer ${token.access_token}` },
    }),
  );
  const verified = info.email_verified === true || info.email_verified === "true";
  return {
    issuer: config.issuer,
    subject: info.sub,
    email: verified && info.email ? info.email.trim().toLowerCase() : null,
    name: info.name?.trim().slice(0, 120) || null,
  };
}
