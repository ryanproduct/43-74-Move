/**
 * The app is open to exactly two people. Allowlist is sourced from env so it can
 * change without a redeploy if needed, and `getAllowedEmails` handles the case
 * where the env vars aren't set yet (early local/CI).
 */
export function getAllowedEmails(): string[] {
  return [process.env.ALLOWED_EMAIL_1, process.env.ALLOWED_EMAIL_2]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((email) => email.trim().toLowerCase());
}

export function isAllowedEmail(email: string): boolean {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return false;
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(normalised);
}
