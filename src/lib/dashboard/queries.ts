import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ProfileLite,
  Property,
  TaskPriority,
  TaskStatus,
} from "@/lib/tasks/types";
import type { UtilityStatus, UtilityType } from "@/lib/utilities/types";
import type { ProjectStatus } from "@/lib/projects/types";

/**
 * Server-only data layer for the dashboard at `/`. Each widget owns a small
 * query function; the page calls them in parallel with `Promise.all`.
 *
 * Dates are filtered against the **Europe/London** calendar day. The move
 * window (29 May 2026 → 2 Aug 2026) falls entirely inside British Summer Time
 * (UTC+1), so we can shortcut DST and compute Europe/London "today" by adding
 * one hour to UTC before reading the date portion. This is intentionally a
 * narrow optimisation; if the window were to drift into GMT, swap this for
 * `date-fns-tz` (not currently a dependency).
 */

/** YYYY-MM-DD for "today" in Europe/London (BST-only window). */
export function londonToday(now: Date = new Date()): string {
  // Shift to UTC+1 (BST) then strip time.
  const shifted = new Date(now.getTime() + 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/** Add N days to a YYYY-MM-DD string and return YYYY-MM-DD. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ---------------------- Task widget types ---------------------- */

export type DashboardTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  property: Property;
  due_date: string | null;
  blocked_reason: string | null;
  owner: ProfileLite | null;
};

const TASK_SELECT = `
  id, title, status, priority, property, due_date, blocked_reason,
  owner:profiles!tasks_owner_id_fkey(id, display_name, avatar_color)
`;

/** Tasks with due_date = today (Europe/London). Excludes done. */
export async function getTodayTasks(today = londonToday()): Promise<DashboardTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("due_date", today)
    .neq("status", "done")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getTodayTasks error", error);
    return [];
  }
  return (data ?? []) as unknown as DashboardTask[];
}

/** Tasks with due_date in [today+1, today+7]. Excludes done. */
export async function getWeekTasks(today = londonToday()): Promise<DashboardTask[]> {
  const supabase = await createClient();
  const start = addDaysISO(today, 1);
  const end = addDaysISO(today, 7);

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .gte("due_date", start)
    .lte("due_date", end)
    .neq("status", "done")
    .order("due_date", { ascending: true })
    .order("priority", { ascending: false });

  if (error) {
    console.error("getWeekTasks error", error);
    return [];
  }
  return (data ?? []) as unknown as DashboardTask[];
}

/** Tasks where status = blocked. blocked_reason is the inline meta. */
export async function getBlockedTasks(): Promise<DashboardTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("status", "blocked")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getBlockedTasks error", error);
    return [];
  }
  return (data ?? []) as unknown as DashboardTask[];
}

/* ---------------------- Activity ---------------------- */

export type DashboardActivity = {
  id: string;
  verb: string;
  summary: string;
  parent_type: string;
  parent_id: string;
  created_at: string;
  actor: ProfileLite | null;
};

/** Last N activity rows, newest first. Default 10. */
export async function getRecentActivity(limit = 10): Promise<DashboardActivity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(
      `id, verb, summary, parent_type, parent_id, created_at,
       actor:profiles!activity_actor_id_fkey(id, display_name, avatar_color)`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentActivity error", error);
    return [];
  }
  return (data ?? []) as unknown as DashboardActivity[];
}

/* ---------------------- Project progress ---------------------- */

export type DashboardProject = {
  id: string;
  name: string;
  property: Property;
  status: ProjectStatus;
  task_count_done: number;
  task_count_total: number;
};

/**
 * Active projects (status != done) with their done/total task counts. Used by
 * the "Project progress" widget on the dashboard.
 */
export async function getProjectsWithProgress(): Promise<DashboardProject[]> {
  const supabase = await createClient();

  const { data: projectRows, error } = await supabase
    .from("projects")
    .select("id, name, property, status")
    .neq("status", "done")
    .order("end_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProjectsWithProgress error", error);
    return [];
  }

  const projects = (projectRows ?? []) as Array<{
    id: string;
    name: string;
    property: Property;
    status: ProjectStatus;
  }>;
  if (projects.length === 0) return [];

  const ids = projects.map((p) => p.id);
  const { data: taskRows, error: taskErr } = await supabase
    .from("tasks")
    .select("project_id, status")
    .in("project_id", ids);
  if (taskErr) {
    console.error("getProjectsWithProgress task-count error", taskErr);
  }

  const totals = new Map<string, { done: number; total: number }>();
  for (const t of (taskRows ?? []) as Array<{
    project_id: string;
    status: string;
  }>) {
    if (!t.project_id) continue;
    const acc = totals.get(t.project_id) ?? { done: 0, total: 0 };
    acc.total += 1;
    if (t.status === "done") acc.done += 1;
    totals.set(t.project_id, acc);
  }

  return projects.map((p) => {
    const counts = totals.get(p.id) ?? { done: 0, total: 0 };
    return {
      ...p,
      task_count_done: counts.done,
      task_count_total: counts.total,
    };
  });
}

/* ---------------------- Utility heatmap ---------------------- */

export type DashboardUtility = {
  id: string;
  name: string;
  type: UtilityType;
  status: UtilityStatus;
};

/** All utilities, ordered by status (open work first), then name. */
export async function getUtilitiesForHeatmap(): Promise<DashboardUtility[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utilities")
    .select("id, name, type, status")
    .order("name", { ascending: true });

  if (error) {
    console.error("getUtilitiesForHeatmap error", error);
    return [];
  }
  const rows = (data ?? []) as DashboardUtility[];
  const statusRank: Record<UtilityStatus, number> = {
    in_progress: 0,
    not_started: 1,
    done: 2,
  };
  return rows.sort((a, b) => {
    const sa = statusRank[a.status] ?? 9;
    const sb = statusRank[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.name.localeCompare(b.name);
  });
}
