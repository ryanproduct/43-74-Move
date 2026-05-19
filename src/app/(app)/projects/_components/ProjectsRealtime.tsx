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
 * Mount this in a server component to subscribe to one or more
 * `postgres_changes` streams. When any row changes, it calls
 * `router.refresh()` so the server tree re-renders.
 *
 * Used by /projects (list of projects) and /projects/[id] (this row + its
 * comments / attachments / activity / linked tasks / contractors).
 *
 * Functionally identical to the task-side `TasksRealtime`, kept local so the
 * Projects feature can ship without modifying a shared component owned by
 * another agent.
 */
export function ProjectsRealtime({ subscriptions }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(
      `realtime-projects:${subscriptions
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
