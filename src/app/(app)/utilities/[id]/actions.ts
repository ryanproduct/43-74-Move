"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

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

export async function addUtilityComment(
  utilityId: string,
  body: string
): Promise<ActionResult> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Comment cannot be empty." };

  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("comments").insert({
    parent_type: "utility",
    parent_id: utilityId,
    body: trimmed,
    created_by: userId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/utilities/${utilityId}`);
  return { ok: true };
}

export async function recordUtilityAttachment(args: {
  utilityId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      parent_type: "utility",
      parent_id: args.utilityId,
      filename: args.filename,
      storage_path: args.storagePath,
      mime_type: args.mimeType,
      size_bytes: args.sizeBytes,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to record attachment.",
    };
  }

  revalidatePath(`/utilities/${args.utilityId}`);
  return { ok: true, data: { id: data.id } };
}

export async function deleteUtilityAttachment(
  attachmentId: string,
  utilityId: string,
  storagePath: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error: storageError } = await supabase.storage
    .from("attachments")
    .remove([storagePath]);
  if (storageError) {
    console.warn("deleteUtilityAttachment storage remove failed", storageError);
  }

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/utilities/${utilityId}`);
  return { ok: true };
}
