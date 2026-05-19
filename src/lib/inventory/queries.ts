import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { InventoryRoom, InventoryRow } from "./types";

const INVENTORY_SELECT = `
  id, room, item, decision, priority_unpack, notes, photo_path,
  created_at, updated_at, created_by
`;

/**
 * Load every inventory row, then group by `room` for the list view. Rooms are
 * sorted alphabetically. Within a room, items go priority-unpack first, then
 * by most recently created.
 */
export async function listInventory(): Promise<InventoryRoom[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select(INVENTORY_SELECT)
    .order("room", { ascending: true })
    .order("priority_unpack", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listInventory error", error);
    return [];
  }

  const rows = (data ?? []) as InventoryRow[];
  const byRoom = new Map<string, InventoryRow[]>();
  for (const r of rows) {
    const list = byRoom.get(r.room) ?? [];
    list.push(r);
    byRoom.set(r.room, list);
  }

  return Array.from(byRoom.entries())
    .map(([room, items]) => ({
      room,
      items,
      doneCount: items.filter((i) => i.decision !== "undecided").length,
    }))
    .sort((a, b) => a.room.localeCompare(b.room));
}

/** Distinct room names across all inventory rows, sorted alphabetically. */
export async function listRooms(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("room")
    .order("room", { ascending: true });

  if (error) {
    console.error("listRooms error", error);
    return [];
  }

  const seen = new Set<string>();
  for (const row of (data ?? []) as { room: string }[]) {
    if (row.room) seen.add(row.room);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

/**
 * Sign a storage object in the `attachments` bucket for 1 hour. Returns null
 * when the path is missing or the signing call fails so the UI can render a
 * placeholder.
 */
export async function signedInventoryPhotoUrl(
  storagePath: string | null,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!storagePath) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) {
    if (error) console.error("signedInventoryPhotoUrl error", error);
    return null;
  }
  return data.signedUrl;
}
