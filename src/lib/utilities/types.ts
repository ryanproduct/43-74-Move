/**
 * Shared types for the Utilities feature. Mirrors the enums in
 * `supabase/migrations/0001_initial.sql`.
 */

export type UtilityType =
  | "electricity"
  | "gas"
  | "dual_fuel"
  | "water"
  | "broadband"
  | "mobile"
  | "tv_licence"
  | "council_tax"
  | "insurance_home"
  | "insurance_contents"
  | "insurance_car"
  | "subscriptions"
  | "post_redirect"
  | "other";

export type UtilityHogarthAction =
  | "cancel"
  | "final_reading"
  | "transfer"
  | "none"
  | "na";

export type UtilityAddisonAction =
  | "setup"
  | "transfer"
  | "keep_existing"
  | "none"
  | "na";

export type UtilityStatus = "not_started" | "in_progress" | "done";

export type UtilityRow = {
  id: string;
  name: string;
  type: UtilityType;
  account_number: string | null;
  hogarth_action: UtilityHogarthAction;
  addison_action: UtilityAddisonAction;
  switch_date: string | null;
  status: UtilityStatus;
  contact_phone: string | null;
  contact_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export const UTILITY_TYPES: UtilityType[] = [
  "electricity",
  "gas",
  "dual_fuel",
  "water",
  "broadband",
  "mobile",
  "tv_licence",
  "council_tax",
  "insurance_home",
  "insurance_contents",
  "insurance_car",
  "subscriptions",
  "post_redirect",
  "other",
];

export const UTILITY_HOGARTH_ACTIONS: UtilityHogarthAction[] = [
  "cancel",
  "final_reading",
  "transfer",
  "none",
  "na",
];

export const UTILITY_ADDISON_ACTIONS: UtilityAddisonAction[] = [
  "setup",
  "transfer",
  "keep_existing",
  "none",
  "na",
];

export const UTILITY_STATUSES: UtilityStatus[] = [
  "not_started",
  "in_progress",
  "done",
];

export const UTILITY_TYPE_LABELS: Record<UtilityType, string> = {
  electricity: "Electricity",
  gas: "Gas",
  dual_fuel: "Dual fuel",
  water: "Water",
  broadband: "Broadband",
  mobile: "Mobile",
  tv_licence: "TV licence",
  council_tax: "Council tax",
  insurance_home: "Home insurance",
  insurance_contents: "Contents insurance",
  insurance_car: "Car insurance",
  subscriptions: "Subscriptions",
  post_redirect: "Post redirect",
  other: "Other",
};

export const UTILITY_HOGARTH_ACTION_LABELS: Record<UtilityHogarthAction, string> = {
  cancel: "Cancel",
  final_reading: "Final reading",
  transfer: "Transfer",
  none: "None",
  na: "N/A",
};

export const UTILITY_ADDISON_ACTION_LABELS: Record<UtilityAddisonAction, string> = {
  setup: "Set up",
  transfer: "Transfer",
  keep_existing: "Keep existing",
  none: "None",
  na: "N/A",
};

export const UTILITY_STATUS_LABELS: Record<UtilityStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};
