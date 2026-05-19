/**
 * Avatar palette. Mirrors the CSS variables defined in globals.css
 * (`--color-coral-500`, etc.). Keep this in sync if you add a new token.
 */
export const AVATAR_PALETTE: Record<string, string> = {
  "coral-500": "#ff6b6b",
  "sky-500": "#0ea5e9",
  "emerald-500": "#10b981",
  "amber-500": "#f59e0b",
  "violet-500": "#8b5cf6",
  "rose-500": "#f43f5e",
};

export function avatarHex(token: string | null | undefined): string {
  if (!token) return AVATAR_PALETTE["sky-500"];
  return AVATAR_PALETTE[token] ?? AVATAR_PALETTE["sky-500"];
}
