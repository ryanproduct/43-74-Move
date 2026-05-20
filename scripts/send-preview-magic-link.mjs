#!/usr/bin/env node
// scripts/send-preview-magic-link.mjs
//
// One-off dev tool: trigger a real magic-link email to an arbitrary
// allowlisted email so you can preview the rendered template (with the
// production Supabase email pipeline) before sending the actual invite.
//
// Usage:
//   SUPABASE_ANON_KEY=… node scripts/send-preview-magic-link.mjs <email>
//
// Notes:
//   - Uses PKCE flow so the link routes through /auth/callback exactly like
//     a real /login sign-in would.
//   - shouldCreateUser: false — never silently provisions a new auth user.
//   - Does NOT clobber any browser session; this runs in Node, no cookies.
//   - The target email must already exist as an auth user (created via
//     Authentication → Users in Supabase dashboard or via Auth Admin API).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ucjuwlkcpfadbzbhrzsv.supabase.co";
const REDIRECT_URL = "https://move.productwins.co/auth/callback";

const anonKey = process.env.SUPABASE_ANON_KEY;
const target = process.argv[2];

if (!anonKey) {
  console.error("Set SUPABASE_ANON_KEY=… in the env (see .env.local).");
  process.exit(1);
}
if (!target) {
  console.error("Usage: node scripts/send-preview-magic-link.mjs <email>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, anonKey, {
  auth: { flowType: "pkce", persistSession: false },
});

const { error } = await supabase.auth.signInWithOtp({
  email: target,
  options: {
    emailRedirectTo: REDIRECT_URL,
    shouldCreateUser: false,
  },
});

if (error) {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
}
console.log(`Sent — check ${target}`);
