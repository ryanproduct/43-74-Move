/**
 * Shared types for the Tasks feature. Mirrors the enums in
 * `supabase/migrations/0001_initial.sql` so the client doesn't have to know
 * about Postgres-specific representations.
 */

export type Property = "hogarth" | "addison" | "both";

export type TaskCategory =
  | "packing"
  | "cleaning"
  | "utilities"
  | "renovation"
  | "admin"
  | "kids"
  | "shopping"
  | "other";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "med" | "high";

export type ParentType = "task" | "contractor" | "project" | "inventory" | "utility";

export type ProfileLite = {
  id: string;
  display_name: string;
  avatar_color: string;
};

/** A task row as fetched for list/detail views (with the owner profile joined). */
export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  property: Property;
  category: TaskCategory;
  owner_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  blocked_reason: string | null;
  project_id: string | null;
  utility_id: string | null;
  contractor_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  owner: ProfileLite | null;
};

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
export const TASK_PRIORITIES: TaskPriority[] = ["low", "med", "high"];
export const TASK_CATEGORIES: TaskCategory[] = [
  "packing",
  "cleaning",
  "utilities",
  "renovation",
  "admin",
  "kids",
  "shopping",
  "other",
];
export const PROPERTIES: Property[] = ["hogarth", "addison", "both"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "High",
  med: "Medium",
  low: "Low",
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  packing: "Packing",
  cleaning: "Cleaning",
  utilities: "Utilities",
  renovation: "Renovation",
  admin: "Admin",
  kids: "Kids",
  shopping: "Shopping",
  other: "Other",
};

export const PROPERTY_LABELS: Record<Property, string> = {
  hogarth: "Hogarth",
  addison: "Addison",
  both: "Both",
};
