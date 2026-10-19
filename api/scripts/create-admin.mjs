// Creates an admin, or resets an existing user's password and makes them admin.
//
//   npm run admin:create -- --email you@example.com --name "Your Name"           # local D1
//   npm run admin:create -- --email you@example.com --name "Your Name" --remote  # Cloudflare D1
//
// The password is prompted for (not echoed) so it never lands in shell history.
// The hash format must match src/lib/password.ts.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const ITERATIONS = 100_000;

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    remote: { type: "boolean", default: false },
  },
});

const email = values.email?.trim().toLowerCase();
const name = values.name?.trim();
if (!email || !/^[^\s@'"]+@[^\s@'"]+\.[^\s@'"]+$/.test(email) || !name || name.length > 120) {
  console.error(
    'Usage: npm run admin:create -- --email you@example.com --name "Your Name" [--remote]',
  );
  process.exit(1);
}

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("Run this in an interactive terminal so the password can be typed."));
      return;
    }
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    let input = "";
    // A paste arrives as one chunk, so walk it character by character.
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(input);
          return;
        }
        if (char === "\u0003") process.exit(130);
        input = char === "\u007f" ? input.slice(0, -1) : input + char;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    256,
  );
  const b64 = (bytes) => Buffer.from(bytes).toString("base64");
  return `pbkdf2_sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

const password = await promptHidden("Password (min. 10 characters): ");
if (password.length < 10 || password.length > 200) {
  console.error("The password must be between 10 and 200 characters.");
  process.exit(1);
}
if ((await promptHidden("Repeat password: ")) !== password) {
  console.error("Passwords do not match.");
  process.exit(1);
}

const sql = (value) => `'${value.replace(/'/g, "''")}'`;
const statement = `INSERT INTO users (email, name, password_hash, role, active)
VALUES (${sql(email)}, ${sql(name)}, ${sql(await hashPassword(password))}, 'admin', 1)
ON CONFLICT (email) DO UPDATE SET
  name = excluded.name, password_hash = excluded.password_hash, role = 'admin', active = 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');`;

// Through a private temp file so the hash is not exposed in the process list.
const dir = mkdtempSync(join(tmpdir(), "sat-admin-"));
const file = join(dir, "admin.sql");
try {
  writeFileSync(file, statement, { mode: 0o600 });
  const result = spawnSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "DB",
      "-c",
      "wrangler.jsonc",
      values.remote ? "--remote" : "--local",
      "--file",
      file,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`Admin ${email} is ready (${values.remote ? "remote" : "local"} database).`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
