"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type {
  UtilityAddisonAction,
  UtilityHogarthAction,
  UtilityStatus,
  UtilityType,
} from "@/lib/utilities/types";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

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

export async function createUtility(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const name = nullable(formData.get("name"));
  if (!name) return { ok: false, error: "Name is required." };

  const payload = {
    name,
    type: (formData.get("type") as UtilityType) || "other",
    account_number: nullable(formData.get("account_number")),
    hogarth_action:
      (formData.get("hogarth_action") as UtilityHogarthAction) || "none",
    addison_action:
      (formData.get("addison_action") as UtilityAddisonAction) || "none",
    switch_date: nullable(formData.get("switch_date")),
    status: (formData.get("status") as UtilityStatus) || "not_started",
    contact_phone: nullable(formData.get("contact_phone")),
    contact_url: nullable(formData.get("contact_url")),
    notes: nullable(formData.get("notes")),
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("utilities")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create utility." };
  }

  revalidatePath("/utilities");
  return { ok: true, data: { id: data.id } };
}

export async function updateUtility(
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
    type: (formData.get("type") as UtilityType) || "other",
    account_number: nullable(formData.get("account_number")),
    hogarth_action:
      (formData.get("hogarth_action") as UtilityHogarthAction) || "none",
    addison_action:
      (formData.get("addison_action") as UtilityAddisonAction) || "none",
    switch_date: nullable(formData.get("switch_date")),
    status: (formData.get("status") as UtilityStatus) || "not_started",
    contact_phone: nullable(formData.get("contact_phone")),
    contact_url: nullable(formData.get("contact_url")),
    notes: nullable(formData.get("notes")),
  };

  const { error } = await supabase.from("utilities").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/utilities");
  revalidatePath(`/utilities/${id}`);
  return { ok: true };
}

export async function setUtilityStatus(
  id: string,
  status: UtilityStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("utilities")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/utilities");
  revalidatePath(`/utilities/${id}`);
  return { ok: true };
}

export async function setUtilitySwitchDate(
  id: string,
  switchDate: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const value =
    switchDate && switchDate.trim().length > 0 ? switchDate.trim() : null;

  const { error } = await supabase
    .from("utilities")
    .update({ switch_date: value })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/utilities");
  revalidatePath(`/utilities/${id}`);
  return { ok: true };
}

export async function setUtilityNotes(
  id: string,
  notes: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const value = notes.trim().length > 0 ? notes : null;

  const { error } = await supabase
    .from("utilities")
    .update({ notes: value })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/utilities/${id}`);
  return { ok: true };
}

export async function deleteUtility(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("utilities").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/utilities");
  redirect("/utilities");
}
