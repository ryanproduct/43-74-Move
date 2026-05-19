"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to `postgres_changes` on `public.inventory` and triggers a
 * `router.refresh()` whenever any row changes. Mounted once on the list page.
 */
export function InventoryRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("realtime:inventory");

    channel.on(
      // The supabase-js types for `.on("postgres_changes", …)` are noisy; the
      // runtime accepts this exact shape.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "inventory" },
      () => {
        router.refresh();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
