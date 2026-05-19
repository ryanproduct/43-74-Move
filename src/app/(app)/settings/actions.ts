"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import {
  AVATAR_COLORS,
  MAX_DISPLAY_NAME_LENGTH,
  type AvatarColor,
  type SettingsState,
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
