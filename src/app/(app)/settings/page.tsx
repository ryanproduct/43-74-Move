import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";

import { SettingsForm } from "./SettingsForm";
import { AVATAR_COLORS, type AvatarColor } from "./constants";

export const metadata = {
  title: "Settings — Move HQ",
};

function pickAvatarColor(stored: string | undefined): AvatarColor {
  if (stored && (AVATAR_COLORS as readonly string[]).includes(stored)) {
    return stored as AvatarColor;
  }
  return "sky-500";
}

async function getEmailDaily(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return true;

  const { data } = await supabase
    .from("profiles")
    .select("email_daily")
    .eq("id", user.id)
    .maybeSingle();

  const value = (data as { email_daily?: boolean } | null)?.email_daily;
  return value ?? true;
}

export default async function SettingsPage() {
  const [session, emailDaily] = await Promise.all([getCurrentProfile(), getEmailDaily()]);
  const displayName =
    session?.profile?.display_name ?? session?.email?.split("@")[0] ?? "";
  const avatarColor = pickAvatarColor(session?.profile?.avatar_color);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Personalise how you appear in Move HQ and choose whether to receive the daily 7am
          summary email.
        </p>
      </header>
      <SettingsForm
        initialDisplayName={displayName}
        initialAvatarColor={avatarColor}
        initialEmailDaily={emailDaily}
      />
    </div>
  );
}
