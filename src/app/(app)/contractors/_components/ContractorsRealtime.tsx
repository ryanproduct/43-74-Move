"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Sub = {
  /** Postgres table name. */
  table: string;
  /** Optional row-level filter, e.g. `id=eq.<contractor-id>` or `parent_id=eq.<contractor-id>`. */
  filter?: string;
};

type Props = {
  /** One or more table subscriptions to refresh the current route on. */
  subscriptions: Sub[];
};

/**
 * Subscribes to one or more `postgres_changes` streams and calls
 * `router.refresh()` whenever a row changes. Mirrors the task-side
 * `TasksRealtime` but lives under the contractors route so it can be
 * iterated on independently.
 */
export function ContractorsRealtime({ subscriptions }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(
      `realtime:contractors:${subscriptions
        .map((s) => `${s.table}${s.filter ?? ""}`)
        .join(",")}`
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

      // The supabase-js types for `.on("postgres_changes", …)` are noisy; the
      // runtime accepts this exact shape.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channel.on("postgres_changes" as any, cfg, () => {
        router.refresh();
      });
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // We intentionally re-subscribe whenever the subscription set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(subscriptions)]);

  return null;
}
