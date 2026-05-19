"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/tasks/types";
import type { ProjectStatus } from "@/lib/projects/types";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function nullable(value: FormDataEntryValue | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * GBP input → integer pence. Accepts strings like `1234.56`, `1234`, or empty
 * string (→ null). Negative values are clamped to null too.
 */
function gbpToPence(value: FormDataEntryValue | null | undefined): number | null {
  const raw = nullable(value);
  if (raw === null) return null;
  const cleaned = raw.replace(/[£,\s]/g, "");
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createProject(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const name = nullable(formData.get("name"));
  if (!name) return { ok: false, error: "Name is required." };

  const payload = {
    name,
    property: (formData.get("property") as Property) || "addison",
    status: (formData.get("status") as ProjectStatus) || "planning",
    budget_pence: gbpToPence(formData.get("budget_gbp")),
    start_date: nullable(formData.get("start_date")),
    end_date: nullable(formData.get("end_date")),
    description: nullable(formData.get("description")),
    chosen_contractor_id: nullable(formData.get("chosen_contractor_id")),
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create project." };
  }

  revalidatePath("/projects");
  return { ok: true, data: { id: data.id } };
}

export async function updateProject(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const name = nullable(formData.get("name"));
  if (!name) return { ok: false, error: "Name is required." };

  const payload = {
    name,
    property: (formData.get("property") as Property) || "addison",
    status: (formData.get("status") as ProjectStatus) || "planning",
    budget_pence: gbpToPence(formData.get("budget_gbp")),
    start_date: nullable(formData.get("start_date")),
    end_date: nullable(formData.get("end_date")),
    description: nullable(formData.get("description")),
    chosen_contractor_id: nullable(formData.get("chosen_contractor_id")),
  };

  const { error } = await supabase.from("projects").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function setProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function setProjectChosenContractor(
  id: string,
  contractorId: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("projects")
    .update({ chosen_contractor_id: contractorId })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function setProjectDescription(
  id: string,
  description: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const value = description.trim().length > 0 ? description : null;

  const { error } = await supabase
    .from("projects")
    .update({ description: value })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function setProjectBudget(
  id: string,
  budgetGbp: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  // Reuse the FormData-friendly parser via a synthetic value.
  const pence =
    budgetGbp === null || budgetGbp.trim() === ""
      ? null
      : gbpToPence(budgetGbp);

  const { error } = await supabase
    .from("projects")
    .update({ budget_pence: pence })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  redirect("/projects");
}

/**
 * Append a new decision to the project's `decisions` jsonb array. Decisions
 * are never edited — only appended. We do the append atomically with a single
 * `update` that combines the existing array with a new element built via
 * `jsonb_build_object`.
 *
 * Supabase's PostgREST does not have a first-class "append to jsonb" verb, so
 * we read-then-write inside the same action. RLS ensures only the household
 * members can do this; the small race window (two simultaneous appends) is
 * acceptable for a two-user app, and the resulting array is still valid.
 */
export async function recordDecision(
  projectId: string,
  topic: string,
  choice: string,
  notes?: string | null
): Promise<ActionResult> {
  const trimmedTopic = topic.trim();
  const trimmedChoice = choice.trim();
  if (!trimmedTopic) return { ok: false, error: "Topic is required." };
  if (!trimmedChoice) return { ok: false, error: "Choice is required." };

  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { data: existing, error: readErr } = await supabase
    .from("projects")
    .select("decisions")
    .eq("id", projectId)
    .maybeSingle();

  if (readErr || !existing) {
    return {
      ok: false,
      error: readErr?.message ?? "Project not found.",
    };
  }

  const current = Array.isArray(existing.decisions) ? existing.decisions : [];
  const entry = {
    decided_at: new Date().toISOString(),
    decided_by: userId,
    topic: trimmedTopic,
    choice: trimmedChoice,
    notes: notes && notes.trim().length > 0 ? notes.trim() : null,
  };
  const next = [...current, entry];

  const { error: writeErr } = await supabase
    .from("projects")
    .update({ decisions: next })
    .eq("id", projectId);

  if (writeErr) return { ok: false, error: writeErr.message };

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
