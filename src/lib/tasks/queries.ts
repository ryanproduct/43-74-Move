import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { TaskRow, TaskStatus, TaskCategory, Property, ProfileLite } from "./types";

const TASK_SELECT = `
  id, title, description, property, category, owner_id, status, priority,
  due_date, blocked_reason, project_id, utility_id, completed_at,
  created_at, updated_at, created_by,
  owner:profiles!tasks_owner_id_fkey(id, display_name, avatar_color)
`;

export type TaskFilters = {
  property?: Property;
  owner?: string;
  category?: TaskCategory;
  status?: TaskStatus;
};

/**
 * Load tasks for the list view. Default sort is `due_date asc nulls last`,
 * then by priority (high → low). Postgres doesn't natively sort enums by our
 * preferred order, so we do the final priority pass in JS.
 */
export async function listTasks(filters: TaskFilters = {}): Promise<TaskRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters.property) query = query.eq("property", filters.property);
  if (filters.owner) query = query.eq("owner_id", filters.owner);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    console.error("listTasks error", error);
    return [];
  }

  const rows = (data ?? []) as unknown as TaskRow[];

  // Stable secondary sort by priority (high → low). `due_date asc nulls last`
  // already came from Postgres; we just refine ties.
  const priorityRank: Record<string, number> = { high: 0, med: 1, low: 2 };
  return rows.sort((a, b) => {
    const dueA = a.due_date ?? "9999-12-31";
    const dueB = b.due_date ?? "9999-12-31";
    if (dueA !== dueB) return dueA < dueB ? -1 : 1;
    return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
  });
}

export async function getTask(id: string): Promise<TaskRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getTask error", error);
    return null;
  }
  return (data as unknown as TaskRow | null) ?? null;
}

export async function listProfiles(): Promise<ProfileLite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_color")
    .order("display_name", { ascending: true });

  if (error) {
    console.error("listProfiles error", error);
    return [];
  }
  return (data ?? []) as ProfileLite[];
}

export type ProjectLite = { id: string; name: string };
export type UtilityLite = { id: string; name: string };

export async function listProjects(): Promise<ProjectLite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) {
    console.error("listProjects error", error);
    return [];
  }
  return (data ?? []) as ProjectLite[];
}

export async function listUtilities(): Promise<UtilityLite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utilities")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) {
    console.error("listUtilities error", error);
    return [];
  }
  return (data ?? []) as UtilityLite[];
}

export type CommentRow = {
  id: string;
  parent_type: string;
  parent_id: string;
  body: string;
  created_at: string;
  created_by: string | null;
  author: ProfileLite | null;
};

export async function listComments(
  parentType: string,
  parentId: string
): Promise<CommentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `id, parent_type, parent_id, body, created_at, created_by,
       author:profiles!comments_created_by_fkey(id, display_name, avatar_color)`
    )
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listComments error", error);
    return [];
  }
  return (data ?? []) as unknown as CommentRow[];
}

export type AttachmentRow = {
  id: string;
  parent_type: string;
  parent_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  caption: string | null;
  created_at: string;
};

export async function listAttachments(
  parentType: string,
  parentId: string
): Promise<AttachmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .select(
      "id, parent_type, parent_id, filename, storage_path, mime_type, size_bytes, caption, created_at"
    )
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAttachments error", error);
    return [];
  }
  return (data ?? []) as AttachmentRow[];
}

export type ActivityRow = {
  id: string;
  actor_id: string;
  verb: string;
  parent_type: string;
  parent_id: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: ProfileLite | null;
};

export async function listActivity(
  parentType: string,
  parentId: string,
  limit = 50
): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(
      `id, actor_id, verb, parent_type, parent_id, summary, metadata, created_at,
       actor:profiles!activity_actor_id_fkey(id, display_name, avatar_color)`
    )
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listActivity error", error);
    return [];
  }
  return (data ?? []) as unknown as ActivityRow[];
}

/**
 * Generate a signed URL valid for the given duration (default 1 hour).
 * Returns null on error so the UI can render a disabled state.
 */
export async function signedAttachmentUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) {
    if (error) console.error("signedAttachmentUrl error", error);
    return null;
  }
  return data.signedUrl;
}
