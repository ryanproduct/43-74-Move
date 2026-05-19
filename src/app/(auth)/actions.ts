"use server";

import { redirect } from "next/navigation";

import { isAllowedEmail } from "@/lib/auth/allowlist";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  status: "idle" | "sent" | "error";
  message?: string;
  email?: string;
};

const REJECTED_MESSAGE =
  "Sorry, this app is only available to two people. Check the email address and try again.";

/**
 * Magic-link sign-in. The allowlist check happens before we ever touch
 * Supabase Auth so unknown addresses never trigger an OTP email.
 */
export async function requestMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";

  if (!email) {
    return { status: "error", message: "Please enter an email address." };
  }

  if (!isAllowedEmail(email)) {
    return { status: "error", message: REJECTED_MESSAGE, email };
  }

  const supabase = await createClient();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return {
      status: "error",
      message: "We couldn't send the magic link. Please try again in a moment.",
      email,
    };
  }

  return { status: "sent", email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
