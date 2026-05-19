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

export default async function SettingsPage() {
  const session = await getCurrentProfile();
  const displayName =
    session?.profile?.display_name ?? session?.email?.split("@")[0] ?? "";
  const avatarColor = pickAvatarColor(session?.profile?.avatar_color);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Personalise how you appear in Move HQ. More preferences arrive with the daily-email
          rollout in Prompt 7.
        </p>
      </header>
      <SettingsForm initialDisplayName={displayName} initialAvatarColor={avatarColor} />
    </div>
  );
}
