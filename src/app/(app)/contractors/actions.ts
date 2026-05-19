"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { ContractorVerdict } from "@/lib/contractors/types";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Normalises empty form values to null so Postgres accepts them. */
function nullable(value: FormDataEntryValue | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Parses a GBP amount entered by the user (as a free-form string like
 * "9,450" or "9450.00" or "£9450") into integer pence, or null if blank.
 * Returns undefined on truly malformed input so callers can flag an error.
 */
function parsePoundsToPence(
  value: FormDataEntryValue | null | undefined
): number | null | undefined {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (raw.length === 0) return null;
  const cleaned = raw.replace(/[£,\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createContractor(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const name = nullable(formData.get("name"));
  if (!name) return { ok: false, error: "Name is required." };

  const trade = nullable(formData.get("trade"));
  if (!trade) return { ok: false, error: "Trade is required." };

  const quotePence = parsePoundsToPence(formData.get("quote_amount"));
  if (quotePence === undefined) {
    return { ok: false, error: "Quote amount must be a number." };
  }

  const payload = {
    name,
    trade,
    project_id: nullable(formData.get("project_id")),
    contact_name: nullable(formData.get("contact_name")),
    phone: nullable(formData.get("phone")),
    email: nullable(formData.get("email")),
    website: nullable(formData.get("website")),
    quote_amount_pence: quotePence,
    quote_includes: nullable(formData.get("quote_includes")),
    quote_excludes: nullable(formData.get("quote_excludes")),
    timeline: nullable(formData.get("timeline")),
    references_notes: nullable(formData.get("references_notes")),
    verdict:
      (formData.get("verdict") as ContractorVerdict) || "considering",
    verdict_notes: nullable(formData.get("verdict_notes")),
    notes: nullable(formData.get("notes")),
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("contractors")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create contractor.",
    };
  }

  revalidatePath("/contractors");
  return { ok: true, data: { id: data.id } };
}

export async function updateContractor(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const name = nullable(formData.get("name"));
  if (!name) return { ok: false, error: "Name is required." };

  const trade = nullable(formData.get("trade"));
  if (!trade) return { ok: false, error: "Trade is required." };

  const quotePence = parsePoundsToPence(formData.get("quote_amount"));
  if (quotePence === undefined) {
    return { ok: false, error: "Quote amount must be a number." };
  }

  const payload = {
    name,
    trade,
    project_id: nullable(formData.get("project_id")),
    contact_name: nullable(formData.get("contact_name")),
    phone: nullable(formData.get("phone")),
    email: nullable(formData.get("email")),
    website: nullable(formData.get("website")),
    quote_amount_pence: quotePence,
    quote_includes: nullable(formData.get("quote_includes")),
    quote_excludes: nullable(formData.get("quote_excludes")),
    timeline: nullable(formData.get("timeline")),
    references_notes: nullable(formData.get("references_notes")),
    verdict:
      (formData.get("verdict") as ContractorVerdict) || "considering",
    verdict_notes: nullable(formData.get("verdict_notes")),
    notes: nullable(formData.get("notes")),
  };

  const { error } = await supabase
    .from("contractors")
    .update(payload)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/contractors");
  revalidatePath(`/contractors/${id}`);
  return { ok: true };
}

export async function setContractorVerdict(
  id: string,
  verdict: ContractorVerdict
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("contractors")
    .update({ verdict })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/contractors");
  revalidatePath(`/contractors/${id}`);
  return { ok: true };
}

export async function setContractorQuote(
  id: string,
  quoteAmountPence: number | null,
  quoteIncludes: string | null,
  quoteExcludes: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("contractors")
    .update({
      quote_amount_pence: quoteAmountPence,
      quote_includes: quoteIncludes,
      quote_excludes: quoteExcludes,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/contractors");
  revalidatePath(`/contractors/${id}`);
  return { ok: true };
}

export async function setContractorNotes(
  id: string,
  notes: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const value = notes.trim().length > 0 ? notes : null;

  const { error } = await supabase
    .from("contractors")
    .update({ notes: value })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/contractors/${id}`);
  return { ok: true };
}

export async function deleteContractor(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("contractors").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/contractors");
  redirect("/contractors");
}
