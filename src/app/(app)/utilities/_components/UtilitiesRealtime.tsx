"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Sub = {
  table: string;
  filter?: string;
};

type Props = {
  subscriptions: Sub[];
};

/**
 * Subscribe to one or more postgres_changes streams; refresh the current
 * route on any change. Mirrors `TasksRealtime` but stays local to the
 * utilities feature so the two are independent.
 */
export function UtilitiesRealtime({ subscriptions }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(
      `utilities-realtime:${subscriptions.map((s) => `${s.table}${s.filter ?? ""}`).join(",")}`
    );

    for (const sub of subscriptions) {
      const cfg: {
        event: "*";
        schema: "public";
        table: string;
        filter?: string;
      } = {
        event: "*",
        schema: "public",
        table: sub.table,
      };
      if (sub.filter) cfg.filter = sub.filter;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channel.on("postgres_changes" as any, cfg, () => {
        router.refresh();
      });
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(subscriptions)]);

  return null;
}
