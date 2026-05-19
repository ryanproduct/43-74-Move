/**
 * Shared types for the Contractors feature. Mirrors the enums in
 * `supabase/migrations/0001_initial.sql` so the client doesn't have to know
 * about Postgres-specific representations.
 */

export type ContractorVerdict =
  | "considering"
  | "shortlist"
  | "chosen"
  | "rejected";

export const CONTRACTOR_VERDICTS: ContractorVerdict[] = [
  "considering",
  "shortlist",
  "chosen",
  "rejected",
];

export const VERDICT_LABELS: Record<ContractorVerdict, string> = {
  considering: "Considering",
  shortlist: "Shortlist",
  chosen: "Chosen",
  rejected: "Rejected",
};

export const VERDICT_HINTS: Record<ContractorVerdict, string> = {
  considering: "Still researching",
  shortlist: "Worth a callback",
  chosen: "This is the one",
  rejected: "Not going ahead",
};

export type ProjectLite = { id: string; name: string };

export type ContractorRow = {
  id: string;
  name: string;
  trade: string;
  project_id: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  quote_amount_pence: number | null;
  quote_includes: string | null;
  quote_excludes: string | null;
  timeline: string | null;
  references_notes: string | null;
  verdict: ContractorVerdict;
  verdict_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  project: ProjectLite | null;
};

/** GBP formatter for pence values. */
export function formatGBPFromPence(pence: number | null | undefined): string {
  if (pence === null || pence === undefined) return "—";
  const fmt = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return fmt.format(pence / 100);
}
