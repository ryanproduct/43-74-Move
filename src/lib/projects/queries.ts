import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { TaskRow } from "@/lib/tasks/types";
import type {
  ContractorForProject,
  ProjectRow,
  ProjectWithRelations,
} from "./types";

const PROJECT_SELECT = `
  id, name, property, status, budget_pence, start_date, end_date,
  chosen_contractor_id, description, decisions,
  created_at, updated_at, created_by,
  chosen_contractor:contractors!projects_chosen_contractor_id_fkey(id, name)
`;

const TASK_SELECT_FOR_PROJECT = `
  id, title, description, property, category, owner_id, status, priority,
  due_date, blocked_reason, project_id, utility_id, completed_at,
  created_at, updated_at, created_by,
  owner:profiles!tasks_owner_id_fkey(id, display_name, avatar_color)
`;

/**
 * List all projects with their chosen contractor (if any) and the count of
 * linked tasks (done / total). The status grouping/sort is applied by the
 * caller using `PROJECT_STATUS_ORDER`.
 */
export async function listProjects(): Promise<ProjectWithRelations[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("end_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listProjects error", error);
    return [];
  }

  const projects = (rows ?? []) as unknown as Array<
    ProjectRow & { chosen_contractor: { id: string; name: string } | null }
  >;

  if (projects.length === 0) return [];

  // Fetch task counts in a single query. We pull (project_id, status) for all
  // tasks that belong to any of these projects, then bucket in memory.
  const ids = projects.map((p) => p.id);
  const { data: taskRows, error: taskErr } = await supabase
    .from("tasks")
    .select("project_id, status")
    .in("project_id", ids);

  if (taskErr) {
    console.error("listProjects task-count error", taskErr);
  }

  const totals = new Map<string, { done: number; total: number }>();
  for (const t of (taskRows ?? []) as Array<{ project_id: string; status: string }>) {
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
      decisions: Array.isArray(p.decisions) ? p.decisions : [],
      task_count_done: counts.done,
      task_count_total: counts.total,
    };
  });
}

export async function getProject(
  id: string
): Promise<ProjectWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getProject error", error);
    return null;
  }
  if (!data) return null;

  const row = data as unknown as ProjectRow & {
    chosen_contractor: { id: string; name: string } | null;
  };

  const { data: taskRows, error: taskErr } = await supabase
    .from("tasks")
    .select("status")
    .eq("project_id", id);

  if (taskErr) {
    console.error("getProject task-count error", taskErr);
  }

  const total = taskRows?.length ?? 0;
  const done = (taskRows ?? []).filter((t) => t.status === "done").length;

  return {
    ...row,
    decisions: Array.isArray(row.decisions) ? row.decisions : [],
    task_count_done: done,
    task_count_total: total,
  };
}

/** Tasks attached to a single project. Ordered like the main task list. */
export async function listTasksForProject(projectId: string): Promise<TaskRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_FOR_PROJECT)
    .eq("project_id", projectId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listTasksForProject error", error);
    return [];
  }

  return (data ?? []) as unknown as TaskRow[];
}

/**
 * Contractors that were considered for this project. Used in the
 * "Contractors considered" section of the workspace.
 */
export async function listContractorsForProject(
  projectId: string
): Promise<ContractorForProject[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contractors")
    .select("id, name, trade, verdict")
    .eq("project_id", projectId)
    .order("verdict", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("listContractorsForProject error", error);
    return [];
  }

  return (data ?? []) as ContractorForProject[];
}

/**
 * All contractors that are eligible to be chosen for this project — i.e.
 * already linked to it via `contractors.project_id`. Used to populate the
 * "Chosen contractor" select on the project form.
 */
export async function listContractorOptionsForProject(
  projectId: string | null
): Promise<{ id: string; name: string }[]> {
  if (!projectId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contractors")
    .select("id, name")
    .eq("project_id", projectId)
    .order("name", { ascending: true });
  if (error) {
    console.error("listContractorOptionsForProject error", error);
    return [];
  }
  return (data ?? []) as { id: string; name: string }[];
}

/**
 * Resolve display names for a list of profile UUIDs. Used to render the
 * "decided_by" column of the decisions log without paying for a join on a
 * jsonb column.
 */
export async function listProfilesByIds(
  ids: string[]
): Promise<Map<string, { id: string; display_name: string; avatar_color: string }>> {
  const map = new Map<
    string,
    { id: string; display_name: string; avatar_color: string }
  >();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_color")
    .in("id", unique);

  if (error) {
    console.error("listProfilesByIds error", error);
    return map;
  }

  for (const p of (data ?? []) as Array<{
    id: string;
    display_name: string;
    avatar_color: string;
  }>) {
    map.set(p.id, p);
  }
  return map;
}
