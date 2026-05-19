import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { UtilityRow } from "./types";

const UTILITY_SELECT = `
  id, name, type, account_number, hogarth_action, addison_action,
  switch_date, status, contact_phone, contact_url, notes,
  created_at, updated_at, created_by
`;

/**
 * Load utilities for the table view. Default sort: status (not_started →
 * in_progress → done), then switch_date asc nulls last, then name.
 */
export async function listUtilities(): Promise<UtilityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utilities")
    .select(UTILITY_SELECT)
    .order("name", { ascending: true });

  if (error) {
    console.error("listUtilities error", error);
    return [];
  }

  const rows = (data ?? []) as unknown as UtilityRow[];

  // Stable sort: status rank first (open work above done), then switch_date.
  const statusRank: Record<string, number> = {
    in_progress: 0,
    not_started: 1,
    done: 2,
  };
  return rows.sort((a, b) => {
    const sa = statusRank[a.status] ?? 9;
    const sb = statusRank[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    const da = a.switch_date ?? "9999-12-31";
    const db = b.switch_date ?? "9999-12-31";
    if (da !== db) return da < db ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getUtility(id: string): Promise<UtilityRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utilities")
    .select(UTILITY_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getUtility error", error);
    return null;
  }
  return (data as unknown as UtilityRow | null) ?? null;
}
