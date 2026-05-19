"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type {
  Property,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from "@/lib/tasks/types";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Normalises empty form values to null so Postgres accepts them. */
function nullable(value: FormDataEntryValue | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createTask(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const title = nullable(formData.get("title"));
  if (!title) return { ok: false, error: "Title is required." };

  const payload = {
    title,
    description: nullable(formData.get("description")),
    property: (formData.get("property") as Property) || "both",
    category: (formData.get("category") as TaskCategory) || "other",
    owner_id: nullable(formData.get("owner_id")),
    status: (formData.get("status") as TaskStatus) || "todo",
    priority: (formData.get("priority") as TaskPriority) || "med",
    due_date: nullable(formData.get("due_date")),
    project_id: nullable(formData.get("project_id")),
    utility_id: nullable(formData.get("utility_id")),
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create task." };
  }

  revalidatePath("/tasks");
  return { ok: true, data: { id: data.id } };
}

export async function updateTask(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const title = nullable(formData.get("title"));
  if (!title) return { ok: false, error: "Title is required." };

  const payload = {
    title,
    description: nullable(formData.get("description")),
    property: (formData.get("property") as Property) || "both",
    category: (formData.get("category") as TaskCategory) || "other",
    owner_id: nullable(formData.get("owner_id")),
    status: (formData.get("status") as TaskStatus) || "todo",
    priority: (formData.get("priority") as TaskPriority) || "med",
    due_date: nullable(formData.get("due_date")),
    project_id: nullable(formData.get("project_id")),
    utility_id: nullable(formData.get("utility_id")),
  };

  const { error } = await supabase.from("tasks").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return { ok: true };
}

export async function setTaskDescription(
  id: string,
  description: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const value = description.trim().length > 0 ? description : null;

  const { error } = await supabase
    .from("tasks")
    .update({ description: value })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/tasks/${id}`);
  return { ok: true };
}

export async function setTaskTitle(
  id: string,
  title: string
): Promise<ActionResult> {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Title cannot be empty." };

  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("tasks")
    .update({ title: trimmed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return { ok: true };
}
