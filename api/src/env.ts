export type Env = {
  DB: D1Database;
  MEDIA: R2Bucket;
  /** "false" only for plain-http local development. */
  COOKIE_SECURE: string;
};

export type Role = "admin" | "user";

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
