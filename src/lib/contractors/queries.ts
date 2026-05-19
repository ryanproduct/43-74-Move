import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ContractorRow, ProjectLite } from "./types";

const CONTRACTOR_SELECT = `
  id, name, trade, project_id, contact_name, phone, email, website,
  quote_amount_pence, quote_includes, quote_excludes, timeline,
  references_notes, verdict, verdict_notes, notes,
  created_at, updated_at, created_by,
  project:projects!contractors_project_id_fkey(id, name)
`;

/**
 * Load all contractors for the list view. Sorted by trade asc, then name asc
 * so the trade-grouped view comes out in a sensible reading order. The
 * project-grouped view re-buckets in the component.
 */
export async function listContractors(): Promise<ContractorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contractors")
    .select(CONTRACTOR_SELECT)
    .order("trade", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("listContractors error", error);
    return [];
  }
  return (data ?? []) as unknown as ContractorRow[];
}

export async function getContractor(id: string): Promise<ContractorRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contractors")
    .select(CONTRACTOR_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getContractor error", error);
    return null;
  }
  return (data as unknown as ContractorRow | null) ?? null;
}

export async function listContractorsByProject(
  projectId: string
): Promise<ContractorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contractors")
    .select(CONTRACTOR_SELECT)
    .eq("project_id", projectId)
    .order("verdict", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("listContractorsByProject error", error);
    return [];
  }
  return (data ?? []) as unknown as ContractorRow[];
}

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

/**
 * Generate a signed URL valid for the given duration (default 1 hour).
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
