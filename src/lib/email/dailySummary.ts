import "server-only";

import { ServerClient } from "postmark";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared module for rendering and sending the 7am daily summary email.
 *
 * Used by:
 *   - `app/api/cron/daily-summary/route.ts` (Vercel cron)
 *   - `app/(app)/settings/actions.ts` (per-user "send me a test" button)
 *
 * The render path is pure: pass it the four data buckets and it returns
 * subject + plain-text body matching the template in PLAN.md section 11.
 * The send path wraps Postmark and isolates failures per recipient.
 */

// ---------------------------------------------------------------------------
// Key dates (Europe/London). Both fall inside BST so UTC+1 is sufficient for
// the v1 move window May–August 2026 — no DST handling required.
// ---------------------------------------------------------------------------
const KEYS_HANDOVER_UTC = Date.UTC(2026, 4, 29, 0, 0, 0); // 29 May 2026 00:00 BST
const MOVE_OUT_UTC = Date.UTC(2026, 7, 2, 0, 0, 0); // 2 Aug 2026 00:00 BST

const APP_URL_FALLBACK = "https://move.productwins.co";

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProfileLite = { id: string; display_name: string };

type TaskWithOwner = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  blocked_reason: string | null;
  owner: ProfileLite | null;
};

type ActivityRowLite = {
  id: string;
  summary: string;
  created_at: string;
};

export type Recipient = {
  email: string;
  display_name: string;
};

export type EmailContent = {
  subject: string;
  textBody: string;
};

export type DailySummaryData = {
  today_tasks: TaskWithOwner[];
  blocked_tasks: TaskWithOwner[];
  yesterday_activity: ActivityRowLite[];
  days_until_keys: number;
  days_until_moveout: number;
  rendered_for: Date;
};

export type SendResult = {
  sent: number;
  skipped: number;
  errors: string[];
};

// ---------------------------------------------------------------------------
// London-time helpers (UTC+1 in BST; the move window is fully inside BST).
// ---------------------------------------------------------------------------
function toLondonNow(now: Date = new Date()): Date {
  // BST is UTC+1. For May–August 2026 this is always true — no DST flip.
  return new Date(now.getTime() + 60 * 60 * 1000);
}

function londonStartOfDayUTC(now: Date = new Date()): number {
  // The date components of `now` shifted into BST, then anchored back to
  // the equivalent 00:00 BST moment expressed as a UTC timestamp.
  const london = toLondonNow(now);
  return Date.UTC(london.getUTCFullYear(), london.getUTCMonth(), london.getUTCDate()) - 60 * 60 * 1000;
}

function formatLondonDate(now: Date = new Date()): {
  weekday: string;
  dayMonth: string;
  isoDate: string;
} {
  const london = toLondonNow(now);
  const weekday = WEEKDAY[london.getUTCDay()];
  const day = london.getUTCDate();
  const month = MONTH_SHORT[london.getUTCMonth()];
  const year = london.getUTCFullYear();
  const isoDate = `${year}-${String(london.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { weekday, dayMonth: `${day} ${month}`, isoDate };
}

function daysBetween(fromMs: number, toMs: number): number {
  const diff = Math.ceil((toMs - fromMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function ownerLabel(owner: ProfileLite | null): string {
  if (!owner?.display_name) return "Unassigned";
  return owner.display_name;
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
const TASK_WITH_OWNER_SELECT = `
  id, title, status, due_date, blocked_reason,
  owner:profiles!tasks_owner_id_fkey(id, display_name)
`;

export async function loadDailySummaryData(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<DailySummaryData> {
  const { isoDate } = formatLondonDate(now);
  const startOfTodayUtc = londonStartOfDayUTC(now);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [todayResult, blockedResult, activityResult] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_WITH_OWNER_SELECT)
      .eq("due_date", isoDate)
      .neq("status", "done")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select(TASK_WITH_OWNER_SELECT)
      .eq("status", "blocked")
      .order("created_at", { ascending: true }),
    supabase
      .from("activity")
      .select("id, summary, created_at")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (todayResult.error) console.error("daily-summary today_tasks error", todayResult.error);
  if (blockedResult.error) console.error("daily-summary blocked_tasks error", blockedResult.error);
  if (activityResult.error) console.error("daily-summary activity error", activityResult.error);

  const today_tasks = ((todayResult.data ?? []) as unknown as TaskWithOwner[]);
  const blocked_tasks = ((blockedResult.data ?? []) as unknown as TaskWithOwner[]);
  const yesterday_activity = ((activityResult.data ?? []) as unknown as ActivityRowLite[]);

  return {
    today_tasks,
    blocked_tasks,
    yesterday_activity,
    days_until_keys: daysBetween(startOfTodayUtc, KEYS_HANDOVER_UTC),
    days_until_moveout: daysBetween(startOfTodayUtc, MOVE_OUT_UTC),
    rendered_for: now,
  };
}

export async function loadRecipients(supabase: SupabaseClient): Promise<Recipient[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email, display_name, email_daily")
    .eq("email_daily", true);

  if (error) {
    console.error("daily-summary recipients error", error);
    return [];
  }

  return ((data ?? []) as Array<{ email: string; display_name: string }>).map((row) => ({
    email: row.email,
    display_name: row.display_name,
  }));
}

// ---------------------------------------------------------------------------
// Rendering (plain text, per PLAN.md section 11)
// ---------------------------------------------------------------------------
export function renderDailySummary(data: DailySummaryData): EmailContent {
  const { weekday, dayMonth } = formatLondonDate(data.rendered_for);
  const appUrl = process.env.APP_URL || APP_URL_FALLBACK;

  const subject = `Move HQ — ${weekday} ${dayMonth}`;

  const lines: string[] = [];
  lines.push("Good morning Ryan & Eleanor,");
  lines.push("");
  lines.push(
    `⏳ ${data.days_until_keys} days until keys handover, ${data.days_until_moveout} days until move-out.`
  );
  lines.push("");

  lines.push(`📌 Today (${data.today_tasks.length})`);
  if (data.today_tasks.length === 0) {
    lines.push("  • Nothing due today.");
  } else {
    for (const task of data.today_tasks) {
      lines.push(`  • [${ownerLabel(task.owner)}] ${task.title}`);
    }
  }
  lines.push("");

  lines.push(`⚠️ Blocked (${data.blocked_tasks.length})`);
  if (data.blocked_tasks.length === 0) {
    lines.push("  • Nothing blocked.");
  } else {
    for (const task of data.blocked_tasks) {
      const reason = task.blocked_reason?.trim();
      const suffix = reason ? ` — ${reason}` : "";
      lines.push(`  • [${ownerLabel(task.owner)}] ${task.title}${suffix}`);
    }
  }
  lines.push("");

  lines.push("🆕 Since yesterday");
  if (data.yesterday_activity.length === 0) {
    lines.push("  • No changes in the last 24 hours.");
  } else {
    for (const row of data.yesterday_activity) {
      lines.push(`  • ${row.summary}`);
    }
  }
  lines.push("");

  lines.push(`→ Open Move HQ: ${appUrl}`);

  return { subject, textBody: lines.join("\n") };
}

// ---------------------------------------------------------------------------
// Sending via Postmark
// ---------------------------------------------------------------------------
function getPostmarkClient(): ServerClient {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    throw new Error("POSTMARK_SERVER_TOKEN is not set");
  }
  return new ServerClient(token);
}

export async function sendSummaryToRecipients(
  recipients: Recipient[],
  content: EmailContent
): Promise<SendResult> {
  const from = process.env.POSTMARK_FROM_EMAIL;
  if (!from) {
    return {
      sent: 0,
      skipped: recipients.length,
      errors: ["POSTMARK_FROM_EMAIL is not set"],
    };
  }

  if (recipients.length === 0) {
    return { sent: 0, skipped: 0, errors: [] };
  }

  const client = getPostmarkClient();
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    if (!recipient.email) {
      skipped += 1;
      continue;
    }
    try {
      await client.sendEmail({
        From: from,
        To: recipient.email,
        Subject: content.subject,
        TextBody: content.textBody,
        MessageStream: "outbound",
      });
      sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${recipient.email}: ${message}`);
      console.error(`daily-summary send failed for ${recipient.email}`, err);
    }
  }

  return { sent, skipped, errors };
}

/**
 * One-shot helper: load the data, render the email, and send to the supplied
 * recipients. Used by the test-send button so we don't query the recipient
 * list (we always target the current user). The cron route does the same
 * three steps inline so it can return the count separately.
 */
export async function renderAndSendForRecipients(
  supabase: SupabaseClient,
  recipients: Recipient[],
  now: Date = new Date()
): Promise<SendResult> {
  const data = await loadDailySummaryData(supabase, now);
  const content = renderDailySummary(data);
  return sendSummaryToRecipients(recipients, content);
}
