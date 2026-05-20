export const AVATAR_COLORS = [
  "coral-500",
  "sky-500",
  "emerald-500",
  "amber-500",
  "violet-500",
  "rose-500",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

export const MAX_DISPLAY_NAME_LENGTH = 32;

export type SettingsState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

export type EmailDailyState = {
  status: "idle" | "saved" | "error";
  message?: string;
  email_daily?: boolean;
};

export type TestEmailState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

export type InviteState = {
  status: "idle" | "sent" | "error";
  message?: string;
};
