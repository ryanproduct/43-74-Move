/**
 * Shared types for the Inventory feature. Mirrors the `inventory` table and
 * the `inventory_decision` enum in `supabase/migrations/0001_initial.sql`.
 */

export type InventoryDecision =
  | "keep"
  | "sell"
  | "donate"
  | "bin"
  | "undecided";

export type InventoryRow = {
  id: string;
  room: string;
  item: string;
  decision: InventoryDecision;
  priority_unpack: boolean;
  notes: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export const INVENTORY_DECISIONS: InventoryDecision[] = [
  "keep",
  "sell",
  "donate",
  "bin",
  "undecided",
];

export const DECISION_LABELS: Record<InventoryDecision, string> = {
  keep: "Keep",
  sell: "Sell",
  donate: "Donate",
  bin: "Bin",
  undecided: "Undecided",
};

/**
 * Tailwind classes for the decision pill. Spec mapping:
 *   keep = sky, sell = amber, donate = emerald, bin = rose, undecided = neutral.
 */
export const DECISION_STYLES: Record<InventoryDecision, string> = {
  keep: "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200",
  sell: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
  donate:
    "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
  bin: "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200",
  undecided:
    "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
};

/** A room with its items, used by the grouped list view. */
export type InventoryRoom = {
  room: string;
  items: InventoryRow[];
  /** Number of items where decision !== 'undecided'. */
  doneCount: number;
};
