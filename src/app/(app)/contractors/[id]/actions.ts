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

/**
 * Post a comment against a contractor. Mirrors the task-side variant but
 * pins `parent_type` to "contractor" so the DB trigger writes the right
 * activity row.
 */
export async function addComment(
  contractorId: string,
  body: string
): Promise<ActionResult> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Comment cannot be empty." };

  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("comments").insert({
    parent_type: "contractor",
    parent_id: contractorId,
    body: trimmed,
    created_by: userId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/contractors/${contractorId}`);
  return { ok: true };
}

export async function recordAttachment(args: {
  contractorId: string;
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
      parent_type: "contractor",
      parent_id: args.contractorId,
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

  revalidatePath(`/contractors/${args.contractorId}`);
  return { ok: true, data: { id: data.id } };
}

export async function deleteAttachment(
  attachmentId: string,
  contractorId: string,
  storagePath: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { error: storageError } = await supabase.storage
    .from("attachments")
    .remove([storagePath]);
  if (storageError) {
    console.warn("deleteAttachment storage remove failed", storageError);
  }

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/contractors/${contractorId}`);
  return { ok: true };
}
