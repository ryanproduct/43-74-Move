"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

export function ViewToggle() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "kanban" ? "kanban" : "list";

  function hrefFor(target: "list" | "kanban") {
    const params = new URLSearchParams(searchParams.toString());
    if (target === "list") params.delete("view");
    else params.set("view", "kanban");
    const qs = params.toString();
    return `/tasks${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5 text-xs">
      <Link
        href={hrefFor("list")}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm px-2 py-1",
          view === "list"
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-3.5 w-3.5" /> List
      </Link>
      <Link
        href={hrefFor("kanban")}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm px-2 py-1",
          view === "kanban"
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" /> Kanban
      </Link>
    </div>
  );
}
