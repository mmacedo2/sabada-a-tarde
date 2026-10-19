export type Env = {
  DB: D1Database;
  MEDIA: R2Bucket;
  /** "false" only for plain-http local development. */
  COOKIE_SECURE: string;
  /** OpenID Connect sign-in (see RUNBOOK.md). Off while issuer, client id and secret are unset. */
  OIDC_ISSUER?: string;
  OIDC_CLIENT_ID?: string;
  OIDC_CLIENT_SECRET?: string;
  /** Shown on the button: "Entrar com <name>". */
  OIDC_PROVIDER_NAME?: string;
};

/** user: reads the site. manager: also edits games. admin: everything. */
export type Role = "admin" | "manager" | "user";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: SessionUser | null;
    sessionId: string | null;
  };
};
