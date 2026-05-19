"use server";

import { revalidatePath } from "next/cache";

import {
  loadDailySummaryData,
  renderDailySummary,
  sendSummaryToRecipients,
  type Recipient,
} from "@/lib/email/dailySummary";
import { createClient } from "@/lib/supabase/server";

import {
  AVATAR_COLORS,
  MAX_DISPLAY_NAME_LENGTH,
  type AvatarColor,
  type EmailDailyState,
  type SettingsState,
  type TestEmailState,
} from "./constants";

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const rawName = formData.get("display_name");
  const rawColor = formData.get("avatar_color");

  const displayName = typeof rawName === "string" ? rawName.trim() : "";
  const avatarColor = typeof rawColor === "string" ? rawColor : "";

  if (!displayName) {
    return { status: "error", message: "Display name can't be empty." };
  }
  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      status: "error",
      message: `Keep the display name to ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
    };
  }
  if (!AVATAR_COLORS.includes(avatarColor as AvatarColor)) {
    return { status: "error", message: "Pick one of the available avatar colours." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Your session expired. Sign in again to save changes." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, avatar_color: avatarColor })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { status: "saved", message: "Saved." };
}

/**
 * Toggle the daily-email preference for the current user. Returns the new
 * value so the client can confirm it without a refetch.
 */
export async function updateEmailDaily(
  _prev: EmailDailyState,
  formData: FormData
): Promise<EmailDailyState> {
  const raw = formData.get("email_daily");
  const emailDaily = raw === "on" || raw === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session expired. Sign in again to save changes.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ email_daily: emailDaily })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: error.message, email_daily: !emailDaily };
  }

  revalidatePath("/settings");
  return {
    status: "saved",
    message: emailDaily ? "Daily email is on." : "Daily email is off.",
    email_daily: emailDaily,
  };
}

/**
 * Send a one-off copy of the daily-summary email to the current user. Uses
 * the same render+send path as the cron route, but only targets the caller.
 *
 * The signature matches `useActionState`'s action contract: previous state +
 * form data. Neither argument is consumed for a test send, but they must be
 * declared so the action binds correctly client-side.
 */
export async function sendTestSummary(
  _prev: TestEmailState,
  formData: FormData
): Promise<TestEmailState> {
  // formData isn't read — the test send doesn't take any user input.
  void formData;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      status: "error",
      message: "Your session expired. Sign in again to send a test.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const recipient: Recipient = {
    email: user.email,
    display_name: (profile?.display_name as string | undefined) ?? user.email,
  };

  try {
    const data = await loadDailySummaryData(supabase);
    const content = renderDailySummary(data);
    const result = await sendSummaryToRecipients([recipient], content);

    if (result.sent === 1) {
      return { status: "sent", message: `Sent — check ${recipient.email}.` };
    }

    const firstError = result.errors[0] ?? "Email did not send. Check Postmark configuration.";
    return { status: "error", message: firstError };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong sending the test.";
    return { status: "error", message };
  }
}
