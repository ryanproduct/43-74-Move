import { Zap } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listUtilities } from "@/lib/utilities/queries";

import { AddUtilityButton } from "./_components/AddUtilityButton";
import { UtilitiesRealtime } from "./_components/UtilitiesRealtime";
import { UtilityRow } from "./_components/UtilityRow";

export default async function UtilitiesPage() {
  const utilities = await listUtilities();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <UtilitiesRealtime subscriptions={[{ table: "utilities" }]} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Utilities</h1>
          <p className="text-sm text-muted-foreground">
            Services to set up, switch over, or cancel between Hogarth and Addison.
          </p>
        </div>
        <AddUtilityButton />
      </header>

      {utilities.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-8 w-8" />}
          title="No utilities yet"
          description="Add the first one to start tracking switchovers."
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Account #</TableHead>
                <TableHead>Hogarth</TableHead>
                <TableHead>Addison</TableHead>
                <TableHead>Switch date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilities.map((u) => (
                <UtilityRow key={u.id} utility={u} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
