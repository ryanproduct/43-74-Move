import { Hammer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import {
  listContractors,
  listProjects,
} from "@/lib/contractors/queries";
import type { ContractorRow } from "@/lib/contractors/types";

import { ContractorCard } from "./_components/ContractorCard";
import { ContractorsRealtime } from "./_components/ContractorsRealtime";
import { GroupToggle } from "./_components/GroupToggle";
import { NewContractorButton } from "./_components/NewContractorButton";

type Search = Promise<{ group?: string }>;

const NO_PROJECT_KEY = "__no_project__";

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const group: "trade" | "project" =
    sp.group === "project" ? "project" : "trade";

  const [contractors, projects] = await Promise.all([
    listContractors(),
    listProjects(),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <ContractorsRealtime subscriptions={[{ table: "contractors" }]} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contractors</h1>
          <p className="text-sm text-muted-foreground">
            Quotes, verdicts and notes for everyone we&apos;ve spoken to.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GroupToggle value={group} />
          <NewContractorButton projects={projects} />
        </div>
      </header>

      {contractors.length === 0 ? (
        <EmptyState
          icon={<Hammer className="h-8 w-8" />}
          title="No contractors yet"
          description="Capture the first quote, contact and verdict."
          action={
            <NewContractorButton
              projects={projects}
              label="Add the first contractor"
            />
          }
        />
      ) : group === "trade" ? (
        <GroupedByTrade contractors={contractors} />
      ) : (
        <GroupedByProject contractors={contractors} />
      )}
    </div>
  );
}

function GroupedByTrade({ contractors }: { contractors: ContractorRow[] }) {
  // Trade keys come in already-sorted from the query (order by trade asc).
  const buckets = new Map<string, ContractorRow[]>();
  for (const c of contractors) {
    const key = c.trade.trim() || "Other";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(c);
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(buckets.entries()).map(([trade, rows]) => (
        <section key={trade} className="flex flex-col gap-3">
          <header className="flex items-baseline gap-2 border-b pb-1.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {trade}
            </h2>
            <Badge variant="outline" className="tabular-nums">
              {rows.length}
            </Badge>
          </header>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((c) => (
              <li key={c.id}>
                <ContractorCard contractor={c} showTrade={false} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function GroupedByProject({ contractors }: { contractors: ContractorRow[] }) {
  // Bucket by project (or "No project"); preserve seen-project insertion order.
  const order: string[] = [];
  const labels = new Map<string, string>();
  const buckets = new Map<string, ContractorRow[]>();

  for (const c of contractors) {
    const key = c.project?.id ?? NO_PROJECT_KEY;
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
      labels.set(key, c.project?.name ?? "No project");
    }
    buckets.get(key)!.push(c);
  }

  return (
    <div className="flex flex-col gap-6">
      {order.map((key) => {
        const rows = buckets.get(key)!;
        return (
          <section key={key} className="flex flex-col gap-3">
            <header className="flex items-baseline gap-2 border-b pb-1.5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {labels.get(key)}
              </h2>
              <Badge variant="outline" className="tabular-nums">
                {rows.length}
              </Badge>
            </header>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((c) => (
                <li key={c.id}>
                  <ContractorCard contractor={c} showProject={false} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
