"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to `postgres_changes` across the four tables the dashboard reads
 * from. Any row change calls `router.refresh()`, which re-runs the server
 * component tree (and therefore the queries). Mounted once at the top of the
 * dashboard page.
 *
 * Functionally similar to `TasksRealtime` / `ProjectsRealtime`, but co-located
 * with the dashboard so we don't have to touch shared components.
 */
const TABLES = ["tasks", "activity", "projects", "utilities"] as const;

export function DashboardRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("realtime-dashboard");

    for (const table of TABLES) {
      // The supabase-js types for `.on("postgres_changes", …)` are noisy; the
      // runtime accepts this exact shape.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channel.on("postgres_changes" as any, {
        event: "*",
        schema: "public",
        table,
      }, () => {
        router.refresh();
      });
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
