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
