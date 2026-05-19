/**
 * Shared types for the Projects feature. Mirrors the enums in
 * `supabase/migrations/0001_initial.sql`.
 */

import type { Property, ProfileLite } from "@/lib/tasks/types";

export type ProjectStatus =
  | "planning"
  | "quoting"
  | "scheduled"
  | "in_progress"
  | "done";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "quoting",
  "scheduled",
  "in_progress",
  "done",
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  quoting: "Quoting",
  scheduled: "Scheduled",
  in_progress: "In progress",
  done: "Done",
};

/** Order in which projects are grouped on the list view. */
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "planning",
  "quoting",
  "scheduled",
  "in_progress",
  "done",
];

/**
 * A single decision recorded against a project. Stored as a jsonb object in
 * the `decisions` array on `projects`. Append-only.
 */
export type ProjectDecision = {
  /** ISO timestamp set server-side from `now()`. */
  decided_at: string;
  /** Profile UUID of the user who recorded it. */
  decided_by: string;
  topic: string;
  choice: string;
  notes?: string | null;
};

/** A project row as fetched for list/detail views. */
export type ProjectRow = {
  id: string;
  name: string;
  property: Property;
  status: ProjectStatus;
  budget_pence: number | null;
  start_date: string | null;
  end_date: string | null;
  chosen_contractor_id: string | null;
  description: string | null;
  decisions: ProjectDecision[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

/** Project + denormalised joins for list / detail rendering. */
export type ProjectWithRelations = ProjectRow & {
  chosen_contractor: { id: string; name: string } | null;
  task_count_done: number;
  task_count_total: number;
};

/** Minimal contractor info shown inside the project workspace. */
export type ContractorForProject = {
  id: string;
  name: string;
  trade: string;
  verdict: "considering" | "shortlist" | "chosen" | "rejected";
};

/** Re-exported so call-sites can do `import { ProfileLite } from "@/lib/projects/types"` if they like. */
export type { ProfileLite };
