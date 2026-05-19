import { NextResponse, type NextRequest } from "next/server";

import {
  loadDailySummaryData,
  loadRecipients,
  renderDailySummary,
  sendSummaryToRecipients,
} from "@/lib/email/dailySummary";
import { createServiceClient } from "@/lib/supabase/service";

// This handler runs at 06:00 UTC every day (= 07:00 BST). The May–August
// move window is entirely within BST so no DST handling is needed for v1.
// Cron config lives in /vercel.json.
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  // Vercel cron sometimes sends the raw secret without the Bearer prefix.
  if (header === secret) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "service client init failed";
    return NextResponse.json({ sent: 0, skipped: 0, errors: [message] }, { status: 500 });
  }

  const [data, recipients] = await Promise.all([
    loadDailySummaryData(supabase),
    loadRecipients(supabase),
  ]);

  const content = renderDailySummary(data);
  const result = await sendSummaryToRecipients(recipients, content);

  return NextResponse.json(result, { status: 200 });
}
