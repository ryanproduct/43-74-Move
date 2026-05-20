#!/usr/bin/env node
// scripts/configure-supabase-smtp.mjs
//
// Switch Supabase Auth from its default email service over to Postmark SMTP.
// After this runs, magic-link / invite emails ship as
//   "Ryan from Move 43-74" <ryan@productwins.co>
// instead of "Supabase Auth" <noreply@mail.app.supabase.io>.
//
// DO NOT RUN until Postmark has approved the account — while pending,
// Postmark refuses to deliver to addresses outside productwins.co and Ryan
// + Eleanor will be locked out of sign-in.
//
// Usage:
//   SUPABASE_ACCESS_TOKEN=sbp_… node scripts/configure-supabase-smtp.mjs
//
// Optional env overrides (sane defaults):
//   SMTP_SENDER_NAME       default: "Ryan from Move 43-74"
//   SMTP_ADMIN_EMAIL       default: read from .env.local POSTMARK_FROM_EMAIL
//   SMTP_USER / SMTP_PASS  default: read from .env.local POSTMARK_SERVER_TOKEN
//   SMTP_HOST / SMTP_PORT  default: smtp.postmarkapp.com / 587

import { readFileSync, existsSync } from "node:fs";

const PROJECT_REF = "ucjuwlkcpfadbzbhrzsv";
const DEFAULT_HOST = "smtp.postmarkapp.com";
const DEFAULT_PORT = 587;
const DEFAULT_SENDER_NAME = "Ryan from Move 43-74";

/** Tiny .env parser — handles `KEY=value` lines, ignores blanks + comments. */
function loadEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

const envFile = loadEnvLocal();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const postmarkToken =
  process.env.SMTP_USER ?? process.env.POSTMARK_SERVER_TOKEN ?? envFile.POSTMARK_SERVER_TOKEN;
const fromEmail =
  process.env.SMTP_ADMIN_EMAIL ?? process.env.POSTMARK_FROM_EMAIL ?? envFile.POSTMARK_FROM_EMAIL;
const senderName = process.env.SMTP_SENDER_NAME ?? DEFAULT_SENDER_NAME;
const host = process.env.SMTP_HOST ?? DEFAULT_HOST;
const port = Number(process.env.SMTP_PORT ?? DEFAULT_PORT);

if (!accessToken) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN to a Supabase PAT (https://supabase.com/dashboard/account/tokens)"
  );
  process.exit(1);
}
if (!postmarkToken) {
  console.error("No Postmark Server API Token (POSTMARK_SERVER_TOKEN in .env.local)");
  process.exit(1);
}
if (!fromEmail) {
  console.error("No From address (POSTMARK_FROM_EMAIL in .env.local)");
  process.exit(1);
}

const body = {
  // Postmark uses the Server API Token as both SMTP username and password.
  smtp_host: host,
  smtp_port: String(port),
  smtp_user: postmarkToken,
  smtp_pass: postmarkToken,
  smtp_admin_email: fromEmail,
  smtp_sender_name: senderName,
  smtp_max_frequency: 60,
};

console.log("About to apply:");
console.log(`  host          ${host}:${port}`);
console.log(`  from          ${senderName} <${fromEmail}>`);
console.log(`  user / pass   <Postmark Server API Token>`);
console.log("");

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }
);

if (!res.ok) {
  console.error(`Failed: HTTP ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

console.log("✓ Custom SMTP applied.");
console.log("");
console.log("Next: open /settings on the production site and click");
console.log('"Send sign-in link to Ryan" / "Send sign-in link to Eleanor"');
console.log("to verify the new sender shows up in Gmail.");
