"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { InventoryDecision } from "@/lib/inventory/types";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function nonEmpty(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Create a new inventory item. `room` and `item` are required. */
export async function createInventoryItem(args: {
  room: string;
  item: string;
}): Promise<ActionResult<{ id: string }>> {
  const room = nonEmpty(args.room);
  const item = nonEmpty(args.item);
  if (!room) return { ok: false, error: "Room is required." };
  if (!item) return { ok: false, error: "Item name is required." };

  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("inventory")
    .insert({
      room,
      item,
      decision: "undecided",
      priority_unpack: false,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create inventory item.",
    };
  }

  revalidatePath("/inventory");
  return { ok: true, data: { id: data.id } };
}

/** Update the free-text `item` field. */
export async function updateInventoryItem(
  id: string,
  item: string
): Promise<ActionResult> {
  const trimmed = nonEmpty(item);
  if (!trimmed) return { ok: false, error: "Item name cannot be empty." };

  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("inventory")
    .update({ item: trimmed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/inventory");
  return { ok: true };
}

export async function setInventoryDecision(
  id: string,
  decision: InventoryDecision
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("inventory")
    .update({ decision })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/inventory");
  return { ok: true };
}

export async function setInventoryPriorityUnpack(
  id: string,
  priorityUnpack: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("inventory")
    .update({ priority_unpack: priorityUnpack })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/inventory");
  return { ok: true };
}

/**
 * Persist the storage path of a freshly uploaded photo. The actual upload is
 * done client-side by the browser supabase client (see `InventoryPhotoCell`).
 */
export async function setInventoryPhoto(
  id: string,
  storagePath: string
): Promise<ActionResult> {
  const trimmed = nonEmpty(storagePath);
  if (!trimmed) return { ok: false, error: "Storage path is required." };

  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("inventory")
    .update({ photo_path: trimmed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/inventory");
  return { ok: true };
}

export async function setInventoryNotes(
  id: string,
  notes: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const value = nonEmpty(notes);

  const { error } = await supabase
    .from("inventory")
    .update({ notes: value })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/inventory");
  return { ok: true };
}

export async function deleteInventoryItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  // Best-effort: clean up the photo object in storage too. We re-read the
  // row first so we know what to delete; failure here is non-fatal.
  const { data: row } = await supabase
    .from("inventory")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();

  if (row?.photo_path) {
    const { error: storageError } = await supabase.storage
      .from("attachments")
      .remove([row.photo_path]);
    if (storageError) {
      console.warn("deleteInventoryItem storage remove failed", storageError);
    }
  }

  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/inventory");
  return { ok: true };
}
